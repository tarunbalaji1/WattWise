// server/routes/auth.js
require('dotenv').config();
const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');

// —————————————————————————————
// 1) Define Login model to use existing 'login' collection
// —————————————————————————————
const LoginSchema = new mongoose.Schema({
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });

const Login = mongoose.model('Login', LoginSchema, 'login');

// —————————————————————————————
// 2) Define Resident model (collection name: 'residents')
// —————————————————————————————
const ResidentSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  email:   { type: String, required: true, unique: true },
  flatNo:  { type: String, required: true },
  towerNo: { type: String, required: true },
  mobile:  { type: String, required: true }
}, { timestamps: true });

const Resident = mongoose.model('Resident', ResidentSchema, 'residents');



// —————————————————————————————
// POST /api/auth/login
// —————————————————————————————
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('[LOGIN ATTEMPT] body:', req.body);

  try {
    // normalize email
    const normalizedEmail = email.trim().toLowerCase();
    const user = await Login.findOne({ email: normalizedEmail });
    console.log('[LOGIN] found user:', user);

    if (!user) {
      return res
        .status(401)
        .json({ msg: 'Invalid credentials (no such user)' });
    }

    // if stored password is plain‐text, hash it once
    if (!user.password.startsWith('$2')) {
      console.log('[LOGIN] Detected plain‑text password, hashing now…');
      user.password = await bcrypt.hash(user.password, 10);
      await user.save();
    }

    // compare provided password to stored bcrypt hash
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('[LOGIN] bcrypt.compare result:', isMatch);

    if (!isMatch) {
      return res
        .status(401)
        .json({ msg: 'Invalid credentials (bad password)' });
    }

    // issue JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.json({ token });
  } catch (err) {
    console.error('[LOGIN] server error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});



// —————————————————————————————
// POST /api/auth/signup
// —————————————————————————————
router.post('/signup', async (req, res) => {
  const { name, email, password, tower, flat, mobile } = req.body;
  console.log('[SIGNUP ATTEMPT] body:', req.body);

  try {
    // 1) ensure email exists in residents collection
    const resident = await Resident.findOne({ email: email.trim().toLowerCase() });
    if (!resident) {
      return res
        .status(400)
        .json({ msg: 'Email not found in residents list' });
    }

    // 2) prevent duplicate signup
    const already = await Login.findOne({ email: resident.email });
    if (already) {
      return res
        .status(400)
        .json({ msg: 'User already registered' });
    }

    // 3) hash password and save new login doc
    const hashedPW = await bcrypt.hash(password, 10);
    const newLogin = new Login({
      email: resident.email,
      password: hashedPW
    });
    await newLogin.save();

    return res
      .status(200)
      .json({ msg: 'Signup successful, please log in.' });
  } catch (err) {
    console.error('[SIGNUP] server error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
