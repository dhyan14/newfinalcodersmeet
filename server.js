const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

// Import models
const User = require('./models/User');
const Message = require('./models/Message');
const FriendRequest = require('./models/FriendRequest');
const SquadChat = require('./models/SquadChat');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Configure CORS first, before any routes
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Add this to your chat-server.js
const isProduction = process.env.NODE_ENV === 'production';
console.log(`Running in ${isProduction ? 'production' : 'development'} mode`);

// Configure Socket.IO differently based on environment
const io = new Server(server, {
  cors: {
    // In production, be more restrictive about origins
    origin: isProduction 
      ? ['https://www.dhyanjain.me', 'https://newfinalcodersmeet.vercel.app'] 
      : '*',
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling'], // Prioritize polling for Vercel
  pingTimeout: 10000,
  pingInterval: 3000
});

// Add Socket.IO connection handling with better error handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  // Handle joining squad room with error handling
  socket.on('join-squad', async (squadId) => {
    try {
      if (!squadId) {
        throw new Error('Squad ID is required');
      }

      const roomName = `squad_${squadId}`;
      await socket.join(roomName);
      console.log(`Socket ${socket.id} joined room: ${roomName}`);

      // Load previous messages
      const messages = await SquadChat.find({ squadId })
        .sort({ timestamp: -1 })
        .limit(50)
        .populate('sender', 'username fullName')
        .lean();

      socket.emit('chat-history', messages.reverse());
    } catch (error) {
      console.error('Error joining squad:', error);
      socket.emit('chat-error', { message: error.message });
    }
  });

  // Handle chat messages
  socket.on('squad-message', async (data) => {
    try {
      if (!data.squadId || !data.message) {
        throw new Error('Invalid message data');
      }

      const message = new SquadChat({
        squadId: data.squadId,
        sender: data.senderId,
        senderName: data.sender || 'Anonymous',
        content: data.message,
        timestamp: new Date()
      });

      await message.save();

      // Broadcast to room
      io.to(`squad_${data.squadId}`).emit('new-message', {
        id: message._id,
        squadId: message.squadId,
        sender: message.sender,
        senderName: message.senderName,
        content: message.content,
        timestamp: message.timestamp
      });

    } catch (error) {
      console.error('Error handling message:', error);
      socket.emit('chat-error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

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
app.use(cors({
  origin: '*', // In development allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Make sure OPTIONS requests are handled properly
app.options('*', cors());

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

// Add specific routes for key files
app.get('/js/squad-chat.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'public', 'js', 'squad-chat.js'));
});

app.get('/js/fallback-chat.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'public', 'js', 'fallback-chat.js'));
});

app.get('/socket.io/socket.io.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'node_modules', 'socket.io', 'client-dist', 'socket.io.js'));
});

// Add proper error handling for static files
app.use((err, req, res, next) => {
    if (err.code === 'ENOENT') {
        res.status(404).json({ error: 'File not found' });
    } else {
        console.error('Server error:', err);
        res.status(500).json({
            error: true,
            message: process.env.NODE_ENV === 'production' 
                ? 'Internal server error' 
                : err.message
        });
    }
});

// Add this near the top of server.js or in a separate file
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10, // Limit connections for serverless
    serverSelectionTimeoutMS: 5000
  });

  cachedDb = mongoose.connection;
  
  // Handle connection errors
  cachedDb.on('error', (err) => {
    console.error('MongoDB connection error:', err);
    cachedDb = null;
  });

  return cachedDb;
}

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
            database: cachedDb ? true : false,
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

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: true,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// Update the GET endpoint to retrieve messages with "since" parameter
app.get('/api/squad-messages', async (req, res) => {
  try {
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
    res.status(500).json({ error: error.message });
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

// Add server info endpoint with error handling
app.get('/api/server-info', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// For Vercel, export the Express app
module.exports = app; 

// ========== USER SCHEMA WITH GEOLOCATION SUPPORT ==========
// Update your existing User schema to include location data
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // Add these fields for location tracking
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude] in GeoJSON format
      default: [0, 0]
    }
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
  // Keep any other existing fields you had
});

// Add a geospatial index for efficient location queries
userSchema.index({ location: '2dsphere' });

// If you already defined your User model, update it instead of creating a new one
const User = mongoose.model('User', userSchema);

// ========== API ENDPOINTS FOR LOCATION SERVICES ==========

// Simple ping endpoint to check if server is running
app.get('/api/ping', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Update a user's location by email
app.post('/api/users/location-by-email', async (req, res) => {
  try {
    const { email, latitude, longitude } = req.body;
    
    if (!email || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        details: 'Email, latitude, and longitude are required' 
      });
    }
    
    // Convert string values to numbers if needed
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    // Validate coordinates
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }
    
    // Update user location in database
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { 
        location: {
          type: 'Point',
          coordinates: [lng, lat] // GeoJSON format is [longitude, latitude]
        },
        lastActive: new Date()
      },
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json({ 
      message: 'Location updated successfully',
      user: {
        email: updatedUser.email,
        location: updatedUser.location
      }
    });
    
  } catch (error) {
    console.error('Error updating user location:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// Find nearby users by email within different distance ranges
app.get('/api/users/nearby-by-email', async (req, res) => {
  try {
    const { email, latitude, longitude } = req.query;
    
    if (!email || !latitude || !longitude) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    // Validate coordinates
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }
    
    // Find the current user
    const currentUser = await User.findOne({ email });
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Define distance ranges in kilometers
    const ranges = [1, 5, 10, 25, 50];
    const result = [];
    
    // Query users within each range
    for (const range of ranges) {
      // Get users who were active in the last 24 hours
      const activeTimeLimit = new Date();
      activeTimeLimit.setHours(activeTimeLimit.getHours() - 24);
      
      const usersInRange = await User.find({
        email: { $ne: email }, // Exclude current user
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: range * 1000 // Convert km to meters
          }
        },
        lastActive: { $gte: activeTimeLimit } // Only active users
      }).select('_id fullName email location');
      
      // Calculate distance for each user and filter out duplicates
      const previousUsers = result.flatMap(r => r.users.map(u => u.email));
      const newUsers = usersInRange.filter(user => !previousUsers.includes(user.email));
      
      const usersWithDistance = newUsers.map(user => {
        const userLng = user.location.coordinates[0];
        const userLat = user.location.coordinates[1];
        const distance = calculateDistance(lat, lng, userLat, userLng);
        
        return {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          distance: distance // Distance in kilometers
        };
      });
      
      result.push({
        range,
        users: usersWithDistance
      });
    }
    
    res.status(200).json(result);
    
  } catch (error) {
    console.error('Error finding nearby users:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// API endpoint for sending friend requests
app.post('/api/send-friend-request', async (req, res) => {
  try {
    const { senderEmail, receiverEmail } = req.body;
    
    if (!senderEmail || !receiverEmail) {
      return res.status(400).json({ error: 'Missing sender or receiver email' });
    }
    
    // Prevent sending a friend request to yourself
    if (senderEmail === receiverEmail) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }
    
    // Find sender and receiver users
    const sender = await User.findOne({ email: senderEmail });
    const receiver = await User.findOne({ email: receiverEmail });
    
    if (!sender || !receiver) {
      return res.status(404).json({ error: 'Sender or receiver not found' });
    }
    
    // Check if this friend request already exists
    const existingRequest = await FriendRequest.findOne({
      sender: sender._id,
      receiver: receiver._id,
      status: 'pending'
    });
    
    if (existingRequest) {
      return res.status(409).json({ error: 'Friend request already sent' });
    }
    
    // Check if they are already friends
    const areFriends = await Friendship.findOne({
      $or: [
        { user1: sender._id, user2: receiver._id },
        { user1: receiver._id, user2: sender._id }
      ]
    });
    
    if (areFriends) {
      return res.status(409).json({ error: 'Already friends' });
    }
    
    // Create and save new friend request
    const friendRequest = new FriendRequest({
      sender: sender._id,
      receiver: receiver._id,
      status: 'pending',
      createdAt: new Date()
    });
    
    await friendRequest.save();
    
    res.status(201).json({ message: 'Friend request sent successfully' });
    
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// Friend Request Schema
const friendRequestSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);

// Friendship Schema to track established friendships
const friendshipSchema = new mongoose.Schema({
  user1: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user2: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

// Ensure no duplicate friendships
friendshipSchema.index({ user1: 1, user2: 1 }, { unique: true });

const Friendship = mongoose.model('Friendship', friendshipSchema);

// Helper function to calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  
  return distance;
}

// Get friend requests endpoint
app.get('/api/friend-requests', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Find pending friend requests for this user
    const requests = await FriendRequest.find({
      receiver: user._id,
      status: 'pending'
    }).populate('sender', 'fullName email');
    
    // Format the response with time ago
    const formattedRequests = requests.map(request => {
      const timeAgo = getTimeAgo(request.createdAt);
      
      return {
        _id: request._id,
        sender: {
          _id: request.sender._id,
          fullName: request.sender.fullName,
          email: request.sender.email
        },
        status: request.status,
        createdAt: request.createdAt,
        timeAgo
      };
    });
    
    res.status(200).json(formattedRequests);
    
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// Helper function to format time ago
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) return interval + ' years ago';
  
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) return interval + ' months ago';
  
  interval = Math.floor(seconds / 86400);
  if (interval > 1) return interval + ' days ago';
  if (interval === 1) return 'yesterday';
  
  interval = Math.floor(seconds / 3600);
  if (interval > 1) return interval + ' hours ago';
  if (interval === 1) return '1 hour ago';
  
  interval = Math.floor(seconds / 60);
  if (interval > 1) return interval + ' minutes ago';
  if (interval === 1) return '1 minute ago';
  
  return 'just now';
}

// Handle friend request responses
app.post('/api/friend-request-response', async (req, res) => {
  try {
    const { requestId, action } = req.body;
    
    if (!requestId || !action || !['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }
    
    // Find the friend request
    const request = await FriendRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ error: 'Friend request not found' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'This request has already been processed' });
    }
    
    if (action === 'accept') {
      // Update request status
      request.status = 'accepted';
      request.updatedAt = new Date();
      await request.save();
      
      // Create friendship record
      const friendship = new Friendship({
        user1: request.sender,
        user2: request.receiver,
        createdAt: new Date()
      });
      
      await friendship.save();
      
      res.status(200).json({ message: 'Friend request accepted' });
    } else {
      // Reject request
      request.status = 'rejected';
      request.updatedAt = new Date();
      await request.save();
      
      res.status(200).json({ message: 'Friend request rejected' });
    }
    
  } catch (error) {
    console.error('Error processing friend request:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
}); 
