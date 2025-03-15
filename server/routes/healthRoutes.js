const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Add this additional endpoint to match what the client is looking for
router.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API is running' });
});

module.exports = router; 