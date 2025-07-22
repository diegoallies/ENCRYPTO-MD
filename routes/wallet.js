const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Claim daily coins
router.post('/claim', authenticate, async (req, res) => {
    try {
        const now = new Date();
        if (req.user.lastClaim) {
            const lastClaim = new Date(req.user.lastClaim);
            const hoursSinceLastClaim = (now - lastClaim) / (1000 * 60 * 60);
            
            if (hoursSinceLastClaim < 24) {
                const hoursLeft = Math.floor(24 - hoursSinceLastClaim);
                return res.status(400).json({ 
                    error: `You can claim again in ${hoursLeft} hours` 
                });
            }
        }

        req.user.coins += 10;
        req.user.lastClaim = now;
        await req.user.save();

        // Record transaction
        const transaction = new Transaction({
            userId: req.user._id,
            type: 'credit',
            amount: 10,
            description: 'Daily claim'
        });
        await transaction.save();

        res.json({ coins: req.user.coins });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Send coins
router.post('/send', authenticate, async (req, res) => {
    try {
        const { recipient, amount } = req.body;
        
        if (req.user.coins < amount) {
            return res.status(400).json({ error: 'Not enough coins' });
        }

        const recipientUser = await User.findOne({ 
            $or: [{ username: recipient }, { email: recipient }],
            _id: { $ne: req.user._id }
        });

        if (!recipientUser) {
            return res.status(404).json({ error: 'Recipient not found' });
        }

        // Perform transaction
        req.user.coins -= amount;
        recipientUser.coins += amount;

        await Promise.all([req.user.save(), recipientUser.save()]);

        // Record transactions
        const debitTransaction = new Transaction({
            userId: req.user._id,
            type: 'debit',
            amount,
            description: `Sent to ${recipientUser.username}`,
            relatedUser: recipientUser._id
        });

        const creditTransaction = new Transaction({
            userId: recipientUser._id,
            type: 'credit',
            amount,
            description: `Received from ${req.user.username}`,
            relatedUser: req.user._id
        });

        await Promise.all([debitTransaction.save(), creditTransaction.save()]);

        res.json({ 
            coins: req.user.coins,
            message: `Successfully sent ${amount} coins to ${recipientUser.username}`
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get transactions
router.get('/transactions', authenticate, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
