const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    pendingConnections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    bio: String,
    avatarUrl: String,
    skills: [{
        name: String,
        level: String
    }],
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }
    },
    locationUpdatedAt: { type: Date }
}, { 
    timestamps: true 
});

// Add indexes
userSchema.index({ location: '2dsphere' });
userSchema.index({ username: 'text' });

module.exports = mongoose.model('User', userSchema); 