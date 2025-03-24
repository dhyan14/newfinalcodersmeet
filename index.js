const app = require('./server.js');
const PORT = process.env.PORT || 3001;

// Log when the server starts to listen
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Try accessing: http://localhost:${PORT}/health`);
});

// Add error handling for the server
server.on('error', (error) => {
  console.error('Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try a different port.`);
  }
}); 
