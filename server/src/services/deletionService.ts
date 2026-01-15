import mongoose from "mongoose";
const { deleteFolderAndContents } = require("./driveService");

const User = require("../models/User");
const UserGroup = require("../models/UserGroup");
const AppliedModules = require("../models/AppliedModules");
const TaApplication = require("../models/TaApplication");
const ModuleDetails = require("../models/ModuleDetails");
const RecruitmentRound = require("../models/RecruitmentRound");
const Document = require("../models/documentModel");

/**
 * Helper function to delete Google Drive folders
 */
const deleteGoogleDriveFolders = async (folderIds: string[]): Promise<void> => {
  const deletePromises = folderIds.map(async (folderId) => {
    try {
      if (folderId) {
        await deleteFolderAndContents(folderId);
      }
    } catch (error) {
      console.error(`Failed to delete Google Drive folder ${folderId}:`, error);
      // Continue with other deletions even if one fails
    }
  });

  await Promise.all(deletePromises);
};

/**
 * Helper function to delete user's documents and associated Google Drive folders
 */
const deleteUserDocuments = async (
  userId: mongoose.Types.ObjectId
): Promise<void> => {
  const documents = await Document.find({ userId });

  if (documents.length > 0) {
    // Collect all drive folder IDs
    const driveFolderIds = documents
      .map((doc: any) => doc.driveFolderId)
      .filter((id: string) => id);

    // Delete Google Drive folders
    // if (driveFolderIds.length > 0) {
    //   await deleteGoogleDriveFolders(driveFolderIds);
    // }

    // Delete document records
    await Document.deleteMany({ userId });
  }
};

/**
 * Helper function to delete user's applied modules records
 */
const deleteUserAppliedModules = async (
  userId: mongoose.Types.ObjectId
): Promise<void> => {
  await AppliedModules.deleteMany({ userId });
};

/**
 * Helper function to delete user's applications and update module counts
 */
const deleteUserApplications = async (
  userId: mongoose.Types.ObjectId,
  userRole: string
): Promise<void> => {
  const applications = await TaApplication.find({ userId });

  if (applications.length === 0) {
    return;
  }

  // Process each application to update module counts
  const updatePromises = applications.map(async (application: any) => {
    try {
      const module = await ModuleDetails.findById(application.moduleId);

      if (module) {
        const countsField =
          userRole === "undergraduate"
            ? "undergraduateCounts"
            : "postgraduateCounts";

        const counts = module[countsField];

        // Update counts based on application status
        if (application.status === "accepted") {
          counts.applied = Math.max(0, counts.applied - 1);
          counts.reviewed = Math.max(0, counts.reviewed - 1);
          counts.accepted = Math.max(0, counts.accepted - 1);
          counts.remaining = counts.remaining + 1;

          // If module status is not 'advertised' and application due date has not passed, change it to 'advertised'
          const now = new Date();
          const applicationDueDate = new Date(module.applicationDueDate);
          if (
            module.moduleStatus !== "advertised" &&
            applicationDueDate > now
          ) {
            module.moduleStatus = "advertised";
          }
        } else if (application.status === "pending") {
          counts.applied = Math.max(0, counts.applied - 1);
          counts.remaining = counts.remaining + 1;
          const now = new Date();
          const applicationDueDate = new Date(module.applicationDueDate);
          if (
            module.moduleStatus !== "advertised" &&
            applicationDueDate > now
          ) {
            module.moduleStatus = "advertised";
          }
        } else if (application.status === "rejected") {
          counts.applied = Math.max(0, counts.applied - 1);
          counts.reviewed = Math.max(0, counts.reviewed - 1);
        }

        await module.save();
      }
    } catch (error) {
      console.error(
        `Failed to update module counts for application ${application._id}:`,
        error
      );
      // Continue with other updates
    }
  });

  await Promise.all(updatePromises);

  // Delete all applications
  await TaApplication.deleteMany({ userId });
};

/**
 * Helper function to remove lecturer from module coordinators
 */
