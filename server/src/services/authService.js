const User = require("../models/User");

const findUser = async (profile) => {
  try {
    let user = await User.findOne({ googleId: profile.sub });
    // console.log("User found:", user);
    if (!user) {
    //   console.log("User not found");
      user = new User({
        googleId: profile.sub,
        name: profile.name,
        email: profile.email,
        profilePicture: profile.picture,
        role: 'admin',
      });

      await user.save();
    //   console.log("New user created:", user);
    }
    return user;
  } catch (error) {
    console.error("Error finding user:", error);
    throw new Error("User not found");
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
  findUser,
  findUserById,
  findUserByEmail,
};
