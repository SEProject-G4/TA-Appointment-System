const mongoose = require('mongoose');
const User = require('../models/User');

// Database indexes for optimal performance
const createIndexes = async () => {
    try {
        console.log('Creating database indexes for optimal performance...');
        
        // User collection indexes
        await User.collection.createIndex({ email: 1 }); // Non-unique email index for queries
        await User.collection.createIndex({ googleId: 1 }, { sparse: true });
        await User.collection.createIndex({ role: 1 });
        await User.collection.createIndex({ userGroup: 1 });
        await User.collection.createIndex({ lastActivityAt: 1 });
        await User.collection.createIndex({ lastLoginAt: 1 });
        
        // Compound indexes for common queries
        await User.collection.createIndex({ role: 1, userGroup: 1 });
        await User.collection.createIndex({ email: 1, role: 1 }, { unique: true }); // Compound unique index
        
        console.log('Database indexes created successfully');
    } catch (error) {
        console.error('Error creating indexes:', error);
    }
};

// Cleanup old session data
const cleanupSessions = async () => {
    try {
        const mongoose = require('mongoose');
        const db = mongoose.connection.db;
        
        // Remove expired sessions (handled by MongoDB TTL, but this is for manual cleanup)
        const result = await db.collection('sessions').deleteMany({
            expires: { $lt: new Date() }
        });
        
        console.log(`Cleaned up ${result.deletedCount} expired sessions`);
    } catch (error) {
        console.error('Error cleaning up sessions:', error);
    }
};

// Database maintenance tasks
const performMaintenance = async () => {
    try {
        console.log('Performing database maintenance...');
        
        // Update users without lastActivityAt
        await User.updateMany(
            { lastActivityAt: { $exists: false } },
            { $set: { lastActivityAt: new Date() } }
        );
        
        // Update users without lastLoginAt
        await User.updateMany(
            { lastLoginAt: { $exists: false } },
            { $set: { lastLoginAt: new Date() } }
        );
        
        console.log('Database maintenance completed');
    } catch (error) {
        console.error('Error performing maintenance:', error);
    }
};

// Get database statistics
const getDatabaseStats = async () => {
    try {
        const stats = await mongoose.connection.db.stats();
        const userStats = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 },
                    lastActivity: { $max: '$lastActivityAt' }
                }
            }
        ]);
        
        return {
            database: {
                collections: stats.collections,
                dataSize: stats.dataSize,
                indexSize: stats.indexSize,
                storageSize: stats.storageSize
            },
            users: userStats
        };
    } catch (error) {
        console.error('Error getting database stats:', error);
        return null;
    }
};

module.exports = {
    createIndexes,
    cleanupSessions,
    performMaintenance,
    getDatabaseStats
};