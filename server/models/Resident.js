const mongoose = require('mongoose');

const ResidentSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  email:   { type: String, required: true, unique: true },
  flatNo:  { type: String, required: true },
  towerNo: { type: String, required: true },
  mobile:  { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Resident', ResidentSchema, 'residents');
