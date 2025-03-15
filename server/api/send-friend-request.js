// Serverless function for sending friend requests
const mongoose = require('mongoose');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const { connectToDatabase } = require('../utils/database');

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
    
    const { senderEmail, recipientEmail } = req.body;
    
    if (!senderEmail || !recipientEmail) {
      return res.status(400).json({ 
        success: false, 
        error: 'Sender and recipient emails are required' 
      });
    }
    
    if (senderEmail === recipientEmail) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot send friend request to yourself' 
      });
    }
    
    // Find sender and recipient
    const sender = await User.findOne({ email: senderEmail });
    const recipient = await User.findOne({ email: recipientEmail });
    
    if (!sender || !recipient) {
      return res.status(404).json({ 
        success: false, 
        error: 'One or both users not found' 
      });
    }
    
    // Check if request already exists
    const existingRequest = await FriendRequest.findOne({
      sender: sender._id,
      recipient: recipient._id,
      status: { $in: ['pending', 'accepted'] }
    });
    
    if (existingRequest) {
      return res.status(400).json({ 
        success: false, 
        error: 'Friend request already sent or users are already friends' 
      });
    }
    
    // Create new friend request
    const friendRequest = new FriendRequest({
      sender: sender._id,
      recipient: recipient._id,
      status: 'pending',
      createdAt: new Date()
    });
    
    await friendRequest.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Friend request sent successfully' 
    });
    
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error while sending friend request' 
    });
  }
}; 