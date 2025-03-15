const express = require('express');
const router = express.Router();

// Simple ping endpoint to check admin authentication
router.get('/admin-ping', (req, res) => {
  if (req.session && req.session.userId && req.session.isAdmin) {
    return res.json({ status: 'authenticated', isAdmin: true });
  }
  return res.json({ status: 'unauthenticated', isAdmin: false });
});

module.exports = router; 