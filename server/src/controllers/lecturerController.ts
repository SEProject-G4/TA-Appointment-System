import type { Request, Response } from "express";
import { decrypt } from "../utils/encryption";
const ModuleDetails = require("../models/ModuleDetails");
const TaApplication = require("../models/TaApplication");
const User = require("../models/User");
const documentModel = require("../models/documentModel");
const RecruitmentSeries = require("../models/RecruitmentRound");
const AppliedModules = require("../models/AppliedModules");
const { EmailService } = require("../services/emailService");

// GET /api/lecturer/modules
// Returns modules where the logged-in lecturer (by id) is listed in coordinators
const getMyModules = async (req: Request, res: Response): Promise<Response> => {
  try {
    const user = (req as any).user;
    if (!user || !user._id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const coordinatorId = user._id;

    // Get all modules where user is coordinator with displayable statuses
    const modules = await ModuleDetails.find({
      coordinators: coordinatorId,
      moduleStatus: {
        $in: [
          "pending changes",
          "changes submitted",
          "advertised",
          "full",
          "getting-documents",
          "closed",
        ],
      },
    })
      .select(
        "_id moduleCode moduleName semester year coordinators applicationDueDate documentDueDate requiredTAHours requiredUndergraduateTACount requiredPostgraduateTACount requirements moduleStatus undergraduateCounts postgraduateCounts"
      )
      .sort({ createdAt: -1 });

    // No recruitment series status filtering; consider all modules for the coordinator
    const activeModules = modules;

    // Group modules by status
    const groupedModules = {
      pendingChanges: activeModules.filter((m: any) => m.moduleStatus === "pending changes"),
      changesSubmitted: activeModules.filter((m: any) => m.moduleStatus === "changes submitted"),
      advertised: activeModules.filter((m: any) => m.moduleStatus === "advertised"),
      full: activeModules.filter((m: any) => m.moduleStatus === "full"),
      gettingDocuments: activeModules.filter((m: any) => m.moduleStatus === "getting documents"),
      closed: activeModules.filter((m: any) => m.moduleStatus === "closed"),
    };

    console.log(
      "lecturer getMyModules -> matched",
      groupedModules.pendingChanges.length,
      "pending changes,",
      groupedModules.changesSubmitted.length,
      "changes submitted,",
      groupedModules.advertised.length,
      "advertised,",
      groupedModules.full.length,
      "full,",
      groupedModules.gettingDocuments.length,
      "getting-documents, and",
      groupedModules.closed.length,
      "closed modules for",
      coordinatorId
    );

    return res.status(200).json(groupedModules);
  } catch (error) {
    console.error("Error fetching lecturer modules:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const editModuleRequirments = async (req: Request, res: Response): Promise<Response> => {
  try {
    const user = (req as any).user;
    if (!user || !user._id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params;
    const { requiredTAHours, requiredUndergraduateTACount, requiredPostgraduateTACount, requirements } =
      req.body;

    // Validate presence of at least one field to update
    const hasAnyField = [
      requiredTAHours,
      requiredUndergraduateTACount,
      requiredPostgraduateTACount,
      requirements,
    ].some((v) => v !== undefined);
    if (!hasAnyField) {
      return res.status(400).json({ error: "At least one field must be provided for update" });
    }

    // Validate counts if provided
    const isProvidedAndInvalid = (val: any) =>
      val !== undefined && (!Number.isInteger(Number(val)) || Number(val) < 0);
    if (
      isProvidedAndInvalid(requiredUndergraduateTACount) ||
      isProvidedAndInvalid(requiredPostgraduateTACount)
    ) {
      return res.status(400).json({ error: "TA counts must be non-negative integers" });
    }

    // Verify the lecturer is a coordinator for this module
    const moduleDoc = await ModuleDetails.findById(id);
    if (!moduleDoc) {
      return res.status(404).json({ error: "Module not found" });
    }

    if (!moduleDoc.coordinators.includes(user._id)) {
      return res.status(403).json({ error: "Not authorized to edit this module" });
    }

    // Verify the module is in an editable status
    const editableStatuses = [
      "pending changes",
      "changes submitted",
      "advertised",
      "full",
      "getting-documents",
    ];
    if (!editableStatuses.includes(moduleDoc.moduleStatus)) {
      return res.status(400).json({ error: "Module is not in an editable status" });
    }

    // Prepare update object
    const updateFields: any = {
      requiredTAHours,
      requiredUndergraduateTACount,
      requiredPostgraduateTACount,
      requirements,
      updatedBy: user._id,
    };

    // Handle undergraduate and postgraduate TA count changes
    const currentUndergradRequired = moduleDoc.undergraduateCounts?.required || 0;
    const currentPostgradRequired = moduleDoc.postgraduateCounts?.required || 0;
    const undergradCount =
      requiredUndergraduateTACount !== undefined
        ? Number(requiredUndergraduateTACount)
        : currentUndergradRequired;
    const postgradCount =
      requiredPostgraduateTACount !== undefined
        ? Number(requiredPostgraduateTACount)
        : currentPostgradRequired;

    // Validation for advertised, full, and getting-documents modules
    const statusesRequiringValidation = ["advertised", "full", "getting-documents"];
    if (statusesRequiringValidation.includes(moduleDoc.moduleStatus)) {
      const currentAppliedUndergrad = moduleDoc.undergraduateCounts?.applied || 0;
      const currentAppliedPostgrad = moduleDoc.postgraduateCounts?.applied || 0;

      if (requiredUndergraduateTACount !== undefined) {
        if (undergradCount === 0 && currentAppliedUndergrad > 0) {
          return res.status(400).json({
            error: `Cannot set undergraduate TA count to 0 because ${currentAppliedUndergrad} student${
              currentAppliedUndergrad > 1 ? "s have" : " has"
            } already applied.`,
          });
        }

        if (undergradCount > 0 && currentAppliedUndergrad > undergradCount) {
          return res.status(400).json({
            error: `Cannot reduce undergraduate TA count to ${undergradCount} because ${currentAppliedUndergrad} student${
              currentAppliedUndergrad > 1 ? "s have" : " has"
            } already applied.`,
          });
        }
      }

      if (requiredPostgraduateTACount !== undefined) {
        if (postgradCount === 0 && currentAppliedPostgrad > 0) {
          return res.status(400).json({
            error: `Cannot set postgraduate TA count to 0 because ${currentAppliedPostgrad} student${
              currentAppliedPostgrad > 1 ? "s have" : " has"
            } already applied.`,
          });
        }

        if (postgradCount > 0 && currentAppliedPostgrad > postgradCount) {
          return res.status(400).json({
            error: `Cannot reduce postgraduate TA count to ${postgradCount} because ${currentAppliedPostgrad} student${
              currentAppliedPostgrad > 1 ? "s have" : " has"
            } already applied.`,
          });
        }
      }
    }

    if (undergradCount > 0) {
      updateFields.openForUndergraduates = true;

      const currentApplied = moduleDoc.undergraduateCounts?.applied || 0;
      const currentAccepted = moduleDoc.undergraduateCounts?.accepted || 0;
      const currentReviewed = moduleDoc.undergraduateCounts?.reviewed || 0;
      const currentDocSubmitted = moduleDoc.undergraduateCounts?.docSubmitted || 0;
      const currentAppointed = moduleDoc.undergraduateCounts?.appointed || 0;
      const currentRemaining = moduleDoc.undergraduateCounts?.remaining || 0;
      const oldRequired = moduleDoc.undergraduateCounts?.required || 0;

      const newRemaining = Math.max(0, currentRemaining + undergradCount - oldRequired);

      updateFields.undergraduateCounts = {
        required: undergradCount,
        remaining: newRemaining,
        applied: currentApplied,
        reviewed: currentReviewed,
        accepted: currentAccepted,
        docSubmitted: currentDocSubmitted,
        appointed: currentAppointed,
      };
    } else {
      updateFields.openForUndergraduates = false;
      updateFields.undergraduateCounts = {
        required: 0,
        remaining: 0,
        applied: 0,
        reviewed: 0,
        accepted: 0,
        docSubmitted: 0,
        appointed: 0,
      };
    }

    if (postgradCount > 0) {
      updateFields.openForPostgraduates = true;

      const currentApplied = moduleDoc.postgraduateCounts?.applied || 0;
      const currentAccepted = moduleDoc.postgraduateCounts?.accepted || 0;
      const currentReviewed = moduleDoc.postgraduateCounts?.reviewed || 0;
      const currentDocSubmitted = moduleDoc.postgraduateCounts?.docSubmitted || 0;
      const currentAppointed = moduleDoc.postgraduateCounts?.appointed || 0;
      const currentRemaining = moduleDoc.postgraduateCounts?.remaining || 0;
      const oldRequired = moduleDoc.postgraduateCounts?.required || 0;

      const newRemaining = Math.max(0, currentRemaining + postgradCount - oldRequired);

      updateFields.postgraduateCounts = {
        required: postgradCount,
        remaining: newRemaining,
        applied: currentApplied,
        reviewed: currentReviewed,
        accepted: currentAccepted,
        docSubmitted: currentDocSubmitted,
        appointed: currentAppointed,
      };
    } else {
      updateFields.openForPostgraduates = false;
      updateFields.postgraduateCounts = {
        required: 0,
        remaining: 0,
        applied: 0,
        reviewed: 0,
        accepted: 0,
        docSubmitted: 0,
        appointed: 0,
      };
    }

    // Determine the new status based on current status
    let newStatus = moduleDoc.moduleStatus;
    if (moduleDoc.moduleStatus === "pending changes") {
      newStatus = "changes submitted";
    } else if (
      moduleDoc.moduleStatus === "changes submitted" ||
      moduleDoc.moduleStatus === "advertised"
    ) {
      newStatus = moduleDoc.moduleStatus;
    }

    updateFields.moduleStatus = newStatus;

    // Update the module fields with appropriate status
    const updatedModule = await ModuleDetails.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    console.log("lecturer editModuleRequirments -> updated module", id, "for", user._id);
    console.log("Request body:", req.body);
    console.log("Update fields before save:", updateFields);
    console.log(
      "Undergraduate count set to:",
      undergradCount,
      "Postgraduate count set to:",
      postgradCount
    );
    console.log(
      "Open for undergraduates:",
      updateFields.openForUndergraduates ? "enabled" : "disabled"
    );
    console.log(
      "Open for postgraduates:",
      updateFields.openForPostgraduates ? "enabled" : "disabled"
    );
    console.log("Updated module after save:", {
      openForUndergraduates: updatedModule!.openForUndergraduates,
      openForPostgraduates: updatedModule!.openForPostgraduates,
      undergraduateCounts: updatedModule!.undergraduateCounts,
      postgraduateCounts: updatedModule!.postgraduateCounts,
    });
    return res.status(200).json(updatedModule);
  } catch (error) {
    console.error("Error updating module requirements:", error);
    return res.status(500).json({ error: "Failed to update module requirements" });
  }
};

const handleRequests = async (req: Request, res: Response): Promise<Response> => {
  try {
    const user = (req as any).user;
    if (!user || !user._id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const coordinatorId = user._id;

    const coordinatorModulesAll = await ModuleDetails.find({
      coordinators: coordinatorId,
    }).select(
      "_id moduleCode moduleName semester requiredUndergraduateTACount requiredPostgraduateTACount recruitmentSeriesId"
    );
    console.log("edit modules -> matched", coordinatorModulesAll.length, "modules for", coordinatorId);

    const coordinatorModules = coordinatorModulesAll;
    console.log("handleRequests -> modules (no RS filter)", coordinatorModules.length);

    if (coordinatorModules.length === 0) {
      return res.status(200).json({
        message: "No modules found for this coordinator",
        applications: [],
      });
    }

    const moduleIds = coordinatorModules.map((module: any) => module._id);
    console.log("handle req module id", moduleIds);

    const moduleIdStrings = moduleIds.map((id: any) => id.toString());

    const taApplications = await TaApplication.find({
      moduleId: { $in: moduleIds },
    }).lean();

    console.log("Module IDs being queried (ObjectIds):", moduleIds.map((id: any) => id.toString()));
    console.log("Module IDs being queried (Strings):", moduleIdStrings);
    console.log("Query results:", taApplications);

    if (taApplications.length === 0) {
      return res.status(200).json({ modules: [] });
    }

    const userIds = [...new Set(taApplications.map((app: any) => app.userId))];

    const users = await User.find({
      _id: { $in: userIds },
    }).select("googleId name indexNumber profilePicture email role");
    console.log("users", users);

    const userMap: any = {};
    users.forEach((user: any) => {
      userMap[user._id] = {
        name: user.name,
        indexNumber: user.indexNumber,
        role: user.role,
        profilePicture: user.profilePicture ?? "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
        email: user.email,
      };
    });

    const moduleMap = new Map();
    console.log("Starting grouping process...");
    console.log("TA Applications to group:", taApplications.length);
    console.log(
      "Available modules:",
      coordinatorModules.map((m: any) => ({ id: m._id.toString(), code: m.moduleCode }))
    );

    for (const app of taApplications as any[]) {
      const rawModuleId = app.moduleId;
      const moduleIdStr =
        typeof rawModuleId === "string"
          ? rawModuleId
          : rawModuleId && typeof rawModuleId.toString === "function"
          ? rawModuleId.toString()
          : null;
      if (!moduleIdStr) {
        console.log("Skipping app without module id:", app._id);
        continue;
      }
      console.log("Processing app with moduleId:", moduleIdStr);
      const module: any = coordinatorModules.find((m: any) => m._id.toString() === moduleIdStr);
      if (!module) {
        console.log("No matching module found for app.moduleId:", moduleIdStr);
        continue;
      }
      console.log("Found matching module:", module.moduleCode);

      if (!moduleMap.has(moduleIdStr)) {
        moduleMap.set(moduleIdStr, {
          moduleId: rawModuleId,
          moduleCode: module.moduleCode,
          moduleName: module.moduleName,
          semester: module.semester,
          requiredUndergraduateTACount: module.undergraduateCounts?.required || 0,
          requiredPostgraduateTACount: module.postgraduateCounts?.required || 0,
          requiredTAHours: module.requiredTAHours || 0,
          totalApplications: 0,
          pendingCount: 0,
          acceptedCount: 0,
          rejectedCount: 0,
          applications: [],
        });
      }

      const group = moduleMap.get(moduleIdStr);
      const userDetails = userMap[app.userId] || {
        name: "Unknown",
        indexNumber: "N/A",
        role: "undergraduate",
        profilePicture: "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
        email: "N/A",
      };
      group.totalApplications += 1;
      const statusLower = String(app.status || "").toLowerCase();
      if (statusLower === "pending") group.pendingCount += 1;
      else if (statusLower === "accepted") group.acceptedCount += 1;
      else if (statusLower === "rejected") group.rejectedCount += 1;

      group.applications.push({
        applicationId: app._id,
        userId: app.userId,
        studentName: userDetails.name,
        indexNumber: userDetails.indexNumber,
        role: userDetails.role,
        profilePicture: userDetails.profilePicture,
        email: userDetails.email,
        status: app.status,
        appliedAt: app.createdAt,
      });
    }

    const groupedModules = Array.from(moduleMap.values());

    console.log(
      "lecturer handleRequests -> grouped modules",
      groupedModules.length,
      "for",
      coordinatorId
    );

    return res.status(200).json({
      message: "TA applications retrieved successfully",
      modules: groupedModules,
    });
  } catch (error) {
    console.error("Error fetching TA applications:", error);
    return res.status(500).json({ error: "Failed to fetch TA applications" });
  }
};

const acceptApplication = async (req: Request, res: Response): Promise<Response> => {
  try {
    const user = (req as any).user;
    if (!user || !user._id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { applicationId } = req.params;
    const coordinatorId = user._id;
    console.log("applicationId", applicationId);
    console.log("coordinatorId", coordinatorId);

    const application = await TaApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }
    console.log("application", application);

    const applicationModuleId = application.moduleId;
    console.log("applicationModuleId", applicationModuleId);

    const module = await ModuleDetails.findById(applicationModuleId);
    if (!module || !module.coordinators.includes(user._id)) {
      return res.status(403).json({ error: "Not authorized to process this application" });
    }

    const taUser = await User.findById(application.userId).select("role name email");
    if (!taUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (String(application.status || "").toLowerCase() !== "pending") {
      return res.status(400).json({ error: "Application has already been processed" });
    }

    const updatePromises: Promise<any>[] = [application.save()];

    if (taUser.role === "undergraduate") {
      updatePromises.push(
        ModuleDetails.findByIdAndUpdate(applicationModuleId, {
          $inc: {
            "undergraduateCounts.reviewed": 1,
            "undergraduateCounts.accepted": 1,
          },
        })
      );
    } else if (taUser.role === "postgraduate") {
      updatePromises.push(
        ModuleDetails.findByIdAndUpdate(applicationModuleId, {
          $inc: {
            "postgraduateCounts.reviewed": 1,
            "postgraduateCounts.accepted": 1,
          },
        })
      );
    }

    application.status = "accepted";
    await Promise.all(updatePromises);

    const moduleAfterUpdate = await ModuleDetails.findById(applicationModuleId);
    
    // Check if all required positions are now filled (last request approved)
    const undergradRequired = moduleAfterUpdate!.undergraduateCounts?.required || 0;
    const undergradAccepted = moduleAfterUpdate!.undergraduateCounts?.accepted || 0;
    const postgradRequired = moduleAfterUpdate!.postgraduateCounts?.required || 0;
    const postgradAccepted = moduleAfterUpdate!.postgraduateCounts?.accepted || 0;
    
    const undergradFilled = undergradRequired === 0 || undergradAccepted >= undergradRequired;
    const postgradFilled = postgradRequired === 0 || postgradAccepted >= postgradRequired;
    const allPositionsFilled = undergradFilled && postgradFilled;
    
    // Change status to "getting documents" when the last required application is approved
    if (allPositionsFilled && moduleAfterUpdate!.moduleStatus !== "getting documents") {
      await ModuleDetails.findByIdAndUpdate(applicationModuleId, {
        $set: { moduleStatus: "getting documents" },
      });
      console.log(`Module ${module.moduleCode} status updated to 'getting documents' - all required positions filled`);
    }

    // Send email notification asynchronously
    setImmediate(async () => {
      try {
        const emailParams = {
          studentName: taUser.name,
          moduleName: module.moduleName,
          moduleCode: module.moduleCode,
          semester: module.semester,
        }

        await EmailService.enqueueProvideNecessaryDetailsForAppointmentEmail(
          [taUser.email], emailParams);
        console.log("Acceptance email sent successfully to:", taUser.email);
      } catch (emailError) {
        console.error("Failed to send acceptance email:", emailError);
      }
    });

    console.log("lecturer acceptApplication -> accepted application", applicationId, "for", coordinatorId);

    return res.status(200).json({
      message: "Application accepted successfully",
      application: application,
    });
  } catch (error) {
    console.error("Error accepting application:", error);
    return res.status(500).json({ error: "Failed to update application" });
  }
};

const rejectApplication = async (req: Request, res: Response): Promise<Response> => {
  try {
    const user = (req as any).user;
    if (!user || !user._id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { applicationId } = req.params;
    const coordinatorId = user._id;

    const application = await TaApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    const applicationModuleId = application.moduleId;
    const module = await ModuleDetails.findById(applicationModuleId);
    if (!module || !module.coordinators.includes(user._id)) {
      return res.status(403).json({ error: "Not authorized to process this application" });
    }

    const taUser = await User.findById(application.userId).select("role");
    if (!taUser) {
      return res.status(404).json({ error: "User not found" });
    }

    application.status = "rejected";
    if (req.body && typeof req.body.reason === "string" && req.body.reason.trim().length > 0) {
      (application as any).rejectionReason = req.body.reason.trim();
    }

    const updatePromises: Promise<any>[] = [application.save()];

    if (taUser.role === "undergraduate") {
      updatePromises.push(
        ModuleDetails.findByIdAndUpdate(applicationModuleId, {
          $inc: {
            "undergraduateCounts.reviewed": 1,
            "undergraduateCounts.remaining": 1,
          },
        })
      );
    } else if (taUser.role === "postgraduate") {
      updatePromises.push(
        ModuleDetails.findByIdAndUpdate(applicationModuleId, {
          $inc: {
            "postgraduateCounts.reviewed": 1,
            "postgraduateCounts.remaining": 1,
          },
        })
      );
    }

    const moduleDetails = await ModuleDetails.findById(applicationModuleId).select("requiredTAHours");
    if (moduleDetails && moduleDetails.requiredTAHours) {
      updatePromises.push(
        AppliedModules.findOneAndUpdate(
          { userId: application.userId },
          {
            $inc: {
              availableHoursPerWeek: moduleDetails.requiredTAHours,
            },
          }
        ).then((result: any) => {
          if (result) {
            console.log(
              `Incremented availableHoursPerWeek by ${moduleDetails.requiredTAHours} for user ${application.userId}`
            );
          } else {
            console.log(`No AppliedModules record found for user ${application.userId}`);
          }
        })
      );
    }

    await Promise.all(updatePromises);

    // If module status is "full" and an application is rejected, change status to "advertised"
    if (module.moduleStatus === "full") {
      await ModuleDetails.findByIdAndUpdate(applicationModuleId, {
        $set: { moduleStatus: "advertised" },
      });
      console.log(`Module ${module.moduleCode} status updated from 'full' to 'advertised' after rejection`);
    }

    console.log("lecturer rejectApplication -> rejected application", applicationId, "for", coordinatorId);

    return res.status(200).json({
      message: "Application rejected successfully",
      application: application,
    });
  } catch (error) {
    console.error("Error rejecting application:", error);
    return res.status(500).json({ error: "Failed to reject application" });
  }
};

const viewModuleDetails = async (req: Request, res: Response): Promise<Response> => {
  try {
    const user = (req as any).user;
    if (!user || !user._id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const coordinatorId = user._id;

    const coordinatorModules = await ModuleDetails.find({
      coordinators: coordinatorId,
    }).select("_id moduleCode moduleName semester requiredTAHours undergraduateCounts postgraduateCounts");

    if (coordinatorModules.length === 0) {
      return res.status(200).json({
        message: "No modules found for this coordinator",
        modules: [],
      });
    }

    const moduleIds = coordinatorModules.map((module: any) => module._id);
    console.log("viewModuleDetails -> found", coordinatorModules.length, "modules for coordinator", coordinatorId);

    const acceptedApplications = await TaApplication.find({
      moduleId: { $in: moduleIds },
      status: "accepted",
    }).lean();

    console.log("viewModuleDetails -> found", acceptedApplications.length, "accepted applications");

    if (acceptedApplications.length === 0) {
      return res.status(200).json({
        message: "No accepted applications found",
        modules: [],
      });
    }

    const userIds = [...new Set(acceptedApplications.map((app: any) => app.userId))];

    const users = await User.find({
      _id: { $in: userIds },
    }).select("name indexNumber role");

    const userMap: any = {};
    users.forEach((user: any) => {
      userMap[user._id.toString()] = {
        name: user.name,
        indexNumber: user.indexNumber,
        role: user.role,
      };
    });

    const appliedModulesData = await AppliedModules.find({
      userId: { $in: userIds },
    }).select("userId isDocSubmitted Documents");

    const appliedModulesMap: any = {};
    appliedModulesData.forEach((am: any) => {
      appliedModulesMap[am.userId.toString()] = {
        isDocSubmitted: am.isDocSubmitted,
        documentsId: am.Documents,
      };
    });

    const documentIds = appliedModulesData
      .filter((am: any) => am.isDocSubmitted && am.Documents)
      .map((am: any) => am.Documents);

    const documents = await documentModel.find({
      _id: { $in: documentIds },
    }).lean();

    const documentsMap: any = {};
    documents.forEach((doc: any) => {
      documentsMap[doc._id.toString()] = doc;
    });

    const moduleMap = new Map();

    for (const app of acceptedApplications as any[]) {
      const moduleIdStr = app.moduleId.toString();
      const userIdStr = app.userId.toString();

      const module: any = coordinatorModules.find((m: any) => m._id.toString() === moduleIdStr);
      if (!module) continue;

      const userDetails = userMap[userIdStr];
      if (!userDetails) continue;

      const appliedModuleInfo = appliedModulesMap[userIdStr] || { isDocSubmitted: false };

      const taInfo: any = {
        userId: userIdStr,
        name: userDetails.name,
        indexNumber: userDetails.indexNumber,
        role: userDetails.role,
        docStatus: appliedModuleInfo.isDocSubmitted ? "submitted" : "pending",
      };

      if (appliedModuleInfo.isDocSubmitted && appliedModuleInfo.documentsId) {
        const docData = documentsMap[appliedModuleInfo.documentsId.toString()];
        if (docData && docData.driveFiles) {
          taInfo.documents = {
            bankPassbook: docData.driveFiles.bankPassbook
              ? {
                  fileUrl:
                    docData.driveFiles.bankPassbook.viewLink ||
                    docData.driveFiles.bankPassbook.downloadLink,
                }
              : undefined,
            nicCopy: docData.driveFiles.nicCopy
              ? {
                  fileUrl:
                    docData.driveFiles.nicCopy.viewLink || docData.driveFiles.nicCopy.downloadLink,
                }
              : undefined,
            cv: docData.driveFiles.cv
              ? {
                  fileUrl: docData.driveFiles.cv.viewLink || docData.driveFiles.cv.downloadLink,
                }
              : undefined,
            degreeCertificate: docData.driveFiles.degreeCertificate
              ? {
                  fileUrl:
                    docData.driveFiles.degreeCertificate.viewLink ||
                    docData.driveFiles.degreeCertificate.downloadLink,
                }
              : undefined,
            declarationForm: docData.driveFiles.declarationForm
              ? {
                  fileUrl:
                    docData.driveFiles.declarationForm.viewLink ||
                    docData.driveFiles.declarationForm.downloadLink,
                }
              : undefined,
          };

          taInfo.personalDetails = {
            bankAccountName: decrypt(docData.bankAccountName) || "",
            bank: decrypt(docData.bank) || "",
            branch: decrypt(docData.branch) || "",
            address: decrypt(docData.address) || "",
            nicNumber: decrypt(docData.nicNumber) || "",
            accountNumber: decrypt(docData.accountNumber) || "",
          };
        }
      }

      if (!moduleMap.has(moduleIdStr)) {
        moduleMap.set(moduleIdStr, {
          moduleId: moduleIdStr,
          moduleCode: module.moduleCode,
          moduleName: module.moduleName,
          semester: module.semester,
          requiredTAHours: module.requiredTAHours || 0,
          acceptedTAs: [],
        });
      }

      moduleMap.get(moduleIdStr).acceptedTAs.push(taInfo);
    }

    const modulesWithAcceptedTAs = Array.from(moduleMap.values());

    console.log("viewModuleDetails -> returning", modulesWithAcceptedTAs.length, "modules with accepted TAs");

    return res.status(200).json({
      message: "Modules with accepted TAs retrieved successfully",
      modules: modulesWithAcceptedTAs,
    });
  } catch (error) {
    console.error("Error fetching module details with accepted TAs:", error);
    return res.status(500).json({ error: "Failed to fetch module details" });
  }
};

module.exports = {
  getMyModules,
  editModuleRequirments,
  handleRequests,
  acceptApplication,
  rejectApplication,
  viewModuleDetails,
};
