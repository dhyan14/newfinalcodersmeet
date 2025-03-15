const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
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

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Chat server running on port ${PORT}`);
}); 