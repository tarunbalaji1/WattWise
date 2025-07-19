// // server/middleware/verifyToken.js
// require('dotenv').config();
// const jwt = require('jsonwebtoken');

// module.exports = function verifyToken(req, res, next) {
//   const auth = req.headers.authorization || '';
//   if (!auth.startsWith('Bearer ')) {
//     return res.status(401).json({ msg: 'Missing or malformed token' });
//   }

//   const token = auth.slice(7);
//   try {
//     const payload = jwt.verify(token, process.env.JWT_SECRET);
//     // payload contains { id, email }
//     req.user = { email: payload.email, id: payload.id };
//     return next();
//   } catch (err) {
//     return res.status(401).json({ msg: 'Invalid or expired token' });
//   }
// };
// server/middleware/verifyToken.js
require('dotenv').config();
const jwt = require('jsonwebtoken');

module.exports = function verifyToken(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'Missing or malformed token' });
  }

  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // --- FIX START ---
    // payload now contains { id, email, role } from auth.js
    req.user = { email: payload.email, id: payload.id, role: payload.role }; // <--- ADDED 'role: payload.role'
    // --- FIX END ---
    return next();
  } catch (err) {
    return res.status(401).json({ msg: 'Invalid or expired token' });
  }
};