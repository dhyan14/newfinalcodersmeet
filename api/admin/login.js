const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const User = require('../../models/User');

// Connect to MongoDB if not already connected
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hack-a-match';
if (mongoose.connection.readyState !== 1) {
  mongoose.connect(MONGODB_URI)
    .catch(err => console.error('MongoDB connection error:', err));
}

// Create a serverless-compatible Express app
const app = express();

// Body parser middleware
app.use(express.json());

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGODB_URI,
    ttl: 24 * 60 * 60 // 1 day
  }),
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Admin login endpoint
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Admin login attempt:', email);
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if user exists and has admin role
    const user = await User.findOne({ email });
    console.log('User found:', user ? user.email : 'No user');
    
    // Check for either role='admin' OR isAdmin=true to handle both
    if (!user || (user.role !== 'admin' && !user.isAdmin) || password !== user.password) {
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

// Export the Express API
module.exports = app; 