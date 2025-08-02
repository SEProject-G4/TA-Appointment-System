const mongoose = require('mongoose');
const config = require('./index');

const connectDB = async () => {
    try{
        await mongoose.connect(`${config.MONGO_URI}`);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1); // Exit process with failure
    }
}

module.exports = connectDB;