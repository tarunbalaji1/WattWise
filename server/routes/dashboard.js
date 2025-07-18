// server/routes/dashboard.js
const router           = require('express').Router();
const verifyToken      = require('../middleware/verifyToken');
const Resident         = require('../models/Resident');
const DailyConsumption = require('../models/DailyConsumption');

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
    const resident = await Resident.findOne({ email: req.user.email });
    if (!resident) return res.status(404).json({ msg: 'Resident not found' });
    const { towerNo, flatNo } = resident;

    // UTC‑midnight dates
    const today      = new Date(); today.setUTCHours(0,0,0,0);
    const yesterday  = new Date(today); yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const dayBefore  = new Date(yesterday); dayBefore.setUTCDate(dayBefore.getUTCDate() - 1);
    const monthStart = new Date(today); monthStart.setUTCDate(1);

    // helper: get cumulative for exact date
    async function getCumul(tower, flat, date) {
      const doc = await DailyConsumption.findOne({ towerNo: tower, flatNo: flat, date });
      return doc ? doc.consumption_kwh : 0;
    }

    const yestCumul        = await getCumul(towerNo, flatNo, yesterday);
    const prevCumul        = await getCumul(towerNo, flatNo, dayBefore);
    const userYesterday    = yestCumul - prevCumul;
    const monthStartCumul  = await getCumul(towerNo, flatNo, monthStart);
    const userMonthTotal   = yestCumul - monthStartCumul;

    // community avg yesterday
    const allYest = await DailyConsumption.find({ date: yesterday }).lean();
    const allPrev = await DailyConsumption.find({ date: dayBefore }).lean();
    const prevMap = Object.fromEntries(allPrev.map(d => [`${d.towerNo}|${d.flatNo}`, d.consumption_kwh]));
    let sumDiff = 0;
    allYest.forEach(d => {
      const key = `${d.towerNo}|${d.flatNo}`;
      sumDiff += d.consumption_kwh - (prevMap[key] || 0);
    });
    const communityYesterday = allYest.length ? sumDiff / allYest.length : 0;

    return res.json({ userYesterday, communityYesterday, userMonthTotal });
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
    const { days, startDate, endDate } = req.query; // Now explicitly get startDate and endDate

    // 1) Find current resident
    const resident = await Resident.findOne({ email: req.user.email });
    if (!resident) return res.status(404).json({ msg: 'Resident not found' });
    const { towerNo, flatNo } = resident;

    // 2) Compute our base “today” (UTC midnight) for relative calculations
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // 3) Determine the primary display range (start and end dates for the graph's X-axis)
    let displayRangeStart, displayRangeEnd;

    if (startDate && endDate) { // New: Handle custom date range first
      displayRangeStart = new Date(startDate);
      displayRangeEnd   = new Date(endDate);

      // Validate dates
      if (isNaN(displayRangeStart.getTime()) || isNaN(displayRangeEnd.getTime())) {
        return res.status(400).json({ msg: 'Invalid start or end date.' });
      }
      if (displayRangeStart.getTime() > displayRangeEnd.getTime()) {
        return res.status(400).json({ msg: 'Start date cannot be after end date.' });
      }
      // Set to UTC midnight for consistency
      displayRangeStart.setUTCHours(0, 0, 0, 0);
      displayRangeEnd.setUTCHours(0, 0, 0, 0);

    } else if (days === 'month') {
      // Month view: display from 1st of this month to today
      displayRangeStart = new Date(today.getUTCFullYear(), today.getUTCMonth(), 1);
      displayRangeEnd   = today; // "till date" means including today
    } else {
      // N‑day view: display from N days ago to today
      displayRangeEnd = today;
      const n = parseInt(days, 10) || 0;
      if (n <= 0) return res.status(400).json({ msg: 'Invalid number of days for range.' }); // Basic validation
      displayRangeStart = new Date(today.getTime() - n * 86_400_000);
    }

    // 4) Determine the data fetch range. We need one day *before* the displayRangeStart
    //    to correctly calculate the daily consumption for the very first displayed day.
    const dataFetchStart = new Date(displayRangeStart);
    dataFetchStart.setUTCDate(dataFetchStart.getUTCDate() - 1); // This gets the day before

    const dataFetchEnd = displayRangeEnd; // Fetch up to the last display day

    // 5) Fetch all readings from dataFetchStart → dataFetchEnd
    const docs = await DailyConsumption.find({
      date: { $gte: dataFetchStart, $lte: dataFetchEnd }
    }).lean();

    // 6) Group them by flatKey and sort by date
    const byFlat = {};
    docs.forEach(d => {
      const key = `${d.towerNo}|${d.flatNo}`;
      byFlat[key] = byFlat[key] || [];
      byFlat[key].push(d);
    });
    Object.values(byFlat).forEach(arr => arr.sort((a,b) => a.date - b.date));

    // 7) Helper to get the latest cumulative ≤ some date
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

    // 8) Build day‑by‑day usage array (rawResult) for the entire dataFetch range
    const rawResult = [];
    const userKey = `${towerNo}|${flatNo}`;

    for (let day = new Date(dataFetchStart); day <= dataFetchEnd; day.setUTCDate(day.getUTCDate()+1)) {
      const prev = new Date(day);
      prev.setUTCDate(prev.getUTCDate() - 1);

      // — user’s daily usage
      const userDocs   = byFlat[userKey] || [];
      const todayUserC = getLatestCumul(userDocs, day);
      const prevUserC  = getLatestCumul(userDocs, prev);
      let userKwh      = +(todayUserC - prevUserC).toFixed(2);
      userKwh = Math.max(0, userKwh); // Ensure non-negative

      // — community average usage
      let sum = 0, count = 0;
      for (const [flatKey, docsArr] of Object.entries(byFlat)) {
        if (flatKey === userKey) continue;
        const tC = getLatestCumul(docsArr, day);
        const pC = getLatestCumul(docsArr, prev);
        let communityDailyConsumption = +(tC - pC).toFixed(2);
        communityDailyConsumption = Math.max(0, communityDailyConsumption);
        sum += communityDailyConsumption;
        count++;
      }
      const communityKwh = count ? +(sum / count).toFixed(2) : 0;

      rawResult.push({
        date:      day.toISOString().slice(0,10),
        user:      userKwh,
        community: communityKwh
      });
    }

    // 9) Filter the rawResult to ensure only dates within the actual display range are returned
    const finalResult = rawResult.filter(item => {
        const itemDate = new Date(item.date + 'T00:00:00Z'); // Parse as UTC date for accurate comparison
        return itemDate.getTime() >= displayRangeStart.getTime() && itemDate.getTime() <= displayRangeEnd.getTime();
    });

    // 10) Return
    return res.json(finalResult);
  }
  catch (err) {
    console.error('[RANGE] error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