const removeLecturerFromModules = async (
  lecturerId: mongoose.Types.ObjectId
): Promise<void> => {
  // Find all modules where this lecturer is a coordinator
  const modules = await ModuleDetails.find({ coordinators: lecturerId });

  if (modules.length > 0) {
    const updatePromises = modules.map(async (module: any) => {
      try {
        // Remove lecturer from coordinators array
        module.coordinators = module.coordinators.filter(
          (coordId: mongoose.Types.ObjectId) => !coordId.equals(lecturerId)
        );
        await module.save();
        console.log(`Removed lecturer from module ${module.moduleCode}`);
      } catch (error) {
        console.error(
          `Failed to remove lecturer from module ${module._id}:`,
          error
        );
        // Continue with other updates
      }
    });

    await Promise.all(updatePromises);
  }
};

/**
 * Delete a single student user and all associated data
 * @param userId - The ID of the user to delete
 * @returns Success status
 */
export const deleteUser = async (
  userId: string | mongoose.Types.ObjectId
): Promise<{ success: boolean; message: string }> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const objectId =
      typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;

    // Get the user
    const user = await User.findById(objectId).session(session);

    if (!user) {
      await session.abortTransaction();
      return { success: false, message: "User not found" };
    }

    // Validate user is a student
    if (!["undergraduate", "postgraduate"].includes(user.role)) {
      await session.abortTransaction();
      return {
        success: false,
        message:
          "Can only delete student users (undergraduate or postgraduate)",
      };
    }

    // Delete user's documents and Google Drive folders (outside transaction for external API)
    await deleteUserDocuments(objectId);

    // Delete user's applied modules records
    await deleteUserAppliedModules(objectId);

    // Delete user's applications and update module counts
    await deleteUserApplications(objectId, user.role);

    // Decrease user count in user group
    await UserGroup.findByIdAndUpdate(
      user.userGroup,
      { $inc: { userCount: -1 } },
      { session }
    );

    // Delete the user
    await User.findByIdAndDelete(objectId).session(session);

    await session.commitTransaction();
    return { success: true, message: "User deleted successfully" };
  } catch (error) {
    await session.abortTransaction();
    console.error("Error deleting user:", error);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Delete a student user group and all associated users and data
 * @param userGroupId - The ID of the user group to delete
 * @returns Success status
 */
export const deleteUserGroup = async (
  userGroupId: string | mongoose.Types.ObjectId
): Promise<{ success: boolean; message: string }> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const objectId =
      typeof userGroupId === "string"
        ? new mongoose.Types.ObjectId(userGroupId)
        : userGroupId;

    // Get the user group
    const userGroup = await UserGroup.findById(objectId).session(session);

    if (!userGroup) {
      await session.abortTransaction();
      return { success: false, message: "User group not found" };
    }

    // Validate user group is for students
    if (!["undergraduate", "postgraduate"].includes(userGroup.groupType)) {
      await session.abortTransaction();
      return {
        success: false,
        message:
          "Can only delete student user groups (undergraduate or postgraduate)",
      };
    }

    // Get all users in this group
    const users = await User.find({ userGroup: objectId }).session(session);

    if (users.length > 0) {
      const userIds = users.map((user: any) => user._id);

      // Collect all document folder IDs for Google Drive deletion
      const documents = await Document.find({ userId: { $in: userIds } });
      const driveFolderIds = documents
        .map((doc: any) => doc.driveFolderId)
        .filter((id: string) => id);

      // Delete Google Drive folders (outside transaction for external API)
      if (driveFolderIds.length > 0) {
        await deleteGoogleDriveFolders(driveFolderIds);
      }

      // Delete all documents
      await Document.deleteMany({ userId: { $in: userIds } });

      // Delete all applied modules records
      await AppliedModules.deleteMany({ userId: { $in: userIds } });

      // Delete all applications and update module counts for each user
      for (const user of users) {
        await deleteUserApplications(user._id, user.role);
      }

      // Delete all users
      await User.deleteMany({ _id: { $in: userIds } }).session(session);
    }

    // Delete the user group
    await UserGroup.findByIdAndDelete(objectId).session(session);

    await session.commitTransaction();
    return {
      success: true,
      message: `User group deleted successfully with ${users.length} users`,
    };
  } catch (error) {
    await session.abortTransaction();
    console.error("Error deleting user group:", error);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Delete a module and all associated data
 * @param moduleId - The ID of the module to delete
 * @returns Success status
 */
export const deleteModule = async (
  moduleId: string | mongoose.Types.ObjectId
): Promise<{ success: boolean; message: string }> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const objectId =
      typeof moduleId === "string"
        ? new mongoose.Types.ObjectId(moduleId)
        : moduleId;

    // Get the module
    const module = await ModuleDetails.findById(objectId).session(session);

    if (!module) {
      await session.abortTransaction();
      return { success: false, message: "Module not found" };
    }

    // Get all applications for this module
    const applications = await TaApplication.find({
      moduleId: objectId,
    }).session(session);

    if (applications.length > 0) {
      // Process each application to update applied modules
      const updatePromises = applications.map(async (application: any) => {
        try {
          const appliedModule = await AppliedModules.findOne({
            userId: application.userId,
            recSeriesId: module.recruitmentSeriesId,
          }).session(session);

          if (appliedModule) {
            // Add module hours back to available hours
            appliedModule.availableHoursPerWeek += module.requiredTAHours;

            // Remove application from applied modules array
            appliedModule.appliedModules = appliedModule.appliedModules.filter(
              (appId: mongoose.Types.ObjectId) => !appId.equals(application._id)
            );

            await appliedModule.save({ session });
          }
        } catch (error) {
          console.error(
            `Failed to update applied module for application ${application._id}:`,
            error
          );
          // Continue with other updates
        }
      });

      await Promise.all(updatePromises);

      // Delete all applications
      await TaApplication.deleteMany({ moduleId: objectId }).session(session);
    }

    // Get recruitment round and decrease module count
    const recruitmentRound = await RecruitmentRound.findById(
      module.recruitmentSeriesId
    ).session(session);

    if (recruitmentRound) {
      recruitmentRound.moduleCount = Math.max(
        0,
        recruitmentRound.moduleCount - 1
      );

      // Decrease TA position counts
      if (module.openForUndergraduates) {
        recruitmentRound.undergraduateTAPositionsCount = Math.max(
          0,
          recruitmentRound.undergraduateTAPositionsCount -
            module.undergraduateCounts.required
        );
      }
      if (module.openForPostgraduates) {
        recruitmentRound.postgraduateTAPositionsCount = Math.max(
          0,
          recruitmentRound.postgraduateTAPositionsCount -
            module.postgraduateCounts.required
        );
      }

      await recruitmentRound.save({ session });
    }

    // Delete the module
    await ModuleDetails.findByIdAndDelete(objectId).session(session);

    await session.commitTransaction();
    return { success: true, message: "Module deleted successfully" };
  } catch (error) {
    await session.abortTransaction();
    console.error("Error deleting module:", error);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Delete a recruitment round and all associated data
 * @param recruitmentRoundId - The ID of the recruitment round to delete
 * @returns Success status
 */
export const deleteRecruitmentRound = async (
  recruitmentRoundId: string | mongoose.Types.ObjectId
): Promise<{ success: boolean; message: string }> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const objectId =
      typeof recruitmentRoundId === "string"
        ? new mongoose.Types.ObjectId(recruitmentRoundId)
        : recruitmentRoundId;

    // Get the recruitment round
    const recruitmentRound = await RecruitmentRound.findById(objectId).session(
      session
    );

    if (!recruitmentRound) {
      await session.abortTransaction();
      return { success: false, message: "Recruitment round not found" };
    }

    if (recruitmentRound.status !== "archived") {
      await session.abortTransaction();
      return {
        success: false,
        message: "Only archived recruitment rounds can be deleted"
      };
    }

    // Get all applied modules for this recruitment round
    const appliedModules = await AppliedModules.find({
      recSeriesId: objectId,
    }).session(session);

    if (appliedModules.length > 0) {
      // Collect all document IDs and folder IDs
      const documentIds = appliedModules
        .map((am: any) => am.Documents)
        .filter((docId: mongoose.Types.ObjectId) => docId);

      if (documentIds.length > 0) {
        const documents = await Document.find({ _id: { $in: documentIds } });
        const driveFolderIds = documents
          .map((doc: any) => doc.driveFolderId)
          .filter((id: string) => id);

        // Delete Google Drive folders (outside transaction for external API)
        // if (driveFolderIds.length > 0) {
        //   await deleteGoogleDriveFolders(driveFolderIds);
        // }

        // Delete documents
        await Document.deleteMany({ _id: { $in: documentIds } });
      }

      // Delete applied modules records
      await AppliedModules.deleteMany({ recSeriesId: objectId }).session(
        session
      );
    }

    // Get all modules for this recruitment round
    const modules = await ModuleDetails.find({
      recruitmentSeriesId: objectId,
    }).session(session);

    if (modules.length > 0) {
      const moduleIds = modules.map((module: any) => module._id);

      // Delete all applications for these modules
      await TaApplication.deleteMany({ moduleId: { $in: moduleIds } }).session(
        session
      );

      // Delete all modules
      await ModuleDetails.deleteMany({ _id: { $in: moduleIds } }).session(
        session
      );
    }

    // Delete the recruitment round
    await RecruitmentRound.findByIdAndDelete(objectId).session(session);

    await session.commitTransaction();
    return {
      success: true,
      message: `Recruitment round deleted successfully with ${modules.length} modules and ${appliedModules.length} applied modules`,
    };
  } catch (error) {
    await session.abortTransaction();
    console.error("Error deleting recruitment round:", error);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Delete a single lecturer user and remove from all module coordinators
 * @param userId - The ID of the lecturer to delete
 * @returns Success status
 */
export const deleteLecturer = async (
  userId: string | mongoose.Types.ObjectId
): Promise<{ success: boolean; message: string }> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const objectId =
      typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;

    // Get the user
    const user = await User.findById(objectId).session(session);

    if (!user) {
      await session.abortTransaction();
      return { success: false, message: "User not found" };
    }

    // Validate user is a lecturer or hod
    if (!["lecturer", "hod"].includes(user.role)) {
      await session.abortTransaction();
      return {
        success: false,
        message: "Can only delete lecturer or hod users",
      };
    }

    // Remove lecturer from all modules they coordinate
    await removeLecturerFromModules(objectId);

    // Decrease user count in user group
    await UserGroup.findByIdAndUpdate(
      user.userGroup,
      { $inc: { userCount: -1 } },
      { session }
    );

    // Delete the user
    await User.findByIdAndDelete(objectId).session(session);

    await session.commitTransaction();
    return { success: true, message: "Lecturer deleted successfully" };
  } catch (error) {
    await session.abortTransaction();
    console.error("Error deleting lecturer:", error);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Delete a lecturer user group and all associated lecturers
 * @param userGroupId - The ID of the user group to delete
 * @returns Success status
 */
export const deleteLecturerGroup = async (
  userGroupId: string | mongoose.Types.ObjectId
): Promise<{ success: boolean; message: string }> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const objectId =
      typeof userGroupId === "string"
        ? new mongoose.Types.ObjectId(userGroupId)
        : userGroupId;

    // Get the user group
    const userGroup = await UserGroup.findById(objectId).session(session);

    if (!userGroup) {
      await session.abortTransaction();
      return { success: false, message: "User group not found" };
    }

    // Validate user group is for lecturers or hod
    if (!["lecturer", "hod"].includes(userGroup.groupType)) {
      await session.abortTransaction();
      return {
        success: false,
        message: "Can only delete lecturer or hod user groups",
      };
    }

    // Get all users in this group
    const users = await User.find({ userGroup: objectId }).session(session);

    if (users.length > 0) {
      // Remove all lecturers from module coordinators
      for (const user of users) {
        await removeLecturerFromModules(user._id);
      }

      // Delete all users
      const userIds = users.map((user: any) => user._id);
      await User.deleteMany({ _id: { $in: userIds } }).session(session);
    }

    // Delete the user group
    await UserGroup.findByIdAndDelete(objectId).session(session);

    await session.commitTransaction();
    return {
      success: true,
      message: `Lecturer group deleted successfully with ${users.length} lecturers`,
    };
  } catch (error) {
    await session.abortTransaction();
    console.error("Error deleting lecturer group:", error);
    throw error;
  } finally {
    session.endSession();
  }
};
