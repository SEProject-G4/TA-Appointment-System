import type { Request, Response } from "express";
import mongoose = require("mongoose");
const ModuleDetails = require("../models/ModuleDetails");
const TaApplication = require("../models/TaApplication");
const User = require("../models/User");
const RecruitmentSeries = require("../models/RecruitmentRound");
const AppliedModules = require("../models/AppliedModules");
const documentModel = require("../models/documentModel");

const getAllRequests = async (req: Request, res: Response): Promise<Response> => {
  const userId = req.query.userId as string;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userGroupID = user.userGroup;
    const userRole = user.role;

    let activeRecSeries: any[] = [];
    if (userRole === "undergraduate") {
      activeRecSeries = await RecruitmentSeries.find(
        { status: "active", undergradMailingList: { $in: [userGroupID] } },
        { _id: 1, undergradHourLimit: 1 }
      );
    } else if (userRole === "postgraduate") {
      activeRecSeries = await RecruitmentSeries.find(
        { status: "active", postgradMailingList: { $in: [userGroupID] } },
        { _id: 1, postgradHourLimit: 1 }
      );
    }

    if (activeRecSeries.length === 0) {
      return res.status(200).json({
        updatedModules: [],
        availableHoursPerWeek: 0,
      });
    }

    const recruitmentRound = activeRecSeries[0];
    const hourLimit =
      userRole === "undergraduate"
        ? recruitmentRound.undergradHourLimit
        : recruitmentRound.postgradHourLimit;

    const recSeriesIds = activeRecSeries.map((r) => r._id);

    const appliedModules = await AppliedModules.find(
      { userId, recSeriesId: { $in: recSeriesIds } },
      { appliedModules: 1, availableHoursPerWeek: 1 }
    ).populate("appliedModules");

    const appliedModulesIds = appliedModules.flatMap((am: any) =>
      am.appliedModules.map((app: any) => app.moduleId)
    );

    const hoursFilter =
      appliedModules?.[0]?.availableHoursPerWeek !== undefined
        ? { requiredTAHours: { $lte: appliedModules[0].availableHoursPerWeek } }
        : userRole === "undergraduate"
        ? { requiredTAHours: { $lte: 6 } }
        : { requiredTAHours: { $lte: 18 } };

    const modules = await ModuleDetails.find({
      recruitmentSeriesId: { $in: recSeriesIds },
      moduleStatus: "advertised",
      _id: { $nin: appliedModulesIds },
      ...hoursFilter,
      ...(userRole === "undergraduate"
        ? { openForUndergraduates: true, "undergraduateCounts.remaining": { $gt: 0 } }
        : { openForPostgraduates: true, "postgraduateCounts.remaining": { $gt: 0 } }),
    });

    interface ModuleCoordinator {
      coordinators: mongoose.Types.ObjectId[];
    }

    const allCoordinators: mongoose.Types.ObjectId[] = modules.flatMap((module: ModuleCoordinator) => module.coordinators);
    const uniqueCoordinators = [...new Set(allCoordinators.map((c) => c.toString()))];
    const coordinatorDetails = await User.find(
      { _id: { $in: uniqueCoordinators } },
      { _id: 1, name: 1 }
    );
    const coordinatorMap: Record<string, string> = coordinatorDetails.reduce((map: any, user: any) => {
      map[user._id] = user.name;
      return map;
    }, {});

    const updatedModules = modules.map((module: any) => {
      const obj = module.toObject();
      return {
        ...obj,
        coordinators: obj.coordinators.map((id: any) => coordinatorMap[id.toString()] || "-"),
      };
    });

    return res.status(200).json({
      updatedModules,
      availableHoursPerWeek:
        appliedModules[0]?.availableHoursPerWeek !== undefined
          ? appliedModules[0].availableHoursPerWeek
          : hourLimit,
    });
  } catch (error) {
    console.error("Error fetching available TA positions:", error);
    return res.status(500).json({ message: "Error fetching available TA positions", error });
  }
};

