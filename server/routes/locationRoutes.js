const express = require('express');
const router = express.Router();
const Location = require('../models/locationModel');
const User = require('../models/userModel'); // Adjust path as needed

// Update user's location
router.post('/users/location-by-email', async (req, res) => {
  try {
    const { email, latitude, longitude } = req.body;
    
    if (!email || !latitude || !longitude) {
      return res.status(400).json({ message: 'Email, latitude, and longitude are required' });
    }
    
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update or create location record
    const locationUpdate = await Location.findOneAndUpdate(
      { email },
      {
        userId: user._id,
        email,
        location: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        },
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );
    
    res.status(200).json({ 
      message: 'Location updated successfully',
      location: {
        latitude,
        longitude,
        lastUpdated: locationUpdate.lastUpdated
      }
    });
    
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get nearby users
router.get('/users/nearby-by-email', async (req, res) => {
  try {
    const { email, latitude, longitude } = req.query;
    
    if (!email || !latitude || !longitude) {
      return res.status(400).json({ message: 'Email, latitude, and longitude are required' });
    }
    
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Define distance ranges in kilometers
    const ranges = [5, 10, 25];
    const result = [];
    
    // Find users for each range
    for (const range of ranges) {
      // Find locations within this range
      const nearbyLocations = await Location.find({
        email: { $ne: email }, // Exclude current user
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            $maxDistance: range * 1000 // Convert km to meters
          }
        }
      });
      
      // Get user details for each location
      const userPromises = nearbyLocations.map(async (loc) => {
        const nearbyUser = await User.findById(loc.userId).select('fullName email');
        if (!nearbyUser) return null;
        
        // Calculate distance
        const distance = calculateDistance(
          parseFloat(latitude), 
          parseFloat(longitude),
          loc.location.coordinates[1], 
          loc.location.coordinates[0]
        );
        
        return {
          _id: nearbyUser._id,
          fullName: nearbyUser.fullName,
          email: nearbyUser.email,
          distance // in kilometers
        };
      });
      
      const users = (await Promise.all(userPromises)).filter(u => u !== null);
      
      // Sort by distance
      users.sort((a, b) => a.distance - b.distance);
      
      result.push({
        range,
        users
      });
    }
    
    res.status(200).json(result);
    
  } catch (error) {
    console.error('Error finding nearby users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to calculate distance between coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

module.exports = router; 