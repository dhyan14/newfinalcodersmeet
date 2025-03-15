const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Update user's location
router.post('/users/update-location', async (req, res) => {
    try {
        const { email, latitude, longitude } = req.body;
        
        if (!email || latitude === undefined || longitude === undefined) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email, latitude, and longitude are required' 
            });
        }
        
        // Update user's location in database
        const updatedUser = await User.findOneAndUpdate(
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
        
        if (!updatedUser) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        res.status(200).json({ 
            success: true, 
            message: 'Location updated successfully' 
        });
        
    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while updating location' 
        });
    }
});

// Get nearby users
router.get('/users/nearby', async (req, res) => {
    try {
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
        
        // For each range, find users within that distance
        for (const range of ranges) {
            // Convert km to meters for MongoDB
            const distanceInMeters = range * 1000;
            
            // Find users within the range
            const usersInRange = await User.find({
                email: { $ne: email }, // Exclude current user
                location: {
                    $near: {
                        $geometry: currentUser.location,
                        $maxDistance: distanceInMeters
                    }
                }
            }).select('fullName email location');
            
            // Calculate actual distance for each user
            const usersWithDistance = usersInRange.map(user => {
                // Calculate distance in kilometers using the Haversine formula
                const distance = calculateDistance(
                    currentUser.location.coordinates[1], // latitude
                    currentUser.location.coordinates[0], // longitude
                    user.location.coordinates[1], // latitude
                    user.location.coordinates[0]  // longitude
                );
                
                return {
                    _id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    distance
                };
            });
            
            // Add to results
            results.push({
                range,
                users: usersWithDistance
            });
        }
        
        res.status(200).json(results);
        
    } catch (error) {
        console.error('Error finding nearby users:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while finding nearby users' 
        });
    }
});

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    
    return distance;
}

module.exports = router; 