const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { firebaseCreateReport, firebaseGetAllReports } = require('../services/firebaseService');

// @route   POST /api/reports
// @desc    Submit a new report (Student or Landlord)
router.post('/', auth, async (req, res) => {
  try {
    const reportData = {
      ...req.body,
      reporterId: req.user.uid,
      reporterEmail: req.user.email,
      reporterRole: req.user.role
    };
    const report = await firebaseCreateReport(reportData);
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ message: 'Error creating report' });
  }
});

// @route   GET /api/reports
// @desc    Get all reports (Admin only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
    const reports = await firebaseGetAllReports();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reports' });
  }
});

module.exports = router;