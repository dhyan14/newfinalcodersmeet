const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Email and password are required' 
      });
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Invalid email or password' 
      });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Invalid email or password' 
      });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Return user data and token
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          profileImage: user.profileImage || null
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      status: 'error', 
      message: 'Server error during login' 
    });
  }
});

// Simplified login route for debugging
router.post('/login-simple', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Log the request for debugging
    console.log('Login attempt:', { email, passwordProvided: !!password });
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Email and password are required' 
      });
    }
    
    // Just return success for testing
    res.status(200).json({
      status: 'success',
      message: 'Login route is working',
      email: email
    });
  } catch (error) {
    console.error('Simplified login error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Server error during login',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Debug endpoint
router.get('/auth-test', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Auth routes are working',
    timestamp: new Date().toISOString()
  });
});

// Don't forget to export the router
module.exports = router; 