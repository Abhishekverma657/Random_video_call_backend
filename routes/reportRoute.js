const express = require('express');
const router = express.Router();
const Reported = require('../models/ReportedUsers');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/report
router.post('/', authMiddleware,  async (req, res) => {
  const { reporterUid, reportedUid, reason } = req.body;
  if (!reporterUid || !reportedUid) {
    return res.status(400).json({ error: 'reporterUid and reportedUid required' });
  }
  try {
    await Reported.create({ reporterUid, reportedUid, reason });
    res.json({ message: 'User reported successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to report user' });
  }
});

module.exports = router;