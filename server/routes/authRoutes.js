// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Email and password are required' 
      });
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Invalid email or password' 
      });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Invalid email or password' 
      });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Return user data and token
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          profileImage: user.profileImage || null
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      status: 'error', 
      message: 'Server error during login' 
    });
  }
}); 