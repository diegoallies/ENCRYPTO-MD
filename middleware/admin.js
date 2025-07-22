const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateAdmin = async (req, res, next) => {
    try {
        // 1. Get token from header
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                error: 'Access denied. No token provided.' 
            });
        }
        
        // 2. Verify token
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Find user in database
        const user = await User.findById(verified.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                error: 'User not found' 
            });
        }
        
        // 4. Check if user is admin
        if (user.role !== 'admin') {
            return res.status(403).json({ 
                success: false,
                error: 'Admin access required' 
            });
        }
        
        // 5. Check if account is banned
        if (user.isBanned) {
            return res.status(403).json({ 
                success: false,
                error: 'Account suspended' 
            });
        }
        
        // 6. Attach user to request
        req.user = user;
        next();
    } catch (err) {
        console.error('Admin authentication error:', err);
        
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                error: 'Session expired. Please log in again.' 
            });
        }
        
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false,
                error: 'Invalid token' 
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Internal server error' 
        });
    }
};

const checkMaintenanceMode = async (req, res, next) => {
    try {
        // In a real app, you would check this from database or Redis cache
        const maintenanceMode = false;
        
        if (maintenanceMode && req.user?.role !== 'admin') {
            return res.status(503).json({
                success: false,
                error: 'System is under maintenance. Please try again later.',
                maintenance: true
            });
        }
        
        next();
    } catch (err) {
        console.error('Maintenance check error:', err);
        next();
    }
};

const adminLogging = (req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[ADMIN] ${req.method} ${req.originalUrl}`);
        if (req.body && Object.keys(req.body).length > 0) {
            console.log('Request body:', req.body);
        }
    }
    next();
};

module.exports = {
    authenticateAdmin,
    checkMaintenanceMode,
    adminLogging
};
