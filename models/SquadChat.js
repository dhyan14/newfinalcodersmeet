const mongoose = require('mongoose');

const squadChatSchema = new mongoose.Schema({
    squadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Squad' },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true }, // Store the username for easier display
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SquadChat', squadChatSchema); 
