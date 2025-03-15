const server = require('./server');
const PORT = process.env.PORT || 3000;

// Check if server is an Express app or HTTP server
if (server.listen) {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} else {
  // If it's an Express app, create HTTP server
  const http = require('http');
  const httpServer = http.createServer(server);
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

const app = require('./server.js');
const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 
