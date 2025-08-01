const User = require('../models/User');

const findUser = async (profile) => {
    try {
        const user = await User.findOne({ googleId: profile.id });
        return user;
    } catch (error) {
        console.error('Error finding user:', error);
        throw new Error('User not found');
    }
}

module.exports = {
    findUser,
};