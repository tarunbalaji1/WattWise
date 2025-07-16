// server/routes/dashboard.js
const router           = require('express').Router();
const verifyToken      = require('../middleware/verifyToken');
const Resident         = require('../models/Resident');
const DailyConsumption = require('../models/DailyConsumption');

// ─── Debug: See raw records for yesterday ──────────────────────────────────────
router.get('/debug', verifyToken, async (req, res) => {
  try {
    const resident = await Resident.findOne({ email: req.user.email });
    if (!resident) return res.status(404).json({ msg: 'User not found' });

    // UTC‐midnight boundaries
    const today = new Date(); today.setUTCHours(0,0,0,0);
    const yesterdayStart = new Date(today);
    yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1);

    // Find all docs in that window
    const records = await DailyConsumption.find({
      towerNo: resident.towerNo,
      flatNo:  resident.flatNo,
      date:    { $gte: yesterdayStart, $lt: today }
    }).lean();

    return res.json({
      resident:  { towerNo: resident.towerNo, flatNo: resident.flatNo },
      dateRange: { from: yesterdayStart.toISOString(), to: today.toISOString() },
      records
    });
  } catch (err) {
    console.error('❌ [DEBUG] error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// ─── Summary: compute yesterday’s & month‑to‑date usage ────────────────────────
router.get('/summary', verifyToken, async (req, res) => {
  try {
    const resident = await Resident.findOne({ email: req.user.email });
    if (!resident) return res.status(404).json({ msg: 'Resident not found' });

    const { towerNo, flatNo } = resident;
    const today = new Date(); today.setUTCHours(0,0,0,0);
    const yesterdayStart = new Date(today);
    yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1);

    // 1) User’s yesterday usage
    const userRec = await DailyConsumption.findOne({
      towerNo, flatNo,
      date: { $gte: yesterdayStart, $lt: today }
    });
    const userYesterday = userRec
      ? userRec.consumption_kwh
      : 0;

    // 2) Community average yesterday
    const commAgg = await DailyConsumption.aggregate([
      { $match: { date: { $gte: yesterdayStart, $lt: today } } },
      { $group: { _id: null, avg: { $avg: '$consumption_kwh' } } }
    ]);
    const communityYesterday = commAgg.length
      ? commAgg[0].avg
      : 0;

    // 3) User’s month‑to‑date total
    const monthStart = new Date(today); monthStart.setUTCDate(1);
    const monthAgg = await DailyConsumption.aggregate([
      { $match: {
          towerNo, flatNo,
          date: { $gte: monthStart, $lt: today }
        }
      },
      { $group: { _id: null, total: { $sum: '$consumption_kwh' } } }
    ]);
    const userMonthTotal = monthAgg.length
      ? monthAgg[0].total
      : 0;

    return res.json({ userYesterday, communityYesterday, userMonthTotal });
  } catch (err) {
    console.error('[SUMMARY] error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
