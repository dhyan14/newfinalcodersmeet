// Middleware to check if user is authenticated as admin
function isAdmin(req, res, next) {
  // Check if user is logged in and has admin role
  if (req.session && req.session.userId && req.session.isAdmin) {
    return next();
  }
  
  return res.status(401).json({ error: 'Unauthorized. Admin access required.' });
}

module.exports = { isAdmin }; 