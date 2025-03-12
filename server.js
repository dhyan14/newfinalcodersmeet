const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();
const multer = require('multer');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const cloudinary = require('cloudinary').v2;

// Import models
const User = require('./models/User');
const Message = require('./models/Message');
const FriendRequest = require('./models/FriendRequest');
const SquadChat = require('./models/SquadChat');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-domain.vercel.app'] 
        : ['http://localhost:5000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

// Configure Mongoose
mongoose.set('strictQuery', false);

// Add this near the top where you create the Express app
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["*"],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

// Store connected users and their socket IDs
const connectedUsers = new Map();

// MongoDB Connection with better error handling
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

// Server Initialization
const startServer = () => {
    server.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
};

// Test route
app.get('/test', async (req, res) => {
    try {
        // Test database read operation
        const users = await User.find().limit(1);
        res.json({ 
            message: 'Test successful',
            dbConnection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            usersFound: users.length
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            dbState: mongoose.connection.readyState
        });
    }
});

// Initialize connection
connectDB();

// Basic test route
app.get('/', (req, res) => {
    res.json({ message: 'Server is running' });
});

// Basic Routes
app.get('/api/status', (req, res) => {
    try {
        const dbState = mongoose.connection.readyState;
        res.json({
            status: 'ok',
            server: 'running',
            database: dbState === 1 ? 'connected' : 'disconnected'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Username generator function
async function generateUsername(fullName) {
    // Convert full name to lowercase and remove special characters
    const base = fullName.toLowerCase().replace(/[^a-z0-9]/g, '');
    let username = base;
    let counter = 1;
    
    // Keep trying until we find a unique username
    while (await User.findOne({ username })) {
        username = `${base}${counter}`;
        counter++;
    }
    
    return username;
}

// Routes
app.post('/api/signup', async (req, res) => {
    try {
        const { fullName, username, email, password } = req.body;

        // Validate input
        if (!fullName || !username || !email || !password) {
            return res.status(400).json({ 
                error: 'All fields are required' 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });

        if (existingUser) {
            return res.status(400).json({ 
                error: existingUser.email === email 
                    ? 'Email already registered' 
                    : 'Username already taken'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user with default location
        const user = new User({
            fullName,
            username,
            email,
            password: hashedPassword,
            skills: [],
            location: {
                type: 'Point',
                coordinates: [0, 0] // Default coordinates
            }
        });

        await user.save();
        
        console.log('User created successfully:', {
            id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email
        });

        res.status(201).json({ 
            message: 'User created successfully',
            userId: user._id 
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to create user' 
        });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Send back complete user data
        res.json({
            id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            skills: user.skills || []
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Update the users endpoint to return all users
app.get('/api/users', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        
        // Find all users except the current user
        const users = await User.find({ _id: { $ne: userId } })
            .select('fullName username')
            .limit(20);
            
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Add connection routes
app.post('/api/connect', async (req, res) => {
    try {
        const { userId, targetUsername } = req.body;
        
        const user = await User.findById(userId);
        const targetUser = await User.findOne({ username: targetUsername });
        
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (user.connections.includes(targetUser._id)) {
            return res.status(400).json({ error: 'Already connected' });
        }
        
        if (user.pendingConnections.includes(targetUser._id)) {
            return res.status(400).json({ error: 'Connection request already sent' });
        }
        
        targetUser.pendingConnections.push(user._id);
        await targetUser.save();
        
        res.json({ message: 'Connection request sent' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send connection request' });
    }
});

app.get('/api/connections/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .populate('connections', 'fullName username email')
            .populate('pendingConnections', 'fullName username email');
            
        res.json({
            connections: user.connections,
            pendingConnections: user.pendingConnections
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch connections' });
    }
});

app.post('/api/accept-connection', async (req, res) => {
    try {
        const { userId, requesterId } = req.body;
        
        const user = await User.findById(userId);
        const requester = await User.findById(requesterId);
        
        user.pendingConnections = user.pendingConnections.filter(id => !id.equals(requesterId));
        user.connections.push(requesterId);
        requester.connections.push(userId);
        
        await user.save();
        await requester.save();
        
        res.json({ message: 'Connection accepted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to accept connection' });
    }
});

// Add this endpoint for username availability check
app.post('/api/check-username', async (req, res) => {
    try {
        const { username } = req.body;
        console.log('Checking username:', username);
        
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        const existingUser = await User.findOne({ username: username });
        console.log('Existing user:', existingUser);
        
        res.json({ available: !existingUser });
    } catch (error) {
        console.error('Username check error:', error);
        res.status(500).json({ error: 'Failed to check username' });
    }
});

// Move this line to the top with other middleware
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Update the multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'uploads/'))
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload an image.'));
        }
    }
});

// Update the profile update route
app.post('/api/update-profile', upload.single('avatar'), async (req, res) => {
    try {
        const { userId, fullName, skills } = req.body;
        
        const updateData = {
            fullName,
            skills: JSON.parse(skills || '[]')
        };

        if (req.file) {
            const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            updateData.avatarUrl = avatarUrl;
        }

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        );

        res.json({
            fullName: user.fullName,
            avatarUrl: user.avatarUrl,
            skills: user.skills,
            email: user.email,
            username: user.username
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Add this after your User model definition
async function createAdminUser() {
    try {
        // Check if admin already exists
        const adminExists = await User.findOne({ email: 'admin@codersmeet.com' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const admin = new User({
                fullName: 'Admin',
                email: 'admin@codersmeet.com',
                password: hashedPassword,
                isAdmin: true
            });
            await admin.save();
            console.log('Admin user created successfully');
        }
    } catch (error) {
        console.error('Error creating admin:', error);
    }
}

// Call this when your server starts
createAdminUser();

// Add this after middleware setup
app.use('/uploads', express.static('uploads'));

// Update the user data endpoint
app.get('/api/user/:username', async (req, res) => {
    try {
        const username = req.params.username;
        console.log('Fetching user data for:', username);
        
        const user = await User.findOne({ username: username });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Send user data
        res.json({
            id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            bio: user.bio || '',
            avatarUrl: user.avatarUrl,
            skills: user.skills || []
        });

    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

// Add this route to your server.js
app.get('/api/current-user', async (req, res) => {
    try {
        const userId = req.query.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            skills: user.skills || []
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

// Message routes - use the imported Message model
app.get('/api/messages/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { with: withUserId } = req.query;

        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: withUserId },
                { sender: withUserId, receiver: userId }
            ]
        })
        .sort({ timestamp: 1 })
        .populate('sender', 'fullName username')
        .populate('receiver', 'fullName username');

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Search users by username
app.get('/api/users/search', async (req, res) => {
    try {
        const { query, userId } = req.query;
        if (!query) return res.json([]);

        const users = await User.find({
            _id: { $ne: userId },
            username: new RegExp(query, 'i'),
            isAdmin: { $ne: true }
        }, {
            fullName: 1,
            username: 1,
            _id: 1
        }).limit(10);

        res.json(users);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Update user location
app.post('/api/users/location', async (req, res) => {
    try {
        const { userId, latitude, longitude } = req.body;
        
        await User.findByIdAndUpdate(userId, {
            location: {
                type: 'Point',
                coordinates: [longitude, latitude]
            },
            lastActive: new Date()
        });

        res.json({ message: 'Location updated' });
    } catch (error) {
        console.error('Location update error:', error);
        res.status(500).json({ error: 'Failed to update location' });
    }
});

// Get nearby users
app.get('/api/users/nearby', async (req, res) => {
    try {
        const { userId, latitude, longitude } = req.query;
        const ranges = [10, 20, 30, 50, 100, 500, 1000]; // kilometers
        
        let results = [];
        for (let range of ranges) {
            const users = await User.find({
                _id: { $ne: userId },
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [parseFloat(longitude), parseFloat(latitude)]
                        },
                        $maxDistance: range * 1000 // convert to meters
                    }
                }
            }, {
                fullName: 1,
                username: 1,
                _id: 1,
                location: 1
            }).limit(50);

            if (users.length > 0) {
                results.push({
                    range: range,
                    users: users.map(user => ({
                        ...user.toObject(),
                        distance: getDistance(
                            latitude, 
                            longitude, 
                            user.location.coordinates[1],
                            user.location.coordinates[0]
                        )
                    }))
                });
            }
        }

        res.json(results);
    } catch (error) {
        console.error('Nearby search error:', error);
        res.status(500).json({ error: 'Failed to find nearby users' });
    }
});

// Send friend request
app.post('/api/friend-request', async (req, res) => {
    try {
        const { senderId, receiverId } = req.body;

        // Check if request already exists
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId }
            ]
        });

        if (existingRequest) {
            return res.status(400).json({ error: 'Friend request already exists' });
        }

        const request = new FriendRequest({
            sender: senderId,
            receiver: receiverId
        });

        await request.save();
        res.json({ message: 'Friend request sent' });
    } catch (error) {
        console.error('Friend request error:', error);
        res.status(500).json({ error: 'Failed to send friend request' });
    }
});

// Helper function to calculate distance
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
}

// Add error handling for uncaught exceptions and rejections
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
    // Optionally, you can exit the process if needed
    // process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Optionally, you can exit the process if needed
    // process.exit(1);
});

// Check for required environment variables
if (!process.env.MONGODB_URI) {
    console.error('Error: MONGODB_URI is not defined in environment variables');
    process.exit(1);
}

// Admin creation route (keep this route secure or remove after creating admin)
app.post('/api/create-admin', async (req, res) => {
    try {
        const adminUser = new User({
            fullName: "Admin User",
            username: "admin",
            email: "admin@codersmeet.com",
            password: await bcrypt.hash("Admin@123", 10),
            isAdmin: true,
            location: {
                type: 'Point',
                coordinates: [0, 0]
            }
        });

        await adminUser.save();
        res.json({ message: 'Admin user created successfully' });
    } catch (error) {
        console.error('Admin creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update the location-by-email endpoint to store last known location
app.post('/api/users/location-by-email', async (req, res) => {
    try {
        const { email, latitude, longitude } = req.body;
        
        if (!email || latitude === undefined || longitude === undefined) {
            return res.status(400).json({ error: 'Email and location coordinates are required' });
        }
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Update user's location and last active timestamp
        user.location = {
            type: 'Point',
            coordinates: [longitude, latitude]
        };
        user.lastActive = new Date();
        user.locationUpdatedAt = new Date(); // Add timestamp for when location was last updated
        
        await user.save();
        
        // Log location update for debugging
        console.log(`Location updated for ${user.fullName}: ${latitude}, ${longitude}`);
        
        res.json({ 
            message: 'Location updated',
            user: {
                fullName: user.fullName,
                email: user.email,
                location: user.location
            }
        });
    } catch (error) {
        console.error('Location update error:', error);
        res.status(500).json({ error: 'Failed to update location' });
    }
});

// Update the nearby-by-email endpoint with improved distance calculation
app.get('/api/users/nearby-by-email', async (req, res) => {
    try {
        const { email, latitude, longitude } = req.query;
        
        if (!email || latitude === undefined || longitude === undefined) {
            return res.status(400).json({ error: 'Email and location coordinates are required' });
        }
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Get all users except the current user
        const allUsers = await User.find({ 
            _id: { $ne: user._id },
            // Only get users with valid location data
            'location.coordinates.0': { $exists: true },
            'location.coordinates.1': { $exists: true }
        }, {
            fullName: 1,
            email: 1,
            _id: 1,
            location: 1
        });
        
        // Calculate distance for each user and group them
        const usersByDistance = {};
        const sameLocationUsers = [];
        const parsedLat = parseFloat(latitude);
        const parsedLng = parseFloat(longitude);
        
        allUsers.forEach(u => {
            // Skip users with default [0,0] coordinates
            if (u.location.coordinates[0] === 0 && u.location.coordinates[1] === 0) {
                return;
            }
            
            const userLng = u.location.coordinates[0];
            const userLat = u.location.coordinates[1];
            
            // Check for exact same location (with small tolerance)
            const isExactSameLocation = 
                Math.abs(userLat - parsedLat) < 0.0001 && 
                Math.abs(userLng - parsedLng) < 0.0001;
            
            if (isExactSameLocation) {
                sameLocationUsers.push({
                    ...u.toObject(),
                    distance: 0
                });
            } else {
                // Calculate distance using the haversine formula
                const distance = calculateHaversineDistance(
                    parsedLat,
                    parsedLng,
                    userLat,
                    userLng
                );
                
                // Group by distance ranges
                const range = distance <= 1 ? 1 :
                             distance <= 10 ? 10 :
                             distance <= 20 ? 20 :
                             distance <= 50 ? 50 :
                             distance <= 100 ? 100 :
                             distance <= 500 ? 500 : 1000;
                
                if (!usersByDistance[range]) {
                    usersByDistance[range] = [];
                }
                
                usersByDistance[range].push({
                    ...u.toObject(),
                    distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
                    lastActive: u.lastActive ? formatTimeAgo(u.lastActive) : 'Unknown',
                    locationAge: u.locationUpdatedAt ? formatTimeAgo(u.locationUpdatedAt) : 'Unknown'
                });
            }
        });
        
        // Format results
        const results = [];
        
        // Add same location users first if any
        if (sameLocationUsers.length > 0) {
            results.push({
                range: 'Same Location',
                users: sameLocationUsers
            });
        }
        
        // Add other ranges
        const ranges = [1, 10, 20, 50, 100, 500, 1000];
        ranges.forEach(range => {
            if (usersByDistance[range] && usersByDistance[range].length > 0) {
                results.push({
                    range: `${range} km`,
                    users: usersByDistance[range].sort((a, b) => a.distance - b.distance)
                });
            }
        });
        
        res.json(results);
    } catch (error) {
        console.error('Nearby search error:', error);
        res.status(500).json({ error: 'Failed to find nearby users' });
    }
});

// More accurate Haversine distance calculation
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Friend request by email
app.post('/api/friend-request-by-email', async (req, res) => {
    try {
        const { senderEmail, receiverEmail } = req.body;
        
        if (!senderEmail || !receiverEmail) {
            return res.status(400).json({ error: 'Sender and receiver emails are required' });
        }
        
        const sender = await User.findOne({ email: senderEmail });
        const receiver = await User.findOne({ email: receiverEmail });
        
        if (!sender || !receiver) {
            return res.status(404).json({ error: 'One or both users not found' });
        }

        // Check if request already exists
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { sender: sender._id, receiver: receiver._id },
                { sender: receiver._id, receiver: sender._id }
            ]
        });

        if (existingRequest) {
            return res.status(400).json({ error: 'Friend request already exists' });
        }

        const request = new FriendRequest({
            sender: sender._id,
            receiver: receiver._id
        });

        await request.save();
        res.json({ message: 'Friend request sent' });
    } catch (error) {
        console.error('Friend request error:', error);
        res.status(500).json({ error: 'Failed to send friend request' });
    }
});

// Add this helper function to format time ago
function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    
    if (diffSec < 60) return `${diffSec} seconds ago`;
    if (diffMin < 60) return `${diffMin} minutes ago`;
    if (diffHour < 24) return `${diffHour} hours ago`;
    if (diffDay < 30) return `${diffDay} days ago`;
    
    return date.toLocaleDateString();
}

// Get friend requests by email
app.get('/api/friend-requests', async (req, res) => {
    try {
        const { email } = req.query;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Find pending friend requests where this user is the receiver
        const requests = await FriendRequest.find({
            receiver: user._id,
            status: 'pending'
        })
        .populate('sender', 'fullName email')
        .sort({ createdAt: -1 });
        
        // Format the requests with time ago
        const formattedRequests = requests.map(request => ({
            _id: request._id,
            sender: request.sender,
            status: request.status,
            createdAt: request.createdAt,
            timeAgo: formatTimeAgo(request.createdAt)
        }));
        
        res.json(formattedRequests);
    } catch (error) {
        console.error('Error fetching friend requests:', error);
        res.status(500).json({ error: 'Failed to fetch friend requests' });
    }
});

// Respond to friend request
app.post('/api/friend-request-response', async (req, res) => {
    try {
        const { requestId, action } = req.body;
        
        if (!requestId || !action) {
            return res.status(400).json({ error: 'Request ID and action are required' });
        }
        
        if (action !== 'accept' && action !== 'reject') {
            return res.status(400).json({ error: 'Invalid action' });
        }
        
        const request = await FriendRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ error: 'Friend request not found' });
        }
        
        if (request.status !== 'pending') {
            return res.status(400).json({ error: 'This request has already been processed' });
        }
        
        // Update request status
        request.status = action === 'accept' ? 'accepted' : 'rejected';
        await request.save();
        
        // If accepted, add users to each other's connections
        if (action === 'accept') {
            const sender = await User.findById(request.sender);
            const receiver = await User.findById(request.receiver);
            
            if (!sender || !receiver) {
                return res.status(404).json({ error: 'One or both users not found' });
            }
            
            // Add to connections if not already connected
            if (!sender.connections.includes(receiver._id)) {
                sender.connections.push(receiver._id);
                await sender.save();
            }
            
            if (!receiver.connections.includes(sender._id)) {
                receiver.connections.push(sender._id);
                await receiver.save();
            }
        }
        
        res.json({ message: `Friend request ${action}ed successfully` });
    } catch (error) {
        console.error(`Error ${action}ing friend request:`, error);
        res.status(500).json({ error: `Failed to ${action} friend request` });
    }
});

// Get user's friends
app.get('/api/friends', async (req, res) => {
    try {
        // Get user from token or query parameter
        const userId = req.query.userId;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        
        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Get user's connections (friends)
        const friends = await User.find({ 
            _id: { $in: user.connections } 
        }).select('fullName username avatarUrl');
        
        res.json(friends);
    } catch (error) {
        console.error('Error fetching friends:', error);
        res.status(500).json({ error: 'Failed to fetch friends' });
    }
});

// Get user by email
app.get('/api/user-by-email', async (req, res) => {
    try {
        const email = req.query.email;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email
        });
    } catch (error) {
        console.error('Error fetching user by email:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Get squad chat messages
app.get('/api/squad-messages', async (req, res) => {
    try {
        // Get the most recent 50 messages
        const messages = await SquadChat.find()
            .sort({ timestamp: -1 })
            .limit(50)
            .populate('sender', 'fullName username email')
            .lean();
        
        // Return messages in chronological order
        res.json(messages.reverse());
    } catch (error) {
        console.error('Error fetching squad messages:', error);
        res.status(500).json({ error: 'Failed to fetch squad messages' });
    }
});

// Send squad message
app.post('/api/send-squad-message', async (req, res) => {
    try {
        const { senderId, content } = req.body;
        
        if (!senderId || !content) {
            return res.status(400).json({ error: 'Sender ID and content are required' });
        }
        
        // Create and save the message
        const message = new SquadChat({
            sender: senderId,
            content: content
        });
        
        await message.save();
        
        // Populate sender info for the response
        const populatedMessage = await SquadChat.findById(message._id)
            .populate('sender', 'fullName username email')
            .lean();
        
        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error('Error sending squad message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Update these WebRTC signaling handlers in your socket.io connection handler
io.on('connection', (socket) => {
    console.log('New client connected');

    // Handle squad join
    socket.on('join_squad', (userData) => {
        console.log('User joined squad:', userData);
        
        // Store user data with socket ID
        connectedUsers.set(socket.id, userData);
        
        // Join the squad room
        socket.join('squad-room');
        
        // Notify others that user joined
        socket.to('squad-room').emit('user_joined_squad', userData);
    });

    // Handle squad messages
    socket.on('squad_message', (messageData) => {
        console.log('Squad message received:', messageData);
        
        // Broadcast the message to all users in the squad room EXCEPT sender
        socket.to('squad-room').emit('new_squad_message', messageData);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        const userData = connectedUsers.get(socket.id);
        if (userData) {
            console.log('User disconnected:', userData);
            socket.to('squad-room').emit('user_left_squad', userData);
            connectedUsers.delete(socket.id);
        }
    });

    // Handle joining a video call room
    socket.on('join_call', (data) => {
        const { roomId, userId, name } = data;
        console.log(`User ${name} (${userId}) joining call room: ${roomId}`);
        
        // Join the room
        socket.join(roomId);
        
        // Get all users in the room except the one joining
        const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || [])
            .filter(clientId => clientId !== socket.id);
        
        // Notify existing users about the new participant
        socket.to(roomId).emit('user_joined', { userId, name });
        
        // Send existing users list to the new participant
        const existingUsers = [];
        clients.forEach(clientId => {
            const userData = connectedUsers.get(clientId);
            if (userData) {
                existingUsers.push({
                    userId: userData.id,
                    name: userData.name
                });
            }
        });
        
        if (existingUsers.length > 0) {
            socket.emit('existing_users', existingUsers);
        }
    });

    // Handle WebRTC signaling
    socket.on('webrtc_offer', (data) => {
        console.log(`Offer from ${data.fromUserId} to ${data.targetUserId}`);
        socket.to(data.roomId).emit('webrtc_offer', data);
    });

    socket.on('webrtc_answer', (data) => {
        console.log(`Answer from ${data.fromUserId} to ${data.targetUserId}`);
        socket.to(data.roomId).emit('webrtc_answer', data);
    });

    socket.on('webrtc_ice_candidate', (data) => {
        console.log(`ICE candidate from ${data.fromUserId} to ${data.targetUserId}`);
        socket.to(data.roomId).emit('webrtc_ice_candidate', data);
    });

    // Handle leaving a call
    socket.on('leave_call', (data) => {
        console.log(`User leaving call room: ${data.roomId}`);
        const userData = connectedUsers.get(socket.id);
        if (userData) {
            socket.to(data.roomId).emit('user_left', {
                userId: userData.id,
                name: userData.name
            });
        }
        socket.leave(data.roomId);
    });
});

module.exports = app; 