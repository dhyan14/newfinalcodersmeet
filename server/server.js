const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// CORS configuration for Vercel
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://dhyanjain.me', 'https://www.dhyanjain.me', 'https://newfinalcodersmeet.vercel.app']
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Make sure OPTIONS requests are handled properly
app.options('*', cors());

// Connect to MongoDB with better error handling
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected successfully');
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  // Don't crash the server, but log the error
  // This allows the API to still work for non-DB operations
});

// Import routes
const userRoutes = require('./routes/userRoutes');
const locationRoutes = require('./routes/locationRoutes');
const healthRoutes = require('./routes/healthRoutes');
const friendRequestRoutes = require('./routes/friendRequestRoutes');
const authRoutes = require('./routes/authRoutes');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api', locationRoutes);
app.use('/api', healthRoutes);
app.use('/api', friendRequestRoutes);
app.use('/api', authRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'CodersMEET API is running',
    timestamp: new Date().toISOString()
  });
});

// For Vercel, we export the Express app
if (process.env.NODE_ENV === 'production') {
  module.exports = app;
} else {
  // Start server locally
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api/health`);
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥');
  console.log(err.name, err.message);
}); 