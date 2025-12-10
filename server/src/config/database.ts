const config = require('./index');
import mongoose = require('mongoose');

const connectDB = async (): Promise<void> => {
    try {
        const mongoUri = config.MONGO_URI;
        
        if (!mongoUri) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }
        
        await mongoose.connect(mongoUri);
        console.log('MongoDB connected successfully');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('MongoDB connection failed:', errorMessage);
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;