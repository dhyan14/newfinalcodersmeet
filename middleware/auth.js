const User = require('../models/User');

// Middleware to check if user is authenticated as admin
function isAdmin(req, res, next) {
  // First check if user is logged in
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  // Check if user has admin privileges (either through role or isAdmin flag)
  if (req.session.isAdmin) {
    return next();
  }
  
  // If not in session, check database (optional extra check)
  User.findById(req.session.userId)
    .then(user => {
      if (!user || (user.role !== 'admin' && !user.isAdmin)) {
        return res.status(403).json({ error: 'Unauthorized. Admin access required.' });
      }
      // User is admin but session doesn't have isAdmin flag, update it
      req.session.isAdmin = true;
      next();
    })
    .catch(err => {
      console.error('Admin auth error:', err);
      return res.status(500).json({ error: 'Server error checking admin status' });
    });
}

module.exports = { isAdmin }; 