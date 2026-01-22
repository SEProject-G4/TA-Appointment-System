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
  try {
    const { users, userRole, groupId } = req.body;
    let assignedGroupId: string;

    // Validate groupId and get assigned group
    if (groupId === "") {
      const ungrouped: IUserGroup | null = await UserGroup.findOne({
        name: "Ungrouped",
        groupType: userRole,
      });
      if (!ungrouped) {
        return res
          .status(500)
          .json({ message: "Ungrouped user group not found." });
      }
      assignedGroupId = String(ungrouped._id);
    } else {
      assignedGroupId = groupId;
    }

    // Arrays to track results
    const successfulUsers: any[] = [];
    const failedUsers: Array<{ email: string; error: string; indexNumber?: string; displayName?: string }> = [];
    const validUsers: any[] = [];

    // Step 1: Pre-validation (fast, no DB operations)
    for (const user of users) {
      // Validate required fields based on user role
      if (userRole === "undergraduate" || userRole === "postgraduate") {
        if (!user.indexNumber) {
          failedUsers.push({
            email: user.email,
            indexNumber: user.indexNumber,
            error: "Index Number is required for this user type",
          });
          continue;
        }
      } else if (userRole === "lecturer" || userRole === "hod") {
        if (!user.displayName) {
          failedUsers.push({
            email: user.email,
            displayName: user.displayName,
            error: "Display Name is required for this user type",
          });
          continue;
        }
      }

      // Basic email validation
      if (!user.email || !user.email.includes("@")) {
        failedUsers.push({
          email: user.email,
          indexNumber: user.indexNumber,
          displayName: user.displayName,
          error: "Invalid email address",
        });
        continue;
      }

      validUsers.push(user);
    }

    // Step 2: Check for duplicates within the submitted batch
    const emailSet = new Set<string>();
    const indexNumberSet = new Set<string>();
    const batchDuplicates: any[] = [];
    const uniqueValidUsers: any[] = [];

    for (const user of validUsers) {
      let isDuplicate = false;

      // Check for duplicate email in batch
      if (emailSet.has(user.email.toLowerCase())) {
        failedUsers.push({
          email: user.email,
          indexNumber: user.indexNumber,
          displayName: user.displayName,
          error: "Duplicate email in the submitted batch",
        });
        isDuplicate = true;
      } else {
        emailSet.add(user.email.toLowerCase());
      }

      // Check for duplicate indexNumber in batch
      if ((userRole === "undergraduate" || userRole === "postgraduate") && user.indexNumber) {
        if (indexNumberSet.has(user.indexNumber)) {
          if (!isDuplicate) {
            failedUsers.push({
              email: user.email,
              indexNumber: user.indexNumber,
              displayName: user.displayName,
              error: "Duplicate index number in the submitted batch",
            });
          }
          isDuplicate = true;
        } else {
          indexNumberSet.add(user.indexNumber);
        }
      }

      if (!isDuplicate) {
        uniqueValidUsers.push(user);
      }
    }

    // If no valid users after pre-validation, return early
    if (uniqueValidUsers.length === 0) {
      return res.status(400).json({
        message: "No valid users to create",
        success: false,
        successCount: 0,
        failureCount: failedUsers.length,
        totalUsers: users.length,
        failedUsers,
      });
    }

    // Step 3: Bulk check for existing emails and index numbers in database
    const emails = uniqueValidUsers.map(u => u.email.toLowerCase());
    const indexNumbers = uniqueValidUsers
      .filter(u => u.indexNumber)
      .map(u => u.indexNumber);

    const [existingEmailUsers, existingIndexUsers] = await Promise.all([
      User.find({ email: { $in: emails } }).select("email").lean(),
      indexNumbers.length > 0 
        ? User.find({ indexNumber: { $in: indexNumbers } }).select("indexNumber").lean()
        : Promise.resolve([])
    ]);

    // Create sets for fast lookup
    const existingEmails = new Set(existingEmailUsers.map((u: any) => u.email.toLowerCase()));
    const existingIndexNumbers = new Set(existingIndexUsers.map((u: any) => u.indexNumber));

    // Filter out users with existing emails or index numbers
    const usersToCreate: any[] = [];
    for (const user of uniqueValidUsers) {
      if (existingEmails.has(user.email.toLowerCase())) {
        failedUsers.push({
          email: user.email,
          indexNumber: user.indexNumber,
          displayName: user.displayName,
          error: "A user with this email already exists",
        });
        continue;
      }

      if (user.indexNumber && existingIndexNumbers.has(user.indexNumber)) {
        failedUsers.push({
          email: user.email,
          indexNumber: user.indexNumber,
          displayName: user.displayName,
          error: "A user with this index number already exists",
        });
        continue;
      }

      usersToCreate.push(user);
    }

    // If no users to create after all validations, return early
    if (usersToCreate.length === 0) {
      return res.status(400).json({
        message: "No valid users to create after duplicate check",
        success: false,
        successCount: 0,
        failureCount: failedUsers.length,
        totalUsers: users.length,
        failedUsers,
      });
    }

    // Step 4: Bulk insert with single transaction
    const session = await User.startSession();
    session.startTransaction();

    try {
      // Prepare users for bulk insert
      const newUsers = usersToCreate.map((user: any) => ({
        ...user,
        email: user.email.toLowerCase(), // Normalize email
        name: "Unsigned User",
        role: userRole,
        userGroup: assignedGroupId,
      }));

      // Bulk insert
      const insertedUsers = await User.insertMany(newUsers, { 
        session,
        ordered: false // Continue even if some fail
      });

      // Update the userGroup's userCount
      await UserGroup.findByIdAndUpdate(
        assignedGroupId,
        { $inc: { userCount: insertedUsers.length } },
        { session }
      );

      await session.commitTransaction();
      
      // Track successful users
      for (const user of usersToCreate) {
        successfulUsers.push({
          email: user.email,
          indexNumber: user.indexNumber,
          displayName: user.displayName,
        });
      }
    } catch (error: any) {
      await session.abortTransaction();
      
      // Handle bulk insert errors
      if (error.writeErrors) {
        // Some users were inserted, some failed
        const insertedCount = error.insertedDocs?.length || 0;
        
        // Track which users failed
        for (let i = 0; i < usersToCreate.length; i++) {
          const user = usersToCreate[i];
          const writeError = error.writeErrors.find((e: any) => e.index === i);
          
          if (writeError) {
            let errorMessage = "Failed to create user";
            if (writeError.code === 11000) {
              const field = Object.keys(writeError.keyPattern || {})[0];
              errorMessage = field 
                ? `Duplicate ${field}: ${writeError.keyValue?.[field]}`
                : "Duplicate key error";
            } else if (writeError.errmsg) {
              errorMessage = writeError.errmsg;
            }
            
            failedUsers.push({
              email: user.email,
              indexNumber: user.indexNumber,
              displayName: user.displayName,
              error: errorMessage,
            });
          } else {
            // User was successfully inserted
            successfulUsers.push({
              email: user.email,
              indexNumber: user.indexNumber,
              displayName: user.displayName,
            });
          }
        }

        // Update group count for successfully inserted users
        if (insertedCount > 0) {
          await UserGroup.findByIdAndUpdate(
            assignedGroupId,
            { $inc: { userCount: insertedCount } }
          );
        }
      } else {
        // Complete failure
        console.error("Error in bulk insert:", error);
        for (const user of usersToCreate) {
          failedUsers.push({
            email: user.email,
            indexNumber: user.indexNumber,
            displayName: user.displayName,
            error: error.message || "Failed to create user",
          });
        }
      }
    } finally {
      session.endSession();
    }

    // Prepare response message
    const totalUsers = users.length;
    const successCount = successfulUsers.length;
    const failureCount = failedUsers.length;

    if (successCount === 0) {
      return res.status(400).json({
        message: "Failed to create any users",
        success: false,
        successCount: 0,
        failureCount,
        totalUsers,
        failedUsers,
      });
    }

    if (failureCount === 0) {
      return res.status(201).json({
        message: `Successfully created all ${successCount} ${userRole} user(s)`,
        success: true,
        successCount,
        failureCount: 0,
        totalUsers,
        successfulUsers,
      });
    }

    // Partial success
    return res.status(207).json({
      message: `Created ${successCount} out of ${totalUsers} user(s). ${failureCount} user(s) failed.`,
      success: true,
      successCount,
      failureCount,
      totalUsers,
      successfulUsers,
      failedUsers,
    });
  } catch (error) {
    console.error("Error in createNewUsers:", error);
    return res.status(500).json({ 
      message: "Internal server error",
      success: false,
    });
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
