const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Referral = require('../models/Referral');
const { pool } = require('../config/db');

// Get referral info
router.get('/', authenticate, async (req, res) => {
    try {
        const referrals = await Referral.find({ user_id: req.user.id });
        const referralLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/signup?ref=${req.user.username}`;
        
        // Calculate earned coins (5 per referral)
        const earnedCoins = referrals.length * 5;
        
        res.json({
            referralLink,
            totalReferrals: referrals.length,
            earnedCoins,
            referrals: referrals.map(ref => ({
                referredUsername: ref.referredUsername,
                createdAt: ref.createdAt
            }))
        });
    } catch (error) {
        console.error('Get referrals error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

module.exports = router;