const applyForTA = async (req: Request, res: Response): Promise<Response> => {
  const { userId, userRole, moduleId, recSeriesId, taHours } = req.body;

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const recruitmentRound = await RecruitmentSeries.findById(recSeriesId).session(session);
    if (!recruitmentRound) {
      throw new Error("Recruitment series not found");
    }
    const hourLimit =
      userRole === "undergraduate"
        ? recruitmentRound.undergradHourLimit
        : recruitmentRound.postgradHourLimit;

    const existingApplication = await TaApplication.findOne({
      userId,
      moduleId,
    }).session(session);
    if (existingApplication) {
      throw new Error("You have already applied for this module");
    }

    let appliedModules = await AppliedModules.findOne({
      userId,
      recSeriesId,
    }).session(session);
    if (appliedModules && appliedModules.availableHoursPerWeek < taHours) {
      throw new Error("Insufficient available hours to apply for this module");
    }

    let updateModule;
    if (userRole === "undergraduate") {
      updateModule = await ModuleDetails.findOneAndUpdate(
        {
          _id: moduleId,
          $expr: {
            $gt: ["$undergraduateCounts.remaining", 0],
          },
        },
        {
          $inc: {
            "undergraduateCounts.applied": 1,
            "undergraduateCounts.remaining": -1,
          },
        },
        { new: true, session, runValidators: true }
      );
    } else if (userRole === "postgraduate") {
      updateModule = await ModuleDetails.findOneAndUpdate(
        {
          _id: moduleId,
          $expr: {
            $gt: ["$postgraduateCounts.remaining", 0],
          },
        },
        {
          $inc: {
            "postgraduateCounts.applied": 1,
            "postgraduateCounts.remaining": -1,
          },
        },
        { new: true, session, runValidators: true }
      );
    }
    if (!updateModule) {
      throw new Error("TA positions for this module are already filled");
    }

    const taApplication = new TaApplication({
      userId,
      moduleId,
    });
    await taApplication.save({ session });
    console.log("application created successfully", taApplication);

    if (appliedModules) {
      await AppliedModules.findByIdAndUpdate(
        appliedModules._id,
        {
          $inc: { availableHoursPerWeek: -taHours },
          $push: { appliedModules: taApplication._id },
        },
        { session }
      );
    } else {
      appliedModules = new AppliedModules({
        userId,
        recSeriesId,
        appliedModules: [taApplication._id],
        availableHoursPerWeek: hourLimit - taHours,
      });
      await appliedModules.save({ session });
    }

    await session.commitTransaction();
    console.log("Transaction committed.");
    return res.status(201).json({
      message: "Application submitted successfully",
      application: taApplication,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Transaction aborted due to error:", error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Error submitting application",
      error,
    });
  } finally {
    session.endSession();
    console.log("Session ended");
  }
};

const getAppliedModules = async (req: Request, res: Response): Promise<Response> => {
  const userId = req.query.userId as string;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userGroupID = user.userGroup;
    const userRole = user.role;

    let activeRecSeries: any[] = [];
    if (userRole === "undergraduate") {
      activeRecSeries = await RecruitmentSeries.find(
        { status: "active", undergradMailingList: { $in: [userGroupID] } },
        { _id: 1 }
      );
    } else if (userRole === "postgraduate") {
      activeRecSeries = await RecruitmentSeries.find(
        { status: "active", postgradMailingList: { $in: [userGroupID] } },
        { _id: 1 }
      );
    }

    const appliedModulesDocs = await AppliedModules.find({
      userId,
      recSeriesId: { $in: activeRecSeries.map((r) => r._id) },
    }).populate({
      path: "appliedModules",
      populate: { path: "moduleId", model: "ModuleDetails" },
    });

    const allApplications = appliedModulesDocs.flatMap((am: any) => am.appliedModules);

    const coordinatorIds = allApplications.flatMap((app: any) => app.moduleId.coordinators);
    const coordinators = await User.find({ _id: { $in: coordinatorIds } });
    const coordinatorMap: Record<string, string> = coordinators.reduce((map: any, user: any) => {
      map[user._id] = user.name;
      return map;
    }, {});

    const updatedApplications = allApplications.map((app: any) => ({
      ...app.toObject(),
      moduleId: {
        ...app.moduleId.toObject(),
        coordinators: app.moduleId.coordinators.map(
          (id: any) => coordinatorMap[id.toString()] || "-"
        ),
      },
    }));

    return res.status(200).json(updatedApplications);
  } catch (error) {
    console.error("Error fetching applied modules:", error);
    return res.status(500).json({ message: "Error fetching applied modules", error });
  }
};

