const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
        
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'suzero_secret');
        req.user = await User.findById(verified.id);
        if (!req.user) return res.status(401).json({ error: 'User not found' });
        if (req.user.isBanned) return res.status(403).json({ error: 'Account suspended' });
        
        next();
    } catch (err) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user?.role === 'admin') next();
    else res.status(403).json({ error: 'Admin access required' });
};

module.exports = { authenticate, isAdmin };
