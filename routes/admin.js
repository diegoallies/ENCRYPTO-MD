const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Deployment = require('../models/Deployment');
const AdminSettings = require('../models/AdminSettings');

// Get all users
router.get('/users', authenticate, isAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Ban/unban user
router.put('/users/:id/ban', authenticate, isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.isBanned = !user.isBanned;
        await user.save();
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all deployments
router.get('/deployments', authenticate, isAdmin, async (req, res) => {
    try {
        const deployments = await Deployment.find().populate('userId', 'username');
        res.json(deployments);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update admin settings
router.put('/settings', authenticate, isAdmin, async (req, res) => {
    try {
        const { herokuApiKey, repoUrl, maintenance, maintenanceMessage } = req.body;
        
        let settings = await AdminSettings.findOne();
        if (!settings) {
            settings = new AdminSettings();
        }

        if (herokuApiKey) settings.herokuApiKey = herokuApiKey;
        if (repoUrl) settings.repoUrl = repoUrl;
        if (maintenance !== undefined) settings.maintenance = maintenance;
        if (maintenanceMessage) settings.maintenanceMessage = maintenanceMessage;

        await settings.save();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get admin stats
router.get('/stats', authenticate, isAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalDeployments = await Deployment.countDocuments();
        const activeDeployments = await Deployment.countDocuments({ status: 'active' });
        const activeUsers = await User.countDocuments({ lastLogin: { $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });

        const settings = await AdminSettings.findOne();

        res.json({
            totalUsers,
            totalDeployments,
            activeDeployments,
            activeUsers,
            settings
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
