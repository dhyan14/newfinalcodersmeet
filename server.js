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
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
let isConnected = false;

const connectToDatabase = async () => {
    if (isConnected) {
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        isConnected = true;
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
};

// Basic test route
app.get('/api/status', async (req, res) => {
    try {
        await connectToDatabase();
        res.json({ status: 'ok' });
    } catch (error) {
        res.status(500).json({ error: 'Database connection failed' });
    }
});

// Login route
app.post('/api/login', async (req, res) => {
    try {
        await connectToDatabase();
        // Your login logic here
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Signup route
app.post('/api/signup', async (req, res) => {
    try {
        await connectToDatabase();
        // Your signup logic here
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Signup failed' });
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
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

module.exports = app; 
