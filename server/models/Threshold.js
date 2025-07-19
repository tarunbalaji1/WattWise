

const mongoose = require('mongoose');

const thresholdSchema = new mongoose.Schema({
  towerNo: {
    type: String,
    required: true
  },
  flatNo: {
    type: String,
    required: true
  },
  monthly_threshold: {
    type: Number,
    required: true,
    min: 0
  },
  daily_threshold: {
    type: Number,
    required: true,
    min: 0
  }
});

const Threshold = mongoose.model('Threshold', thresholdSchema);

module.exports = Threshold;