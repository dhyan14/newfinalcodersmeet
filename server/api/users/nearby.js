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

  try {
    // Return mock data for testing
    res.status(200).json({
      success: true,
      message: 'Nearby users endpoint is working',
      results: [
        {
          range: 5,
          users: [
            {
              _id: '1',
              fullName: 'Test User 1',
              email: 'test1@example.com',
              bio: 'Frontend Developer',
              skills: ['JavaScript', 'React', 'CSS'],
              distance: 5
            },
            {
              _id: '2',
              fullName: 'Test User 2',
              email: 'test2@example.com',
              bio: 'Backend Developer',
              skills: ['Node.js', 'Express', 'MongoDB'],
              distance: 5
            }
          ]
        }
      ]
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error',
      message: error.message
    });
  }
}; 