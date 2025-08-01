const User = require('../models/User');
const authService = require('../services/authService');

exports.protected = async (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authorized, no session ID' });
    }

    try{
        const user = await authService.findUser({ id: req.session.userId });
        if (!user) {
            req.session.destroy();
            return res.status(404).json({ error: 'Not authorised, user not found' });
        }
        req.user = user;
        next();
    } catch (error) {
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