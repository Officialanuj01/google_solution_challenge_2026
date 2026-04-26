const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
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
        required: function() {
            return !this.isGoogleUser; // Password only required for non-Google users
        }
    },
    isGoogleUser: {
        type: Boolean,
        default: false
    },
    googleId: {
        type: String,
        sparse: true, // Allows null values but ensures uniqueness for non-null values
        unique: true
    },
    refreshToken: {
        type: String
    },
    role: {
        type: String,
        enum: {
            values: ['shopkeeper', 'delivery_person', 'demo', null],
            message: 'Role must be shopkeeper, delivery_person, demo, or null'
        },
        default: null // null means role not selected yet
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving (only for non-Google users)
userSchema.pre('save', async function(next) {
    if (!this.isModified('password') || this.isGoogleUser) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
