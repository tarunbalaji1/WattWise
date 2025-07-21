const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const { Readable } = require('stream');


const verifyToken = require('../middleware/verifyToken');
const DailyConsumption = require('../models/DailyConsumption');
const { validateCsvRow } = require('../utils/csvValidator');


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


router.post('/upload-csv', verifyToken, upload.single('csvFile'), async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
    }
    if (!req.file) {
        return res.status(400).json({ msg: 'No file uploaded.' });
    }


    const allRows = [];
    const validRows = [];
    const invalidRows = [];
    let rowCounter = 1; // Start at 1 to account for the header row


    const stream = Readable.from(req.file.buffer.toString('utf8'));


    stream
        .pipe(csv({
            // Make header mapping more robust
            mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/[\s-]+/g, '_'),
        }))
        .on('data', (data) => {
            rowCounter++; // Increment for each data row
            // Attach the original row number to each parsed object
            allRows.push({ ...data, originalRowNumber: rowCounter });
        })
        .on('end', async () => {
            // --- PHASE 1: VALIDATION ---
            for (const row of allRows) {
                // Standardize potential header names to a single key for validation
                const rowForValidation = {
                    towerNo: row.tower_no || row.towerno,
                    flatNo: row.flat_no || row.flatno,
                    date: row.date,
                    consumption_kwh: row.consumption_kwh || row.cumulative_units_consumed,
                };


                const { isValid, error } = validateCsvRow(rowForValidation);


                if (isValid) {
                    validRows.push(row);
                } else {
                    // If invalid, push the original row data along with the error
                    invalidRows.push({
                        originalRowNumber: row.originalRowNumber,
                        towerNo: rowForValidation.towerNo,
                        flatNo: rowForValidation.flatNo,
                        date: rowForValidation.date,
                        consumption_kwh: rowForValidation.consumption_kwh,
                        error: error // The specific error from the validator
                    });
                }
            }


            // --- DECISION POINT ---
            if (invalidRows.length > 0) {
                return res.status(400).json({
                    message: 'Upload failed. Please fix the errors below and re-upload.',
                    invalidEntries: invalidRows.length,
                    validEntries: validRows.length,
                    errors: invalidRows, // Send the detailed list of errors
                });
            }


            if (validRows.length === 0) {
                return res.status(400).json({ msg: 'The CSV file is empty or contains no valid data.' });
            }


            // --- PHASE 2: DATABASE UPDATE ---
            try {
                const bulkOps = validRows.map(row => {
                    const recordDate = new Date(row.date || rowForValidation.date);
                    recordDate.setUTCHours(0, 0, 0, 0);


                    return {
                        updateOne: {
                            filter: {
                                towerNo: (row.tower_no || row.towerno).trim().toUpperCase(),
                                flatNo: (row.flat_no || row.flatno).trim(),
                                date: recordDate
                            },
                            update: {
                                $set: {
                                    consumption_kwh: Number(row.consumption_kwh || row.cumulative_units_consumed)
                                }
                            },
                            upsert: true
                        }
                    };
                });


                await DailyConsumption.bulkWrite(bulkOps);


                return res.status(200).json({
                    message: 'File processed successfully!',
                    successfulEntries: validRows.length,
                });


            } catch (dbError) {
                console.error('Database bulk write error:', dbError);
                return res.status(500).json({ msg: 'A database error occurred during the update process.' });
            }
        });
});


module.exports = router;



