// server/routes/adminResidents.js
const express     = require('express');
const router      = express.Router();
const Resident    = require('../models/Resident');
const Login       = require('../models/Login');      // ← import the Login model
const verifyToken = require('../middleware/verifyToken');

// List all residents
// GET /api/admin/residents
router.get('/', verifyToken, async (req, res) => {
  try {
    const residents = await Resident.find().lean();
    res.json(residents);
  } catch (err) {
    console.error('[ADMIN] GET residents error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Add a new resident
// POST /api/admin/residents
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, email, towerNo, flatNo, mobile, password } = req.body;
    // (username was removed earlier)
    if (!name || !email || !towerNo || !flatNo || !mobile || !password) {
      return res.status(400).json({ msg: 'All fields required' });
    }

    // ensure no duplicate resident
    const exists = await Resident.findOne({ email });
    if (exists) {
      return res.status(400).json({ msg: 'Email already in use' });
    }

    // create only in residents
    const newRes = new Resident({ name, email, towerNo, flatNo, mobile, password });
    await newRes.save();

    // note: we do NOT touch the Login collection here—user will log in 
    //   once an admin or auth flow creates their credentials separately.

    res.status(201).json(newRes);
  } catch (err) {
    console.error('[ADMIN] POST resident error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete a resident by ID (cannot delete yourself)
// DELETE /api/admin/residents/:id
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 1) Prevent deleting the logged‑in admin
    if (id === req.user.id) {
      return res.status(403).json({ msg: "Cannot delete the logged‑in admin" });
    }

    // 2) Delete from residents
    const deleted = await Resident.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ msg: 'Resident not found' });
    }

    // 3) Also delete their login record
    //    Assuming Login schema has { email, password, ... }
    await Login.deleteOne({ email: deleted.email });

    return res.json({ msg: 'Resident and login removed', id });
  } catch (err) {
    console.error('[ADMIN] DELETE resident error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
