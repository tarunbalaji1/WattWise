// server/routes/adminHighConsumers.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const Resident = require('../models/Resident');
const DailyConsumption = require('../models/DailyConsumption');

// This helper function is still correct and does not need to be changed.
function getLatestCumul(flatKey, targetDateISO, allFlatReadings) {
    let latestConsumption = 0;
    const recordsForFlat = allFlatReadings[flatKey] ? Object.entries(allFlatReadings[flatKey]) : [];
    recordsForFlat.sort(([dateA], [dateB]) => dateA.localeCompare(dateB));

    for (const [dateString, consumption] of recordsForFlat) {
        if (dateString <= targetDateISO) {
            latestConsumption = consumption;
        } else {
            break;
        }
    }
    return latestConsumption;
}


router.get('/', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
        }

        // 1) Determine our dates
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        
        // *CHANGED*: Define yesterday to use as our new end date.
        const yesterday = new Date(today);
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);

        const monthFirst = new Date(today.getUTCFullYear(), today.getUTCMonth(), 1);

        const beforeMonthFirstDate = new Date(monthFirst);
        beforeMonthFirstDate.setUTCDate(beforeMonthFirstDate.getUTCDate() - 1);

        // 2) Pull all relevant meter docs
        const fetchStartDate = new Date(monthFirst.getTime() - (30 * 24 * 60 * 60 * 1000));
        
        // *CHANGED*: Fetch data only up to YESTERDAY.
        const fetchEndDate = yesterday;

        const docs = await DailyConsumption.find({
            date: { $gte: fetchStartDate, $lte: fetchEndDate }
        }).lean();

        // 3) Group cumulatives per flat & per day
        const byFlat = {};
        docs.forEach(d => {
            const key = `${d.towerNo}|${d.flatNo}`;
            const day = d.date.toISOString().slice(0, 10);
            byFlat[key] = byFlat[key] || {};
            byFlat[key][day] = d.consumption_kwh;
        });

        // 4) Grab every resident
        const residents = await Resident.find().lean();

        // 5) Build the results array
        const results = residents.map(r => {
            const key = `${r.towerNo}|${r.flatNo}`;

            const beforeMonthFirstISO = beforeMonthFirstDate.toISOString().slice(0, 10);
            
            // *CHANGED*: Use yesterday's ISO string for the lookup.
            const yesterdayISO = yesterday.toISOString().slice(0, 10);

            const startC = getLatestCumul(key, beforeMonthFirstISO, byFlat);
            
            // *CHANGED*: Use yesterday's date to get the end consumption value.
            const endC = getLatestCumul(key, yesterdayISO, byFlat);

            let consumption = +(endC - startC).toFixed(2);
            consumption = Math.max(0, consumption);

            return {
                _id: r._id,
                name: r.name,
                email: r.email,
                towerNo: r.towerNo,
                flatNo: r.flatNo,
                consumption
            };
        });

        // 6) Sort and return results
        const sortOrder = req.query.sort === 'asc' ? 1 : -1;
        results.sort((a, b) => sortOrder * (a.consumption - b.consumption));

        return res.json(results);
    } catch (err) {
        console.error('[ADMIN] GET high-consumers error:', err);
        return res.status(500).json({ msg: 'Server error: ' + err.message });
    }
});

module.exports = router;