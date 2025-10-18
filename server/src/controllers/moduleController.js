const ModuleDetails = require("../models/ModuleDetails");
const User = require("../models/User");
const RecruitmentRound = require("../models/RecruitmentRound");
const TAApplication = require("../models/TaApplication");
const AppliedModule = require("../models/AppliedModules");
const { sendEmail } = require("../services/emailService");

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
                const user = await User.findById(coordinatorId, "displayName email profilePicture");
                if (user) {
                    return { 
                        id: user._id,
                        displayName: user.displayName,
                        email: user.email,
                        profilePicture: user.profilePicture
                    };
                }
                return null;
            })
        );

        const populatedModuleDetails = {
            ...module._doc,
            coordinators: coordinatorDetails.filter(c => c !== null)
        };
        
    res.status(200).json(populatedModuleDetails);
} catch (error) {
    console.error("Error fetching module details:", error);
    res.status(500).json({ error: "Internal server error" });
    }
};

const advertiseModule = async(req, res) => {
    const { moduleId } = req.params;
    try {
        const module = await ModuleDetails.findById(moduleId);
        if (!module) {
            return res.status(404).json({ error: "Module not found" });
        }

        module.moduleStatus = "advertised";
        await module.save();

        const recruitmentSeriesId = module.recruitmentSeriesId;
        if (!recruitmentSeriesId) {
            return res.status(400).json({ error: "Module is not associated with any recruitment series" });
        }
        const recruitmentSeries = await RecruitmentRound.findById(recruitmentSeriesId);
        if (!recruitmentSeries) {
            return res.status(404).json({ error: "Recruitment series not found" });
        }
        const userGroupIds = recruitmentSeries.undergradMailingList.concat(recruitmentSeries.postgradMailingList);

        const users = await User.find({ userGroup: { $in: userGroupIds } }, "email name");

        const emailPromises = users.map(user => {
            const subject = `New TA Position Available: ${module.moduleCode} - ${module.moduleName}`;
            const htmlContent = `<p>Hello ${user.name},</p>
            <p>We are excited to announce a new TA position available for the module ${module.moduleCode} - ${module.moduleName}.</p>
            <p>Please check the details and apply if you are interested.</p>
            <p>Best regards,</p>
            <p>The TA Recruitment Team</p>`;

            return sendEmail(user.email, subject, htmlContent);
        });

        await Promise.all(emailPromises);
        res.status(200).json({ message: "Module advertised successfully" });
    } catch (error) {
        console.error("Error advertising module:", error);
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
            confirmRemoval = false
        } = req.body;

        // Validate dates
        const now = new Date();
        const appDate = new Date(applicationDueDate);
        const docDate = new Date(documentDueDate);

        if (appDate <= now) {
            return res.status(400).json({ 
                error: "Application due date must be after the current date" 
            });
        }

        if (docDate <= appDate) {
            return res.status(400).json({ 
                error: "Document due date must be after the application due date" 
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

        if(existingModule.openForPostgraduates){
            const currentPostgradCounts = existingModule.postgraduateCounts;
            if(currentPostgradCounts.accepted > newPostgradRequired){
                return res.status(400).json({ 
                    error: "New postgraduate TA count cannot be less than the number of already accepted postgraduate TAs" 
                });
            }
        }

        if(existingModule.openForUndergraduates){
            const currentUndergradCounts = existingModule.undergraduateCounts;
            const potentialUndergradCount = currentUndergradCounts.accepted + currentUndergradCounts.applied - currentUndergradCounts.reviewed;
            if(currentUndergradCounts.accepted > newUndergradRequired){
                return res.status(400).json({
                    error: "New undergraduate TA count cannot be less than the number of already accepted undergraduate TAs"
                });
            }else if(currentUndergradCounts.accepted === newUndergradRequired){
                if(existingModule.moduleStatus === 'advertised'){
                    existingModule.moduleStatus = 'undergrad full';
                }
            }else if(potentialUndergradCount > newUndergradRequired){
                undergradApplicationsToRemove = potentialUndergradCount - newUndergradRequired;
            }
        }

        const recSeriesId = existingModule.recruitmentSeriesId;
    
        

        let applicationsToRemove = [];
        let affectedUsers = [];

        // Get all current applications for this module
        const currentApplications = await TAApplication.find({
            moduleId: moduleId,
            status: 'pending'
        }).populate('userId', 'name email role').sort({ createdAt: -1 });

        // Separate applications by user type
        const undergradApplications = [];
        const postgradApplications = [];

        for (const application of currentApplications) {
            if (application.userId.role === 'undergraduate') {
                undergradApplications.push(application);
            } else if (application.userId.role === 'postgraduate') {
                postgradApplications.push(application);
            }
        }

        if (undergradApplicationsToRemove > 0) {
            const undergradToRemove = undergradApplications.slice(0, undergradApplicationsToRemove);
            applicationsToRemove.push(...undergradToRemove);
        }

        if (postgradApplicationsToRemove > 0) {
            const postgradToRemove = postgradApplications.slice(0, postgradApplicationsToRemove);
            applicationsToRemove.push(...postgradToRemove);
        }

        // If applications need to be removed and user hasn't confirmed, send warning
        if (applicationsToRemove.length > 0 && !confirmRemoval) {
            return res.status(409).json({
                requiresConfirmation: true,
                message: `Reducing TA counts will remove ${applicationsToRemove.length} recent applications`,
                applicationsToRemove: applicationsToRemove.map(app => {
                    return {
                        applicationId: app._id,
                        userName: app.userId.name || 'Unknown',
                        userEmail: app.userId.email || 'Unknown',
                        studentType: app.userId.role,
                        appliedAt: app.createdAt,
                        hoursAllocated: requiredTAHours || 0 // Use the module's TA hours
                    };
                })
            });
        }

        // If confirmed or no applications to remove, proceed with update
        if (applicationsToRemove.length > 0 && confirmRemoval) {
            // Return TA hours to affected users and remove the module from their appliedModules
            for (const application of applicationsToRemove) {
                const hoursToReturn = requiredTAHours || 0;
                const appliedModule = await AppliedModule.findOne({ userId: application.userId._id, recSeriesId: recSeriesId });
                if (appliedModule) {
                    appliedModule.availableHours += hoursToReturn;
                    const currentAppliedModules = appliedModule.appliedModules || [];
                    appliedModule.appliedModules = currentAppliedModules.filter(modId => modId.toString() !== moduleId);
                    await TAApplication.deleteOne({ _id: application._id }).then(await appliedModule.save()).catch(err => {
                        console.error('Error removing application:', err);
                    });
                    affectedUsers.push({
                        name: application.userId.name,
                        email: application.userId.email,
                        hoursReturned: hoursToReturn
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
            openForPostgraduates: newPostgradRequired > 0
        };

        // Update counts (recalculate after potential application removal)
        const remainingApplications = await TAApplication.find({ moduleId: moduleId }).populate('userId', 'role');
        const newAppliedUndergradCount = remainingApplications.filter(app => app.userId.role === 'undergraduate').length;
        const newAppliedPostgradCount = remainingApplications.filter(app => app.userId.role === 'postgraduate').length;

        if (newUndergradRequired > 0) {
            const reviewedCount = existingModule.undergraduateCounts?.reviewed || 0;
            const acceptedCount = existingModule.undergraduateCounts?.accepted || 0;
            const remainingCount = newUndergradRequired - (acceptedCount + newAppliedUndergradCount - reviewedCount);
            updateData.undergraduateCounts = {
                required: newUndergradRequired,
                applied: newAppliedUndergradCount,
                remaining: Math.max(0, remainingCount),
                reviewed: existingModule.undergraduateCounts?.reviewed || 0,
                accepted: existingModule.undergraduateCounts?.accepted || 0,
                docSubmitted: existingModule.undergraduateCounts?.docSubmitted || 0,
                appointed: existingModule.undergraduateCounts?.appointed || 0
            };
        } else {
            updateData.undergraduateCounts = null;
        }

        if (newPostgradRequired > 0) {
            const reviewedCount = existingModule.postgraduateCounts?.reviewed || 0;
            const acceptedCount = existingModule.postgraduateCounts?.accepted || 0;
            const remainingPostgradCount = newPostgradRequired - (acceptedCount + newAppliedPostgradCount - reviewedCount);
            updateData.postgraduateCounts = {
                required: newPostgradRequired,
                applied: newAppliedPostgradCount,
                remaining: Math.max(0, remainingPostgradCount),
                reviewed: existingModule.postgraduateCounts?.reviewed || 0,
                accepted: existingModule.postgraduateCounts?.accepted || 0,
                docSubmitted: existingModule.postgraduateCounts?.docSubmitted || 0,
                appointed: existingModule.postgraduateCounts?.appointed || 0
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
            const emailPromises = affectedUsers.map(user => {
                const subject = `TA Application Removed - ${moduleCode}`;
                const htmlContent = `
                    <p>Dear ${user.name},</p>
                    <p>We regret to inform you that your TA application for <strong>${moduleCode} - ${moduleName}</strong> has been removed due to a reduction in the number of required TAs for this module.</p>
                    ${user.hoursReturned > 0 ? `<p>Your allocated hours (${user.hoursReturned} hours) have been returned to your available hours.</p>` : ''}
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
            affectedUsers: affectedUsers.length
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
    updateModule,
};