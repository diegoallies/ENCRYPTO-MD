const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    profilePic: { type: String, default: 'https://i.imgur.com/JRqk1W1.png' },
    githubUsername: String,
    whatsappNumber: String,
    coins: { type: Number, default: 100 },
    lastClaim: Date,
    referrals: [String],
    referredBy: String,
    redeemedVouchers: [String],
    deployments: [{
        appName: String,
        url: String,
        status: { type: String, enum: ['active', 'suspended', 'pending'], default: 'pending' },
        type: String,
        createdAt: { type: Date, default: Date.now },
        lastRenewed: Date
    }],
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isBanned: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
