const User = require("../models/User");
const config = require("../config");

const findUser = async (profile) => {
  try {
    let user = await User.findOne({ googleId: profile.sub });
    // console.log("User found:", user);
    if (!user) {
    //   console.log("User not found");
      const emailLower = String(profile.email || '').toLowerCase();
      const lecturerEmails = String(config.LECTURER_EMAILS || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      const isLecturerSeeded = lecturerEmails.includes(emailLower);

      user = new User({
        googleId: profile.sub,
        name: profile.name,
        email: emailLower,
        profilePicture: profile.picture,
        role: isLecturerSeeded ? 'lecturer' : 'admin',
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

module.exports = {
  findUser,
  findUserById,
};
