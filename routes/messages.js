const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Message = require('../models/Message');
const { pool } = require('../config/db');

// Send message
router.post('/', authenticate, async (req, res) => {
    try {
        const { content, receiverId, subject } = req.body;
        
        const message = await Message.create({
            user_id: req.user.id,
            message: content,
            subject: subject || 'Message'
        });

        res.json(message);
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Get messages
router.get('/', authenticate, async (req, res) => {
    try {
        let messages;
        
        if (req.user.role === 'admin') {
            // Admin can see all messages
            messages = await Message.find();
        } else {
            // Users see only their messages
            messages = await Message.find({ user_id: req.user.id });
        }

        // Get user info for each message
        const messagesWithUsers = await Promise.all(messages.map(async (msg) => {
            const user = await require('../models/User').findById(msg.user_id);
            return {
                ...msg,
                sender: user ? {
                    username: user.username,
                    profilePic: user.profilePic
                } : null
            };
        }));

        res.json(messagesWithUsers.slice(0, 50)); // Limit to 50
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Mark as read
router.put('/:id/read', authenticate, async (req, res) => {
    try {
        const message = await Message.findOne({ id: req.params.id });
        
        if (!message || (req.user.role !== 'admin' && message.user_id !== req.user.id)) {
            return res.status(404).json({ error: 'Message not found' });
        }

        const updatedMessage = await Message.update(req.params.id, { is_read: true });
        res.json(updatedMessage);
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

module.exports = router;
