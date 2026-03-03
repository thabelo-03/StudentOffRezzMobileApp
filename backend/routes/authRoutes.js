const express = require('express');
const router = express.Router();
const { registerUser } = require('../controllers/authController');

// This matches api.post('/auth/register')
router.post('/register', registerUser);

module.exports = router;