// server/routes/admindashboard.js
const router           = require('express').Router();
const verifyToken      = require('../middleware/verifyToken');
const Resident         = require('../models/Resident');
const DailyConsumption = require('../models/DailyConsumption');

/**
 * GET /api/admin/range-by-flat?towerNo=<t>&flatNo=<f>&days=<n> or &startDate=<date>&endDate=<date>
 * Returns an array of { date, user, community } for a specified flat/tower.
 * Requires admin privileges.
 */
router.get('/range-by-flat', verifyToken, async (req, res) => {
  try {
    // Ensure the user is an admin (assuming role is in req.user from verifyToken)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
    }

    const { towerNo, flatNo, days, startDate, endDate } = req.query;

    // Validate input flatNo and towerNo
    if (!towerNo || !flatNo) {
      return res.status(400).json({ msg: 'Tower number and Flat number are required.' });
    }

    // Convert towerNo and flatNo to correct types if necessary (e.g., if they are numbers in DB)
    // For now, assuming they are strings as per your Resident model structure.

    // Compute our base “today” (UTC midnight) for relative calculations
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    let displayRangeStart, displayRangeEnd;

    if (startDate && endDate) {
      displayRangeStart = new Date(startDate);
      displayRangeEnd   = new Date(endDate);

      if (isNaN(displayRangeStart.getTime()) || isNaN(displayRangeEnd.getTime())) {
        return res.status(400).json({ msg: 'Invalid start or end date.' });
      }
      if (displayRangeStart.getTime() > displayRangeEnd.getTime()) {
        return res.status(400).json({ msg: 'Start date cannot be after end date.' });
      }
      displayRangeStart.setUTCHours(0, 0, 0, 0);
      displayRangeEnd.setUTCHours(0, 0, 0, 0);

    } else if (days === 'month') {
      displayRangeStart = new Date(today.getUTCFullYear(), today.getUTCMonth(), 1);
      displayRangeEnd   = today;
    } else {
      displayRangeEnd = today;
      const n = parseInt(days, 10) || 0;
      if (n <= 0) return res.status(400).json({ msg: 'Invalid number of days for range.' });
      displayRangeStart = new Date(today.getTime() - n * 86_400_000);
    }

    const dataFetchStart = new Date(displayRangeStart);
    dataFetchStart.setUTCDate(dataFetchStart.getUTCDate() - 1);

    const dataFetchEnd = displayRangeEnd;

    // Fetch all readings within the dataFetch range
    const docs = await DailyConsumption.find({
      date: { $gte: dataFetchStart, $lte: dataFetchEnd }
    }).lean();

    // Group them by flatKey and sort by date
    const byFlat = {};
    docs.forEach(d => {
      const key = `${d.towerNo}|${d.flatNo}`;
      byFlat[key] = byFlat[key] || [];
      byFlat[key].push(d);
    });
    Object.values(byFlat).forEach(arr => arr.sort((a,b) => a.date - b.date));

    // Helper to get the latest cumulative ≤ some date
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

    // Build day‑by‑day usage array (rawResult) for the entire dataFetch range
    const rawResult = [];
    const targetResidentKey = `${towerNo}|${flatNo}`; // Key for the resident being analyzed

    for (let day = new Date(dataFetchStart); day <= dataFetchEnd; day.setUTCDate(day.getUTCDate()+1)) {
      const prev = new Date(day);
      prev.setUTCDate(prev.getUTCDate() - 1);

      // — Target resident’s daily usage
      const targetResidentDocs = byFlat[targetResidentKey] || [];
      const todayTargetC = getLatestCumul(targetResidentDocs, day);
      const prevTargetC  = getLatestCumul(targetResidentDocs, prev);
      let targetResidentKwh = +(todayTargetC - prevTargetC).toFixed(2);
      targetResidentKwh = Math.max(0, targetResidentKwh); // Ensure non-negative

      // — community average usage (excluding the target resident from the average calculation if desired, or include all)
      let sum = 0, count = 0;
      for (const [flatKey, docsArr] of Object.entries(byFlat)) {
        // If you want to exclude the target resident from community average:
        // if (flatKey === targetResidentKey) continue;
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
        user:      targetResidentKwh, // 'user' field now represents the target resident
        community: communityKwh
      });
    }

    // Filter the rawResult to ensure only dates within the actual display range are returned
    const finalResult = rawResult.filter(item => {
        const itemDate = new Date(item.date + 'T00:00:00Z');
        return itemDate.getTime() >= displayRangeStart.getTime() && itemDate.getTime() <= displayRangeEnd.getTime();
    });

    return res.json(finalResult);
  }
  catch (err) {
    console.error('[ADMIN RANGE] error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;