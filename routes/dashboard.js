const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');
const Deployment = require('../models/Deployment');
const Referral = require('../models/Referral');
const { pool } = require('../config/db');

router.get('/', authenticate, async (req, res) => {
    try {
        // Get user stats
        const activeDeploymentsResult = await pool.query(
            'SELECT COUNT(*) as count FROM deployments WHERE user_id = $1 AND status = $2',
            [req.user.id, 'active']
        );
        const activeDeployments = parseInt(activeDeploymentsResult.rows[0].count);

        // Get referral earnings (sum of coins from referrals)
        const referralEarningsResult = await pool.query(
            `SELECT COUNT(*) * 5 as total FROM referrals WHERE user_id = $1`,
            [req.user.id]
        );
        const referralEarnings = parseInt(referralEarningsResult.rows[0].total) || 0;

        // Get recent deployments
        const recentDeploymentsResult = await pool.query(
            `SELECT app_name as "appName", url, status, created_at as "createdAt" 
             FROM deployments 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT 3`,
            [req.user.id]
        );

        res.json({
            user: {
                username: req.user.username,
                email: req.user.email,
                profilePic: req.user.profilePic,
                coins: req.user.coins
            },
            stats: {
                activeDeployments,
                referralEarnings
            },
            recentDeployments: recentDeploymentsResult.rows
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

module.exports = router;
