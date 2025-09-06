const RecruitmentSeries = require("../models/RecruitmentSeries");
const UserGroup = require("../models/UserGroup");
const ModuleDetails = require("../models/ModuleDetails");

const createRecruitmentSeries = async (req, res) => {
    try{
        const name = req.body.name;
        const applicationDueDate = req.body.applicationDueDate;
        const documentDueDate = req.body.documentDueDate;
        const undergradHourLimit = req.body.undergradHourLimit;
        const postgradHourLimit = req.body.postgradHourLimit;
        const undergradMailingList = req.body.undergradMailingList.map((group) => group._id);
        const postgradMailingList = req.body.postgradMailingList.map((group) => group._id);

        const newRecruitmentSeries = new RecruitmentSeries({
            name,
            applicationDueDate,
            documentDueDate,
            undergradHourLimit,
            postgradHourLimit,
            undergradMailingList,
            postgradMailingList,
            status: "initialised"
        });
        console.log("New RecruitmentSeries is going to create",newRecruitmentSeries);
        await newRecruitmentSeries.save();
        res.status(201).json(newRecruitmentSeries);
    } catch (error) {
        console.error("Error creating recruitment series:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

const getAllRecruitmentSeries = async (req, res) => {
    console.log("Fetching all recruitment series");
    try {
        const recruitmentSeriesList = await RecruitmentSeries.find();
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

const addModuleToRecruitmentSeries = async (req, res) => {
    try {
        const seriesId = req.params.seriesId;
        const moduleData = req.body;

        // Find the recruitment series by ID
        const recruitmentSeries = await RecruitmentSeries.findById(seriesId);
        if (!recruitmentSeries) {
            return res.status(404).json({ error: "Recruitment series not found" });
        }

        console.log("Adding module to series:", seriesId, moduleData);

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
            requiredUndergraduateTACount: moduleData.requiredUndergraduateTACount,
            requiredPostgraduateTACount: moduleData.requiredPostgraduateTACount,
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

module.exports = {
    createRecruitmentSeries,
    getAllRecruitmentSeries,
    addModuleToRecruitmentSeries
};