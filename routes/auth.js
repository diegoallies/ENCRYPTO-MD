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
        res.status(500).json({ error: 'Internal server error' });
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

        const user = new User({ username, email, password });
        
        if (referralCode) {
            const referrer = await User.findOne({ username: referralCode });
            if (referrer) {
                user.referredBy = referralCode;
                referrer.referrals.push(username);
                referrer.coins += 5;
                await referrer.save();
            }
        }

        await user.save();
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
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
