const mongoose = require('mongoose');
const { Schems } = mongoose;

const userSchema = new mongoose.Schema({
    googleId: {
        type: String,
        required: true,
        unique: true,
    },
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    profilePicture: {
        type: String,
        default: 'https://www.gravatar.com/avatar?d=mp',
    },
    role:{
        type: String,
        enum: ['admin', 'undergraduate', 'postgraduate','lecturer','cse-office', 'hod'],
        default: 'undergraduate',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exxports = mongoose.model('User', userSchema);