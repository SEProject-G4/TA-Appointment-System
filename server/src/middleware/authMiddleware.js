const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const authService = require('../services/authService');

exports.protected = async (req, res, next) => {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    console.log('Auth debug:', {
        authHeader: authHeader ? 'Present' : 'Missing',
        path: req.path
    });
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Not authorized, no token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify JWT token
        const decoded = jwt.verify(token, config.JWT_SECRET);
        
        // Fetch user from database
        const user = await authService.findUserById(decoded.userId);
        if (!user) {
            return res.status(404).json({ error: 'Not authorised, user not found' });
        }
        
        req.user = user;
        req.userId = decoded.userId;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        console.error('Error in authMiddleware:', error);
        return res.status(500).json({ error: 'Authentication failed' });
    }
}

exports.authorize = (roles = []) => {
    if (typeof roles == 'string') {
        roles = [roles]; // convert single role to array
    }

    return (req, res, next) => {
        if(!req.user) {
            return res.status(401).json({ message: 'No user data found in request' });
        }

        if (roles.length>0 && !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: You do not have the required role' });
        }
        next();
    }
}