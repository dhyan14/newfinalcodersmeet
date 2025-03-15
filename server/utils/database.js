const mongoose = require('mongoose');

let isConnected = false;
let connectionPromise = null;

exports.connectToDatabase = async () => {
  if (isConnected) {
    return;
  }

  // If a connection attempt is already in progress, wait for it
  if (connectionPromise) {
    return connectionPromise;
  }

  try {
    // Store the connection promise so we can reuse it
    connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
    });

    const db = await connectionPromise;
    isConnected = db.connections[0].readyState === 1;
    console.log('MongoDB connected successfully');
    
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    connectionPromise = null;
    isConnected = false;
    throw error;
  }
}; 