const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok',
        message: 'API is running',
        timestamp: new Date().toISOString()
    });
});

// Root health endpoint
router.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Add a test endpoint
router.get('/test', (req, res) => {
  res.status(200).json({ 
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 