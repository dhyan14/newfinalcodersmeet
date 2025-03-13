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

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Add this near the top of your file
const socketIoOptions = {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  path: '/socket.io/',
  allowEIO3: true, // Allow Engine.IO 3 compatibility
  pingTimeout: 60000, // Increase ping timeout
  pingInterval: 25000 // Increase ping interval
};

// Initialize Socket.io with these options
const io = require('socket.io')(server, socketIoOptions);

// Update CORS configuration
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? [process.env.FRONTEND_URL || 'https://newfinalcodersmeet.vercel.app']
        : ['http://localhost:5000', 'http://localhost:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    optionsSuccessStatus: 204,
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Other middleware
app.use(express.json());
app.use(express.static('public', {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
    } else if (path.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    }
  }
}));

// Add better error logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
    next();
});

// Add explicit MIME type handling
app.use((req, res, next) => {
  const url = req.url;
  
  if (url.endsWith('.js')) {
    res.setHeader('Content-Type', 'application/javascript');
  } else if (url.endsWith('.css')) {
    res.setHeader('Content-Type', 'text/css');
  } else if (url.endsWith('.html')) {
    res.setHeader('Content-Type', 'text/html');
  } else if (url.endsWith('.json')) {
    res.setHeader('Content-Type', 'application/json');
  }
  
  next();
});

// MongoDB Connection
let isConnected = false;

const connectToDatabase = async () => {
    if (isConnected) return;

    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000
        });
        isConnected = true;
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        isConnected = false;
        throw error;
    }
};

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Status endpoint
app.get('/api/status', async (req, res) => {
    try {
        await connectToDatabase();
        res.json({
            status: 'ok',
            server: true,
            database: isConnected,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Login route with better error handling
app.post('/api/login', async (req, res) => {
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
app.post('/api/signup', async (req, res) => {
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
app.post('/api/check-username', async (req, res) => {
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
app.get('/api/users/:id', async (req, res) => {
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
app.get('/api/user-by-email', async (req, res) => {
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
app.get('/api/friends', async (req, res) => {
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
app.get('/api/search-users', async (req, res) => {
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

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // Handle specific errors
    if (err.name === 'MongoError' || err.name === 'MongooseError') {
        return res.status(500).json({
            status: 'error',
            message: 'Database error occurred',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
    
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            details: err.message
        });
    }
    
    // Default error response
    res.status(500).json({
        status: 'error',
        message: err.message || 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// Update the Socket.IO initialization with better error handling
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL || 'https://newfinalcodersmeet.vercel.app']
      : ['http://localhost:5000', 'http://localhost:3000'],
    methods: ["GET", "POST"],
    credentials: true
  },
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Add Socket.IO error handling
io.engine.on("connection_error", (err) => {
  console.log("Connection error:", err);
});

// Improve Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('join-squad-room', async (squadId) => {
    try {
      socket.join(`squad-${squadId}`);
      console.log(`User ${socket.id} joined squad room: squad-${squadId}`);
      
      // Fetch recent messages for this squad
      const recentMessages = await SquadChat.find({ squadId })
        .sort({ timestamp: -1 })
        .limit(50)
        .populate('sender', 'username')
        .lean();
      
      // Send previous messages to the client
      socket.emit('previous-messages', recentMessages.reverse());
    } catch (error) {
      console.error('Error in join-squad-room:', error);
      socket.emit('error', { message: 'Failed to join squad room' });
    }
  });
  
  socket.on('squad-message', async (data) => {
    try {
      console.log('Received squad message:', data);
      
      // Validate message data
      if (!data.squadId || !data.message) {
        throw new Error('Invalid message data');
      }
      
      // Save message to database
      const chatMessage = new SquadChat({
        squadId: data.squadId,
        sender: data.senderId,
        senderName: data.sender,
        content: data.message,
        timestamp: new Date()
      });
      
      await chatMessage.save();
      
      // Broadcast to all clients in the room
      io.to(`squad-${data.squadId}`).emit('squad-message', {
        ...data,
        timestamp: chatMessage.timestamp
      });
    } catch (error) {
      console.error('Error handling squad message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Update the GET endpoint to retrieve messages with "since" parameter
app.get('/api/squad-messages', async (req, res) => {
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
app.post('/api/squad-messages', async (req, res) => {
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
      io.to(`squad-${squadId}`).emit('squad-message', {
        squadId,
        message,
        sender,
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

// Add a server info endpoint for debugging
app.get('/api/server-info', (req, res) => {
  res.json({
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    hostname: req.hostname,
    headers: req.headers,
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  server.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
  });
}

// For Vercel, export the Express app
module.exports = app; 
