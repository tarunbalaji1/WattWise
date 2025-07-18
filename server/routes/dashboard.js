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
    const { days } = req.query; // '5' | '15' | '30' | 'month'

    // 1) Find current resident
    const resident = await Resident.findOne({ email: req.user.email });
    if (!resident) return res.status(404).json({ msg: 'Resident not found' });
    const { towerNo, flatNo } = resident;

    // 2) Compute our base “today” (UTC midnight)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // 3) Determine the primary display range (start and end dates for the graph's X-axis)
    let displayRangeStart, displayRangeEnd; // Renamed to clearly define the display range

    if (days === 'month') {
      // Month view: display from 1st of this month to today
      displayRangeStart = new Date(today.getUTCFullYear(), today.getUTCMonth(), 1);
      displayRangeEnd   = today; // Crucial: "till date" means including today
    } else {
      // N‑day view: display from N days ago to today
      displayRangeEnd = today;
      const n = parseInt(days, 10) || 0;
      displayRangeStart = new Date(today.getTime() - n * 86_400_000);
    }

    // 4) Determine the data fetch range. We need one day before the displayRangeStart
    //    to correctly calculate the daily consumption for the very first displayed day.
    const dataFetchStart = new Date(displayRangeStart);
    dataFetchStart.setUTCDate(dataFetchStart.getUTCDate() - 1); // This will be June 30th for July 1st start

    const dataFetchEnd = displayRangeEnd; // Fetch up to the last display day

    // 5) Fetch all readings from dataFetchStart → dataFetchEnd
    const docs = await DailyConsumption.find({
      date: { $gte: dataFetchStart, $lte: dataFetchEnd }
    }).lean();

    // 6) Group them by flatKey and sort by date
    const byFlat = {};
    docs.forEach(d => {
      const key = `${d.towerNo}|${d.flatNo}`; // Corrected template literal
      byFlat[key] = byFlat[key] || [];
      byFlat[key].push(d);
    });
    Object.values(byFlat).forEach(arr => arr.sort((a,b) => a.date - b.date));

    // 7) Helper to get the latest cumulative ≤ some date
    function getLatestCumul(docsArr, targetDate) {
      let last = 0;
      for (const rec of docsArr) {
        if (rec.date.getTime() <= targetDate.getTime()) { // Use .getTime() for robust comparison
          last = rec.consumption_kwh;
        } else {
          break; // Optimization: stop if we've passed the targetDate
        }
      }
      return last;
    }

    // 8) Build day‑by‑day usage array
    const rawResult = []; // Building a temporary raw result first
    const userKey = `${towerNo}|${flatNo}`; // Corrected template literal

    // Loop through ALL days from dataFetchStart to dataFetchEnd
    // This includes the "day before" the display starts for calculation purposes
    for (let day = new Date(dataFetchStart); day <= dataFetchEnd; day.setUTCDate(day.getUTCDate()+1)) {
      const prev = new Date(day);
      prev.setUTCDate(prev.getUTCDate() - 1);

      // — user’s daily usage
      const userDocs   = byFlat[userKey] || [];
      const todayUserC = getLatestCumul(userDocs, day);
      const prevUserC  = getLatestCumul(userDocs, prev);
      let userKwh      = +(todayUserC - prevUserC).toFixed(2);
      userKwh = Math.max(0, userKwh); // Ensure non-negative daily consumption

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
        const itemDate = new Date(item.date + 'T00:00:00Z'); // Parse as UTC date
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