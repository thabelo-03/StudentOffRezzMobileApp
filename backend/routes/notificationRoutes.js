const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

// Define or access the Notification model
const Notification = mongoose.models.Notification || mongoose.model('Notification', new mongoose.Schema({}, {strict: false}), 'notifications');

/**
 * @route   GET /api/notifications
 * @desc    Get notifications for the logged-in user (Landlord)
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    // 1. Convert the ID from the token to an ObjectId
    const userId = new mongoose.Types.ObjectId(req.user._id);

    // 2. Find notifications where the logged-in user is the recipient
    const notifications = await Notification.find({
      $or: [
        { recipient: userId },
        { recipient: req.user._id.toString() }
      ]
    }).sort({ createdAt: -1 });

    console.log(`🔔 Found ${notifications.length} notifications for user ${req.user.email}`);
    res.json(notifications);
  } catch (err) {
    console.error('Notification Route Error:', err.message);
    res.status(500).json({ message: "Error fetching notifications" });
  }
});

module.exports = router;