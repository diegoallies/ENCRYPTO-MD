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

        const newCoins = req.user.coins + 10;
        await User.update(req.user.id, { coins: newCoins, lastClaim: now });

        // Record transaction
        await Transaction.create({
            userId: req.user.id,
            type: 'credit',
            amount: 10,
            description: 'Daily claim'
        });

        res.json({ coins: newCoins });
    } catch (error) {
        console.error('Claim error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
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
            $or: [{ username: recipient }, { email: recipient }]
        });

        if (!recipientUser || recipientUser.id === req.user.id) {
            return res.status(404).json({ error: 'Recipient not found' });
        }

        // Perform transaction
        await User.update(req.user.id, { coins: req.user.coins - amount });
        await User.update(recipientUser.id, { coins: recipientUser.coins + amount });

        // Record transactions
        await Transaction.create({
            userId: req.user.id,
            type: 'debit',
            amount,
            description: `Sent to ${recipientUser.username}`
        });

        await Transaction.create({
            userId: recipientUser.id,
            type: 'credit',
            amount,
            description: `Received from ${req.user.username}`
        });

        const updatedUser = await User.findById(req.user.id);
        res.json({ 
            coins: updatedUser.coins,
            message: `Successfully sent ${amount} coins to ${recipientUser.username}`
        });
    } catch (error) {
        console.error('Send coins error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Get transactions
router.get('/transactions', authenticate, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user.id });
        res.json(transactions.slice(0, 50)); // Limit to 50
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

module.exports = router;
