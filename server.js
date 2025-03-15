const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Message = require('./models/Message');
const FriendRequest = require('./models/FriendRequest');
const SquadChat = require('./models/SquadChat');

const app = express();

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
app.use(express.static('public'));

// Add better error logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
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

// Update user location with debugging
app.post('/api/users/location-by-email', async (req, res) => {
    try {
        await connectToDatabase();
        const { email, latitude, longitude } = req.body;
        
        console.log('Updating location for:', { email, latitude, longitude }); // Debug log
        
        if (!email || latitude === undefined || longitude === undefined) {
            return res.status(400).json({ error: 'Email, latitude, and longitude are required' });
        }
        
        // Update user's location in the database
        const user = await User.findOneAndUpdate(
            { email }, 
            { 
                location: {
                    type: 'Point',
                    coordinates: [longitude, latitude] // GeoJSON format: [longitude, latitude]
                },
                lastLocationUpdate: new Date()
            },
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        console.log('Location updated for user:', user._id); // Debug log
        console.log('Updated location:', user.location); // Debug log
        
        res.json({ success: true, message: 'Location updated successfully' });
    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({ error: 'Failed to update location', details: error.message });
    }
});

// Get nearby users - add debugging
app.get('/api/users/nearby-by-email', async (req, res) => {
    try {
        await connectToDatabase();
        const { email, latitude, longitude } = req.query;
        
        console.log('Nearby request params:', { email, latitude, longitude }); // Debug log
        
        if (!email || !latitude || !longitude) {
            return res.status(400).json({ error: 'Email, latitude, and longitude are required' });
        }
        
        // Find the current user to exclude them from results
        const currentUser = await User.findOne({ email });
        if (!currentUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        console.log('Current user found:', currentUser._id); // Debug log
        
        // Define search ranges in kilometers
        const ranges = [1, 5, 10]; // 1km, 5km, 10km ranges
        const results = [];
        
        // Convert from string to number
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        
        console.log('Parsed coordinates:', { lat, lng }); // Debug log
        
        // Simpler approach without $geoNear first to test
        const allUsers = await User.find({ 
            _id: { $ne: currentUser._id }
        }).limit(10);
        
        console.log(`Found ${allUsers.length} other users in total`); // Debug log
        
        // Return simple results for now
        res.json([
            {
                range: 10,
                users: allUsers.map(user => ({
                    _id: user._id,
                    fullName: user.fullName,
                    username: user.username,
                    email: user.email,
                    distance: 5 // Mock distance
                }))
            }
        ]);
        
        /* Comment out the complex query for now
        // For each range, find users within that distance
        for (const range of ranges) {
            // Use MongoDB's $geoNear aggregation to find nearby users
            const nearbyUsers = await User.aggregate([
                {
                    $geoNear: {
                        near: {
                            type: 'Point',
                            coordinates: [lng, lat] // GeoJSON format: [longitude, latitude]
                        },
                        distanceField: 'distance', // This will add the distance in meters to each result
                        maxDistance: range * 1000, // Convert km to meters
                        spherical: true,
                        query: { 
                            _id: { $ne: currentUser._id }, // Exclude current user
                            lastLocationUpdate: { 
                                $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Only include users active in the last 24 hours
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        fullName: 1,
                        username: 1,
                        email: 1,
                        distance: { $divide: ['$distance', 1000] }, // Convert meters to kilometers
                        lastLocationUpdate: 1
                    }
                }
            ]);
            
            results.push({
                range,
                users: nearbyUsers
            });
        }
        
        res.json(results);
        */
    } catch (error) {
        console.error('Error finding nearby users:', error);
        res.status(500).json({ error: 'Failed to find nearby users', details: error.message });
    }
});

// Send friend request
app.post('/api/send-friend-request', async (req, res) => {
    try {
        await connectToDatabase();
        const { senderEmail, receiverEmail } = req.body;
        
        if (!senderEmail || !receiverEmail) {
            return res.status(400).json({ error: 'Sender and receiver emails are required' });
        }
        
        if (senderEmail === receiverEmail) {
            return res.status(400).json({ error: 'Cannot send friend request to yourself' });
        }
        
        // Find sender and receiver
        const sender = await User.findOne({ email: senderEmail });
        const receiver = await User.findOne({ email: receiverEmail });
        
        if (!sender || !receiver) {
            return res.status(404).json({ error: 'Sender or receiver not found' });
        }
        
        // Check if friend request already exists
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { sender: sender._id, receiver: receiver._id },
                { sender: receiver._id, receiver: sender._id }
            ]
        });
        
        if (existingRequest) {
            return res.status(400).json({ error: 'Friend request already exists' });
        }
        
        // Check if they are already friends
        if (sender.connections && sender.connections.includes(receiver._id)) {
            return res.status(400).json({ error: 'Already connected with this user' });
        }
        
        // Create new friend request
        const newFriendRequest = new FriendRequest({
            sender: sender._id,
            receiver: receiver._id,
            status: 'pending',
            createdAt: new Date()
        });
        
        await newFriendRequest.save();
        
        res.status(201).json({ 
            success: true, 
            message: 'Friend request sent successfully'
        });
    } catch (error) {
        console.error('Error sending friend request:', error);
        res.status(500).json({ error: 'Failed to send friend request', details: error.message });
    }
});

