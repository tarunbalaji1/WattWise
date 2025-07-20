// server/routes/dashboard.js
const router           = require('express').Router();
const verifyToken      = require('../middleware/verifyToken');
const Resident         = require('../models/Resident');
const DailyConsumption = require('../models/DailyConsumption');
const Threshold = require('../models/Threshold');

/**
 * GET /api/dashboard/summary
 * Returns:
 * {
 *   userYesterday,
 *   communityYesterday,
 *   userMonthTotal
 * }
 */
router.get('/summary', verifyToken, async (req, res) => {
    try {
        // *FIX:* Define the missing helper function here inside the route handler
        async function getLatestCumulative(tower, flat, targetDate) {
            const doc = await DailyConsumption.findOne({
                towerNo: tower,
                flatNo: flat,
                date: { $lte: targetDate } // Find docs on or before the target date
            }).sort({ date: -1 }); // Sort descending to get the most recent one
            return doc ? doc.consumption_kwh : 0;
        }

        const resident = await Resident.findOne({ email: req.user.email });
        if (!resident) return res.status(404).json({ msg: 'Resident not found' });
        const { towerNo, flatNo } = resident;

        // --- Date Definitions ---
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setUTCDate(today.getUTCDate() - 1);

        const dayBefore = new Date(yesterday);
        dayBefore.setUTCDate(yesterday.getUTCDate() - 1);

        const monthStart = new Date(today.getUTCFullYear(), today.getUTCMonth(), 1);

        const beforeMonthFirst = new Date(monthStart);
        beforeMonthFirst.setUTCDate(beforeMonthFirst.getUTCDate() - 1);

        // --- User Consumption Calculation ---
        // Now these calls will work because the function is defined above
        const yestCumul = await getLatestCumulative(towerNo, flatNo, yesterday);
        const prevCumul = await getLatestCumulative(towerNo, flatNo, dayBefore);
        const userYesterday = Math.max(0, yestCumul - prevCumul);

        const monthStartBaselineCumul = await getLatestCumulative(towerNo, flatNo, beforeMonthFirst);
        const userMonthTotal = Math.max(0, yestCumul - monthStartBaselineCumul);

        // --- Community Average Calculation ---
        const allYest = await DailyConsumption.find({ date: yesterday }).lean();
        const allPrev = await DailyConsumption.find({ date: dayBefore }).lean();
        const prevMap = Object.fromEntries(allPrev.map(d => [`${d.towerNo}|${d.flatNo}`, d.consumption_kwh]));
        
        let sumDiff = 0;
        allYest.forEach(d => {
            const key = `${d.towerNo}|${d.flatNo}`;
            const previousReading = prevMap[key] || 0;
            if (previousReading > 0) {
                sumDiff += d.consumption_kwh - previousReading;
            }
        });
        const communityYesterday = allYest.length ? sumDiff / allYest.length : 0;

        return res.json({
            userYesterday: +userYesterday.toFixed(2),
            communityYesterday: +communityYesterday.toFixed(2),
            userMonthTotal: +userMonthTotal.toFixed(2)
        });

    } catch (err) {
        console.error('[DASHBOARD] summary error:', err);
        return res.status(500).json({ msg: 'Server error' });
    }
});

/**
 * GET /api/dashboard/range?days=<n>
 * Returns an array of { date, user, community }
 * for the last n days (if days>0) or month‑to‑date (days=0).
 */
