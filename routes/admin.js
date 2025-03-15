const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const User = require('../models/User'); // Adjust path to your User model

// Helper function to get user by email
async function getUserByEmail(email) {
  return await User.findOne({ email });
}

// Helper function to compare passwords - use bcrypt in production
async function comparePasswords(inputPassword, storedPassword) {
  // In production, use bcrypt.compare
  // For now, simple comparison (REPLACE THIS IN PRODUCTION)
  return inputPassword === storedPassword;
}

// Helper function to get all users
async function getAllUsers() {
  return await User.find({}, '-password'); // Exclude password field
}

// Admin login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists and has admin role
    const user = await getUserByEmail(email);
    
    if (!user || user.role !== 'admin' || !(await comparePasswords(password, user.password))) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }
    
    // Create session for admin
    req.session.userId = user._id;
    req.session.isAdmin = true;
    
    res.status(200).json({ message: 'Admin login successful' });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Server error during admin login' });
  }
});

// Check if user is authenticated as admin
router.get('/check-auth', isAdmin, (req, res) => {
  res.status(200).json({ isAdmin: true });
});

// Admin logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid'); // Clear session cookie
    res.status(200).json({ message: 'Logout successful' });
  });
});

// Get all users (protected by admin middleware)
router.get('/users', isAdmin, async (req, res) => {
  try {
    // Fetch all users from database
    const users = await getAllUsers();
    
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error while fetching users' });
  }
});

module.exports = router; 