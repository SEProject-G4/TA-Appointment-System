const RecruitmentRound = require("../models/RecruitmentRound");
const UserGroup = require("../models/UserGroup");
const ModuleDetails = require("../models/ModuleDetails");
const User = require("../models/User");
const { default: mongoose } = require("mongoose");
const emailService = require("../services/emailService");
const config = require("../config");

const createRecruitmentRound = async (req, res) => {
    try{
        const name = req.body.name;
        const applicationDueDate = req.body.applicationDueDate;
        const documentDueDate = req.body.documentDueDate;
        const undergradHourLimit = req.body.undergradHourLimit;
        const postgradHourLimit = req.body.postgradHourLimit;
        const undergradMailingList = req.body.undergradMailingList.map((group) => group._id);
        const postgradMailingList = req.body.postgradMailingList.map((group) => group._id);

        const newRecruitmentRound = new RecruitmentRound({
            name,
            applicationDueDate,
            documentDueDate,
            undergradHourLimit,
            postgradHourLimit,
            undergradMailingList,
            postgradMailingList,
            status: "initialised"
        });
        console.log("New RecruitmentRound is going to create",newRecruitmentRound);
        await newRecruitmentRound.save();
        res.status(201).json(newRecruitmentRound);
    } catch (error) {
        console.error("Error creating recruitment series:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

const getAllRecruitmentRounds = async (req, res) => {
    console.log("Fetching all recruitment series");
    try {
        const recruitmentSeriesList = await RecruitmentRound.find();
        const resDataList = await Promise.all(recruitmentSeriesList.map(async (series) => {
            const undergradGroups = await Promise.all(series.undergradMailingList.map(group_id => UserGroup.findById(group_id)));
            const postgradGroups = await Promise.all(series.postgradMailingList.map(group_id => UserGroup.findById(group_id)));

            return {
                ...series._doc,
                undergradMailingList: undergradGroups.filter(group => group !== null),
                postgradMailingList: postgradGroups.filter(group => group !== null)
            };
        }));
        res.status(200).json(resDataList);
    } catch (error) {
        console.error("Error fetching recruitment series:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const addModuleToRecruitmentRound = async (req, res) => {
    try {
        const seriesId = req.params.seriesId;
        const moduleData = req.body;

        // Find the recruitment series by ID
        const recruitmentSeries = await RecruitmentRound.findById(seriesId);
        if (!recruitmentSeries) {
            return res.status(404).json({ error: "Recruitment series not found" });
        }

        console.log("Adding module to series:", seriesId, moduleData);

        const openForUndergrads = moduleData.requiredUndergraduateTACount > 0;
        const openForPostgrads = moduleData.requiredPostgraduateTACount > 0;

        // Add the module
        const newModule = new ModuleDetails({
            recruitmentSeriesId: seriesId,
            moduleCode: moduleData.moduleCode,
            moduleName: moduleData.moduleName,
            semester: moduleData.semester,
            coordinators: moduleData.coordinators,
            applicationDueDate: new Date(moduleData.applicationDueDate),
            documentDueDate: new Date(moduleData.documentDueDate),
            requiredTAHours: moduleData.requiredTAHours,
            openForUndergraduates: openForUndergrads,
            openForPostgraduates: openForPostgrads,
            undergraduateCounts: !openForUndergrads ? null : {
                required: moduleData.requiredUndergraduateTACount,
                remaining: moduleData.requiredUndergraduateTACount,
            },
            postgraduateCounts: !openForPostgrads ? null : {
                required: moduleData.requiredPostgraduateTACount,
                remaining: moduleData.requiredPostgraduateTACount,
            },
            moduleStatus: "initialised",
            requirements: moduleData.requirements
        });
        await newModule.save();

        res.status(200).json(recruitmentSeries);
    } catch (error) {
        console.error("Error adding module to recruitment series:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getModuleDetailsBySeriesId = async (req, res) => {
    try {
        const seriesId = req.params.seriesId;
        const moduleDetails = await ModuleDetails.find({ recruitmentSeriesId: seriesId });
        const populatedModuleDetails = await Promise.all(moduleDetails.map(async (module) => {
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
            return {
                ...module._doc,
                coordinators: coordinatorDetails.filter(c => c !== null)
            };
        }));
        res.status(200).json(populatedModuleDetails);
    } catch (error) {
        console.error("Error fetching module details:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getEligibleUndergraduates = async (req, res) => {
    try {
        const seriesId = req.params.seriesId;
        const recruitmentSeries = await RecruitmentRound.findById(seriesId);
        if (!recruitmentSeries) {
            return res.status(404).json({ error: "Recruitment series not found" });
        }
        const undergradGroups = recruitmentSeries.undergradMailingList;
        const eligibleUndergraduates = await User.find({ userGroup: { $in: undergradGroups }, role: 'undergraduate' });
        res.status(200).json(eligibleUndergraduates);
    } catch (error) {
        console.error("Error fetching eligible undergraduates:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getEligiblePostgraduates = async (req, res) => {
    try {
        const seriesId = req.params.seriesId;
        const recruitmentSeries = await RecruitmentRound.findById(seriesId);
        if (!recruitmentSeries) {
            return res.status(404).json({ error: "Recruitment series not found" });
        }
        const postgradGroups = recruitmentSeries.postgradMailingList;
        const eligiblePostgraduates = await User.find({ userGroup: { $in: postgradGroups }, role: 'postgraduate' });
        res.status(200).json(eligiblePostgraduates);
    } catch (error) {
        console.error("Error fetching eligible postgraduates:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const copyRecruitmentRound = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { seriesId } = req.params;
        const { name, applicationDueDate, documentDueDate, undergradHourLimit, postgradHourLimit, undergradMailingList, postgradMailingList, modules } = req.body;
        const originalSeries = await RecruitmentRound.findById(seriesId).session(session);
        if (!originalSeries) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ error: "Original recruitment series not found" });
        }

        const newSeries = new RecruitmentRound({
            name,
            applicationDueDate,
            documentDueDate,
            undergradHourLimit,
            postgradHourLimit,
            undergradMailingList,
            postgradMailingList,
            status: "initialised"
        });

        await newSeries.save({ session });

        let modulesToCopy = [];
        if (modules.length > 0) {
            modulesToCopy = await ModuleDetails.find({ _id: { $in: modules }, recruitmentSeriesId: seriesId }).session(session);
            await Promise.all(modulesToCopy.map(async module => {
                const newModule = new ModuleDetails({
                    recruitmentSeriesId: newSeries._id,
                    moduleCode: module.moduleCode,
                    moduleName: module.moduleName,
                    semester: module.semester,
                    coordinators: module.coordinators,
                    applicationDueDate: new Date(applicationDueDate),
                    documentDueDate: new Date(documentDueDate),
                    requiredTAHours: module.requiredTAHours,
                    openForUndergraduates: module.openForUndergraduates,
                    openForPostgraduates: module.openForPostgraduates,
                    undergraduateCounts: module.undergraduateCounts ? {
                        required: module.undergraduateCounts.required,
                        remaining: module.undergraduateCounts.required
                     } : null,
                    postgraduateCounts: module.postgraduateCounts ? {
                        required: module.postgraduateCounts.required,
                        remaining: module.postgraduateCounts.required
                    } : null,
                    requirements: module.requirements,
                    moduleStatus: "initialised",
                });
                await newModule.save({ session });
            }));
            newSeries.moduleCount = modulesToCopy.length;
            newSeries.undergraduateTAPositionsCount = modulesToCopy.reduce((sum, mod) => sum + (mod.undergraduateCounts ? mod.undergraduateCounts.required : 0), 0);
            newSeries.postgraduateTAPositionsCount = modulesToCopy.reduce((sum, mod) => sum + (mod.postgraduateCounts ? mod.postgraduateCounts.required : 0), 0);
            await newSeries.save({ session });
        }

        await session.commitTransaction();
        res.status(201).json({ message: "The new recruitment round created successfully including " + modulesToCopy.length + " modules." });
    } catch (error) {
        await session.abortTransaction();
        console.error("Error copying recruitment round:", error);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        session.endSession();
    }
};

const deleteRecruitmentRound = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { seriesId } = req.params;

        // Find the recruitment series
        const recruitmentSeries = await RecruitmentRound.findById(seriesId).session(session);
        if (!recruitmentSeries) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ error: "Recruitment round not found" });
        }

        // Delete associated modules
        await ModuleDetails.deleteMany({ recruitmentSeriesId: seriesId }).session(session);

        // Delete the recruitment series
        await RecruitmentRound.findByIdAndDelete(seriesId).session(session);

        await session.commitTransaction();
        res.status(200).json({ message: "Recruitment round deleted successfully" });
    } catch (error) {
        await session.abortTransaction();
        console.error("Error deleting recruitment round:", error);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        session.endSession();
    }
};

const updateRecruitmentRoundDeadlines = async (req, res) => {
    try {
        const { seriesId } = req.params;
        const { applicationDueDate, documentDueDate } = req.body;

        // Validate required fields
        if (!applicationDueDate || !documentDueDate) {
            return res.status(400).json({ error: "Both application due date and document due date are required" });
        }

        // Validate dates
        const appDate = new Date(applicationDueDate);
        const docDate = new Date(documentDueDate);
        const now = new Date();

        if (appDate <= now) {
            return res.status(400).json({ error: "Application due date must be in the future" });
        }

        if (docDate <= now) {
            return res.status(400).json({ error: "Document due date must be in the future" });
        }

        if (appDate > docDate) {
            return res.status(400).json({ error: "Application due date must be on or before document due date" });
        }

        // Find and update the recruitment series
        const recruitmentSeries = await RecruitmentRound.findById(seriesId);
        if (!recruitmentSeries) {
            return res.status(404).json({ error: "Recruitment series not found" });
        }

        recruitmentSeries.applicationDueDate = appDate;
        recruitmentSeries.documentDueDate = docDate;
        await recruitmentSeries.save();

        res.status(200).json({ 
            message: "Deadlines updated successfully",
            recruitmentSeries: {
                _id: recruitmentSeries._id,
                applicationDueDate: recruitmentSeries.applicationDueDate,
                documentDueDate: recruitmentSeries.documentDueDate
            }
        });
    } catch (error) {
        console.error("Error updating recruitment round deadlines:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const updateRecruitmentRoundHourLimits = async (req, res) => {
    try {
        const { seriesId } = req.params;
        const { undergradHourLimit, postgradHourLimit } = req.body;

        // Validate required fields
        if (undergradHourLimit === undefined || postgradHourLimit === undefined) {
            return res.status(400).json({ error: "Both undergraduate and postgraduate hour limits are required" });
        }

        // Validate hour limits
        if (!Number.isInteger(undergradHourLimit) || undergradHourLimit <= 0 || undergradHourLimit > 50) {
            return res.status(400).json({ error: "Undergraduate hour limit must be a positive integer between 1 and 50" });
        }

        if (!Number.isInteger(postgradHourLimit) || postgradHourLimit <= 0 || postgradHourLimit > 50) {
            return res.status(400).json({ error: "Postgraduate hour limit must be a positive integer between 1 and 50" });
        }

        // Find and update the recruitment series
        const recruitmentSeries = await RecruitmentRound.findById(seriesId);
        if (!recruitmentSeries) {
            return res.status(404).json({ error: "Recruitment series not found" });
        }

        recruitmentSeries.undergradHourLimit = undergradHourLimit;
        recruitmentSeries.postgradHourLimit = postgradHourLimit;
        await recruitmentSeries.save();

        res.status(200).json({ 
            message: "Hour limits updated successfully",
            recruitmentSeries: {
                _id: recruitmentSeries._id,
                undergradHourLimit: recruitmentSeries.undergradHourLimit,
                postgradHourLimit: recruitmentSeries.postgradHourLimit
            }
        });
    } catch (error) {
        console.error("Error updating recruitment round hour limits:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const notifyModules = async (req, res) => {
    try {
        const { seriesId } = req.params;

        // Validate input
        if (!seriesId) {
            return res.status(400).json({ error: "seriesId is required" });
        }

        console.log(`Starting notification process for recruitment series ${seriesId}`);
        
        // Find all initialised modules in the recruitment series
        const modules = await ModuleDetails.find({ 
            recruitmentSeriesId: seriesId,
            moduleStatus: "initialised" 
        }).lean();
        
        if (modules.length === 0) {
            return res.status(404).json({ error: "No initialised modules found in this recruitment series" });
        }

        // Prepare emails for job queue
        const emails = [];
        const moduleUpdates = [];

        for (const module of modules) {
            try {
                if (!module.coordinators || module.coordinators.length === 0) {
                    console.warn(`Module ${module.moduleCode} has no coordinators assigned - skipping`);
                    continue;
                }

                // Fetch coordinators for this module
                const coordinators = await User.find({ 
                    _id: { $in: module.coordinators },
                    email: { $exists: true, $ne: null, $ne: '' }
                }).lean();

                if (coordinators.length === 0) {
                    console.warn(`Module ${module.moduleCode} has no coordinators with valid email addresses - skipping`);
                    continue;
                }

                const emailAddresses = coordinators.map(coordinator => coordinator.email);
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

                // Add each coordinator email as a separate job for better tracking
                emailAddresses.forEach(email => {
                    emails.push({
                        to: email,
                        subject: subject,
                        html: htmlContent,
                        metadata: {
                            moduleId: module._id,
                            moduleCode: module.moduleCode,
                            moduleName: module.moduleName,
                            coordinatorEmail: email,
                        }
                    });
                });

                // Track modules that will be updated
                moduleUpdates.push(module._id);

            } catch (moduleError) {
                console.error(`Error preparing notification for module ${module.moduleCode}:`, moduleError);
            }
        }

        if (emails.length === 0) {
            return res.status(400).json({ 
                error: "No valid emails could be prepared. Check module coordinators and email addresses.",
                totalModulesFound: modules.length
            });
        }

        // Queue the bulk email job
        const jobResult = await emailService.sendBulkEmails(emails, 'notify_lecturers', seriesId, {
            moduleUpdates,
            originalModuleCount: modules.length,
        });

        if (!jobResult.success) {
            return res.status(500).json({ 
                error: "Failed to queue notification emails",
                details: jobResult.error
            });
        }

        // Update module statuses to "pending changes" immediately
        await ModuleDetails.updateMany(
            { _id: { $in: moduleUpdates } },
            { $set: { moduleStatus: "pending changes" } }
        );

        console.log(`✅ Queued ${emails.length} notification emails for ${moduleUpdates.length} modules`);

        res.status(200).json({
            message: `Notification emails queued successfully`,
            jobId: jobResult.jobId,
            summary: {
                modulesProcessed: moduleUpdates.length,
                emailsQueued: emails.length,
                estimatedDuration: jobResult.estimatedDuration,
            },
            details: {
                jobId: jobResult.jobId,
                queueName: jobResult.queueName,
                statusCheckUrl: `/api/jobs/${jobResult.jobId}/status`,
            }
        });

    } catch (error) {
        console.error("Error in notifyModules function:", error);
        res.status(500).json({ error: "Internal server error while queuing notifications" });
    }
};

const advertiseModules = async (req, res) => {
    try {
        const { seriesId } = req.params;

        // Validate input
        if (!seriesId) {
            return res.status(400).json({ error: "seriesId is required" });
        }

        console.log(`Starting advertisement process for recruitment series ${seriesId}`);

        // Fetch recruitment series and validate
        const recruitmentSeries = await RecruitmentRound.findById(seriesId).lean();
        if (!recruitmentSeries) {
            return res.status(404).json({ error: "Recruitment series not found" });
        }

        // Find all modules with "changes submitted" status in the recruitment series
        const modules = await ModuleDetails.find({ 
            recruitmentSeriesId: seriesId,
            moduleStatus: "changes submitted"
        }).lean();

        if (modules.length === 0) {
            return res.status(404).json({ error: "No modules with 'changes submitted' status found in this recruitment series" });
        }

        // Fetch mailing lists in parallel
        const [undergradMailingList, postgradMailingList] = await Promise.all([
            User.find({ 
                userGroup: { $in: recruitmentSeries.undergradMailingList }, 
                role: 'undergraduate',
                email: { $exists: true, $ne: null, $ne: '' }
            }, 'email displayName').lean(),
            User.find({ 
                userGroup: { $in: recruitmentSeries.postgradMailingList }, 
                role: 'postgraduate',
                email: { $exists: true, $ne: null, $ne: '' }
            }, 'email displayName').lean()
        ]);

        // Categorize modules and collect semester information
        const undergradModules = [];
        const postgradModules = [];
        const underSemesters = new Set();
        const postSemesters = new Set();

        modules.forEach(module => {
            if (module.openForUndergraduates) {
                underSemesters.add(module.semester);
                undergradModules.push(module);
            }
            if (module.openForPostgraduates) {
                postSemesters.add(module.semester);
                postgradModules.push(module);
            }
        });

        // Prepare emails for job queue
        const emails = [];
        let emailGroups = [];

        // Prepare undergraduate emails
        if (undergradModules.length > 0 && undergradMailingList.length > 0) {
            const undergradEmails = undergradMailingList.map(user => user.email);
            const undergradSubject = `New TA Opportunities Available - Semester${underSemesters.size > 1 ? 's' : ''} ${Array.from(underSemesters).sort().join(', ')}`;
            
            const undergradHtmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #007bff;">New TA Opportunities Available!</h2>
                    <p>Dear Undergraduate Student,</p>
                    <p>We are excited to announce that TA positions are now available for the following modules:</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
                        ${undergradModules.map(mod => `
                            <div style="margin-bottom: 15px; padding: 10px; background-color: white; border-left: 4px solid #28a745; border-radius: 4px;">
                                <strong>${mod.moduleCode} - ${mod.moduleName}</strong><br>
                                <span style="color: #6c757d;">Semester: ${mod.semester}</span><br>
                                ${mod.undergraduateCounts ? `<span style="color: #007bff;">Positions Available: ${mod.undergraduateCounts.required}</span><br>` : ''}
                                ${mod.requiredTAHours ? `<span style="color: #fd7e14;">Hours per week: ${mod.requiredTAHours}</span>` : ''}
                            </div>
                        `).join('')}
                    </div>

                    <div style="background-color: #e7f3ff; padding: 15px; margin: 20px 0; border-radius: 5px;">
                        <strong>Application Deadlines:</strong><br>
                        Application Due: ${new Date(recruitmentSeries.applicationDueDate).toLocaleDateString()}<br>
                        Document Due: ${new Date(recruitmentSeries.documentDueDate).toLocaleDateString()}<br>
                        Hour Limit: ${recruitmentSeries.undergradHourLimit} hours per week
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

            // Add each undergraduate email to the batch
            undergradEmails.forEach(email => {
                emails.push({
                    to: email,
                    subject: undergradSubject,
                    html: undergradHtmlContent,
                    metadata: {
                        userType: 'undergraduate',
                        moduleCount: undergradModules.length,
                        userEmail: email,
                    }
                });
            });

            emailGroups.push({
                type: 'undergraduate',
                recipientCount: undergradEmails.length,
                moduleCount: undergradModules.length,
            });
        }

        // Prepare postgraduate emails
        if (postgradModules.length > 0 && postgradMailingList.length > 0) {
            const postgradEmails = postgradMailingList.map(user => user.email);
            const postgradSubject = `New TA Opportunities Available - Semester${postSemesters.size > 1 ? 's' : ''} ${Array.from(postSemesters).sort().join(', ')}`;
            
            const postgradHtmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #007bff;">New TA Opportunities Available!</h2>
                    <p>Dear Postgraduate Student,</p>
                    <p>We are excited to announce that TA positions are now available for the following modules:</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
                        ${postgradModules.map(mod => `
                            <div style="margin-bottom: 15px; padding: 10px; background-color: white; border-left: 4px solid #6f42c1; border-radius: 4px;">
                                <strong>${mod.moduleCode} - ${mod.moduleName}</strong><br>
                                <span style="color: #6c757d;">Semester: ${mod.semester}</span><br>
                                ${mod.postgraduateCounts ? `<span style="color: #007bff;">Positions Available: ${mod.postgraduateCounts.required}</span><br>` : ''}
                                ${mod.requiredTAHours ? `<span style="color: #fd7e14;">Hours per week: ${mod.requiredTAHours}</span>` : ''}
                            </div>
                        `).join('')}
                    </div>

                    <div style="background-color: #f3e7ff; padding: 15px; margin: 20px 0; border-radius: 5px;">
                        <strong>Application Deadlines:</strong><br>
                        Application Due: ${new Date(recruitmentSeries.applicationDueDate).toLocaleDateString()}<br>
                        Document Due: ${new Date(recruitmentSeries.documentDueDate).toLocaleDateString()}<br>
                        Hour Limit: ${recruitmentSeries.postgradHourLimit} hours per week
                    </div>

                    <p>This is an excellent opportunity to contribute to the academic community while developing your teaching and mentoring skills.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${config.FRONTEND_URL}/login" 
                           style="background-color: #6f42c1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                            Apply Now
                        </a>
                    </div>

                    <p style="font-size: 14px; color: #6c757d;">
                        For questions or support, please contact the TA Appointment System administrators.
                    </p>
                    <p>Best regards,<br>TA Appointment System</p>
                </div>
            `;

            // Add each postgraduate email to the batch
            postgradEmails.forEach(email => {
                emails.push({
                    to: email,
                    subject: postgradSubject,
                    html: postgradHtmlContent,
                    metadata: {
                        userType: 'postgraduate',
                        moduleCount: postgradModules.length,
                        userEmail: email,
                    }
                });
            });

            emailGroups.push({
                type: 'postgraduate',
                recipientCount: postgradEmails.length,
                moduleCount: postgradModules.length,
            });
        }

        if (emails.length === 0) {
            return res.status(400).json({ 
                error: "No valid emails could be prepared. Check student groups and email addresses.",
                totalModulesFound: modules.length,
                undergradModules: undergradModules.length,
                postgradModules: postgradModules.length,
                undergradStudents: undergradMailingList.length,
                postgradStudents: postgradMailingList.length,
            });
        }

        // Queue the bulk email job
        const jobResult = await emailService.sendBulkEmails(emails, 'advertise_modules', seriesId, {
            emailGroups,
            originalModuleCount: modules.length,
            undergradModules: undergradModules.length,
            postgradModules: postgradModules.length,
        });

        if (!jobResult.success) {
            return res.status(500).json({ 
                error: "Failed to queue advertisement emails",
                details: jobResult.error
            });
        }

        // Update module statuses to "advertised" immediately
        const moduleIds = modules.map(mod => mod._id);
        await ModuleDetails.updateMany(
            { _id: { $in: moduleIds } },
            { $set: { moduleStatus: 'advertised' } }
        );

        console.log(`✅ Queued ${emails.length} advertisement emails for ${modules.length} modules`);

        res.status(200).json({
            message: `Advertisement emails queued successfully`,
            jobId: jobResult.jobId,
            summary: {
                modulesProcessed: modules.length,
                emailsQueued: emails.length,
                undergradModules: undergradModules.length,
                postgradModules: postgradModules.length,
                estimatedDuration: jobResult.estimatedDuration,
            },
            details: {
                jobId: jobResult.jobId,
                queueName: jobResult.queueName,
                emailGroups: emailGroups,
                statusCheckUrl: `/api/jobs/${jobResult.jobId}/status`,
            }
        });

    } catch (error) {
        console.error("Error in advertiseModules function:", error);
        res.status(500).json({ error: "Internal server error while queuing advertisements" });
    }
};

module.exports = {
    createRecruitmentRound,
    getAllRecruitmentRounds,
    addModuleToRecruitmentRound,
    getModuleDetailsBySeriesId,
    getEligibleUndergraduates,
    getEligiblePostgraduates,
    copyRecruitmentRound,
    deleteRecruitmentRound,
    updateRecruitmentRoundDeadlines,
    updateRecruitmentRoundHourLimits,
    notifyModules,
    advertiseModules
};