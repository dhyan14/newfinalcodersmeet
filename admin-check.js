const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hack-a-match';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected for admin check'))
  .catch(err => console.error('MongoDB connection error:', err));

// Create a standalone Express app just for admin check
const app = express();

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

// Admin check endpoint
app.get('/admin-check', (req, res) => {
  console.log('Admin check request received');
  console.log('Session:', req.session);
  
  res.setHeader('Content-Type', 'application/json');
  
  if (req.session && req.session.userId && req.session.isAdmin) {
    console.log('User is admin');
    return res.send(JSON.stringify({ status: 'authenticated', isAdmin: true }));
  }
  
  console.log('User is not admin');
  return res.send(JSON.stringify({ status: 'unauthenticated', isAdmin: false }));
});

// Start server on a different port
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Admin check server running on port ${PORT}`);
}); 