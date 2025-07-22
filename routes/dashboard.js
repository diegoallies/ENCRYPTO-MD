const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');
const Deployment = require('../models/Deployment');
const Referral = require('../models/Referral');

router.get('/', authenticate, async (req, res) => {
    try {
        // Get user stats
        const activeDeployments = await Deployment.countDocuments({ 
            userId: req.user._id, 
            status: 'active' 
        });

        const referralEarnings = await Referral.aggregate([
            { $match: { referrer: req.user._id } },
            { $group: { _id: null, total: { $sum: "$coinsEarned" } } }
        ]);

        // Get recent deployments
        const recentDeployments = await Deployment.find({ 
            userId: req.user._id 
        })
        .sort({ createdAt: -1 })
        .limit(3)
        .select('appName url status createdAt');

        res.json({
            user: {
                username: req.user.username,
                email: req.user.email,
                profilePic: req.user.profilePic,
                coins: req.user.coins
            },
            stats: {
                activeDeployments,
                referralEarnings: referralEarnings[0]?.total || 0
            },
            recentDeployments
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
