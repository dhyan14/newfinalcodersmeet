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

// Middleware
app.use(cors({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add OPTIONS handler for preflight requests
app.options('*', cors());

app.use(express.json());
app.use(express.static('public'));

// Add after your middleware setup
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// MongoDB Connection with detailed logging
let isConnected = false;

const connectToDatabase = async () => {
    if (isConnected) {
        return;
    }

    try {
        console.log('Attempting to connect to MongoDB...');
        console.log('Connection string:', process.env.MONGODB_URI ? 'Present' : 'Missing');
        
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000 // 5 second timeout
        });
        
        isConnected = true;
        console.log('MongoDB Connected Successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        isConnected = false;
        throw error;
    }
};

// Status route with detailed response
app.get('/api/status', async (req, res) => {
    try {
        console.log('Status check requested');
        await connectToDatabase();
        
        const status = {
            status: 'ok',
            database: isConnected ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            mongodbUri: process.env.MONGODB_URI ? 'configured' : 'missing'
        };
        
        console.log('Status response:', status);
        res.json(status);
    } catch (error) {
        console.error('Status check failed:', error);
        res.status(500).json({
            status: 'error',
            error: error.message,
            details: 'Database connection failed',
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

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        status: 'error',
        message: err.message || 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// Add this near your other routes
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Export the app
module.exports = app; 
