import type { Request, Response } from "express";
const RecruitmentRound = require("../models/RecruitmentRound");
const UserGroup = require("../models/UserGroup");
const ModuleDetails = require("../models/ModuleDetails");
const User = require("../models/User");
const mongoose = require("mongoose");
const emailService = require("../services/emailService");
const config = require("../config/index");

const createRecruitmentRound = async (req: Request, res: Response): Promise<Response> => {
    try{
        const name = req.body.name;
        const applicationDueDate = req.body.applicationDueDate;
        const documentDueDate = req.body.documentDueDate;
        const undergradHourLimit = req.body.undergradHourLimit;
        const postgradHourLimit = req.body.postgradHourLimit;
        const undergradMailingList = req.body.undergradMailingList.map((group: any) => group._id);
        const postgradMailingList = req.body.postgradMailingList.map((group: any) => group._id);

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
        const result = await newRecruitmentRound.save();
        return res.status(201).json(result);
    } catch (error) {
        console.error("Error creating recruitment series:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

const getAllRecruitmentRounds = async (req: Request, res: Response): Promise<Response> => {
    console.log("Fetching all recruitment series");
    try {
        const recruitmentSeriesList = await RecruitmentRound.find();
        const resDataList = await Promise.all(recruitmentSeriesList.map(async (series: any) => {
            const undergradGroups = await Promise.all(series.undergradMailingList.map((group_id: any) => UserGroup.findById(group_id)));
            const postgradGroups = await Promise.all(series.postgradMailingList.map((group_id: any) => UserGroup.findById(group_id)));

            return {
                ...series._doc,
                undergradMailingList: undergradGroups.filter(group => group !== null),
                postgradMailingList: postgradGroups.filter(group => group !== null)
            };
        }));
        return res.status(200).json(resDataList);
    } catch (error) {
        console.error("Error fetching recruitment series:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

const addModuleToRecruitmentRound = async (req: Request, res: Response): Promise<Response> => {
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

        return res.status(200).json(recruitmentSeries);
    } catch (error) {
        console.error("Error adding module to recruitment series:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

const getModuleDetailsBySeriesId = async (req: Request, res: Response): Promise<Response> => {
    try {
        const seriesId = req.params.seriesId;
        const moduleDetails = await ModuleDetails.find({ recruitmentSeriesId: seriesId });
        const populatedModuleDetails = await Promise.all(moduleDetails.map(async (module: any) => {
            const coordinatorDetails = await Promise.all(
                module.coordinators.map(async (coordinatorId: any) => {
                    const user = await User.findById(coordinatorId, "displayName email profilePicture");
                    if (user) {
                        return {
                            id: user._id,
                            displayName: (user as any).displayName,
                            email: user.email,
                            profilePicture: (user as any).profilePicture
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
        return res.status(200).json(populatedModuleDetails);
    } catch (error) {
        console.error("Error fetching module details:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
                                                                                                                
const getModulesForRounds = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { roundIds } = req.body;

        // Validate input
        if (!roundIds || !Array.isArray(roundIds) || roundIds.length === 0) {
            return res.status(400).json({ error: "roundIds array is required" });
        }

        console.log(`Fetching modules for ${roundIds.length} recruitment rounds`);

        // Fetch all modules for the given round IDs
        const moduleDetails = await ModuleDetails.find({ 
            recruitmentSeriesId: { $in: roundIds } 
        });

        console.log(`Found ${moduleDetails.length} modules across ${roundIds.length} rounds`);

        // Populate coordinator details for all modules
        const populatedModuleDetails = await Promise.all(moduleDetails.map(async (module: any) => {
            const coordinatorDetails = await Promise.all(
                module.coordinators.map(async (coordinatorId: any) => {
                    const user = await User.findById(coordinatorId, "displayName email profilePicture");
                    if (user) {
                        return {
                            id: user._id,
                            displayName: (user as any).displayName,
                            email: user.email,
                            profilePicture: (user as any).profilePicture
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

        // Group modules by recruitment round ID
        const modulesByRound: any = {};
        roundIds.forEach((roundId: any) => {
            modulesByRound[roundId] = populatedModuleDetails.filter(
                (module: any) => module.recruitmentSeriesId.toString() === roundId.toString()
            );
        });

        return res.status(200).json(modulesByRound);
    } catch (error) {
        console.error("Error fetching modules for rounds:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

const getEligibleUndergraduates = async (req: Request, res: Response): Promise<Response> => {
    try {
        const seriesId = req.params.seriesId;
        const recruitmentSeries = await RecruitmentRound.findById(seriesId);
        if (!recruitmentSeries) {
            return res.status(404).json({ error: "Recruitment series not found" });
        }
        const undergradGroups = recruitmentSeries.undergradMailingList;
        const eligibleUndergraduates = await User.find({ userGroup: { $in: undergradGroups }, role: 'undergraduate' });
        return res.status(200).json(eligibleUndergraduates);
    } catch (error) {
        console.error("Error fetching eligible undergraduates:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

const getEligiblePostgraduates = async (req: Request, res: Response): Promise<Response> => {
    try {
        const seriesId = req.params.seriesId;
        const recruitmentSeries = await RecruitmentRound.findById(seriesId);
        if (!recruitmentSeries) {
            return res.status(404).json({ error: "Recruitment series not found" });
        }
        const postgradGroups = recruitmentSeries.postgradMailingList;
        const eligiblePostgraduates = await User.find({ userGroup: { $in: postgradGroups }, role: 'postgraduate' });
        return res.status(200).json(eligiblePostgraduates);
    } catch (error) {
        console.error("Error fetching eligible postgraduates:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

const copyRecruitmentRound = async (req: Request, res: Response): Promise<Response> => {
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

        let modulesToCopy: any[] = [];
        if (modules.length > 0) {
            modulesToCopy = await ModuleDetails.find({ _id: { $in: modules }, recruitmentSeriesId: seriesId }).session(session);
            await Promise.all(modulesToCopy.map(async (module: any) => {
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
            newSeries.undergraduateTAPositionsCount = modulesToCopy.reduce((sum: number, mod: any) => sum + (mod.undergraduateCounts ? mod.undergraduateCounts.required : 0), 0);
            newSeries.postgraduateTAPositionsCount = modulesToCopy.reduce((sum: number, mod: any) => sum + (mod.postgraduateCounts ? mod.postgraduateCounts.required : 0), 0);
            await newSeries.save({ session });
        }

        await session.commitTransaction();
        const undergradMailingGroups = await Promise.all(newSeries.undergradMailingList.map((groupId: any) => UserGroup.findById(groupId)));
        const postgradMailingGroups = await Promise.all(newSeries.postgradMailingList.map((groupId: any) => UserGroup.findById(groupId)));
        const returningRR = {
            ...(newSeries as any)._doc,
            undergradMailingList: undergradMailingGroups,
            postgradMailingList: postgradMailingGroups
        }
        const returningModules = await Promise.all(modulesToCopy.map(async (module: any) => {
            const coordinatorDetails = await Promise.all(
                module.coordinators.map(async (coordinatorId: any) => {
                    const user = await User.findById(coordinatorId, "displayName email profilePicture");
                    if (user) {
                        return {
                            id: user._id,
                            displayName: (user as any).displayName,
                            email: user.email,
                            profilePicture: (user as any).profilePicture
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

        return res.status(201).json({ 
            message: "The new recruitment round created successfully including " + modulesToCopy.length + " modules.",
            recruitmentRound: returningRR,
            modulesCopied: returningModules
        });
    } catch (error) {
        await session.abortTransaction();
        console.error("Error copying recruitment round:", error);
        return res.status(500).json({ error: "Internal server error" });
    } finally {
        session.endSession();
    }
};

const deleteRecruitmentRound = async (req: Request, res: Response): Promise<Response> => {
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
        return res.status(200).json({ message: "Recruitment round deleted successfully" });
    } catch (error) {
        await session.abortTransaction();
        console.error("Error deleting recruitment round:", error);
        return res.status(500).json({ error: "Internal server error" });
    } finally {
        session.endSession();
    }
};

const updateRecruitmentRound = async (req: Request, res: Response): Promise<Response> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { seriesId } = req.params;
        const { 
            name, 
            applicationDueDate, 
            documentDueDate, 
            undergradHourLimit, 
            postgradHourLimit, 
            undergradMailingList, 
            postgradMailingList,
            updateModuleDeadlines = true
        } = req.body;

        // Validate input
        if (!seriesId) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ error: "seriesId is required" });
        }

        // Find the recruitment series
        const recruitmentSeries = await RecruitmentRound.findById(seriesId).session(session);
        if (!recruitmentSeries) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ error: "Recruitment round not found" });
        }

        // Validate dates
        if (applicationDueDate && documentDueDate) {
            const appDate = new Date(applicationDueDate);
            const docDate = new Date(documentDueDate);

            if (appDate > docDate) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ 
                    error: "Application due date must be on or before document due date" 
                });
            }
        }

        // Validate hour limits
        if (undergradHourLimit !== undefined && (undergradHourLimit <= 0 || undergradHourLimit > 50)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ 
                error: "Undergraduate hour limit must be between 1 and 50" 
            });
        }

        if (postgradHourLimit !== undefined && (postgradHourLimit <= 0 || postgradHourLimit > 50)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ 
                error: "Postgraduate hour limit must be between 1 and 50" 
            });
        }

        // Check if dates are being updated
        const datesUpdated = (applicationDueDate !== undefined && applicationDueDate !== recruitmentSeries.applicationDueDate.toISOString()) ||
                            (documentDueDate !== undefined && documentDueDate !== recruitmentSeries.documentDueDate.toISOString());

        // Update fields if provided
        if (name !== undefined) recruitmentSeries.name = name;
        if (applicationDueDate !== undefined) recruitmentSeries.applicationDueDate = new Date(applicationDueDate);
        if (documentDueDate !== undefined) recruitmentSeries.documentDueDate = new Date(documentDueDate);
        if (undergradHourLimit !== undefined) recruitmentSeries.undergradHourLimit = undergradHourLimit;
        if (postgradHourLimit !== undefined) recruitmentSeries.postgradHourLimit = postgradHourLimit;
        if (undergradMailingList !== undefined) recruitmentSeries.undergradMailingList = undergradMailingList;
        if (postgradMailingList !== undefined) recruitmentSeries.postgradMailingList = postgradMailingList;

        await recruitmentSeries.save({ session });

        let modulesUpdated = 0;

        // Update module deadlines if dates were changed and updateModuleDeadlines is true
        if (datesUpdated && updateModuleDeadlines) {
            const updateFields: any = {};
            if (applicationDueDate !== undefined) updateFields.applicationDueDate = new Date(applicationDueDate);
            if (documentDueDate !== undefined) updateFields.documentDueDate = new Date(documentDueDate);

            if (Object.keys(updateFields).length > 0) {
                const moduleUpdateResult = await ModuleDetails.updateMany(
                    { recruitmentSeriesId: seriesId },
                    { $set: updateFields }
                ).session(session);
                modulesUpdated = moduleUpdateResult.modifiedCount || 0;
            }
        }

        await session.commitTransaction();

        console.log(`✅ Recruitment round ${seriesId} has been updated. ${modulesUpdated} modules updated.`);

        return res.status(200).json({ 
            message: datesUpdated && updateModuleDeadlines && modulesUpdated > 0
                ? `Recruitment round updated successfully. ${modulesUpdated} modules also updated.`
                : "Recruitment round updated successfully",
            recruitmentSeries: {
                _id: recruitmentSeries._id,
                name: recruitmentSeries.name,
                status: recruitmentSeries.status,
                applicationDueDate: recruitmentSeries.applicationDueDate,
                documentDueDate: recruitmentSeries.documentDueDate,
                undergradHourLimit: recruitmentSeries.undergradHourLimit,
                postgradHourLimit: recruitmentSeries.postgradHourLimit
            },
            modulesUpdated: modulesUpdated
        });
    } catch (error) {
        await session.abortTransaction();
        console.error("Error updating recruitment round:", error);
        return res.status(500).json({ error: "Internal server error" });
    } finally {
        session.endSession();
    }
};

const updateRecruitmentRoundDeadlines = async (req: Request, res: Response): Promise<Response> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { seriesId } = req.params;
        const { applicationDueDate, documentDueDate, updateModuleDeadlines = true } = req.body;

        // Validate required fields
        if (!applicationDueDate || !documentDueDate) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ error: "Both application due date and document due date are required" });
        }

        // Validate dates
        const appDate = new Date(applicationDueDate);
        const docDate = new Date(documentDueDate);
        const now = new Date();

        if (appDate <= now) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ error: "Application due date must be in the future" });
        }

        if (docDate <= now) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ error: "Document due date must be in the future" });
        }

        if (appDate > docDate) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ error: "Application due date must be on or before document due date" });
        }

        // Find and update the recruitment series
        const recruitmentSeries = await RecruitmentRound.findById(seriesId).session(session);
        if (!recruitmentSeries) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ error: "Recruitment series not found" });
        }

        recruitmentSeries.applicationDueDate = appDate;
        recruitmentSeries.documentDueDate = docDate;
        await recruitmentSeries.save({ session });

        let modulesUpdated: any = 0;
        
        // Update module deadlines if requested
        if (updateModuleDeadlines) {
            const moduleUpdateResult = await ModuleDetails.updateMany(
                { recruitmentSeriesId: seriesId },
                { 
                    $set: { 
                        applicationDueDate: appDate,
                        documentDueDate: docDate 
                    } 
                }
            ).session(session);
            modulesUpdated = moduleUpdateResult;
        }

        await session.commitTransaction();

        console.log(`✅ Recruitment round ${seriesId} deadlines updated. ${modulesUpdated} modules updated.`);

        return res.status(200).json({ 
            message: updateModuleDeadlines 
                ? `Deadlines updated successfully. ${modulesUpdated} modules also updated.`
                : "Deadlines updated successfully",
            recruitmentSeries: {
                _id: recruitmentSeries._id,
                applicationDueDate: recruitmentSeries.applicationDueDate,
                documentDueDate: recruitmentSeries.documentDueDate
            },
            modulesUpdated: modulesUpdated
        });
    } catch (error) {
        await session.abortTransaction();
        console.error("Error updating recruitment round deadlines:", error);
        return res.status(500).json({ error: "Internal server error" });
    } finally {
        session.endSession();
    }
};

const updateRecruitmentRoundHourLimits = async (req: Request, res: Response): Promise<Response> => {
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

        return res.status(200).json({ 
            message: "Hour limits updated successfully",
            recruitmentSeries: {
                _id: recruitmentSeries._id,
                undergradHourLimit: recruitmentSeries.undergradHourLimit,
                postgradHourLimit: recruitmentSeries.postgradHourLimit
            }
        });
    } catch (error) {
        console.error("Error updating recruitment round hour limits:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

const notifyModules = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { seriesId } = req.params;

        // Validate input
        if (!seriesId) {
            return res.status(400).json({ error: "seriesId is required" });
        }

        console.log(`Starting notification process for recruitment series ${seriesId}`);
        
        // Find all initialised modules in the recruitment series
        console.log(`🔍 Searching for modules with seriesId: ${seriesId} and status: "initialised"`);
        const modules = await ModuleDetails.find({ 
            recruitmentSeriesId: seriesId,
            moduleStatus: "initialised" 
        }).lean();
        
        console.log(`📊 Found ${modules.length} modules to process`);
        
        if (modules.length === 0) {
            return res.status(404).json({ error: "No initialised modules found in this recruitment series" });
        }

        // Prepare emails for job queue
        const emails = [];
        const moduleUpdates = [];

        for (const module of modules as any[]) {
            try {
                console.log(`🔍 Processing module: ${module.moduleCode} - ${module.moduleName}`);
                
                if (!module.coordinators || module.coordinators.length === 0) {
                    console.warn(`Module ${module.moduleCode} has no coordinators assigned - skipping`);
                    continue;
                }

                console.log(`👥 Fetching ${module.coordinators.length} coordinators for ${module.moduleCode}`);
                // Fetch coordinators for this module
                const coordinators = await User.find({ 
                    _id: { $in: module.coordinators },
                    email: { $exists: true, $ne: '' }
                }).lean();
                
                console.log(`✅ Found ${coordinators.length} coordinators with valid emails for ${module.moduleCode}`);

                if (coordinators.length === 0) {
                    console.warn(`Module ${module.moduleCode} has no coordinators with valid email addresses - skipping`);
                    continue;
                }

                const emailAddresses = coordinators.map((coordinator: any) => coordinator.email);
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

                await emailService.sendEmail(emailAddresses, subject, htmlContent).then(async (result: boolean) => {
                    if (result) {
                        await ModuleDetails.updateOne(
                            { _id: module._id },
                            { $set: { moduleStatus: "pending changes" } }
                        );
                        console.log(`✅ Notification email sent for module ${module.moduleCode}`);
                    } else {
                        console.error(`❌ Failed to send notification email for module ${module.moduleCode}`);
                    }
                });

                // Track modules that will be updated
                moduleUpdates.push(module._id);

            } catch (moduleError) {
                console.error(`Error preparing notification for module ${module.moduleCode}:`, moduleError);
            }
        }

        return res.status(200).json({
            message: `Notification emails sent successfully`,
        });

    } catch (error) {
        console.error("Error in notifyModules function:", error);
        return res.status(500).json({ error: "Internal server error while queuing notifications" });
    }
};

const advertiseModules = async (req: Request, res: Response): Promise<Response> => {
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
                userGroup: { $in: (recruitmentSeries as any).undergradMailingList }, 
                role: 'undergraduate',
                email: { $exists: true, $ne: '' }
            }, 'email displayName').lean(),
            User.find({ 
                userGroup: { $in: (recruitmentSeries as any).postgradMailingList }, 
                role: 'postgraduate',
                email: { $exists: true, $ne: '' }
            }, 'email displayName').lean()
        ]);

        // Categorize modules and collect semester information
        const undergradModules: any[] = [];
        const postgradModules: any[] = [];
        const underSemesters = new Set();
        const postSemesters = new Set();

        modules.forEach((module: any) => {
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
            const undergradEmails = undergradMailingList.map((user: any) => user.email);
            const undergradSubject = `New TA Opportunities Available - Semester${underSemesters.size > 1 ? 's' : ''} ${Array.from(underSemesters).sort().join(', ')}`;
            
            const undergradHtmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #007bff;">New TA Opportunities Available!</h2>
                    <p>Dear Undergraduate Student,</p>
                    <p>We are excited to announce that TA positions are now available for the following modules:</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
                        ${undergradModules.map((mod: any) => `
                            <div style="margin-bottom: 15px; padding: 15px; background-color: white; border-left: 4px solid #28a745; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                                <strong style="font-size: 16px; color: #28a745;">${mod.moduleCode} - ${mod.moduleName}</strong><br>
                                <span style="color: #6c757d; font-size: 14px;">Semester: ${mod.semester}</span><br>
                                ${mod.undergraduateCounts ? `<span style="color: #007bff; font-weight: 500;">Positions Available: ${mod.undergraduateCounts.required}</span><br>` : ''}
                                ${mod.requiredTAHours ? `<span style="color: #fd7e14; font-weight: 500;">Hours per week: ${mod.requiredTAHours}</span><br>` : ''}
                                <div style="margin-top: 10px; padding: 8px; background-color: #f8f9fa; border-radius: 4px;">
                                    <strong style="color: #dc3545; font-size: 14px;">📅 Module Deadlines:</strong><br>
                                    <span style="color: #dc3545; font-size: 13px;">Application Due: ${new Date(mod.applicationDueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span><br>
                                    <span style="color: #dc3545; font-size: 13px;">Document Due: ${new Date(mod.documentDueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div style="background-color: #e7f3ff; padding: 15px; margin: 20px 0; border-radius: 5px;">
                        <strong>General Information:</strong><br>
                        Hour Limit: ${(recruitmentSeries as any).undergradHourLimit} hours per week<br>
                        <small style="color: #6c757d;">Note: Each module may have different application and document deadlines as shown above.</small>
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

            await emailService.sendEmail(undergradEmails, undergradSubject, undergradHtmlContent).then(async (result: boolean) => {
                if (result) {
                    console.log(`✅ Advertisement emails sent to undergraduates`);
                    await ModuleDetails.updateMany(
                        { _id: { $in: undergradModules.map((mod: any) => mod._id) } },
                        { $set: { moduleStatus: 'advertised' } }
                    ).then(() => {
                        console.log(`✅ Updated module statuses to 'advertised' for undergraduate modules`);
                    });
                }
            });
        }

        // Prepare postgraduate emails
        if (postgradModules.length > 0 && postgradMailingList.length > 0) {
            const postgradEmails = postgradMailingList.map((user: any) => user.email);
            const postgradSubject = `New TA Opportunities Available - Semester${postSemesters.size > 1 ? 's' : ''} ${Array.from(postSemesters).sort().join(', ')}`;
            
            const postgradHtmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #007bff;">New TA Opportunities Available!</h2>
                    <p>Dear Postgraduate Student,</p>
                    <p>We are excited to announce that TA positions are now available for the following modules:</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
                        ${postgradModules.map((mod: any) => `
                            <div style="margin-bottom: 15px; padding: 15px; background-color: white; border-left: 4px solid #6f42c1; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                                <strong style="font-size: 16px; color: #6f42c1;">${mod.moduleCode} - ${mod.moduleName}</strong><br>
                                <span style="color: #6c757d; font-size: 14px;">Semester: ${mod.semester}</span><br>
                                ${mod.postgraduateCounts ? `<span style="color: #007bff; font-weight: 500;">Positions Available: ${mod.postgraduateCounts.required}</span><br>` : ''}
                                ${mod.requiredTAHours ? `<span style="color: #fd7e14; font-weight: 500;">Hours per week: ${mod.requiredTAHours}</span><br>` : ''}
                                <div style="margin-top: 10px; padding: 8px; background-color: #f8f9fa; border-radius: 4px;">
                                    <strong style="color: #dc3545; font-size: 14px;">📅 Module Deadlines:</strong><br>
                                    <span style="color: #dc3545; font-size: 13px;">Application Due: ${new Date(mod.applicationDueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span><br>
                                    <span style="color: #dc3545; font-size: 13px;">Document Due: ${new Date(mod.documentDueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div style="background-color: #f3e7ff; padding: 15px; margin: 20px 0; border-radius: 5px;">
                        <strong>General Information:</strong><br>
                        Hour Limit: ${(recruitmentSeries as any).postgradHourLimit} hours per week<br>
                        <small style="color: #6c757d;">Note: Each module may have different application and document deadlines as shown above.</small>
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

            await emailService.sendEmail(postgradEmails, postgradSubject, postgradHtmlContent).then(async (result: boolean) => {
                if (result) {
                    console.log(`✅ Advertisement emails sent to postgraduates`);
                    await ModuleDetails.updateMany(
                        { _id: { $in: postgradModules.map((mod: any) => mod._id) } },
                        { $set: { moduleStatus: 'advertised' } }
                    ).then(async () => {
                        console.log(`✅ Updated module statuses to 'advertised' for postgraduate modules`);
                        if((recruitmentSeries as any).status !== 'active') {
                            // If the recruitment series is not active, we can archive it
                            await RecruitmentRound.updateOne(
                                { _id: seriesId },
                                { $set: { status: 'active' } }
                            );
                        }
                    });
                }
            });
        }

        return res.status(200).json({ message: "Modules advertised successfully" });

    } catch (error) {
        console.error("Error in advertiseModules function:", error);
        return res.status(500).json({ error: "Internal server error while queuing advertisements" });
    }
};

const closeRecruitmentRound = async (req: Request, res: Response): Promise<Response> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { seriesId } = req.params;

        // Validate input
        if (!seriesId) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ error: "seriesId is required" });
        }

        // Find the recruitment series
        const recruitmentSeries = await RecruitmentRound.findById(seriesId).session(session);
        if (!recruitmentSeries) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ error: "Recruitment round not found" });
        }

        // Check if the recruitment round can be closed
        if (recruitmentSeries.status === 'closed') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ error: "Recruitment round is already closed" });
        }

        if (recruitmentSeries.status === 'archived') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ error: "Cannot close an archived recruitment round" });
        }

        // Update all modules in this recruitment series to 'closed' status
        const moduleUpdateResult = await ModuleDetails.updateMany(
            { recruitmentSeriesId: seriesId },
            { $set: { moduleStatus: 'closed' } }
        ).session(session);

        // Update the recruitment series status to closed
        recruitmentSeries.status = 'closed';
        await recruitmentSeries.save({ session });

        await session.commitTransaction();

        console.log(`✅ Recruitment round ${seriesId} has been closed. ${moduleUpdateResult.modifiedCount} modules updated to 'closed' status.`);

        return res.status(200).json({ 
            message: "Recruitment round closed successfully",
            recruitmentSeries: {
                _id: recruitmentSeries._id,
                name: recruitmentSeries.name,
                status: recruitmentSeries.status
            },
            modulesUpdated: moduleUpdateResult.modifiedCount
        });
    } catch (error) {
        await session.abortTransaction();
        console.error("Error closing recruitment round:", error);
        return res.status(500).json({ error: "Internal server error" });
    } finally {
        session.endSession();
    }
};

