const User = require("../models/User");
const config = require("../config/index");
import type { Types } from "mongoose";
import type { IUser } from "../models/User";
import type { TokenPayload } from "google-auth-library";

interface UserSessionInfo {
  id: Types.ObjectId;
  name: string;
  email: string;
  role: string;
  groupId: Types.ObjectId;
  profilePicture: string;
}

interface DetailedUserProfile {
  id: Types.ObjectId;
  name: string;
  email: string;
  role: string;
  profilePicture: string;
  displayName?: string | undefined;
  indexNumber?: string | undefined;
  googleId?: string | undefined;
  userGroup: any;
  firstLogin: boolean;
  createdAt: Date;
}

interface AvailableRole {
  userId: Types.ObjectId;
  role: string;
  displayName: string;
  indexNumber?: string | undefined;
}

const handleFirstLogin = async (user: IUser, payload: TokenPayload): Promise<void> => {
  try {
    const fallbackName =  user.email.split('@')[0] ?? "User";
    const finalName = payload.name || fallbackName;
    const finalPicture = payload.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(finalName)}&background=random`;

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          name: finalName,
          firstLogin: false,
          googleId: payload.sub, // 'sub' is the only guaranteed field from Google
          profilePicture: finalPicture,
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    user.name = finalName;
    user.firstLogin = false;
    user.googleId = payload.sub;
    user.profilePicture = finalPicture;

    console.log(`First login completed for user: ${user.email}`);
  } catch (error) {
    console.error("Error handling first login:", error);
    throw error;
  }
};

const findUserById = async (id: string | Types.ObjectId): Promise<IUser> => {
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
const findUserByIdOptimized = async (
  id: string | Types.ObjectId,
  fields: string | null = null
): Promise<IUser> => {
  try {
    let query = User.findById(id);

    // Only select necessary fields for session validation
    if (fields) {
      query = query.select(fields);
    } else {
      query = query.select("_id name email role userGroup profilePicture lastLoginAt");
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

const findUserByEmail = async (email: string): Promise<IUser[]> => {
  try {
    // Find all users with this email (multiple roles possible)
    const users = await User.find({ email }).lean();
    // Return empty array if no users found (let controller handle the "not found" case)
    return users || [];
  } catch (error) {
    console.error("Error finding user by email:", error);
    throw error; // Only throw for actual database errors
  }
};

// Batch user lookup for efficiency
const findUsersByIds = async (userIds: (string | Types.ObjectId)[]): Promise<IUser[]> => {
  try {
    const users = await User.find({
      _id: { $in: userIds },
    })
      .select("_id name email role userGroup profilePicture")
      .lean();

    return users;
  } catch (error) {
    console.error("Error finding users by IDs:", error);
    throw error;
  }
};

// Update user last activity
const updateLastActivity = async (userId: string | Types.ObjectId): Promise<void> => {
  try {
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          lastActivityAt: new Date(),
        },
      }
    );
  } catch (error) {
    console.error("Error updating last activity:", error);
    // Don't throw - this is not critical
  }
};

// Get user session info
const getUserSessionInfo = async (userId: string | Types.ObjectId): Promise<UserSessionInfo> => {
  try {
    const user = await User.findById(userId)
      .select("_id name email role userGroup profilePicture")
      .lean();

    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: user._id as Types.ObjectId,
      name: user.name,
      email: user.email,
      role: user.role,
      groupId: user.userGroup as Types.ObjectId,
      profilePicture: user.profilePicture
    };
  } catch (error) {
    console.error("Error getting user session info:", error);
    throw error;
  }
};

// Get detailed user profile with all fields
const getDetailedUserProfile = async (userId: string | Types.ObjectId): Promise<DetailedUserProfile> => {
  try {
    const user = await User.findById(userId).populate("userGroup", "name description").lean();

    if (!user) {
      throw new Error("User not found");
    }

    // Return all user data including timestamps
    return {
      id: user._id as Types.ObjectId,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      displayName: user.displayName,
      indexNumber: user.indexNumber,
      googleId: user.googleId,
      userGroup: user.userGroup as Types.ObjectId,
      firstLogin: user.firstLogin,
      createdAt: user.createdAt
    };
  } catch (error) {
    console.error("Error getting detailed user profile:", error);
    throw error;
  }
};

// Find user by email and role combination
const findUserByEmailAndRole = async (email: string, role: string): Promise<any> => {
  try {
    const user = await User.findOne({ email, role }).lean();
    if (!user) {
      throw new Error("User not found for this email and role combination");
    }
    return user;
  } catch (error) {
    console.error("Error finding user by email and role:", error);
    throw error;
  }
};

// Get all available roles for an email
const getAvailableRolesForEmail = async (email: string): Promise<AvailableRole[]> => {
  try {
    const users = await User.find({ email })
      .select("_id role name displayName indexNumber")
      .lean();

    return users.map((user: IUser) => ({
      userId: user._id as Types.ObjectId,
      role: user.role,
      displayName: user.displayName || user.name,
      indexNumber: user.indexNumber,
    }));
  } catch (error) {
    console.error("Error getting available roles for email:", error);
    throw error;
  }
};

// Switch user session to different role
const switchUserRole = async (email: string, newRole: string): Promise<UserSessionInfo> => {
  try {
    const user = await findUserByEmailAndRole(email, newRole);
    return await getUserSessionInfo(user._id);
  } catch (error) {
    console.error("Error switching user role:", error);
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
  findUserByEmailAndRole,
  getAvailableRolesForEmail,
  switchUserRole,
};
