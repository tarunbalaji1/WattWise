// server/models/Login.js
const mongoose = require('mongoose');

const LoginSchema = new mongoose.Schema({
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true }    // always store the bcrypt hash
}, { timestamps: true });

// Third argument forces Mongoose to use the existing 'login' collection
module.exports = mongoose.model('Login', LoginSchema, 'login');
