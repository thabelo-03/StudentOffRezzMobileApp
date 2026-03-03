// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/authMiddleware'); // Your JWT checker

// GET all users (Same database used for login)
router.get('/users', auth, async (req, res) => {
  try {
    // Optional: Check if the logged-in user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    // Fetch users but EXCLUDE the password field for security
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;