const adminRoutes = require('./routes/admin');

// Admin routes
app.use('/api/admin', adminRoutes); 

// Session setup (required for admin authentication)
const session = require('express-session');
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
})); 