const archiveRecruitmentRound = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { seriesId } = req.params;

        // Validate input
        if (!seriesId) {
            return res.status(400).json({ error: "seriesId is required" });
        }

        // Find the recruitment series
        const recruitmentSeries = await RecruitmentRound.findById(seriesId);
        if (!recruitmentSeries) {
            return res.status(404).json({ error: "Recruitment round not found" });
        }

        // Check if the recruitment round can be archived
        if (recruitmentSeries.status === 'archived') {
            return res.status(400).json({ error: "Recruitment round is already archived" });
        }

        if (recruitmentSeries.status !== 'closed') {
            return res.status(400).json({ error: "Only closed recruitment rounds can be archived" });
        }

        // Update the status to archived
        recruitmentSeries.status = 'archived';
        await recruitmentSeries.save();

        console.log(`✅ Recruitment round ${seriesId} has been archived`);

        return res.status(200).json({ 
            message: "Recruitment round archived successfully",
            recruitmentSeries: {
                _id: recruitmentSeries._id,
                name: recruitmentSeries.name,
                status: recruitmentSeries.status
            }
        });
    } catch (error) {
        console.error("Error archiving recruitment round:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    createRecruitmentRound,
    getAllRecruitmentRounds,
    addModuleToRecruitmentRound,
    getModuleDetailsBySeriesId,
    getModulesForRounds,
    getEligibleUndergraduates,
    getEligiblePostgraduates,
    copyRecruitmentRound,
    deleteRecruitmentRound,
    updateRecruitmentRound,
    updateRecruitmentRoundDeadlines,
    updateRecruitmentRoundHourLimits,
    notifyModules,
    advertiseModules,
    closeRecruitmentRound,
    archiveRecruitmentRound
};
