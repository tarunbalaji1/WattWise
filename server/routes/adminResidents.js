// server/routes/adminResidents.js
const express     = require('express');
const router      = express.Router();
const Resident    = require('../models/Resident');
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
    const { name, email, towerNo, flatNo, username, mobile, password } = req.body;
    if (!name||!email||!towerNo||!flatNo||!username||!mobile||!password) {
      return res.status(400).json({ msg: 'All fields required' });
    }

    const exists = await Resident.findOne({ email });
    if (exists) return res.status(400).json({ msg: 'Email already in use' });

    const newRes = new Resident({ name, email, towerNo, flatNo, username, mobile, password });
    await newRes.save();
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

    // 1) Block deleting the logged‑in admin
    if (id === req.user.id) {
      return res.status(403).json({ msg: "Cannot delete the logged‑in admin" });
    }

    // 2) Proceed
    const deleted = await Resident.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ msg: 'Resident not found' });

    res.json({ msg: 'Resident removed', id });
  } catch (err) {
    console.error('[ADMIN] DELETE resident error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
