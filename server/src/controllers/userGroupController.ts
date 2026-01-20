import type { Request, Response } from "express";
const User = require("../models/User");
const UserGroup = require("../models/UserGroup");
import type { IUserGroup } from "../models/UserGroup";
import {
  deleteUser,
  deleteUsers as deleteBulkUsers,
  deleteUserGroup,
} from "../services/deletionService";

const defaultUserGroups = [
  { name: "Ungrouped", groupType: "undergraduate" },
  { name: "Ungrouped", groupType: "postgraduate" },
  { name: "Ungrouped", groupType: "lecturer" },
  { name: "Ungrouped", groupType: "hod" },
  { name: "Ungrouped", groupType: "cse-office" },
  { name: "Ungrouped", groupType: "admin" },
];

export const initializeUserGroups = async (): Promise<void> => {
  console.log("Initializing default user groups...");
  for (const group of defaultUserGroups) {
    const { name, groupType } = group;
    try {
      const existingGroup: IUserGroup | null = await UserGroup.findOne({
        name,
        groupType,
      });
      if (!existingGroup) {
        const newGroup: IUserGroup = new UserGroup({
          name,
          groupType,
          userCount: 0,
        });
        await newGroup.save();
        console.log(`Created group: ${name}`);
      } else {
        console.log(`Group already exists: ${name}`);
      }
    } catch (error) {
      console.error(`Failed to initialize group ${name}:`, error);
    }
  }
};

const createNewUsers = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const session = await User.startSession();
  session.startTransaction();
  
  try {
    const { users, userRole, groupId } = req.body;
    let assignedGroupId: string;

    if (groupId === "") {
      const ungrouped: IUserGroup | null = await UserGroup.findOne({
        name: "Ungrouped",
        groupType: userRole,
      }).session(session);
      if (!ungrouped) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(500)
          .json({ message: "Ungrouped user group not found." });
      }
      assignedGroupId = String(ungrouped._id);
    } else {
      assignedGroupId = groupId;
    }

    if (userRole === "undergraduate" || userRole === "postgraduate") {
      for (const user of users) {
        if (!user.indexNumber) {
          await session.abortTransaction();
          session.endSession();
          return res
            .status(400)
            .json({ message: "Index Number is required for this user type." });
        }
      }
    } else if (userRole === "lecturer" || userRole === "hod") {
      for (const user of users) {
        if (!user.displayName) {
          await session.abortTransaction();
          session.endSession();
          return res
            .status(400)
            .json({ message: "Display Name is required for this user type." });
        }
      }
    }

    const newUsers = users.map((user: any) => ({
      ...user,
      name: "Unsigned User",
      role: userRole,
      userGroup: assignedGroupId,
    }));

    const insertedUsers = await User.insertMany(newUsers, { session });
    const createdUserCount = insertedUsers.length;

    // Update the userGroup's userCount
    await UserGroup.findByIdAndUpdate(
      assignedGroupId,
      { $inc: { userCount: createdUserCount } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: `${createdUserCount} ${userRole} users successfully created and added to the group.`,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creating users:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getUserGroupsByType = async (
  req: Request,
  res: Response
): Promise<Response> => {
  console.log("Fetching user groups for type:", req.params.groupType);
  try {
    const { groupType } = req.params;
    const userGroups = await UserGroup.find({ groupType });
    return res.status(200).json(userGroups);
  } catch (error) {
    console.error("Error fetching user groups:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getUsersFromGroup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { groupId } = req.params;
    const users = await User.find({ userGroup: groupId });
    const payload = users.map((user: any) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePicUrl: user.profilePicture,
      dateAdded: user.createdAt,
      indexNumber: user.indexNumber,
      displayName: user.displayName,
    }));
    return res.status(200).json(payload);
  } catch (error) {
    console.error("Error fetching users from group:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteUserById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const result = await deleteUser(userId);
    
    if (!result.success) {
      const statusCode = result.message.includes("not found") ? 404 : 500;
      return res.status(statusCode).json({ message: result.message });
    }
    
    return res.status(200).json({ message: result.message });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteUsers = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userIds } = req.body;
    
    const result = await deleteBulkUsers(userIds);
    
    if (!result.success) {
      return res.status(500).json({ message: result.message });
    }
    
    return res.status(200).json({
      message: result.message,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting users:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteWholeUserGroup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { groupId } = req.params;

    if (!groupId) {
      return res.status(400).json({ message: "User group ID is required" });
    }

    const result = await deleteUserGroup(groupId);

    if (!result.success) {
      const statusCode = result.message.includes("not found") ? 404 : 500;
      return res.status(statusCode).json({ message: result.message });
    }
    
    return res.status(200).json({ message: result.message });
  } catch (error) {
    console.error("Error deleting user group and its users:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateUserGroupName = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { groupId } = req.params;
    const { newName } = req.body;
    const updatedGroup = await UserGroup.findByIdAndUpdate(
      groupId,
      { name: newName },
      { new: true }
    );
    if (!updatedGroup) {
      return res.status(404).json({ message: "User group not found" });
    }
    return res
      .status(200)
      .json({
        message: "User group updated successfully",
        group: updatedGroup,
      });
  } catch (error) {
    console.error("Error updating user group:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateUserDetails = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { userId } = req.params;
    const { name, email, role, ...others } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, ...others },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    return res
      .status(200)
      .json({
        message: "User details updated successfully",
        user: updatedUser,
      });
  } catch (error) {
    console.error("Error updating user details:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAllLecturers = async (
  req: Request,
  res: Response
): Promise<Response> => {
  console.log("Fetching all lecturers...");
  try {
    const lecturers = await User.find({ role: { $in: ["lecturer"] } });
    return res.status(200).json(lecturers);
  } catch (error) {
    console.error("Error fetching lecturers:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAdminOfficeHoDUserGroups = async (
  req: Request,
  res: Response
): Promise<Response> => {
  console.log("Fetching admin, office, and HoD user groups...");
  try {
    const userGroups = await UserGroup.find({
      groupType: { $in: ["admin", "cse-office", "hod"] },
    });
    return res.status(200).json(userGroups);
  } catch (error) {
    console.error("Error fetching user groups:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const createNewUserGroup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { name, groupType } = req.body;
    const newGroup = new UserGroup({ name, groupType, userCount: 0 });
    await newGroup.save();
    return res
      .status(201)
      .json({ message: "User group created successfully", group: newGroup });
  } catch (error) {
    console.error("Error creating user group:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  initializeUserGroups,
  createNewUsers,
  getUserGroupsByType,
  createNewUserGroup,
  getUsersFromGroup,
  deleteWholeUserGroup,
  deleteUserById,
  deleteUsers,
  updateUserGroupName,
  updateUserDetails,
  getAllLecturers,
  getAdminOfficeHoDUserGroups
};
