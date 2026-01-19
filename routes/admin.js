const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Deployment = require('../models/Deployment');
const AdminSettings = require('../models/AdminSettings');
const { pool } = require('../config/db');

// Get all users
router.get('/users', authenticate, isAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, email, profile_pic, coins, role, is_banned, created_at FROM users ORDER BY created_at DESC');
        const users = result.rows.map(row => ({
            _id: row.id,
            id: row.id,
            username: row.username,
            email: row.email,
            profilePic: row.profile_pic,
            coins: row.coins,
            role: row.role,
            isBanned: row.is_banned,
            createdAt: row.created_at
        }));
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Ban/unban user
router.put('/users/:id/ban', authenticate, isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const updatedUser = await User.update(req.params.id, { isBanned: !user.isBanned });
        res.json(updatedUser);
    } catch (error) {
        console.error('Ban user error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Get all deployments
router.get('/deployments', authenticate, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT d.*, u.username 
            FROM deployments d 
            JOIN users u ON d.user_id = u.id 
            ORDER BY d.created_at DESC
        `);
        const deployments = result.rows.map(row => ({
            _id: row.id,
            id: row.id,
            userId: row.user_id,
            appName: row.app_name,
            url: row.url,
            status: row.status,
            type: row.type,
            createdAt: row.created_at,
            user: { username: row.username }
        }));
        res.json(deployments);
    } catch (error) {
        console.error('Get deployments error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Update admin settings
router.put('/settings', authenticate, isAdmin, async (req, res) => {
    try {
        const { herokuApiKeys, githubRepo, maintenance, maintenanceMessage, coinSettings } = req.body;
        
        const updates = {};
        if (herokuApiKeys !== undefined) updates.herokuApiKeys = herokuApiKeys;
        if (githubRepo !== undefined) updates.githubRepo = githubRepo;
        if (maintenance !== undefined) updates.maintenance = maintenance;
        if (maintenanceMessage !== undefined) updates.maintenanceMessage = maintenanceMessage;
        if (coinSettings !== undefined) updates.coinSettings = coinSettings;

        const settings = await AdminSettings.update(updates);
        res.json(settings);
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Get admin stats
router.get('/stats', authenticate, isAdmin, async (req, res) => {
    try {
        const totalUsersResult = await pool.query('SELECT COUNT(*) as count FROM users');
        const totalUsers = parseInt(totalUsersResult.rows[0].count);

        const totalDeploymentsResult = await pool.query('SELECT COUNT(*) as count FROM deployments');
        const totalDeployments = parseInt(totalDeploymentsResult.rows[0].count);

        const activeDeploymentsResult = await pool.query('SELECT COUNT(*) as count FROM deployments WHERE status = $1', ['active']);
        const activeDeployments = parseInt(activeDeploymentsResult.rows[0].count);

        const activeUsersResult = await pool.query('SELECT COUNT(*) as count FROM users WHERE created_at > NOW() - INTERVAL \'30 days\'');
        const activeUsers = parseInt(activeUsersResult.rows[0].count);

        const settings = await AdminSettings.getAllSettings();

        res.json({
            totalUsers,
            totalDeployments,
            activeDeployments,
            activeUsers,
            settings
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

module.exports = router;
