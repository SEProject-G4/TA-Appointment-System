const ModuleDetails = require("../models/ModuleDetails");
const User = require("../models/User");
const RecruitmentRound = require("../models/RecruitmentRound");
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

module.exports = {
    getModuleDetailsById,
    changeModuleStatus,
    advertiseModule,
};