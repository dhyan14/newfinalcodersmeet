const express = require('express');
const router = express.Router();
const User = require('../models/userModel'); // Adjust path as needed
const mongoose = require('mongoose');

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

const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);

// Send a friend request
router.post('/send-friend-request', async (req, res) => {
  try {
    const { senderEmail, receiverEmail } = req.body;
    
    if (!senderEmail || !receiverEmail) {
      return res.status(400).json({ message: 'Sender and receiver emails are required' });
    }
    
    // Find users by email
    const sender = await User.findOne({ email: senderEmail });
    const receiver = await User.findOne({ email: receiverEmail });
    
    if (!sender || !receiver) {
      return res.status(404).json({ message: 'One or both users not found' });
    }
    
    // Check if request already exists
    const existingRequest = await FriendRequest.findOne({
      sender: sender._id,
      receiver: receiver._id,
      status: 'pending'
    });
    
    if (existingRequest) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }
    
    // Create new friend request
    const friendRequest = new FriendRequest({
      sender: sender._id,
      receiver: receiver._id
    });
    
    await friendRequest.save();
    
    res.status(201).json({ message: 'Friend request sent successfully' });
    
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get friend requests for a user
router.get('/friend-requests', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Find pending friend requests for this user
    const requests = await FriendRequest.find({
      receiver: user._id,
      status: 'pending'
    }).populate('sender', 'fullName email');
    
    // Format the response
    const formattedRequests = requests.map(request => {
      const timeAgo = getTimeAgo(request.createdAt);
      
      return {
        _id: request._id,
        sender: {
          _id: request.sender._id,
          fullName: request.sender.fullName,
          email: request.sender.email
        },
        createdAt: request.createdAt,
        timeAgo
      };
    });
    
    res.status(200).json(formattedRequests);
    
  } catch (error) {
    console.error('Error getting friend requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Respond to a friend request
router.post('/friend-request-response', async (req, res) => {
  try {
    const { requestId, action } = req.body;
    
    if (!requestId || !action) {
      return res.status(400).json({ message: 'Request ID and action are required' });
    }
    
    if (action !== 'accept' && action !== 'reject') {
      return res.status(400).json({ message: 'Action must be either accept or reject' });
    }
    
    // Find the request
    const request = await FriendRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Friend request not found' });
    }
    
    // Update request status
    request.status = action === 'accept' ? 'accepted' : 'rejected';
    await request.save();
    
    // If accepted, update friends list for both users
    if (action === 'accept') {
      // Implementation depends on how you store friends in your user model
      // This is a simple example assuming you have a friends array in your user model
      await User.findByIdAndUpdate(request.sender, {
        $addToSet: { friends: request.receiver }
      });
      
      await User.findByIdAndUpdate(request.receiver, {
        $addToSet: { friends: request.sender }
      });
    }
    
    res.status(200).json({ 
      message: `Friend request ${action === 'accept' ? 'accepted' : 'rejected'} successfully` 
    });
    
  } catch (error) {
    console.error('Error responding to friend request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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