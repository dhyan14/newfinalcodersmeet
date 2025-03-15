// existing code...

// Add this route to get all users (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Check if the requesting user is an admin
    if (!req.user.isAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    // Fetch all users
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// existing code... 