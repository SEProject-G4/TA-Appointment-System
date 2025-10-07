const RecruitmentRound = require("../models/RecruitmentRound");
const UserGroup = require("../models/UserGroup");
const ModuleDetails = require("../models/ModuleDetails");
const User = require("../models/User");
const { default: mongoose } = require("mongoose");

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

module.exports = {
    createRecruitmentRound,
    getAllRecruitmentRounds,
    addModuleToRecruitmentRound,
    getModuleDetailsBySeriesId,
    getEligibleUndergraduates,
    getEligiblePostgraduates,
    copyRecruitmentRound,
    deleteRecruitmentRound
};