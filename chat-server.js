const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();

// More specific CORS configuration
app.use(cors({
  origin: [
    'https://newfinalcodersmeet.vercel.app',
    'https://www.dhyanjain.me',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));

const server = http.createServer(app);

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      'https://newfinalcodersmeet.vercel.app',
      'https://www.dhyanjain.me',
      'http://localhost:3000'
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 30000,
  pingInterval: 25000
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-squad', (squadId) => {
    socket.join(`squad_${squadId}`);
    console.log(`Socket ${socket.id} joined squad ${squadId}`);
  });
  
  socket.on('squad-message', (data) => {
    io.to(`squad_${data.squadId}`).emit('new-message', data);
  });
});

app.get('/api/server-info', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Add a health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Chat server running on port ${PORT}`);
}); 