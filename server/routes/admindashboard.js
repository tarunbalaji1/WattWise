// server/routes/admindashboard.js
const router = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const Resident = require('../models/Resident');
const DailyConsumption = require('../models/DailyConsumption');

router.get('/range-by-flat', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
        }

        const { towerNo, flatNo, days, startDate, endDate } = req.query;

        if (!towerNo || !flatNo) {
            return res.status(400).json({ msg: 'Tower number and Flat number are required.' });
        }

        // 1) --- CRITICAL: ESTABLISH KEY DATES IN UTC ---
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);

        // 2) --- CRITICAL: DETERMINE THE EXACT DISPLAY RANGE ---
        let displayRangeStart, displayRangeEnd;

        if (startDate && endDate) {
            displayRangeStart = new Date(startDate);
            displayRangeEnd = new Date(endDate);
            displayRangeStart.setUTCHours(0, 0, 0, 0);
            displayRangeEnd.setUTCHours(0, 0, 0, 0);
        } else if (days === 'month') {
            displayRangeStart = new Date(today.getUTCFullYear(), today.getUTCMonth(), 1);
            displayRangeEnd = yesterday;
        } else {
            const n = parseInt(days, 10) || 7;
            displayRangeEnd = yesterday;
            displayRangeStart = new Date(yesterday.getTime() - (n - 1) * 86_400_000);
        }

        // 3) --- CRITICAL: DETERMINE THE DATA FETCH RANGE ---
        const dataFetchStart = new Date(displayRangeStart);
        dataFetchStart.setUTCDate(dataFetchStart.getUTCDate() - 1);

        // 4) --- CRITICAL: FETCH DATA CORRECTLY ---
        const docs = await DailyConsumption.find({
            date: { $gte: dataFetchStart, $lt: today }
        }).lean();

        // 5) Group data by flat
        const byFlat = {};
        docs.forEach(d => {
            const key = `${d.towerNo}|${d.flatNo}`;
            byFlat[key] = byFlat[key] || [];
            byFlat[key].push(d);
        });
        Object.values(byFlat).forEach(arr => arr.sort((a, b) => a.date - b.date));

        // 6) Helper function
        function getLatestCumul(docsArr, targetDate) {
            let last = 0;
            for (const rec of docsArr) {
                if (rec.date.getTime() <= targetDate.getTime()) {
                    last = rec.consumption_kwh;
                } else { break; }
            }
            return last;
        }

        // 7) --- CRITICAL: PROCESS EVERY DAY IN THE RANGE ---
        const rawResult = [];
        const targetResidentKey = `${towerNo}|${flatNo}`;

        for (let day = new Date(dataFetchStart); day <= displayRangeEnd; day.setUTCDate(day.getUTCDate() + 1)) {
            const prev = new Date(day);
            prev.setUTCDate(prev.getUTCDate() - 1);

            const targetResidentDocs = byFlat[targetResidentKey] || [];
            const todayTargetC = getLatestCumul(targetResidentDocs, day);
            const prevTargetC = getLatestCumul(targetResidentDocs, prev);
            let targetResidentKwh = +(todayTargetC - prevTargetC).toFixed(2);
            targetResidentKwh = Math.max(0, targetResidentKwh);

            // ... (community average logic remains the same)
            let sum = 0, count = 0;
            for (const [flatKey, docsArr] of Object.entries(byFlat)) {
                const tC = getLatestCumul(docsArr, day);
                const pC = getLatestCumul(docsArr, prev);
                let dailyConsumption = +(tC - pC).toFixed(2);
                if (tC > 0 && pC > 0 && dailyConsumption >= 0) {
                    sum += Math.max(0, dailyConsumption);
                    count++;
                }
            }
            const communityKwh = count ? +(sum / count).toFixed(2) : 0;

            rawResult.push({
                date: day.toISOString().slice(0, 10),
                user: targetResidentKwh,
                community: communityKwh
            });
        }

        // 8) --- CRITICAL: FILTER TO THE EXACT DISPLAY RANGE ---
        const finalResult = rawResult.filter(item => {
            const itemDate = new Date(item.date + 'T00:00:00Z');
            return itemDate >= displayRangeStart && itemDate <= displayRangeEnd;
        });

        return res.json(finalResult);

    } catch (err) {
        console.error('[ADMIN RANGE] error:', err);
        return res.status(500).json({ msg: 'Server error: ' + err.message });
    }
});

module.exports = router;