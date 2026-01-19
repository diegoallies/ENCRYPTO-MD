const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Update profile
router.put('/profile', authenticate, async (req, res) => {
    try {
        const { username, profilePic, githubUsername, whatsappNumber } = req.body;
        const updates = {};
        
        if (username && username !== req.user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ error: 'Username already taken' });
            }
            updates.username = username;
        }

        if (profilePic) updates.profilePic = profilePic;
        if (githubUsername) updates.githubUsername = githubUsername;
        if (whatsappNumber) updates.whatsappNumber = whatsappNumber;

        const updatedUser = await User.update(req.user.id, updates);
        res.json(updatedUser);
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Change password
router.put('/password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!(await req.user.comparePassword(currentPassword))) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        await User.update(req.user.id, { password: newPassword });
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

module.exports = router;
