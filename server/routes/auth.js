// server/routes/auth.js
require('dotenv').config();
const router   = require('express').Router();
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const Login    = require('../models/Login');
const Resident = require('../models/Resident');

/**
 * POST /api/auth/signup
 */
router.post('/signup', async (req, res) => {
  try {
    // 1) Destructure & normalize
    const {
      name,
      email: rawEmail,
      tower,
      flat,
      mobile,
      password
    } = req.body;

    const email = String(rawEmail || '')
      .trim()
      .toLowerCase();

    console.log('\n🔔 [SIGNUP] incoming payload:', { name, email, tower, flat, mobile });

    // 2) Check that email is in residents collection
    const resident = await Resident.findOne({ email });
    console.log('🔍 [SIGNUP] resident lookup result:', resident);
    if (!resident) {
      return res.status(400).json({ msg: 'Email not found in residents list' });
    }

    // 3) Check login collection for duplicates
    const duplicate = await Login.findOne({ email });
    console.log('🔍 [SIGNUP] existing login doc:', duplicate);
    if (duplicate) {
      return res.status(400).json({ msg: 'User already registered' });
    }

    // 4) Hash the password and save
    const hashed = await bcrypt.hash(password, 10);
    const newLogin = await new Login({ email, password: hashed }).save();
    console.log('✅ [SIGNUP] new login saved:', newLogin);

    return res.json({ msg: 'Signup successful, please log in.' });
  } catch (err) {
    console.error('❌ [SIGNUP] server error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    // 1) Destructure & normalize
    const { email: rawEmail, password } = req.body;
    const email = String(rawEmail || '').trim().toLowerCase();

    console.log('\n🔔 [LOGIN] incoming payload:', { email });

    // 2) Lookup login document
    const user = await Login.findOne({ email });
    console.log('🔍 [LOGIN] login lookup result:', user);
    if (!user) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    // 3) Legacy on‑the‑fly re‑hash (only if needed)
    if (!user.password.startsWith('$2')) {
      console.log('🔄 [LOGIN] legacy password detected, re‑hashing…');
      user.password = await bcrypt.hash(user.password, 10);
      await user.save();
      console.log('🔄 [LOGIN] password re‑hashed for', user.email);
    }

    // 4) Compare provided password
    const match = await bcrypt.compare(password, user.password);
    console.log('🔍 [LOGIN] bcrypt.compare result:', match);
    if (!match) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    // 5) Issue JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('✅ [LOGIN] issuing token for', user.email);

    return res.json({ token });
  } catch (err) {
    console.error('❌ [LOGIN] server error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
