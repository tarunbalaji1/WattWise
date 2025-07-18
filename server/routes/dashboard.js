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
  const { days } = req.query;       // could be '5', '15', '30' or 'month'
  const resident = await Resident.findOne({ email: req.user.email });
  if (!resident) return res.status(404).json({ msg: 'Resident not found' });
  const { towerNo, flatNo } = resident;

  // UTC midnight today
  const end = new Date(); 
  end.setUTCHours(0,0,0,0);

  let start;
  if (days === 'month') {
    // first of this month at UTC midnight
    start = new Date(end.getUTCFullYear(), end.getUTCMonth(), 1);
  } else {
    // last N days
    const n = parseInt(days, 10) || 0;
    start = new Date(end.getTime() - n * 86400000);
  }

  // one day before start
  const beforeStart = new Date(start);
  beforeStart.setUTCDate(beforeStart.getUTCDate() - 1);

  // fetch cumulatives from beforeStart → end
  const docs = await DailyConsumption.find({
    towerNo, flatNo,
    date: { $gte: beforeStart, $lte: end }
  }).lean();

  // map date→cumulative kWh
  const cumulMap = new Map(
    docs.map(d => [ d.date.toISOString(), d.consumption_kwh ])
  );

  // build array of dates to plot
  const dates = [];
  for (
    let d = new Date(start);
    d <= end;
    d.setUTCDate(d.getUTCDate()+1)
  ) {
    dates.push(new Date(d));
  }

  // community data (exclude this flat)
  const commDocs = await DailyConsumption.find({
    date: { $gte: beforeStart, $lte: end }
  }).lean();
  const commByDate = {};
  commDocs.forEach(d => {
    const key = d.date.toISOString();
    if (!commByDate[key]) commByDate[key] = [];
    if (!(d.towerNo===towerNo && d.flatNo===flatNo)) {
      commByDate[key].push(d.consumption_kwh);
    }
  });

  // assemble response
  const result = dates.map(day => {
    const curISO  = day.toISOString();
    const prevISO = new Date(day).setUTCDate(day.getUTCDate()-1);
    const prevKey = new Date(prevISO).toISOString();

    const todayCumul = cumulMap.get(curISO)  || 0;
    const prevCumul  = cumulMap.get(prevKey) || 0;
    const userKwh    = todayCumul - prevCumul;

    const todayArr = commByDate[curISO]  || [];
    const prevArr  = commByDate[prevKey] || [];
    let sumDiff = 0;
    todayArr.forEach((val,i) => sumDiff += val - (prevArr[i]||0));
    const communityKwh = todayArr.length ? sumDiff / todayArr.length : 0;

    return {
      date:      curISO.slice(0,10),
      user:      userKwh,
      community: communityKwh
    };
  });

  return res.json(result);
});


module.exports = router;
