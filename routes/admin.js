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
    console.log('Admin login attempt:', email);
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if user exists and has admin role
    const user = await getUserByEmail(email);
    console.log('User found:', user ? user.email : 'No user');
    
    // Check for either role='admin' OR isAdmin=true to handle both
    if (!user || (user.role !== 'admin' && !user.isAdmin) || !(await comparePasswords(password, user.password))) {
      console.log('Invalid credentials or not admin');
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }
    
    // Create session for admin
    req.session.userId = user._id;
    req.session.isAdmin = true;
    
    console.log('Admin login successful for:', user.email);
    res.status(200).json({ 
      message: 'Admin login successful',
      admin: {
        fullName: user.fullName,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Server error during admin login' });
  }
});

// Check if user is authenticated as admin
router.get('/check-auth', isAdmin, async (req, res) => {
  try {
    // Get admin user data to return
    const admin = await User.findById(req.session.userId, '-password');
    res.status(200).json({ isAdmin: true, admin });
  } catch (error) {
    console.error('Error fetching admin data:', error);
    res.status(200).json({ isAdmin: true }); // Still return isAdmin true even if user fetch fails
  }
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

// Add dashboard stats endpoint
router.get('/dashboard-stats', isAdmin, async (req, res) => {
  try {
    // Get counts from database
    const totalUsers = await User.countDocuments();
    
    // Get users created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newUsers = await User.countDocuments({ createdAt: { $gte: today } });
    
    // You can add more stats here based on your data model
    
    res.status(200).json({
      totalUsers,
      newUsers,
      connections: 0, // Replace with actual count when available
      projects: 0     // Replace with actual count when available
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Server error while fetching dashboard stats' });
  }
});

module.exports = router; 