import type { Request, Response } from "express";
const ModuleDetails = require("../models/ModuleDetails");
const User = require("../models/User");
const RecruitmentRound = require("../models/RecruitmentRound");
const TAApplication = require("../models/TaApplication");
const AppliedModule = require("../models/AppliedModules");
const { EmailService } = require("../services/emailService");
const config = require("../config/index");
import mongoose = require("mongoose");

const changeModuleStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const moduleId = req.params.moduleId;
    const newStatus = req.body.status;

    // Find the module by ID
    const module = await ModuleDetails.findById(moduleId);
    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }

    // Update the module status
    module.moduleStatus = newStatus;
    await module.save();

    return res.status(200).json(module);
  } catch (error) {
    console.error("Error changing module status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getModuleDetailsById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const moduleId = req.params.moduleId;
    const module = await ModuleDetails.findById(moduleId);
    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }

    const coordinatorDetails = await Promise.all(
      (module.coordinators as any[]).map(async (coordinatorId: any) => {
        const user = await User.findById(
          coordinatorId,
          "displayName email profilePicture"
        );
        if (user) {
          return {
            id: user._id,
            displayName: (user as any).displayName,
            email: user.email,
            profilePicture: (user as any).profilePicture,
          };
        }
        return null;
      })
    );

    const populatedModuleDetails = {
      ...(module as any)._doc,
      coordinators: coordinatorDetails.filter((c) => c !== null),
    };

    return res.status(200).json(populatedModuleDetails);
  } catch (error) {
    console.error("Error fetching module details:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const advertiseModule = async (req: Request, res: Response): Promise<Response> => {
  const { moduleId } = req.params;
  try {
    const module = await ModuleDetails.findById(moduleId);
    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }

    const recruitmentSeriesId = module.recruitmentSeriesId;
    if (!recruitmentSeriesId) {
      return res.status(400).json({
        error: "Module is not associated with any recruitment series",
      });
    }
    const recruitmentSeries = await RecruitmentRound.findById(
      recruitmentSeriesId
    );
    if (!recruitmentSeries) {
      return res.status(404).json({ error: "Recruitment series not found" });
    }

    const undergraduateUsers = await User.find(
      { userGroup: { $in: recruitmentSeries.undergradMailingList } },
      "email"
    );
    const postgraduateUsers = await User.find(
      { userGroup: { $in: recruitmentSeries.postgradMailingList } },
      "email"
    );

    const undergradEmails = undergraduateUsers.map((user: any) => user.email);
    const postgradEmails = postgraduateUsers.map((user: any) => user.email);

    const undergradEmailParamas = {
      moduleName: module.moduleName,
      moduleCode: module.moduleCode,
      semester: module.semester,
      positionsCount: module.undergraduateCounts ? module.undergraduateCounts.required : 0,
      hoursPerWeek: module.requiredTAHours || 0,
      applicationDeadline: module.applicationDueDate,
      docSubmittingDeadline: module.documentDueDate,
      type: "undergraduate"
    };

    const postgradEmailParams = {
      moduleName: module.moduleName,
      moduleCode: module.moduleCode,
      semester: module.semester,
      positionsCount: module.postgraduateCounts ? module.postgraduateCounts.required : 0,
      hoursPerWeek: module.requiredTAHours || 0,
      applicationDeadline: module.applicationDueDate,
      docSubmittingDeadline: module.documentDueDate,
      type: "postgraduate"
    };

    // Send emails to both groups
    await EmailService.enqueueOneModuleAdvertisingEmail(undergradEmails, undergradEmailParamas);
    await EmailService.enqueueOneModuleAdvertisingEmail(postgradEmails, postgradEmailParams);

    // Update module status to 'advertised'
    module.moduleStatus = "advertised";
    await module.save().then(async () => {
      console.log(
        `✅ Updated module statuses to 'advertised' for postgraduate modules`
      );
      if (recruitmentSeries.status !== "active") {
        // If the recruitment series is not active, we can activate it
        recruitmentSeries.status = "active";
        await recruitmentSeries.save();
      }
    });
    return res.status(200).json({ message: "Module advertised successfully" });
  } catch (error) {
    console.error("Error advertising module:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const notifyModule = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { moduleId } = req.params;

    if (!moduleId) {
      return res.status(400).json({ error: "Module ID is required" });
    }

    // Find the module by ID
    const module = await ModuleDetails.findById(moduleId);
    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }

    if (!module.coordinators || module.coordinators.length === 0) {
      console.warn(
        `Module ${module.moduleCode} has no coordinators assigned - skipping`
      );
    }

    console.log(
      `👥 Fetching ${module.coordinators.length} coordinators for ${module.moduleCode}`
    );
    // Fetch coordinators for this module
    const coordinators = await User.find({
      _id: { $in: module.coordinators },
      email: { $exists: true, $ne: "" },
    }).lean();

    console.log(
      `✅ Found ${coordinators.length} coordinators with valid emails for ${module.moduleCode}`
    );

    if (coordinators.length === 0) {
      console.warn(
        `Module ${module.moduleCode} has no coordinators with valid email addresses - skipping`
      );
      return res.status(200).json({ message: "No coordinators to notify" });
    }

    const emailAddresses = coordinators.map((coordinator: any) => coordinator.email);
    for(const coord of coordinators) {
      const emailParamas = {
        coordName: coord.displayName || "Module Coordinator",
        moduleName: module.moduleName,
        moduleCode: module.moduleCode,
        semester: module.semester,
      };

      await EmailService.enqueueModuleNotifyingEmail([coord.email], emailParamas);
    }
    
    console.log(
      `✅ Notifications sent to ${emailAddresses.length} coordinators for ${module.moduleCode}`
    );
    await ModuleDetails.findByIdAndUpdate(moduleId, {
      $set: { moduleStatus: "pending changes" },
    });

    return res.status(200).json({ message: "Module notifications sent successfully" });
  } catch (error) {
    console.error("Error notifying module:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const updateModule = async (req: Request, res: Response): Promise<Response> => {
  try {
    const moduleId = req.params.moduleId;
    const {
      moduleCode,
      moduleName,
      semester,
      coordinators,
      applicationDueDate,
      documentDueDate,
      requiredTAHours,
      requiredUndergraduateTACount,
      requiredPostgraduateTACount,
      requirements,
      confirmRemoval = false,
    } = req.body;

    // Validate dates
    const now = new Date();
    const appDate = new Date(applicationDueDate);
    const docDate = new Date(documentDueDate);

    if (appDate <= now) {
      return res.status(400).json({
        error: "Application due date must be after the current date",
      });
    }

    if (docDate <= appDate) {
      return res.status(400).json({
        error: "Document due date must be after the application due date",
      });
    }

    // Find the existing module
    const existingModule = await ModuleDetails.findById(moduleId);
    if (!existingModule) {
      return res.status(404).json({ error: "Module not found" });
    }

    const newUndergradRequired = requiredUndergraduateTACount || 0;
    const newPostgradRequired = requiredPostgraduateTACount || 0;

    let undergradApplicationsToRemove = 0;
    let postgradApplicationsToRemove = 0;

    if (existingModule.openForPostgraduates) {
      const currentPostgradCounts = existingModule.postgraduateCounts;
      if (currentPostgradCounts && currentPostgradCounts.accepted > newPostgradRequired) {
        return res.status(400).json({
          error:
            "New postgraduate TA count cannot be less than the number of already accepted postgraduate TAs",
        });
      }
    }

    if (existingModule.openForUndergraduates) {
      const currentUndergradCounts = existingModule.undergraduateCounts;
      if (currentUndergradCounts) {
        const potentialUndergradCount =
          currentUndergradCounts.accepted +
          currentUndergradCounts.applied -
          currentUndergradCounts.reviewed;
        if (currentUndergradCounts.accepted > newUndergradRequired) {
          return res.status(400).json({
            error:
              "New undergraduate TA count cannot be less than the number of already accepted undergraduate TAs",
          });
        } else if (currentUndergradCounts.accepted === newUndergradRequired) {
          if (existingModule.moduleStatus === "advertised") {
            existingModule.moduleStatus = "full" as any;
          }
        } else if (potentialUndergradCount > newUndergradRequired) {
          undergradApplicationsToRemove =
            potentialUndergradCount - newUndergradRequired;
        }
      }
    }

    const recSeriesId = existingModule.recruitmentSeriesId;

    let applicationsToRemove: any[] = [];
    let affectedUsers: any[] = [];

    // Get all current applications for this module
    const currentApplications = await TAApplication.find({
      moduleId: moduleId,
      status: "pending",
    })
      .populate("userId", "name email role")
      .sort({ createdAt: -1 });

    // Separate applications by user type
    const undergradApplications = [];
    const postgradApplications = [];

    for (const application of currentApplications) {
      if ((application.userId as any).role === "undergraduate") {
        undergradApplications.push(application);
      } else if ((application.userId as any).role === "postgraduate") {
        postgradApplications.push(application);
      }
    }

    if (undergradApplicationsToRemove > 0) {
      const undergradToRemove = undergradApplications.slice(
        0,
        undergradApplicationsToRemove
      );
      applicationsToRemove.push(...undergradToRemove);
    }

    if (postgradApplicationsToRemove > 0) {
      const postgradToRemove = postgradApplications.slice(
        0,
        postgradApplicationsToRemove
      );
      applicationsToRemove.push(...postgradToRemove);
    }

    // If applications need to be removed and user hasn't confirmed, send warning
    if (applicationsToRemove.length > 0 && !confirmRemoval) {
      return res.status(409).json({
        requiresConfirmation: true,
        message: `Reducing TA counts will remove ${applicationsToRemove.length} recent applications`,
        applicationsToRemove: applicationsToRemove.map((app: any) => {
          return {
            applicationId: app._id,
            userName: app.userId.name || "Unknown",
            userEmail: app.userId.email || "Unknown",
            studentType: app.userId.role,
            appliedAt: app.createdAt,
            hoursAllocated: requiredTAHours || 0, // Use the module's TA hours
          };
        }),
      });
    }

    // If confirmed or no applications to remove, proceed with update
    if (applicationsToRemove.length > 0 && confirmRemoval) {
      // Return TA hours to affected users and remove the module from their appliedModules
      for (const application of applicationsToRemove) {
        const hoursToReturn = requiredTAHours || 0;
        const appliedModule = await AppliedModule.findOne({
          userId: (application.userId as any)._id,
          recSeriesId: recSeriesId,
        });
        if (appliedModule) {
          appliedModule.availableHoursPerWeek = (appliedModule.availableHoursPerWeek || 0) + hoursToReturn;
          const currentAppliedModules = appliedModule.appliedModules || [];
          appliedModule.appliedModules = currentAppliedModules.filter(
            (modId: any) => modId.toString() !== moduleId
          );
          await TAApplication.deleteOne({ _id: application._id })
            .then(async () => await appliedModule.save())
            .catch((err: Error) => {
              console.error("Error removing application:", err);
            });
          affectedUsers.push({
            name: (application.userId as any).name,
            email: (application.userId as any).email,
            hoursReturned: hoursToReturn,
          });
        }
      }
    }
    // Update the module
    const updateData: any = {
      moduleCode,
      moduleName,
      semester,
      coordinators,
      applicationDueDate,
      documentDueDate,
      requiredTAHours,
      requirements,
      openForUndergraduates: newUndergradRequired > 0,
      openForPostgraduates: newPostgradRequired > 0,
    };

    // Update counts (recalculate after potential application removal)
    const remainingApplications = await TAApplication.find({
      moduleId: moduleId,
    }).populate("userId", "role");
    const newAppliedUndergradCount = remainingApplications.filter(
      (app: any) => (app.userId as any).role === "undergraduate"
    ).length;
    const newAppliedPostgradCount = remainingApplications.filter(
      (app: any) => (app.userId as any).role === "postgraduate"
    ).length;

    if (newUndergradRequired > 0) {
      const reviewedCount = existingModule.undergraduateCounts?.reviewed || 0;
      const acceptedCount = existingModule.undergraduateCounts?.accepted || 0;
      const remainingCount =
        newUndergradRequired -
        (acceptedCount + newAppliedUndergradCount - reviewedCount);
      updateData.undergraduateCounts = {
        required: newUndergradRequired,
        applied: newAppliedUndergradCount,
        remaining: Math.max(0, remainingCount),
        reviewed: existingModule.undergraduateCounts?.reviewed || 0,
        accepted: existingModule.undergraduateCounts?.accepted || 0,
        docSubmitted: existingModule.undergraduateCounts?.docSubmitted || 0,
        appointed: existingModule.undergraduateCounts?.appointed || 0,
      };
    } else {
      updateData.undergraduateCounts = null;
    }

    if (newPostgradRequired > 0) {
      const reviewedCount = existingModule.postgraduateCounts?.reviewed || 0;
      const acceptedCount = existingModule.postgraduateCounts?.accepted || 0;
      const remainingPostgradCount =
        newPostgradRequired -
        (acceptedCount + newAppliedPostgradCount - reviewedCount);
      updateData.postgraduateCounts = {
        required: newPostgradRequired,
        applied: newAppliedPostgradCount,
        remaining: Math.max(0, remainingPostgradCount),
        reviewed: existingModule.postgraduateCounts?.reviewed || 0,
        accepted: existingModule.postgraduateCounts?.accepted || 0,
        docSubmitted: existingModule.postgraduateCounts?.docSubmitted || 0,
        appointed: existingModule.postgraduateCounts?.appointed || 0,
      };
    } else {
      updateData.postgraduateCounts = null;
    }

    const updatedModule = await ModuleDetails.findByIdAndUpdate(
      moduleId,
      updateData,
      { new: true, runValidators: true }
    );

    // Send notification emails to affected users if applications were removed
    // if (affectedUsers.length > 0) {
    //   const emailPromises = affectedUsers.map((user: any) => {
    //     const subject = `TA Application Removed - ${moduleCode}`;
    //     const htmlContent = `
    //                 <p>Dear ${user.name},</p>
    //                 <p>We regret to inform you that your TA application for <strong>${moduleCode} - ${moduleName}</strong> has been removed due to a reduction in the number of required TAs for this module.</p>
    //                 ${
    //                   user.hoursReturned > 0
    //                     ? `<p>Your allocated hours (${user.hoursReturned} hours) have been returned to your available hours.</p>`
    //                     : ""
    //                 }
    //                 <p>You are welcome to apply for other available TA positions.</p>
    //                 <p>We apologize for any inconvenience caused.</p>
    //                 <p>Best regards,<br>The TA Recruitment Team</p>
    //             `;
    //     return sendEmail(user.email, subject, htmlContent);
    //   });

    //   await Promise.all(emailPromises);
    // }

    return res.status(200).json({
      message: "Module updated successfully",
      module: updatedModule,
      removedApplications: applicationsToRemove.length,
      affectedUsers: affectedUsers.length,
    });
  } catch (error) {
    console.error("Error updating module:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const addApplicants = async (req: Request, res: Response): Promise<Response> => {
  //TODO: Lock the module during this operation to prevent race conditions
  //TODO: Send the email for corresponding tas

  const { moduleId } = req.params;
  const { role, userIds } = req.body;

  if (role !== "undergraduate" && role !== "postgraduate") {
    return res.status(400).json({ error: "Invalid role specified" });
  }

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ error: "No user IDs provided" });
  }

  const module = await ModuleDetails.findById(moduleId);

  if (!module) {
    return res.status(404).json({ error: "Module not found" });
  }

  let availableCount = 0;
  if (role === "undergraduate") {
    if (!module.openForUndergraduates) {
      return res
        .status(400)
        .json({ error: "Module is not open for undergraduate applicants" });
    } else {
      availableCount =
        (module.undergraduateCounts?.required || 0) -
          (module.undergraduateCounts?.accepted || 0);
    }
  } else if (role === "postgraduate") {
    if (!module.openForPostgraduates) {
      return res
        .status(400)
        .json({ error: "Module is not open for postgraduate applicants" });
    } else {
      availableCount =
        (module.postgraduateCounts?.required || 0) -
          (module.postgraduateCounts?.accepted || 0);
    }
  }

  if (availableCount === 0) {
    return res
      .status(400)
      .json({
        error:
          "No available positions for this role. All positions are filled with approved applicants.",
      });
  }

  if (userIds.length > availableCount) {
    return res
      .status(400)
      .json({
        error: `Number of applicants exceeds available positions. Only ${availableCount} positions are available.`,
      });
  }

  const recSeriesId = module.recruitmentSeriesId;

  if (!recSeriesId) {
    return res.status(400).json({
      error: "Module is not associated with any recruitment series",
    });
  }

  const recruitmentSeries = await RecruitmentRound.findById(recSeriesId);

  if (!recruitmentSeries) {
    return res.status(404).json({ error: "Recruitment series not found" });
  }

  const availableHours =
    role === "undergraduate"
      ? recruitmentSeries.undergradHourLimit
      : recruitmentSeries.postgradHourLimit;
  const neededHours = module.requiredTAHours || 0;
  const results = new Map();
  // Batch-load users, appliedModules and existing TA applications to reduce round-trips
  const usersList = await User.find({ _id: { $in: userIds } }).lean();
  const userMap = new Map(usersList.map((u: any) => [String(u._id), u]));

  const appliedModulesList = await AppliedModule.find({
    userId: { $in: userIds },
    recSeriesId,
  }).lean();
  const appliedMap = new Map(appliedModulesList.map((a: any) => [String(a.userId), a]));

  const existingAppsList = await TAApplication.find({
    userId: { $in: userIds },
    moduleId,
  }).lean();
  const existingAppMap = new Map(existingAppsList.map((a: any) => [String(a.userId), a]));

  for (const userId of userIds) {
    const user: any = userMap.get(String(userId));
    if (!user) {
      results.set(userId, { name: "Unknown", status: "failed", reason: "User not found" });
      continue;
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const appliedModule: any = appliedMap.get(String(userId));
      const existingApplication: any = existingAppMap.get(String(userId));

      // Check AppliedModule first
      if (appliedModule) {
        // If there's already an application for this user & module
        if (existingApplication) {
          if (existingApplication.status === "accepted") {
            results.set(userId, { name: user.name, status: "success", reason: "User already has an accepted application for this position" });
          } else {
            // Update application to accepted
            await TAApplication.updateOne({ _id: existingApplication._id }, { $set: { status: "accepted" } }, { session });
            results.set(userId, { name: user.name, status: "success", reason: "Existing application updated to accepted" });
            
            let updateModuleObj: any = {};

            if (role === "undergraduate") {
              const newAcceptedCount = (module.undergraduateCounts?.accepted || 0) + 1;
              if (newAcceptedCount === module.undergraduateCounts?.required) {
                //notify coordinators that undergrad positions are full
                if(module.openForPostgraduates && module.postgraduateCounts && module.postgraduateCounts.accepted === module.postgraduateCounts.required){
                  updateModuleObj.$set = { moduleStatus: "getting documents" };
                }else if(!module.openForPostgraduates){
                  updateModuleObj.$set = { moduleStatus: "getting documents" };
                }
              }
              updateModuleObj.$inc = { "undergraduateCounts.reviewed": 1, "undergraduateCounts.accepted": 1 };
              await ModuleDetails.updateOne({ _id: moduleId }, updateModuleObj, { session });
            } else {
              const newAcceptedCount = (module.postgraduateCounts?.accepted || 0) + 1;
              if (newAcceptedCount === module.postgraduateCounts?.required) {
                //notify coordinators that postgrad positions are full
                if(module.openForUndergraduates && module.undergraduateCounts && module.undergraduateCounts.accepted === module.undergraduateCounts.required){
                  updateModuleObj.$set = { moduleStatus: "getting documents" };
                }else if(!module.openForUndergraduates){
                  updateModuleObj.$set = { moduleStatus: "getting documents" };
                }
              }
              updateModuleObj.$inc = { "postgraduateCounts.reviewed": 1, "postgraduateCounts.accepted": 1 };
              await ModuleDetails.updateOne({ _id: moduleId }, updateModuleObj, { session });
            }
          }
          await session.commitTransaction();
          session.endSession();
          continue;
        }

        // AppliedModule exists but no application: create one and attach
        if ((appliedModule.availableHoursPerWeek || 0) >= neededHours) {
          let updateModuleObj: any = {};
          const taApplication = new TAApplication({ userId, moduleId, status: "accepted" });
          await taApplication.save({ session });

          const updatedApplied = await AppliedModule.findOneAndUpdate(
            { _id: appliedModule._id },
            { $inc: { availableHoursPerWeek: -neededHours }, $push: { appliedModules: taApplication._id } },
            { session, new: true }
          );

          
          
          if (role === "undergraduate") {
          const newRemainingCount = (module.undergraduateCounts?.remaining || 0) - 1;
          const newAcceptedCount = (module.undergraduateCounts?.accepted || 0) + 1;
          if (newAcceptedCount === module.undergraduateCounts?.required) {
            if(module.openForPostgraduates && module.postgraduateCounts && module.postgraduateCounts.accepted === module.postgraduateCounts.required){
              updateModuleObj.$set = { moduleStatus: "getting documents" };
            }else if(!module.openForPostgraduates){
              updateModuleObj.$set = { moduleStatus: "getting documents" };
            }
          }else if(newRemainingCount === 0){
            //notify coordinators that undergrad positions are full
            if(module.openForPostgraduates && module.postgraduateCounts && module.postgraduateCounts.remaining === 0){
              updateModuleObj.$set = { moduleStatus: "full" };
            }else if(!module.openForPostgraduates){
              updateModuleObj.$set = { moduleStatus: "full" };
            }
          }
          updateModuleObj.$inc = { "undergraduateCounts.applied": 1, "undergraduateCounts.reviewed": 1, "undergraduateCounts.accepted": 1, "undergraduateCounts.remaining": -1 };
          await ModuleDetails.updateOne({ _id: moduleId }, updateModuleObj, { session });
        } else {
          const newRemainingCount = (module.postgraduateCounts?.remaining || 0) - 1;
          const newAcceptedCount = (module.postgraduateCounts?.accepted || 0) + 1;
          if (newAcceptedCount === module.postgraduateCounts?.required) {
            if(module.openForUndergraduates && module.undergraduateCounts && module.undergraduateCounts.accepted === module.undergraduateCounts.required){
              updateModuleObj.$set = { moduleStatus: "getting documents" };
            }
          }else if(newRemainingCount === 0){
            //notify coordinators that postgrad positions are full
            if(module.openForUndergraduates && module.undergraduateCounts && module.undergraduateCounts.remaining === 0){
              updateModuleObj.$set = { moduleStatus: "full" };
            }
          }
          updateModuleObj.$inc = { "postgraduateCounts.applied": 1, "postgraduateCounts.reviewed": 1, "postgraduateCounts.accepted": 1, "postgraduateCounts.remaining": -1 };
          await ModuleDetails.updateOne({ _id: moduleId }, updateModuleObj, { session });
        }

        results.set(userId, { name: user.name, status: "success" });
        await session.commitTransaction();
        session.endSession();
        continue;
      }else{
        await session.abortTransaction();
        session.endSession();
        results.set(userId, { name: user.name, status: "failed", reason: "Insufficient available hours" });
        continue;
      }
    }

      // No AppliedModule exists: create AppliedModule first, then create application and attach
      const initialAvailable = role === "undergraduate" ? recruitmentSeries.undergradHourLimit : recruitmentSeries.postgradHourLimit;
      let updateModuleObj: any = {};
      const taApplication = new TAApplication({ userId, moduleId, status: "accepted" });
      await taApplication.save({ session });

      const newAppliedModule = new AppliedModule({ userId, recSeriesId, availableHoursPerWeek: initialAvailable - neededHours, appliedModules: [taApplication._id] });
      await newAppliedModule.save({ session });

      if (role === "undergraduate") {
        const newRemainingCount = (module.undergraduateCounts?.remaining || 0) - 1;
          const newAcceptedCount = (module.undergraduateCounts?.accepted || 0) + 1;
          if (newAcceptedCount === module.undergraduateCounts?.required) {
            if(module.openForPostgraduates && module.postgraduateCounts && module.postgraduateCounts.accepted === module.postgraduateCounts.required){
              updateModuleObj.$set = { moduleStatus: "getting documents" };
            }else if(!module.openForPostgraduates){
              updateModuleObj.$set = { moduleStatus: "getting documents" };
            }
          }else if(newRemainingCount === 0){
            //notify coordinators that undergrad positions are full
            if(module.openForPostgraduates && module.postgraduateCounts && module.postgraduateCounts.remaining === 0){
              updateModuleObj.$set = { moduleStatus: "full" };
            }else if(!module.openForPostgraduates){
              updateModuleObj.$set = { moduleStatus: "full" };
            }
          }
          updateModuleObj.$inc = { "undergraduateCounts.applied": 1, "undergraduateCounts.reviewed": 1, "undergraduateCounts.accepted": 1, "undergraduateCounts.remaining": -1 };
          await ModuleDetails.updateOne({ _id: moduleId }, updateModuleObj, { session });
      } else {
        const newRemainingCount = (module.postgraduateCounts?.remaining || 0) - 1;
          const newAcceptedCount = (module.postgraduateCounts?.accepted || 0) + 1;
          if (newAcceptedCount === module.postgraduateCounts?.required) {
            if(module.openForUndergraduates && module.undergraduateCounts && module.undergraduateCounts.accepted === module.undergraduateCounts.required){
              updateModuleObj.$set = { moduleStatus: "getting documents" };
            }
          }else if(newRemainingCount === 0){
            //notify coordinators that postgrad positions are full
            if(module.openForUndergraduates && module.undergraduateCounts && module.undergraduateCounts.remaining === 0){
              updateModuleObj.$set = { moduleStatus: "full" };
            }
          }
          updateModuleObj.$inc = { "postgraduateCounts.applied": 1, "postgraduateCounts.reviewed": 1, "postgraduateCounts.accepted": 1, "postgraduateCounts.remaining": -1 };
          await ModuleDetails.updateOne({ _id: moduleId }, updateModuleObj, { session });
      }

      results.set(userId, { name: user.name, status: "success" });
      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      results.set(userId, { name: user.name, status: "failed", reason: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  return res
    .status(200)
    .json({
      results: Array.from(results.values()),
      message: `Processed ${userIds.length} applicants.`,
    });
};

const getModuleApplications = async (req: Request, res: Response): Promise<Response> => {
  try {
    const moduleId = req.params.moduleId;

    const applications = await TAApplication.find({ moduleId })
      .populate("userId", "indexNumber profilePicture name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json(applications);
  } catch (error) {
    console.error("Error fetching module applications:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getModuleDetailsById,
  changeModuleStatus,
  advertiseModule,
  notifyModule,
  updateModule,
  addApplicants,
  getModuleApplications,
};
