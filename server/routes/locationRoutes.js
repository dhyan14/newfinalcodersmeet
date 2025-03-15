const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Update user location
router.post('/users/update-location', async (req, res) => {
    try {
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
                }
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
        
        // Convert kilometers to radians (Earth's radius is approximately 6371 km)
        const kmToRadians = (km) => km / 6371;
        
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
});

module.exports = router; 