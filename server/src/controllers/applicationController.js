const ModuleDetails = require("../models/ModuleDetails");
const TAApplication = require("../models/TaApplication");
const AppliedModule = require("../models/AppliedModules");
const User = require("../models/User");
const { default: mongoose } = require("mongoose");
const app = require("../app");

const deleteApplication = async (req, res) => {
        const { applicationId } = req.params;

        const application = await TAApplication.findById(applicationId);
        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        const userId = application.userId;
        const moduleId = application.moduleId;
        
        const user = await User.findById(userId);
        console.log("Deleting application for user:", user);
        const module = await ModuleDetails.findById(moduleId);
        const recSeriesId = module.recruitmentSeriesId;
        console.log("Found module:", module);
        const appliedModule = await AppliedModule.findOne({ userId, recSeriesId });
        console.log("Found applied module for user:", appliedModule);
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            if(user && module && appliedModule) {
                const role = user.role;
                const regainingTime = module.requiredTAHours;
                
                // Update available hours
                appliedModule.availableHoursPerWeek += regainingTime;
                
                // Remove application from appliedModules array
                appliedModule.appliedModules = appliedModule.appliedModules.filter(
                    (appId) => appId.toString() !== applicationId.toString()
                );
                await appliedModule.save({ session });
                
                // Update module counts based on role and application status
                if (role === "undergraduate") {
                    module.undergraduateCounts.applied -= 1;
                    if(application.status === "pending"){
                        module.undergraduateCounts.remaining += 1;
                    }else if(application.status === "accepted"){
                        module.undergraduateCounts.reviewed -= 1;
                        module.undergraduateCounts.accepted -= 1;
                        module.undergraduateCounts.remaining += 1;
                    }else if(application.status === "rejected"){
                        module.undergraduateCounts.reviewed -= 1;
                    }
                }else if (role === "postgraduate") {
                    module.postgraduateCounts.applied -= 1;
                    if(application.status === "pending"){
                        module.postgraduateCounts.remaining += 1;
                    }else if(application.status === "accepted"){
                        module.postgraduateCounts.reviewed -= 1;
                        module.postgraduateCounts.accepted -= 1;
                        module.postgraduateCounts.remaining += 1;
                    }else if(application.status === "rejected"){
                        module.postgraduateCounts.reviewed -= 1;
                    }
                }
                await module.save({ session });
                
                // Delete the application last
                await application.deleteOne({ session });
            }else{
                await application.deleteOne({ session });
            }
            await session.commitTransaction();
            session.endSession();
            return res.status(200).json({ message: "Application deleted successfully" });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            return res.status(500).json({ message: "Error deleting application", error });
        }
};

module.exports = {
    deleteApplication,
};