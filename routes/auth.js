const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ $or: [{ username }, { email: username }] });
        
        if (!user || !(await user.comparePassword(password))) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'suzero_secret', { expiresIn: '7d' });
        
        res.json({ 
            token, 
            user: { 
                username: user.username, 
                email: user.email, 
                profilePic: user.profilePic,
                coins: user.coins,
                role: user.role
            } 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password, referralCode } = req.body;
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        
        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        const userData = { username, email, password };
        
        if (referralCode) {
            const referrer = await User.findOne({ username: referralCode });
            if (referrer) {
                userData.referredBy = referralCode;
                // Add referral record
                const Referral = require('../models/Referral');
                await Referral.create({ user_id: referrer.id, referred_username: username });
                // Update referrer coins
                await User.update(referrer.id, { coins: referrer.coins + 5 });
            }
        }

        const user = await User.create(userData);
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'suzero_secret', { expiresIn: '7d' });

        res.status(201).json({ 
            token, 
            user: { 
                username, 
                email, 
                profilePic: user.profilePic,
                coins: user.coins,
                role: user.role
            } 
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

module.exports = router;
