// server/routes/adminHighConsumers.js
const express          = require('express');
const router           = express.Router();
const verifyToken      = require('../middleware/verifyToken');
const Resident         = require('../models/Resident');
const DailyConsumption = require('../models/DailyConsumption');

router.get('/', verifyToken, async (req, res) => {
  try {
    // 1) Determine our dates (all at UTC midnight)
    const today      = new Date(); today.setUTCHours(0,0,0,0);
    const monthFirst = new Date(today.getUTCFullYear(), today.getUTCMonth(), 1);      // e.g. 2025-07-01T00:00:00Z
    const yesterday  = new Date(today);       yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    // We want the reading immediately before the 1st, so:
    const beforeFirst = new Date(monthFirst); beforeFirst.setUTCDate(beforeFirst.getUTCDate() - 1);

    // 2) Pull all meter docs from [beforeFirst … yesterday] in one go
    const docs = await DailyConsumption.find({
      date: { $gte: beforeFirst, $lte: yesterday }
    }).lean();

    // 3) Group cumulatives per flat & per day (string “YYYY‑MM‑DD”)
    const byFlat = {};
    docs.forEach(d => {
      const key = `${d.towerNo}|${d.flatNo}`;
      const day = d.date.toISOString().slice(0,10);
      byFlat[key] = byFlat[key] || {};
      byFlat[key][day] = d.consumption_kwh;
    });

    // 4) Grab every resident
    const residents = await Resident.find().lean();

    // 5) Build the results array
    const results = residents.map(r => {
      const key    = `${r.towerNo}|${r.flatNo}`;
      const dayMap = byFlat[key] || {};

      // lookup cumul at “the day before the 1st”
      const firstMinus1 = beforeFirst.toISOString().slice(0,10);
      const startC = dayMap[firstMinus1] || 0;

      // lookup cumul at “yesterday”
      const yest = yesterday.toISOString().slice(0,10);
      const endC = dayMap[yest] || 0;

      // subtract to get just this month’s kWh
      const consumption = +(endC - startC).toFixed(2);

      return {
        _id:         r._id,
        name:        r.name,
        email:       r.email,
        towerNo:     r.towerNo,
        flatNo:      r.flatNo,
        consumption
      };
    });

    // 6) Sort descending or ascending
    const sortOrder = req.query.sort === 'asc' ? 1 : -1;
    results.sort((a,b) => sortOrder * (a.consumption - b.consumption));

    return res.json(results);
  } catch (err) {
    console.error('[ADMIN] GET high-consumers error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
