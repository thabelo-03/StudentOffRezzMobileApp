const express = require('express');
const router = express.Router();
const { admin, db } = require('../firebaseAdmin'); // Use Firebase instead of Mongoose
const auth = require('../middleware/authMiddleware');
const { firebaseGetSystemConfig, firebaseUpdateSystemConfig } = require('../services/firebaseService');

// @route   GET /api/admin/users
// @desc    Get all users from Firebase Realtime Database
router.get('/users', auth, async (req, res) => {
  try {
    // Check if the requester is actually an admin (Optional but recommended)
    // if (req.user.role !== 'admin') return res.status(403).json({ message: "Admin access only" });

    const snapshot = await db.ref('users').once('value');
    const usersData = snapshot.val();

    if (!usersData) return res.json([]);

    // Convert Firebase object to Array
    const usersList = Object.keys(usersData).map(uid => ({
      id: uid,
      ...usersData[uid]
    }));

    res.json(usersList);
  } catch (err) {
    console.error("Admin Users Fetch Error:", err.message);
    res.status(500).json({ message: 'Server Error fetching users' });
  }
});

// @route   DELETE /api/admin/users/:uid
// @desc    Delete user from both Firebase Auth and Realtime Database
router.delete('/users/:uid', auth, async (req, res) => {
  try {
    const { uid } = req.params;

    // 1. Delete from Firebase Authentication
    await admin.auth().deleteUser(uid);

    // 2. Delete from Realtime Database
    await db.ref(`users/${uid}`).remove();

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error("Admin Delete Error:", err.message);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// @route   PUT /api/admin/users/:uid/status
// @desc    Block or Unblock a user
router.put('/users/:uid/status', auth, async (req, res) => {
  try {
    const { uid } = req.params;
    const { disabled } = req.body; // true = block, false = unblock

    // 1. Update Firebase Auth status
    await admin.auth().updateUser(uid, { disabled });

    // 2. Update Realtime Database to reflect status in UI
    await db.ref(`users/${uid}`).update({ disabled });

    res.json({ message: `User ${disabled ? 'blocked' : 'unblocked'} successfully`, disabled });
  } catch (err) {
    console.error("Admin Block Error:", err.message);
    res.status(500).json({ message: 'Error updating user status' });
  }
});

// @route   PUT /api/admin/users/:uid/verification
// @desc    Update landlord verification status (Approve/Reject)
router.put('/users/:uid/verification', auth, async (req, res) => {
  try {
    const { uid } = req.params;
    const { status } = req.body; // 'verified', 'rejected', 'pending'

    if (!['verified', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status provided' });
    }

    // Update Realtime Database
    const updates = { verificationStatus: status };

    // If approving a student, set studentVerified to true
    const userSnap = await db.ref(`users/${uid}`).once('value');
    const user = userSnap.val();
    if (user && user.role === 'student' && status === 'verified') {
      updates.studentVerified = true;
    }

    await db.ref(`users/${uid}`).update(updates);

    // Simulate sending email (In production, use nodemailer here)
    if (status === 'verified') {
      const userSnap = await db.ref(`users/${uid}`).once('value');
      const userEmail = userSnap.val()?.email;
      console.log(`[EMAIL SERVICE] Sending approval email to ${userEmail}`);
    }

    res.json({ message: `User verification updated to ${status}`, verificationStatus: status });
  } catch (err) {
    console.error("Admin Verify Error:", err.message);
    res.status(500).json({ message: 'Error updating verification status' });
  }
});

// @route   POST /api/admin/users/reset-password
// @desc    Generate password reset link
router.post('/users/reset-password', auth, async (req, res) => {
  try {
    const { email } = req.body;
    const link = await admin.auth().generatePasswordResetLink(email);
    console.log(`[PASSWORD RESET] Link for ${email}: ${link}`);
    res.json({ message: 'Password reset link generated (Check server logs)' });
  } catch (err) {
    console.error("Admin Reset Password Error:", err.message);
    res.status(500).json({ message: 'Error generating reset link' });
  }
});

// @route   GET /api/admin/config
// @desc    Get system configuration
router.get('/config', auth, async (req, res) => {
  try {
    const config = await firebaseGetSystemConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching config' });
  }
});

// @route   PUT /api/admin/config
// @desc    Update system configuration
router.put('/config', auth, async (req, res) => {
  try {
    const updated = await firebaseUpdateSystemConfig(req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating config' });
  }
});

module.exports = router;