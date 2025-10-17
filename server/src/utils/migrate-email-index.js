const mongoose = require('mongoose');
const config = require('../config');
const User = require('../models/User');

/**
 * Migration script to update email uniqueness constraint
 * This removes the old unique email index and ensures the compound index exists
 * 
 * Usage: node src/utils/migrate-email-index.js
 */

async function migrateEmailIndex() {
    try {
        console.log('Starting email index migration...');
        console.log('Connecting to database...');
        
        await mongoose.connect(config.MONGO_URI);
        console.log('Connected to database');

        // Get all existing indexes
        const indexes = await User.collection.getIndexes();
        console.log('Current indexes:', Object.keys(indexes));

        // Drop the old unique email index if it exists
        try {
            await User.collection.dropIndex('email_1');
            console.log('✓ Dropped old unique email index (email_1)');
        } catch (error) {
            if (error.code === 27 || error.message.includes('index not found')) {
                console.log('✓ Old unique email index does not exist (already removed)');
            } else {
                console.error('Error dropping email index:', error.message);
            }
        }

        // Ensure the compound unique index exists
        try {
            await User.collection.createIndex(
                { email: 1, role: 1 }, 
                { unique: true, name: 'email_1_role_1' }
            );
            console.log('✓ Created compound unique index on email and role');
        } catch (error) {
            if (error.code === 85 || error.message.includes('already exists')) {
                console.log('✓ Compound unique index already exists');
            } else {
                throw error;
            }
        }

        // Create non-unique email index for queries
        try {
            await User.collection.createIndex(
                { email: 1 }, 
                { name: 'email_1_nonunique' }
            );
            console.log('✓ Created non-unique email index for queries');
        } catch (error) {
            if (error.code === 85 || error.message.includes('already exists')) {
                console.log('✓ Non-unique email index already exists');
            } else {
                console.warn('Warning: Could not create non-unique email index:', error.message);
            }
        }

        // Verify the new indexes
        const newIndexes = await User.collection.getIndexes();
        console.log('\nFinal indexes:', Object.keys(newIndexes));

        // Check for users with same email
        const emailGroups = await User.aggregate([
            {
                $group: {
                    _id: '$email',
                    count: { $sum: 1 },
                    roles: { $push: '$role' }
                }
            },
            {
                $match: { count: { $gt: 1 } }
            }
        ]);

        if (emailGroups.length > 0) {
            console.log('\n📧 Users with multiple roles:');
            emailGroups.forEach(group => {
                console.log(`  - ${group._id}: ${group.roles.join(', ')}`);
            });
        } else {
            console.log('\n✓ No users currently have multiple roles');
        }

        console.log('\n✅ Migration completed successfully!');
        console.log('The admin email can now have both admin and lecturer roles.');
        
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from database');
        process.exit(0);
    }
}

// Run the migration
if (require.main === module) {
    migrateEmailIndex();
}

module.exports = { migrateEmailIndex };

