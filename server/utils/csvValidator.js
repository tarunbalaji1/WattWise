/**
 * This function validates a single row from the parsed CSV data.
 * @param {object} row - An object representing a single row, e.g., { flatNo: '101', towerNo: 'A', ... }
 * @returns {object} - An object { isValid: boolean, error: string | null }
 */
function validateCsvRow(row) {
    const { flatNo, towerNo, date, consumption_kwh } = row;


    // --- NEW: Calculate yesterday's date for comparison ---
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Set to midnight UTC for a clean comparison


    const yesterday = new Date(today);
    yesterday.setUTCDate(today.getUTCDate() - 1);
    const yesterdayISO = yesterday.toISOString().slice(0, 10); // "YYYY-MM-DD" format


    // 1. Validate Tower Number
    const validTowers = ['A', 'B', 'C'];
    if (!towerNo || !validTowers.includes(String(towerNo).trim().toUpperCase())) {
        return { isValid: false, error: `Invalid Tower: "${towerNo}". Must be A, B, or C.` };
    }


    // 2. Validate Flat Number
    const numFlatNo = parseInt(flatNo, 10);
    if (isNaN(numFlatNo) || !(
        (numFlatNo >= 101 && numFlatNo <= 150) ||
        (numFlatNo >= 201 && numFlatNo <= 250) ||
        (numFlatNo >= 301 && numFlatNo <= 350) ||
        (numFlatNo >= 401 && numFlatNo <= 450) ||
        (numFlatNo >= 501 && numFlatNo <= 550)
    )) {
        return { isValid: false, error: `Invalid Flat No: "${flatNo}". Out of valid ranges.` };
    }


    // 3. Validate Date Format
    const parsedDate = new Date(date);
    if (!date || isNaN(parsedDate.getTime())) {
        return { isValid: false, error: `Invalid Date Format: "${date}".` };
    }


    // --- NEW: 4. Validate if the date from the file IS yesterday's date ---
    // We normalize the parsed date to UTC midnight to ensure an accurate comparison
    parsedDate.setUTCHours(0, 0, 0, 0);
    const dateFromRowISO = parsedDate.toISOString().slice(0, 10);


    if (dateFromRowISO !== yesterdayISO) {
        return { isValid: false, error: `Invalid Date: "${date}". All entries must be for yesterday (${yesterdayISO}).` };
    }


    // 5. Validate Consumption Units
    if (consumption_kwh === null || consumption_kwh === undefined || String(consumption_kwh).trim() === '' || isNaN(Number(consumption_kwh)) || Number(consumption_kwh) < 0) {
        return { isValid: false, error: `Invalid Consumption: "${consumption_kwh}". Must be a non-negative number.` };
    }


    // If all checks pass, the row is valid.
    return { isValid: true, error: null };
}


module.exports = { validateCsvRow };





