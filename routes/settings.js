const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Update profile
router.put('/profile', authenticate, async (req, res) => {
    try {
        const { username, profilePic, githubUsername, whatsappNumber } = req.body;
        
        if (username && username !== req.user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ error: 'Username already taken' });
            }
            req.user.username = username;
        }

        if (profilePic) req.user.profilePic = profilePic;
        if (githubUsername) req.user.githubUsername = githubUsername;
        if (whatsappNumber) req.user.whatsappNumber = whatsappNumber;

        await req.user.save();
        res.json(req.user);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Change password
router.put('/password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!(await req.user.comparePassword(currentPassword))) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        req.user.password = newPassword;
        await req.user.save();
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
