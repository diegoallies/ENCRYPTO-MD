const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');
const Referral = require('../models/Referral');

// Get referral info
router.get('/', authenticate, async (req, res) => {
    try {
        const referrals = await Referral.find({ referrer: req.user._id })
            .populate('referredUser', 'username createdAt')
            .sort({ createdAt: -1 });

        const referralLink = `${process.env.FRONTEND_URL || req.headers.origin}/signup?ref=${req.user.username}`;
        
        res.json({
            referralLink,
            totalReferrals: referrals.length,
            earnedCoins: referrals.reduce((sum, ref) => sum + ref.coinsEarned, 0),
            referrals
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
