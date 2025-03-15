// Serverless function for finding nearby users
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

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Connect to database
    await connectToDatabase();
    
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }
    
    // Find the current user
    const currentUser = await User.findOne({ email });
    
    if (!currentUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Check if user has location data
    if (!currentUser.location || !currentUser.location.coordinates) {
      return res.status(400).json({ 
        success: false, 
        message: 'User location not available' 
      });
    }
    
    // Define search ranges in kilometers
    const ranges = [1, 5, 10, 25];
    const results = [];
    
    // Search for users in each range
    for (const range of ranges) {
      const nearbyUsers = await User.find({
        email: { $ne: email }, // Exclude current user
        location: {
          $nearSphere: {
            $geometry: {
              type: 'Point',
              coordinates: currentUser.location.coordinates
            },
            $maxDistance: range * 1000 // Convert km to meters
          }
        }
      }).select('fullName email bio skills avatarUrl');
      
      if (nearbyUsers.length > 0) {
        results.push({
          range: range,
          users: nearbyUsers.map(user => ({
            ...user.toObject(),
            distance: range // Approximate distance
          }))
        });
        break; // Stop after finding users in the first range
      }
    }
    
    res.status(200).json({
      success: true,
      currentLocation: currentUser.location,
      results: results
    });
    
  } catch (error) {
    console.error('Error finding nearby users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while finding nearby users',
      error: error.message
    });
  }
}; 