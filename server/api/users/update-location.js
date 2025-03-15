// Serverless function for updating user location
const mongoose = require('mongoose');
const User = require('../../models/User');
const { connectToDatabase } = require('../../utils/database');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Connect to database
    await connectToDatabase();
    
    const { email, latitude, longitude } = req.body;
    
    if (!email || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, latitude, and longitude are required' 
      });
    }
    
    // Find and update user location
    const user = await User.findOneAndUpdate(
      { email },
      { 
        location: {
          type: 'Point',
          coordinates: [longitude, latitude] // GeoJSON format: [longitude, latitude]
        },
        lastLocationUpdate: new Date()
      },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Location updated successfully',
      location: user.location
    });
    
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating location',
      error: error.message
    });
  }
}; 