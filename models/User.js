const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
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
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],  // [longitude, latitude]
            default: [0, 0]
        }
    },
    lastLocationUpdate: {
        type: Date,
        default: null
    },
    locationUpdatedAt: { type: Date },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    progress: {
        type: Number,
        default: 0
    }
}, { 
    timestamps: true 
});

// Add indexes
userSchema.index({ location: '2dsphere' });
userSchema.index({ username: 'text' });

const User = mongoose.model('User', userSchema);

module.exports = User; 
