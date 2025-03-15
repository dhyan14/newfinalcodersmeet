const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

// Create Express app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://your-frontend-domain.com', 'https://www.your-frontend-domain.com']
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Make sure OPTIONS requests are handled properly
app.options('*', cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/codersmeet', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected successfully');
})
.catch(err => {
  console.error('MongoDB connection error:', err);
});

// Import routes
const userRoutes = require('./routes/userRoutes');
const locationRoutes = require('./routes/locationRoutes');
const healthRoutes = require('./routes/healthRoutes');
const friendRequestRoutes = require('./routes/friendRequestRoutes');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api', locationRoutes);
app.use('/api', healthRoutes);
app.use('/api', friendRequestRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('CodersMEET API is running');
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
}); 