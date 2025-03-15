const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Fix the path - was userModel
const mongoose = require('mongoose');
const FriendRequest = require('../models/FriendRequest');

// Create a schema for friend requests
const friendRequestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const FriendRequestModel = mongoose.model('FriendRequest', friendRequestSchema);

// Send a friend request
router.post('/send-friend-request', async (req, res) => {
  try {
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
});

// Get friend requests for a user
router.get('/friend-requests', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
    }
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    // Find pending friend requests
    const requests = await FriendRequest.find({
      recipient: user._id,
      status: 'pending'
    }).populate('sender', 'fullName email');
    
    // Format the requests with time ago
    const formattedRequests = requests.map(request => {
      const createdAt = new Date(request.createdAt);
      const now = new Date();
      const diffMs = now - createdAt;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      let timeAgo;
      if (diffDays > 0) {
        timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else if (diffHours > 0) {
        timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else if (diffMins > 0) {
        timeAgo = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      } else {
        timeAgo = 'Just now';
      }
      
      return {
        _id: request._id,
        sender: request.sender,
        status: request.status,
        createdAt: request.createdAt,
        timeAgo
      };
    });
    
    res.status(200).json(formattedRequests);
    
  } catch (error) {
    console.error('Error getting friend requests:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error while getting friend requests' 
    });
  }
});

// Respond to a friend request (accept/reject)
router.post('/friend-request-response', async (req, res) => {
  try {
    const { requestId, action } = req.body;
    
    if (!requestId || !action) {
      return res.status(400).json({ 
        success: false, 
        error: 'Request ID and action are required' 
      });
    }
    
    if (action !== 'accept' && action !== 'reject') {
      return res.status(400).json({ 
        success: false, 
        error: 'Action must be either "accept" or "reject"' 
      });
    }
    
    // Find the request
    const request = await FriendRequest.findById(requestId);
    
    if (!request) {
      return res.status(404).json({ 
        success: false, 
        error: 'Friend request not found' 
      });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        error: 'This request has already been processed' 
      });
    }
    
    if (action === 'accept') {
      // Update request status
      request.status = 'accepted';
      await request.save();
      
      // Add each user to the other's friends list
      await User.findByIdAndUpdate(
        request.sender,
        { $addToSet: { friends: request.recipient } }
      );
      
      await User.findByIdAndUpdate(
        request.recipient,
        { $addToSet: { friends: request.sender } }
      );
      
      res.status(200).json({ 
        success: true, 
        message: 'Friend request accepted' 
      });
    } else {
      // Update request status to rejected
      request.status = 'rejected';
      await request.save();
      
      res.status(200).json({ 
        success: true, 
        message: 'Friend request rejected' 
      });
    }
    
  } catch (error) {
    console.error('Error responding to friend request:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error while responding to friend request' 
    });
  }
});

module.exports = router; 