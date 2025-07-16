const mongoose = require('mongoose');

const LoginSchema = new mongoose.Schema({
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true }  // will store bcrypt hash
}, { timestamps: true });

// Third arg forces use of your existing “login” collection
module.exports = mongoose.model('Login', LoginSchema, 'login');