// Get friend requests
app.get('/api/friend-requests', async (req, res) => {
    try {
        await connectToDatabase();
        const { email } = req.query;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Find pending friend requests where user is the receiver
        const requests = await FriendRequest.find({
            receiver: user._id,
            status: 'pending'
        }).populate('sender', 'fullName email');
        
        // Calculate time ago for each request
        const requestsWithTimeAgo = requests.map(request => {
            const createdAt = new Date(request.createdAt);
            const now = new Date();
            const diffInSeconds = Math.floor((now - createdAt) / 1000);
            
            let timeAgo;
            if (diffInSeconds < 60) {
                timeAgo = `${diffInSeconds} seconds ago`;
            } else if (diffInSeconds < 3600) {
                timeAgo = `${Math.floor(diffInSeconds / 60)} minutes ago`;
            } else if (diffInSeconds < 86400) {
                timeAgo = `${Math.floor(diffInSeconds / 3600)} hours ago`;
            } else {
                timeAgo = `${Math.floor(diffInSeconds / 86400)} days ago`;
            }
            
            return {
                _id: request._id,
                sender: request.sender,
                status: request.status,
                createdAt: request.createdAt,
                timeAgo
            };
        });
        
        res.json(requestsWithTimeAgo);
    } catch (error) {
        console.error('Error getting friend requests:', error);
        res.status(500).json({ error: 'Failed to get friend requests', details: error.message });
    }
});

// Respond to friend request
app.post('/api/friend-request-response', async (req, res) => {
    try {
        await connectToDatabase();
        const { requestId, action } = req.body;
        
        if (!requestId || !action) {
            return res.status(400).json({ error: 'Request ID and action are required' });
        }
        
        if (action !== 'accept' && action !== 'reject') {
            return res.status(400).json({ error: 'Action must be either "accept" or "reject"' });
        }
        
        // Find the friend request
        const request = await FriendRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ error: 'Friend request not found' });
        }
        
        if (action === 'accept') {
            // Add each user to the other's connections array
            await User.findByIdAndUpdate(
                request.sender,
                { $addToSet: { connections: request.receiver } }
            );
            
            await User.findByIdAndUpdate(
                request.receiver,
                { $addToSet: { connections: request.sender } }
            );
            
            // Update request status
            request.status = 'accepted';
            await request.save();
        } else {
            // If rejected, just update the status
            request.status = 'rejected';
            await request.save();
        }
        
        res.json({ 
            success: true, 
            message: `Friend request ${action === 'accept' ? 'accepted' : 'rejected'} successfully`
        });
    } catch (error) {
        console.error(`Error ${req.body.action}ing friend request:`, error);
        res.status(500).json({ 
            error: `Failed to ${req.body.action} friend request`, 
            details: error.message 
        });
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

// Catch-all route SHOULD BE LAST
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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

// Add this to handle 404s
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Not Found',
        path: req.path
    });
});

// Just keep the export
module.exports = app; 
