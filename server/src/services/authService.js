const User = require("../models/User");

const handleFirstLogin = (user, payload) => {
  try {
    user.name = payload.name;
    user.firstLogin = false;
    user.googleId = payload.sub;
    user.profilePicture = payload.picture;
    user.save();
  } catch (error) {
    console.error("Error handling first login:", error);
  }
};

const findUserById = async (id) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  } catch (error) {
    console.error("Error finding user by ID:", error);
    throw error;
  }
};

const findUserByEmail = async (email) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  } catch (error) {
    console.error("Error finding user by email:", error);
    throw error;
  }
};

module.exports = {
  handleFirstLogin,
  findUserById,
  findUserByEmail,
};
