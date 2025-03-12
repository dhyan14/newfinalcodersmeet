const mongoose = require('mongoose');

const squadChatSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SquadChat', squadChatSchema); 