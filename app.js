const express = require('express');
const app = express();
const session = require('express-session');
const adminRoutes = require('./routes/admin');
console.log('Admin routes loaded:', Object.keys(adminRoutes));
const path = require('path');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
require('dotenv').config();
const adminPingRoutes = require('./routes/admin-ping');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hack-a-match';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Body parser middleware - MUST come BEFORE routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware - MUST come BEFORE routes
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

// Static files middleware
app.use(express.static('public'));

// Direct admin ping route for debugging
app.get('/api/admin-ping-direct', (req, res) => {
  res.set('Content-Type', 'application/json');
  
  if (req.session && req.session.userId && req.session.isAdmin) {
    return res.send(JSON.stringify({ status: 'authenticated', isAdmin: true }));
  }
  return res.send(JSON.stringify({ status: 'unauthenticated', isAdmin: false }));
});

// Add this test route BEFORE any other routes
app.post('/api/test-login', (req, res) => {
  console.log('Test login route hit!', req.body);
  res.json({ message: 'Test login route working' });
});

// API routes - Make sure these are registered BEFORE any catch-all routes
app.use('/api/admin', adminRoutes);

// Add this after your static middleware but before any catch-all routes
app.get('/admin-dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

// API routes
app.use('/api', adminPingRoutes);

// Other routes...

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 