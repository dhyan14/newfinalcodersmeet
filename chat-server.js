const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// CORS middleware - must come before routes
app.use(cors({
  origin: function(origin, callback) {
    // Allow any origin
    callback(null, true);
  },
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['X-Requested-With', 'Content-Type', 'Authorization'],
  credentials: true
}));

// Socket.IO config
const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      // Allow any origin for Socket.IO too
      callback(null, true);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["X-Requested-With", "Content-Type", "Authorization"],
    credentials: true
  },
  transports: ['polling', 'websocket'], // Prioritize polling
  allowUpgrades: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Set permissive CORS headers for all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Parse JSON body
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id, 'transport:', socket.conn.transport.name);
  
  socket.on('join-squad', (squadId) => {
    // Convert squadId to string to avoid ObjectId issues
    const squadIdString = String(squadId);
    socket.join(`squad_${squadIdString}`);
    console.log(`Socket ${socket.id} joined squad ${squadIdString}`);
  });
  
  socket.on('squad-message', (data) => {
    console.log('Message received:', data);
    // Make sure we use the squadId as a string
    const squadIdString = String(data.squadId);
    io.to(`squad_${squadIdString}`).emit('new-message', {
      ...data,
      // Ensure squadId is a string
      squadId: squadIdString
    });
  });
  
  socket.on('disconnect', (reason) => {
    console.log('Client disconnected:', socket.id, 'reason:', reason);
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', socket.id, error);
  });
});

// Root route for quick verification
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Chat server is running',
    endpoints: ['/health', '/api/server-info']
  });
});

// Server info endpoint
app.get('/api/server-info', (req, res) => {
  console.log('Server info endpoint accessed');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    connections: io.engine ? io.engine.clientsCount : 0,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    connections: io.engine ? io.engine.clientsCount : 0,
    transport_options: io.engine ? io.engine.opts.transports : ['polling', 'websocket']
  });
});

// Catch-all route for 404 errors
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'API endpoint not found',
    path: req.path
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Chat server running on port ${PORT}`);
  console.log(`Available transports: ${io.engine.opts.transports.join(', ')}`);
}); 