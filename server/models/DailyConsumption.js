// server/models/DailyConsumption.js
const mongoose = require('mongoose');

const DailyConsumptionSchema = new mongoose.Schema({
  towerNo:         { type: String, required: true },
  flatNo:          { type: String, required: true },
  date:            { type: Date,   required: true },  // e.g. "2025-07-15T00:00:00Z"
  consumption_kwh: { type: Number, required: true }
}, {
  timestamps: true
});

// Force the exact collection name
module.exports = mongoose.model(
  'DailyConsumption',
  DailyConsumptionSchema,
  'daily_consumption'
);
