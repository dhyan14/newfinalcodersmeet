const adminRoutes = require('./routes/admin');
const session = require('express-session');

// Session setup MUST come BEFORE routes that use it
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Admin routes - now session middleware is available here
app.use('/api/admin', adminRoutes); 