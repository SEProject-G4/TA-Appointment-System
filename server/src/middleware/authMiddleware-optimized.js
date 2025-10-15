const User = require('../models/User');
const authService = require('../services/authService-optimized');
const NodeCache = require('node-cache');

// User cache - 15 minutes TTL
const userCache = new NodeCache({ 
  stdTTL: 900, // 15 minutes
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false // Don't clone objects (better performance)
});

// Session cache to avoid repeated DB queries
const sessionUserCache = new NodeCache({
  stdTTL: 600, // 10 minutes 
  checkperiod: 60,
  useClones: false
});

exports.protected = async (req, res, next) => {
    if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authorized, no session' });
    }

    const userId = req.session.userId;
    const cacheKey = `user:${userId}`;
    
    try {
        // Check cache first
        let user = userCache.get(cacheKey);
        
        if (!user) {
            // Cache miss - fetch from database
            user = await authService.findUserByIdOptimized(userId);
            if (!user) {
                req.session.destroy((err) => {
                    if (err) console.error('Session destroy error:', err);
                });
                return res.status(404).json({ error: 'User not found' });
            }
            
            // Cache the user data
            userCache.set(cacheKey, user);
        }
        
        // Attach user to request
        req.user = user;
        
        // Update session activity timestamp
        req.session.lastActivity = new Date();
        
        next();
    } catch (error) {
        console.error('Error in authMiddleware:', error);
        return res.status(500).json({ error: 'Authentication failed' });
    }
};

exports.authorize = (roles = []) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'No user data found in request' });
        }

        if (roles.length > 0 && !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: 'Forbidden: You do not have the required role',
                required: roles,
                current: req.user.role
            });
        }
        
        next();
    };
};

// Middleware to invalidate user cache when user data changes
exports.invalidateUserCache = (userId) => {
    const cacheKey = `user:${userId}`;
    userCache.del(cacheKey);
    sessionUserCache.del(cacheKey);
    console.log(`Cache invalidated for user: ${userId}`);
};

// Optional: Session activity tracking
exports.trackActivity = (req, res, next) => {
    if (req.session?.userId) {
        req.session.lastActivity = new Date();
        req.session.requestCount = (req.session.requestCount || 0) + 1;
    }
    next();
};

// Session cleanup utility
exports.cleanupExpiredSessions = async () => {
    try {
        // This will be handled by MongoDB TTL, but you can add custom logic here
        console.log('Session cleanup completed');
    } catch (error) {
        console.error('Session cleanup error:', error);
    }
};

// Cache statistics for monitoring
exports.getCacheStats = () => {
    return {
        userCache: userCache.getStats(),
        sessionCache: sessionUserCache.getStats()
    };
};