// server/routes/dashboard.js
router.get('/range', verifyToken, async (req, res) => {
    try {
        const { days, startDate, endDate } = req.query;

        // 1) Find current resident
        const resident = await Resident.findOne({ email: req.user.email });
        if (!resident) return res.status(404).json({ msg: 'Resident not found' });
        const { towerNo, flatNo } = resident;

        // 2) Compute base dates (UTC midnight)
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        // *NEW*: Define yesterday here for reuse
        const yesterday = new Date(today);
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);

        // 3) Determine the primary display range (start and end dates for the graph)
        let displayRangeStart, displayRangeEnd;

        if (startDate && endDate) { // Handle custom date range first
            displayRangeStart = new Date(startDate);
            displayRangeEnd = new Date(endDate);

            if (isNaN(displayRangeStart.getTime()) || isNaN(displayRangeEnd.getTime())) {
                return res.status(400).json({ msg: 'Invalid start or end date.' });
            }
            if (displayRangeStart > displayRangeEnd) {
                return res.status(400).json({ msg: 'Start date cannot be after end date.' });
            }
            displayRangeStart.setUTCHours(0, 0, 0, 0);
            displayRangeEnd.setUTCHours(0, 0, 0, 0);

        } else if (days === 'month') {
            // Month view: display from 1st of this month to YESTERDAY
            displayRangeStart = new Date(today.getUTCFullYear(), today.getUTCMonth(), 1);
            displayRangeEnd = yesterday; // *FIXED*

        } else {
            // N‑day view: display from N-1 days before yesterday up to YESTERDAY
            const n = parseInt(days, 10) || 0;
            if (n <= 0) return res.status(400).json({ msg: 'Invalid number of days for range.' });
            
            displayRangeEnd = yesterday; // *FIXED*
            displayRangeStart = new Date(yesterday.getTime() - (n - 1) * 86_400_000); // e.g., for 7 days, go back 6 days from yesterday
        }

        // 4) Determine the data fetch range (need one day prior for calculation)
        const dataFetchStart = new Date(displayRangeStart);
        dataFetchStart.setUTCDate(dataFetchStart.getUTCDate() - 1);
        const dataFetchEnd = displayRangeEnd;

        // 5) Fetch all relevant readings in one go
        const docs = await DailyConsumption.find({
            date: { $gte: dataFetchStart, $lte: dataFetchEnd }
        }).lean();

        // 6) Group readings by flat and sort by date
        const byFlat = {};
        docs.forEach(d => {
            const key = `${d.towerNo}|${d.flatNo}`;
            byFlat[key] = byFlat[key] || [];
            byFlat[key].push(d);
        });
        Object.values(byFlat).forEach(arr => arr.sort((a, b) => a.date - b.date));

        // 7) Helper to get the latest cumulative value on or before a target date
        function getLatestCumul(docsArr, targetDate) {
            let last = 0;
            for (const rec of docsArr) {
                if (rec.date.getTime() <= targetDate.getTime()) {
                    last = rec.consumption_kwh;
                } else {
                    break;
                }
            }
            return last;
        }

        // 8) Build day‑by‑day usage array for the entire data fetch range
        const rawResult = [];
        const userKey = `${towerNo}|${flatNo}`;

        for (let day = new Date(dataFetchStart); day <= dataFetchEnd; day.setUTCDate(day.getUTCDate() + 1)) {
            const prev = new Date(day);
            prev.setUTCDate(prev.getUTCDate() - 1);

            // User's daily usage
            const userDocs = byFlat[userKey] || [];
            const todayUserC = getLatestCumul(userDocs, day);
            const prevUserC = getLatestCumul(userDocs, prev);
            let userKwh = +(todayUserC - prevUserC).toFixed(2);
            userKwh = Math.max(0, userKwh);

            // Community average usage
            let sum = 0, count = 0;
            for (const [flatKey, docsArr] of Object.entries(byFlat)) {
                if (flatKey === userKey) continue;
                const tC = getLatestCumul(docsArr, day);
                const pC = getLatestCumul(docsArr, prev);
                let dailyConsumption = +(tC - pC).toFixed(2);
                dailyConsumption = Math.max(0, dailyConsumption);
                sum += dailyConsumption;
                count++;
            }
            const communityKwh = count ? +(sum / count).toFixed(2) : 0;

            rawResult.push({
                date: day.toISOString().slice(0, 10),
                user: userKwh,
                community: communityKwh
            });
        }

        // 9) Filter the results to only the intended display range
        const finalResult = rawResult.filter(item => {
            const itemDate = new Date(item.date + 'T00:00:00Z');
            return itemDate >= displayRangeStart && itemDate <= displayRangeEnd;
        });

        // 10) Return final result
        return res.json(finalResult);

    } catch (err) {
        console.error('[RANGE] error:', err);
        return res.status(500).json({ msg: 'Server error' });
    }
});


/**
 * GET /api/dashboard/profile
 * Returns user details + current thresholds.
 */
router.get('/profile', verifyToken, async (req, res) => {
  try {
    // 1) fetch resident by email
    const resident = await Resident.findOne({ email: req.user.email }).lean();
    if (!resident) return res.status(404).json({ msg: 'Resident not found' });

    // 2) fetch thresholds (may be null)
    const thr = await Threshold.findOne({
      towerNo: resident.towerNo,
      flatNo:  resident.flatNo
    }).lean();

    // 3) assemble payload
    return res.json({
      _id:           resident._id, 
      name:             resident.name,
      email:            resident.email,
      tower:            resident.towerNo,
      flat:             resident.flatNo,
      mobile:           resident.mobile,
      dailyLimit:       thr?.daily_threshold   ?? null,
      monthlyLimit:     thr?.monthly_threshold ?? null
    });
  }
  catch(err) {
    console.error('[DASHBOARD] profile error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * POST /api/dashboard/thresholds
 * Body: { daily: Number, monthly: Number }
 * Creates or updates the threshold row for this resident.
 */
router.post('/thresholds', verifyToken, async (req, res) => {
  try {
    const { daily, monthly } = req.body;
    if (daily == null || monthly == null) {
      return res.status(400).json({ msg: 'daily & monthly values required' });
    }

    // find resident
    const resident = await Resident.findOne({ email: req.user.email });
    if (!resident) return res.status(404).json({ msg: 'Resident not found' });

    // upsert threshold
    const filter = {
      towerNo: resident.towerNo,
      flatNo:  resident.flatNo
    };
    const update = {
      daily_threshold:   daily,
      monthly_threshold: monthly
    };
    const opts = { upsert: true, new: true, setDefaultsOnInsert: true };

    const thr = await Threshold
      .findOneAndUpdate(filter, update, opts)
      .lean();

    return res.json({
      msg: 'Threshold saved',
      daily:   thr.daily_threshold,
      monthly: thr.monthly_threshold
    });
  }
  catch(err) {
    console.error('[DASHBOARD] thresholds POST error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});


module.exports = router;
