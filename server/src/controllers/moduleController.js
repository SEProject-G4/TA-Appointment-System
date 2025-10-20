const ModuleDetails = require("../models/ModuleDetails");
const User = require("../models/User");
const RecruitmentRound = require("../models/RecruitmentRound");
const TAApplication = require("../models/TaApplication");
const AppliedModule = require("../models/AppliedModules");
const { sendEmail } = require("../services/emailService");
const config = require("../config");

const changeModuleStatus = async (req, res) => {
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

    res.status(200).json(module);
  } catch (error) {
    console.error("Error changing module status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getModuleDetailsById = async (req, res) => {
  try {
    const moduleId = req.params.moduleId;
    const module = await ModuleDetails.findById(moduleId);
    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }

    const coordinatorDetails = await Promise.all(
      module.coordinators.map(async (coordinatorId) => {
        const user = await User.findById(
          coordinatorId,
          "displayName email profilePicture"
        );
        if (user) {
          return {
            id: user._id,
            displayName: user.displayName,
            email: user.email,
            profilePicture: user.profilePicture,
          };
        }
        return null;
      })
    );

    const populatedModuleDetails = {
      ...module._doc,
      coordinators: coordinatorDetails.filter((c) => c !== null),
    };

    res.status(200).json(populatedModuleDetails);
  } catch (error) {
    console.error("Error fetching module details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const advertiseModule = async (req, res) => {
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

    const undergradEmails = undergraduateUsers.map((user) => user.email);
    const postgradEmails = postgraduateUsers.map((user) => user.email);

    const subject = `New TA Opportunities Available: ${module.moduleCode} - ${module.moduleName}`;
    const undergradHtmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #007bff;">New TA Opportunities Available!</h2>
            <p>Dear Undergraduate Student,</p>
            <p>We are excited to announce that TA positions are now available for the following module:</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <div style="margin-bottom: 15px; padding: 15px; background-color: white; border-left: 4px solid #6f42c1; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <strong style="font-size: 16px; color: #6f42c1;">${
                      module.moduleCode
                    } - ${module.moduleName}</strong><br>
                    <span style="color: #6c757d; font-size: 14px;">Semester: ${
                      module.semester
                    }</span><br>
                    ${
                      module.postgraduateCounts
                        ? `<span style="color: #007bff; font-weight: 500;">Positions Available: ${module.postgraduateCounts.required}</span><br>`
                        : ""
                    }
                    ${
                      module.requiredTAHours
                        ? `<span style="color: #fd7e14; font-weight: 500;">Hours per week: ${module.requiredTAHours}</span><br>`
                        : ""
                    }
                    <div style="margin-top: 10px; padding: 8px; background-color: #f8f9fa; border-radius: 4px;">
                        <strong style="color: #dc3545; font-size: 14px;">📅 Module Deadlines:</strong><br>
                        <span style="color: #dc3545; font-size: 13px;">Application Due: ${new Date(
                          module.applicationDueDate
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}</span><br>
                        <span style="color: #dc3545; font-size: 13px;">Document Due: ${new Date(
                          module.documentDueDate
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}</span>
                    </div>
                </div>
            </div>
                
            <p>Don't miss this opportunity to gain valuable teaching experience and enhance your academic journey!</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${config.FRONTEND_URL}/login" 
                    style="background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                    Apply Now
                </a>
            </div>

            <p style="font-size: 14px; color: #6c757d;">
                For questions or support, please contact the TA Appointment System administrators.
            </p>
            <p>Best regards,<br>TA Appointment System</p>
        </div>
    `;

    const postgradHtmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #007bff;">New TA Opportunities Available!</h2>
            <p>Dear Postgraduate Student,</p>
            <p>We are excited to announce that TA positions are now available for the following module:</p>

            <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <div style="margin-bottom: 15px; padding: 15px; background-color: white; border-left: 4px solid #6f42c1; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <strong style="font-size: 16px; color: #6f42c1;">${
                      module.moduleCode
                    } - ${module.moduleName}</strong><br>
                    <span style="color: #6c757d; font-size: 14px;">Semester: ${
                      module.semester
                    }</span><br>
                    ${
                      module.postgraduateCounts
                        ? `<span style="color: #007bff; font-weight: 500;">Positions Available: ${module.postgraduateCounts.required}</span><br>`
                        : ""
                    }
                    ${
                      module.requiredTAHours
                        ? `<span style="color: #fd7e14; font-weight: 500;">Hours per week: ${module.requiredTAHours}</span><br>`
                        : ""
                    }
                    <div style="margin-top: 10px; padding: 8px; background-color: #f8f9fa; border-radius: 4px;">
                        <strong style="color: #dc3545; font-size: 14px;">📅 Module Deadlines:</strong><br>
                        <span style="color: #dc3545; font-size: 13px;">Application Due: ${new Date(
                          module.applicationDueDate
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}</span><br>
                        <span style="color: #dc3545; font-size: 13px;">Document Due: ${new Date(
                          module.documentDueDate
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}</span>
                    </div>
                </div>
            </div>

            <p>Don't miss this opportunity to gain valuable teaching experience and enhance your academic journey!</p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${config.FRONTEND_URL}/login"
                    style="background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                    Apply Now
                </a>
            </div>

            <p style="font-size: 14px; color: #6c757d;">
                For questions or support, please contact the TA Appointment System administrators.
            </p>
            <p>Best regards,<br>TA Appointment System</p>
        </div>
    `;

    // Send emails to both groups
    await sendEmail(undergradEmails, subject, undergradHtmlContent);
    await sendEmail(postgradEmails, subject, postgradHtmlContent);

    // Update module status to 'advertised'
    module.moduleStatus = "advertised";
    await module.save().then(async () => {
      console.log(
        `✅ Updated module statuses to 'advertised' for postgraduate modules`
      );
      if (recruitmentSeries.status !== "active") {
        // If the recruitment series is not active, we can archive it
        recruitmentSeries.status = "active";
        await recruitmentSeries.save();
      }
    });
    res.status(200).json({ message: "Module advertised successfully" });
  } catch (error) {
    console.error("Error advertising module:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const notifyModule = async (req, res) => {
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
      email: { $exists: true, $ne: null, $ne: "" },
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

    const emailAddresses = coordinators.map((coordinator) => coordinator.email);
    const subject = `Please enter your TA requests for ${module.moduleCode} - ${module.moduleName} in semester ${module.semester}`;
    const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>TA Request Required</h2>
                <p>Dear Module Coordinator,</p>
                <p>This is a reminder to submit your TA requirements for the following module:</p>
                <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #007bff;">
                    <strong>Module:</strong> ${module.moduleCode} - ${module.moduleName}<br>
                    <strong>Semester:</strong> ${module.semester}<br>
                </div>
                <p>Please log into the TA Appointment System to review and submit your TA requirements.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${config.FRONTEND_URL}/login" 
                        style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Access TA System
                    </a>
                </div>
                <p>If you have any questions or need assistance, please contact the system administrators.</p>
                <p>Best regards,<br>TA Appointment System</p>
            </div>
        `;

    await sendEmail(emailAddresses, subject, htmlContent);
    console.log(
      `✅ Notifications sent to ${emailAddresses.length} coordinators for ${module.moduleCode}`
    );
    await ModuleDetails.findByIdAndUpdate(moduleId, {
      $set: { moduleStatus: "pending changes" },
    });

    res.status(200).json({ message: "Module notifications sent successfully" });
  } catch (error) {
    console.error("Error notifying module:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateModule = async (req, res) => {
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
      if (currentPostgradCounts.accepted > newPostgradRequired) {
        return res.status(400).json({
          error:
            "New postgraduate TA count cannot be less than the number of already accepted postgraduate TAs",
        });
      }
    }

    if (existingModule.openForUndergraduates) {
      const currentUndergradCounts = existingModule.undergraduateCounts;
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
          existingModule.moduleStatus = "undergrad full";
        }
      } else if (potentialUndergradCount > newUndergradRequired) {
        undergradApplicationsToRemove =
          potentialUndergradCount - newUndergradRequired;
      }
    }

    const recSeriesId = existingModule.recruitmentSeriesId;

    let applicationsToRemove = [];
    let affectedUsers = [];

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
      if (application.userId.role === "undergraduate") {
        undergradApplications.push(application);
      } else if (application.userId.role === "postgraduate") {
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
        applicationsToRemove: applicationsToRemove.map((app) => {
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
          userId: application.userId._id,
          recSeriesId: recSeriesId,
        });
        if (appliedModule) {
          appliedModule.availableHours += hoursToReturn;
          const currentAppliedModules = appliedModule.appliedModules || [];
          appliedModule.appliedModules = currentAppliedModules.filter(
            (modId) => modId.toString() !== moduleId
          );
          await TAApplication.deleteOne({ _id: application._id })
            .then(await appliedModule.save())
            .catch((err) => {
              console.error("Error removing application:", err);
            });
          affectedUsers.push({
            name: application.userId.name,
            email: application.userId.email,
            hoursReturned: hoursToReturn,
          });
        }
      }
    }
    // Update the module
    const updateData = {
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
      (app) => app.userId.role === "undergraduate"
    ).length;
    const newAppliedPostgradCount = remainingApplications.filter(
      (app) => app.userId.role === "postgraduate"
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
    if (affectedUsers.length > 0) {
      const emailPromises = affectedUsers.map((user) => {
        const subject = `TA Application Removed - ${moduleCode}`;
        const htmlContent = `
                    <p>Dear ${user.name},</p>
                    <p>We regret to inform you that your TA application for <strong>${moduleCode} - ${moduleName}</strong> has been removed due to a reduction in the number of required TAs for this module.</p>
                    ${
                      user.hoursReturned > 0
                        ? `<p>Your allocated hours (${user.hoursReturned} hours) have been returned to your available hours.</p>`
                        : ""
                    }
                    <p>You are welcome to apply for other available TA positions.</p>
                    <p>We apologize for any inconvenience caused.</p>
                    <p>Best regards,<br>The TA Recruitment Team</p>
                `;
        return sendEmail(user.email, subject, htmlContent);
      });

      await Promise.all(emailPromises);
    }

    res.status(200).json({
      message: "Module updated successfully",
      module: updatedModule,
      removedApplications: applicationsToRemove.length,
      affectedUsers: affectedUsers.length,
    });
  } catch (error) {
    console.error("Error updating module:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getModuleDetailsById,
  changeModuleStatus,
  advertiseModule,
  notifyModule,
  updateModule,
};
