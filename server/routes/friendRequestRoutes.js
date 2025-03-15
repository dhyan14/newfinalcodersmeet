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
    
    // Check if sender and recipient exist
    const sender = await User.findOne({ email: senderEmail });
    const recipient = await User.findOne({ email: recipientEmail });
    
    if (!sender || !recipient) {
      return res.status(404).json({ 
        success: false, 
        error: 'Sender or recipient not found' 
      });
    }
    
    // Check if they're already friends
    if (sender.friends && sender.friends.includes(recipient._id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'You are already friends with this user' 
      });
    }
    
    // Check if a request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: sender._id, recipient: recipient._id, status: 'pending' },
        { sender: recipient._id, recipient: sender._id, status: 'pending' }
      ]
    });
    
    if (existingRequest) {
      return res.status(400).json({ 
        success: false, 
        error: 'A friend request already exists between these users' 
      });
    }
    
    // Create new friend request
    const newRequest = new FriendRequest({
      sender: sender._id,
      recipient: recipient._id,
      status: 'pending',
      createdAt: new Date()
    });
    
    await newRequest.save();
    
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
    
    // Find the user
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    // Find pending requests where user is the recipient
    const requests = await FriendRequest.find({
      recipient: user._id,
      status: 'pending'
    }).populate('sender', 'fullName email');
    
    // Format the requests with time ago
    const formattedRequests = requests.map(request => {
      const timeAgo = getTimeAgo(request.createdAt);
      
      return {
        _id: request._id,
        sender: {
          _id: request.sender._id,
          fullName: request.sender.fullName,
          email: request.sender.email
        },
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

// Helper function to format time ago
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) return interval + ' years ago';
  if (interval === 1) return '1 year ago';
  
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) return interval + ' months ago';
  if (interval === 1) return '1 month ago';
  
  interval = Math.floor(seconds / 86400);
  if (interval > 1) return interval + ' days ago';
  if (interval === 1) return '1 day ago';
  
  interval = Math.floor(seconds / 3600);
  if (interval > 1) return interval + ' hours ago';
  if (interval === 1) return '1 hour ago';
  
  interval = Math.floor(seconds / 60);
  if (interval > 1) return interval + ' minutes ago';
  if (interval === 1) return '1 minute ago';
  
  return 'just now';
}

module.exports = router; 