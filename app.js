const express = require('express');
const app = express();
const session = require('express-session');
const adminRoutes = require('./routes/admin');
const path = require('path');
const MongoStore = require('connect-mongo');

// Body parser middleware - MUST come BEFORE routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware - MUST come BEFORE routes
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/hack-a-match',
    ttl: 24 * 60 * 60 // 1 day
  }),
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Static files middleware
app.use(express.static('public'));

// Add this after your static middleware but before your API routes
app.get('/admin-dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

// API routes
app.use('/api/admin', adminRoutes);

// Other routes...

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 