// // server/routes/auth.js
// require('dotenv').config();
// const router   = require('express').Router();
// const bcrypt   = require('bcrypt');
// const jwt      = require('jsonwebtoken');
// const Login    = require('../models/Login');
// const Resident = require('../models/Resident');

// /**
//  * POST /api/auth/signup
//  */
// router.post('/signup', async (req, res) => {
//   try {
//     // 1) Destructure & normalize
//     const {
//       name,
//       email: rawEmail,
//       tower,
//       flat,
//       mobile,
//       password
//     } = req.body;

//     const email = String(rawEmail || '')
//       .trim()
//       .toLowerCase();

//     console.log('\n🔔 [SIGNUP] incoming payload:', { name, email, tower, flat, mobile });

//     // 2) Check that email is in residents collection
//     const resident = await Resident.findOne({ email });
//     console.log('🔍 [SIGNUP] resident lookup result:', resident);
//     if (!resident) {
//       return res.status(400).json({ msg: 'Email not found in residents list' });
//     }

//     // 3) Check login collection for duplicates
//     const duplicate = await Login.findOne({ email });
//     console.log('🔍 [SIGNUP] existing login doc:', duplicate);
//     if (duplicate) {
//       return res.status(400).json({ msg: 'User already registered' });
//     }

//     // 4) Hash the password and save
//     const hashed = await bcrypt.hash(password, 10);
//     const newLogin = await new Login({ email, password: hashed }).save();
//     console.log('✅ [SIGNUP] new login saved:', newLogin);

//     return res.json({ msg: 'Signup successful, please log in.' });
//   } catch (err) {
//     console.error('❌ [SIGNUP] server error:', err);
//     return res.status(500).json({ msg: 'Server error' });
//   }
// });

// /**
//  * POST /api/auth/login
//  */
// router.post('/login', async (req, res) => {
//   try {
//     // 1) Destructure & normalize
//     const { email: rawEmail, password } = req.body;
//     const email = String(rawEmail || '').trim().toLowerCase();

//     console.log('\n🔔 [LOGIN] incoming payload:', { email });

//     // 2) Lookup login document
//     const user = await Login.findOne({ email });
//     console.log('🔍 [LOGIN] login lookup result:', user);
//     if (!user) {
//       return res.status(401).json({ msg: 'Invalid credentials' });
//     }

//     // 3) Legacy on‑the‑fly re‑hash (only if needed)
//     if (!user.password.startsWith('$2')) {
//       console.log('🔄 [LOGIN] legacy password detected, re‑hashing…');
//       user.password = await bcrypt.hash(user.password, 10);
//       await user.save();
//       console.log('🔄 [LOGIN] password re‑hashed for', user.email);
//     }

//     // 4) Compare provided password
//     const match = await bcrypt.compare(password, user.password);
//     console.log('🔍 [LOGIN] bcrypt.compare result:', match);
//     if (!match) {
//       return res.status(401).json({ msg: 'Invalid credentials' });
//     }

//     // 5) Issue JWT
//     const token = jwt.sign(
//       { id: user._id, email: user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: '1h' }
//     );
//     console.log('✅ [LOGIN] issuing token for', user.email);

//     return res.json({ token });
//   } catch (err) {
//     console.error('❌ [LOGIN] server error:', err);
//     return res.status(500).json({ msg: 'Server error' });
//   }
// });

// module.exports = router;
// server/routes/auth.js
require('dotenv').config();
const router   = require('express').Router();
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const Login    = require('../models/Login');
const Resident = require('../models/Resident'); // Make sure this model has a 'role' field or a way to identify admin.

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
    const newLogin = await new Login({ email, password: await bcrypt.hash(password, 10) }).save();
    console.log('✅ [SIGNUP] new login saved:', newLogin);

    // After successful signup, we assume they are a 'user' unless otherwise specified.
    // Consider adding role to Resident model if not already there, and setting it here.
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

    // 3) Legacy on-the-fly re-hash (only if needed)
    if (user.password && !user.password.startsWith('$2')) { // Added user.password check
      console.log('🔄 [LOGIN] legacy password detected, re-hashing…');
      user.password = await bcrypt.hash(user.password, 10);
      await user.save();
      console.log('🔄 [LOGIN] password re-hashed for', user.email);
    }

    // 4) Compare provided password
    const match = await bcrypt.compare(password, user.password);
    console.log('🔍 [LOGIN] bcrypt.compare result:', match);
    if (!match) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    // --- START FIX: Determine and include user role ---
    let role = 'user'; // Default role
    // Check if the Resident document has a role or if it's the hardcoded admin email
    const residentInfo = await Resident.findOne({ email });

    if (residentInfo && residentInfo.role) { // If Resident model stores a 'role'
        role = residentInfo.role;
    } else if (email === 'wattwise@admin.com') { // Your client-side hardcoded admin email
        role = 'admin';
    }
    // --- END FIX ---

    // 5) Issue JWT - Now include the role in the token payload
    const token = jwt.sign(
      { id: user._id, email: user.email, role: role }, // <--- ADDED 'role' HERE
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('✅ [LOGIN] issuing token for', user.email, 'with role:', role);

    // 6) Return JWT AND the role to the frontend
    return res.json({ token, role: role }); // <--- ADDED 'role' TO RESPONSE
  } catch (err) {
    console.error('❌ [LOGIN] server error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;