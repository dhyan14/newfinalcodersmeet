const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();
const http = require('http');

// Import models
const User = require('./models/User');
const Message = require('./models/Message');
const FriendRequest = require('./models/FriendRequest');
const SquadChat = require('./models/SquadChat');
const Squad = require('./models/Squad');

// Create Express app and HTTP server
const app = express();

// Middleware setup - order is important
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`
    );
  });
  next();
});

// Create HTTP server after middleware setup
const server = http.createServer(app);

// MongoDB Connection
const connectToDatabase = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return; // Already connected
    }
    
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/codersmeet';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    
    console.log('Connected to MongoDB');
    
    // Ensure indexes are created
    await User.collection.createIndex({ location: '2dsphere' });
    await User.collection.createIndex({ username: 'text', fullName: 'text', skills: 'text' });
    
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Initialize Socket.IO after server creation
const io = require('socket.io')(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  path: '/socket.io/',
  transports: ['polling', 'websocket'],
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000
});

// Socket.IO error handling
io.engine.on("connection_error", (err) => {
  console.error("Socket.IO connection error:", err);
});

// API Router setup
const apiRouter = express.Router();
app.use('/api', apiRouter);

// API Routes
apiRouter.get('/server-info', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    socketEnabled: true,
    version: '1.0.0',
    features: {
      geolocation: true,
      chat: true,
      squads: true
    }
  });
});

// Squad routes
apiRouter.get('/squad/:squadId/members', async (req, res, next) => {
  try {
    const { squadId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(squadId)) {
      return res.status(400).json({ error: 'Invalid squad ID' });
    }

    const squad = await Squad.findById(squadId)
      .populate('members.user', 'username fullName email skills')
      .lean();
    
    if (!squad) {
      return res.status(404).json({ error: 'Squad not found' });
    }

    res.json(squad.members);
  } catch (error) {
    next(error);
  }
});

// User routes
apiRouter.get('/users/search', async (req, res, next) => {
  try {
    const { q, lat, lng, distance = 10 } = req.query;
    let query = {};
    
    // Text search
    if (q) {
      query.$or = [
        { username: new RegExp(q, 'i') },
        { fullName: new RegExp(q, 'i') },
        { skills: new RegExp(q, 'i') }
      ];
    }

    // Location search
    if (lat && lng) {
      const coords = [parseFloat(lng), parseFloat(lat)];
      if (!isNaN(coords[0]) && !isNaN(coords[1])) {
        query.location = {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: coords
            },
            $maxDistance: distance * 1000
          }
        };
      }
    }

    const users = await User.find(query)
      .select('username fullName email location skills')
      .limit(20)
      .lean();

    res.json(users);
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/users/location', async (req, res, next) => {
  try {
    const { userId, latitude, longitude } = req.body;
    
    if (!userId || !latitude || !longitude) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const coords = [parseFloat(longitude), parseFloat(latitude)];
    if (isNaN(coords[0]) || isNaN(coords[1])) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const user = await User.findByIdAndUpdate(userId, {
      location: {
        type: "Point",
        coordinates: coords
      },
      locationUpdatedAt: new Date()
    }, { new: true });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Location updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Login route with better error handling
apiRouter.post('/login', async (req, res) => {
    try {
        await connectToDatabase();
        const { email, password } = req.body;
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check password (in a real app, you would compare hashed passwords)
        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        
        // Return user data without password
        res.json({ 
            success: true, 
            user: {
                _id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed', details: error.message });
    }
});

// Signup route with validation
apiRouter.post('/signup', async (req, res) => {
    try {
        await connectToDatabase();
        const { fullName, email, password, username } = req.body;
        
        // Basic validation
        if (!email || !password || !fullName || !username) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({ error: 'Email already registered' });
            }
            if (existingUser.username === username) {
                return res.status(400).json({ error: 'Username already taken' });
            }
        }
        
        // Create new user
        const newUser = new User({
            fullName,
            username,
            email,
            password, // In a real app, you should hash this password
            createdAt: new Date()
        });
        
        // Save user to database
        await newUser.save();
        
        // Return success without sending the password back
        res.status(201).json({ 
            success: true, 
            message: 'User registered successfully',
            user: {
                _id: newUser._id,
                fullName: newUser.fullName,
                username: newUser.username,
                email: newUser.email
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Signup failed', details: error.message });
    }
});

// Add this to your server.js file - Username availability check endpoint
apiRouter.post('/check-username', async (req, res) => {
    try {
        await connectToDatabase();
        const { username } = req.body;
        
        if (!username || username.length < 3) {
            return res.status(400).json({ 
                error: 'Username must be at least 3 characters long' 
            });
        }
        
        // Check if username exists
        const existingUser = await User.findOne({ username });
        
        res.json({
            available: !existingUser,
            username
        });
    } catch (error) {
        console.error('Username check error:', error);
        res.status(500).json({ 
            error: 'Failed to check username availability',
            details: error.message 
        });
    }
});

// Get user by ID
apiRouter.get('/users/:id', async (req, res) => {
    try {
        await connectToDatabase();
        const userId = req.params.id;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Return user data without password
        res.json({ 
            success: true, 
            user: {
                _id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                bio: user.bio,
                avatarUrl: user.avatarUrl,
                skills: user.skills,
                connections: user.connections.length
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user data', details: error.message });
    }
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// HTML file handler
app.get('/*.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', req.path));
});

// Get user by email
apiRouter.get('/user-by-email', async (req, res) => {
  try {
    await connectToDatabase();
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user by email:', error);
    res.status(500).json({ error: 'Failed to fetch user', details: error.message });
  }
});

// Get friends by user ID
apiRouter.get('/friends', async (req, res) => {
  try {
    await connectToDatabase();
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get friends (assuming you have a connections array in your User model)
    const friends = await User.find({ _id: { $in: user.connections || [] } });
    
    res.json(friends);
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ error: 'Failed to fetch friends', details: error.message });
  }
});

// Search users
apiRouter.get('/search-users', async (req, res) => {
  try {
    await connectToDatabase();
    const { term } = req.query;
    
    if (!term) {
      return res.status(400).json({ error: 'Search term is required' });
    }
    
    const users = await User.find({
      $or: [
        { username: { $regex: term, $options: 'i' } },
        { fullName: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } }
      ]
    }).limit(10);
    
    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users', details: error.message });
  }
});

// Update your catch-all route to only handle HTML requests, not API requests
app.get('*', (req, res, next) => {
  // Skip API routes - they should be handled by their own handlers
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // For non-API routes, serve the index.html file
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Add a specific 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'API endpoint not found',
    path: req.path
  });
});

// Add this before your routes
app.use((req, res, next) => {
  // Log all requests
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Add this after your routes
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Update the GET endpoint to retrieve messages with "since" parameter
apiRouter.get('/squad-messages', async (req, res) => {
  try {
    console.log('GET /api/squad-messages - Query:', req.query);
    await connectToDatabase();
    
    const { squadId, since } = req.query;
    
    // Build the query
    const query = {};
    
    // Add squadId filter if provided
    if (squadId) {
      query.squadId = squadId;
    }
    
    // Add timestamp filter if "since" parameter is provided
    if (since) {
      try {
        query.timestamp = { $gt: new Date(since) };
      } catch (e) {
        console.error('Invalid date format for since parameter:', since, e);
      }
    }
    
    console.log('MongoDB query:', JSON.stringify(query));
    
    // Get messages
    const messages = await SquadChat.find(query)
      .sort({ timestamp: 1 }) // Sort by timestamp ascending
      .limit(50)
      .populate('sender', 'username fullName')
      .lean();
    
    console.log(`Found ${messages.length} messages`);
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update the POST endpoint for messages
apiRouter.post('/squad-messages', async (req, res) => {
  try {
    console.log('POST /api/squad-messages - Body:', req.body);
    await connectToDatabase();
    
    const { squadId, message, sender, senderId, timestamp } = req.body;
    
    // Validate required fields
    if (!squadId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Squad ID and message are required',
        error: 'Missing required fields'
      });
    }
    
    console.log('Received message:', { squadId, message, sender });
    
    // Create new message
    const chatMessage = new SquadChat({
      squadId: squadId,
      sender: senderId || 'anonymous',
      senderName: sender || 'Anonymous',
      content: message,
      timestamp: timestamp || new Date()
    });
    
    // Save to database
    await chatMessage.save();
    console.log('Message saved to database with ID:', chatMessage._id);
    
    // Emit to socket clients if needed
    if (io) {
      io.to(`squad_${squadId}`).emit('new-message', {
        id: chatMessage._id,
        squadId,
        message,
        sender,
        senderName: chatMessage.senderName,
        timestamp: chatMessage.timestamp
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: chatMessage
    });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update the error handling middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ 
      error: 'API endpoint not found', 
      path: req.path,
      method: req.method 
    });
  } else {
    next();
  }
});

// Add better request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`
    );
  });
  next();
});

// Server startup
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectToDatabase();
    
    // Then start the server
    const port = process.env.PORT || 3000;
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'production') {
  startServer().catch(error => {
    console.error('Server startup failed:', error);
    process.exit(1);
  });
}

// Export for production
module.exports = app; 
