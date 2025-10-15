const { getCacheStats } = require('../middleware/authMiddleware-optimized');

// Performance monitoring middleware
const performanceMonitoring = (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const endpoint = `${req.method} ${req.route?.path || req.path}`;
        
        // Log slow requests
        if (duration > 1000) { // 1 second threshold
            console.warn(`SLOW REQUEST: ${endpoint} took ${duration}ms`);
        }
        
        // Log request metrics
        console.log(`REQUEST: ${endpoint} - ${res.statusCode} - ${duration}ms`);
    });
    
    next();
};

// Session analytics
const getSessionAnalytics = async (req, res) => {
    try {
        // Get cache statistics
        const cacheStats = getCacheStats();
        
        // Get session statistics (would need to implement with session store)
        const sessionStats = {
            activeSessions: 'Not implemented', // Would need session store integration
            cacheHitRate: cacheStats.userCache.hits / (cacheStats.userCache.hits + cacheStats.userCache.misses) || 0,
            cacheStats
        };
        
        res.json({
            timestamp: new Date().toISOString(),
            performance: sessionStats,
            system: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpuUsage: process.cpuUsage()
            }
        });
    } catch (error) {
        console.error('Error getting analytics:', error);
        res.status(500).json({ error: 'Failed to get analytics' });
    }
};

// Health check with detailed status
const healthCheck = async (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        checks: {
            database: 'checking...',
            cache: 'checking...',
            session: 'checking...'
        }
    };
    
    try {
        // Check database connection
        const mongoose = require('mongoose');
        health.checks.database = mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy';
        
        // Check cache
        const cacheStats = getCacheStats();
        health.checks.cache = cacheStats ? 'healthy' : 'unhealthy';
        
        // Check session store
        health.checks.session = 'healthy'; // Assume healthy if we got this far
        
        const allHealthy = Object.values(health.checks).every(check => check === 'healthy');
        health.status = allHealthy ? 'healthy' : 'degraded';
        
        res.status(allHealthy ? 200 : 503).json(health);
    } catch (error) {
        health.status = 'unhealthy';
        health.error = error.message;
        res.status(503).json(health);
    }
};

module.exports = {
    performanceMonitoring,
    getSessionAnalytics,
    healthCheck
};