const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');

// Send message
router.post('/', authenticate, async (req, res) => {
    try {
        const { content, receiverId } = req.body;
        
        const message = new Message({
            sender: req.user._id,
            receiver: receiverId,
            content,
            isAdminMessage: req.user.role === 'admin'
        });

        await message.save();
        res.json(message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get messages
router.get('/', authenticate, async (req, res) => {
    try {
        let query;
        
        if (req.user.role === 'admin') {
            query = {
                $or: [
                    { receiver: null },
                    { receiver: req.user._id },
                    { sender: req.user._id }
                ]
            };
        } else {
            query = {
                $or: [
                    { sender: req.user._id },
                    { receiver: req.user._id }
                ]
            };
        }

        const messages = await Message.find(query)
            .populate('sender', 'username profilePic')
            .populate('receiver', 'username profilePic')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Mark as read
router.put('/:id/read', authenticate, async (req, res) => {
    try {
        const message = await Message.findOneAndUpdate(
            { _id: req.params.id, receiver: req.user._id },
            { isRead: true },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        res.json(message);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
