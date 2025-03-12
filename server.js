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
    res.status(200).json({
        status: 'ok',
        server: true,
        timestamp: new Date().toISOString()
    });
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
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Add your login logic here
        res.json({ success: true, user });
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
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        // Add your signup logic here
        res.json({ success: true });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Signup failed', details: error.message });
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

// Catch-all route
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

// Export the app
module.exports = app; 