const getAcceptedModules = async (req: Request, res: Response): Promise<Response> => {
  const userId = req.query.userId as string;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const userGroupID = user.userGroup;
    const userRole = user.role;

    let activeRecSeries: any[] = [];
    if (userRole === "undergraduate") {
      activeRecSeries = await RecruitmentSeries.find(
        { status: "active", undergradMailingList: { $in: [userGroupID] } },
        { _id: 1 }
      );
    } else if (userRole === "postgraduate") {
      activeRecSeries = await RecruitmentSeries.find(
        { status: "active", postgradMailingList: { $in: [userGroupID] } },
        { _id: 1 }
      );
    }

    const acceptedApplications = await AppliedModules.find({
      userId,
      recSeriesId: { $in: activeRecSeries.map((r) => r._id) },
    }).populate({
      path: "appliedModules",
      match: { status: "accepted" },
      populate: {
        path: "moduleId",
        model: "ModuleDetails",
        populate: {
          path: "coordinators",
          model: "User",
          select: "name",
        },
      },
    });

    const currentRecSeriesId = activeRecSeries[0]?._id;

    const appliedModulesDoc = await AppliedModules.findOne({
      userId,
      recSeriesId: currentRecSeriesId,
    });
    const docSubmissionStatus = appliedModulesDoc?.isDocSubmitted || false;
    
    // Filter acceptedApplications to only include those that actually have accepted applications
    // (The match filter in populate filters the array, but the parent document is still returned)
    /*const appliedModulesWithAccepted = acceptedApplications.filter((app: any) => 
      app.appliedModules && app.appliedModules.length > 0
    );
    
    // Check ALL AppliedModules for this user (across all recruitment rounds)
    // Check if ANY of them have isDocSubmitted: false
    // If all have isDocSubmitted: true, then docSubmissionStatus should be true (all submitted - disable button)
    // If any have isDocSubmitted: false, then docSubmissionStatus should be false (needs submission - enable button)
    
    const allAppliedModulesForUser = await AppliedModules.find({
      userId,
    }).lean();
    
    let docSubmissionStatus = true; // Default to true (all submitted - button disabled)
    
    if (allAppliedModulesForUser && allAppliedModulesForUser.length > 0) {
      // Check if ANY AppliedModules for this user has isDocSubmitted: false
      const hasUnsubmittedDocs = allAppliedModulesForUser.some((app: any) => {
        return !app.isDocSubmitted;
      });
      docSubmissionStatus = !hasUnsubmittedDocs; // If any are unsubmitted, status is false (enable button)
    } else {
      // No AppliedModules records for this user, so no need to submit documents
      docSubmissionStatus = true; // Button disabled
    }

    // Fetch current round's submitted document if it exists
    let currentRoundDocument = null;
    if (currentRecSeriesId) {
      const currentAppliedModule = await AppliedModules.findOne({
        userId,
        recSeriesId: currentRecSeriesId,
        isDocSubmitted: true,
        Documents: { $exists: true, $ne: null },
      })
        .populate("recSeriesId", "name")
        .populate("Documents")
        .lean();

      if (currentAppliedModule && currentAppliedModule.Documents) {
        currentRoundDocument = {
          _id: currentAppliedModule.Documents._id,
          recSeriesName: currentAppliedModule.recSeriesId?.name || "Current Round",
          recSeriesId: currentAppliedModule.recSeriesId?._id?.toString(),
          bankAccountName: currentAppliedModule.Documents.bankAccountName,
          address: currentAppliedModule.Documents.address,
          nicNumber: currentAppliedModule.Documents.nicNumber,
          accountNumber: currentAppliedModule.Documents.accountNumber,
          studentType: currentAppliedModule.Documents.studentType,
          driveFiles: currentAppliedModule.Documents.driveFiles,
          createdAt: currentAppliedModule.Documents.createdAt,
          isCurrentRound: true,
        };
      }
    }

    // Fetch previously submitted documents from other recruitment rounds through AppliedModules
    const previousAppliedModules = await AppliedModules.find({
      userId,
      recSeriesId: { $ne: currentRecSeriesId },
      isDocSubmitted: true,
      Documents: { $exists: true, $ne: null },
    })
      .populate("recSeriesId", "name")
      .populate("Documents")
      .sort({ createdAt: -1 })
      .lean();

    const previousDocuments = previousAppliedModules
      .filter((am: any) => am.Documents) // Only include those with documents
      .map((am: any) => ({
        _id: am.Documents._id,
        recSeriesName: am.recSeriesId?.name || "Unknown Round",
        recSeriesId: am.recSeriesId?._id?.toString(),
        bankAccountName: am.Documents.bankAccountName,
        address: am.Documents.address,
        nicNumber: am.Documents.nicNumber,
        accountNumber: am.Documents.accountNumber,
        studentType: am.Documents.studentType,
        driveFiles: am.Documents.driveFiles,
        createdAt: am.Documents.createdAt,
        isCurrentRound: false,
      })); */
      let previousDocuments = null;
      previousDocuments = await documentModel.find(
        {userId}
      )
      

    return res.status(200).json({
      acceptedApplications, // Only return AppliedModules that have accepted applications
      docSubmissionStatus,
      currentRecSeriesId: currentRecSeriesId?.toString(), // Current round's document if submitted
      previousDocuments,
    });
  } catch (error) {
    console.error("Error fetching accepted modules:", error);
    return res.status(500).json({ message: "Error fetching accepted modules", error });
  }
};

module.exports = {
  getAllRequests,
  applyForTA,
  getAppliedModules,
  getAcceptedModules,
};
