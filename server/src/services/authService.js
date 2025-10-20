const User = require("../models/User");
const config = require("../config");

const handleFirstLogin = async (user, payload) => {
  try {
    // Use updateOne for better performance
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          name: payload.name,
          firstLogin: false,
          googleId: payload.sub,
          profilePicture: payload.picture,
          lastLoginAt: new Date(),
          updatedAt: new Date()
        }
      }
    );
    
    // Update the user object for immediate use
    user.name = payload.name;
    user.firstLogin = false;
    user.googleId = payload.sub;
    user.profilePicture = payload.picture;
    user.lastLoginAt = new Date();
    
    console.log(`First login completed for user: ${user.email}`);
  } catch (error) {
    console.error("Error handling first login:", error);
    throw error;
  }
};

const findUserById = async (id) => {
  try {
    const user = await User.findById(id).lean(); // Use lean() for read-only operations
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  } catch (error) {
    console.error("Error finding user by ID:", error);
    throw error;
  }
};

// Optimized version with selective field projection
const findUserByIdOptimized = async (id, fields = null) => {
  try {
    let query = User.findById(id);
    
    // Only select necessary fields for session validation
    if (fields) {
      query = query.select(fields);
    } else {
      query = query.select('_id name email role userGroup profilePicture lastLoginAt');
    }
    
    const user = await query.lean();
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
    // Add index on email field for better performance
    const user = await User.findOne({ email }).lean();
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  } catch (error) {
    console.error("Error finding user by email:", error);
    throw error;
  }
};

// Batch user lookup for efficiency
const findUsersByIds = async (userIds) => {
  try {
    const users = await User.find({ 
      _id: { $in: userIds } 
    })
    .select('_id name email role userGroup profilePicture')
    .lean();
    
    return users;
  } catch (error) {
    console.error("Error finding users by IDs:", error);
    throw error;
  }
};

// Update user last activity
const updateLastActivity = async (userId) => {
  try {
    await User.updateOne(
      { _id: userId },
      { 
        $set: { 
          lastActivityAt: new Date() 
        }
      }
    );
  } catch (error) {
    console.error("Error updating last activity:", error);
    // Don't throw - this is not critical
  }
};

// Get user session info
const getUserSessionInfo = async (userId) => {
  try {
    const user = await User.findById(userId)
      .select('_id name email role userGroup profilePicture lastLoginAt lastActivityAt')
      .lean();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      groupId: user.userGroup,
      profilePicture: user.profilePicture,
      lastLoginAt: user.lastLoginAt,
      lastActivityAt: user.lastActivityAt
    };
  } catch (error) {
    console.error("Error getting user session info:", error);
    throw error;
  }
};

// Get detailed user profile with all fields
const getDetailedUserProfile = async (userId) => {
  try {
    const user = await User.findById(userId)
      .populate('userGroup', 'name description')
      .lean();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    // Return all user data including timestamps
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      displayName: user.displayName,
      indexNumber: user.indexNumber,
      googleId: user.googleId,
      userGroup: user.userGroup,
      firstLogin: user.firstLogin,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      lastActivityAt: user.lastActivityAt,
      updatedAt: user.updatedAt
    };
  } catch (error) {
    console.error("Error getting detailed user profile:", error);
    throw error;
  }
};

module.exports = {
  handleFirstLogin,
  findUserById,
  findUserByIdOptimized,
  findUserByEmail,
  findUsersByIds,
  updateLastActivity,
  getUserSessionInfo,
  getDetailedUserProfile,
};