const { get, default: mongoose, model } = require("mongoose");
const app = require("../app");
const ModuleDetails = require("../models/ModuleDetails");
const TaApplication = require("../models/TaApplication");
const User = require("../models/User");
const RecruitmentSeries = require("../models/RecruitmentRound");
const AppliedModules = require("../models/AppliedModules");

// fetching all the available modules that have been advertised by admin for the active recruitment series-------------------------------
// and that the user has not already applied for. and satisfies the available ta hours condition
const getAllRequests = async (req, res) => {
  const userId = req.query.userId; //fetch userID from query parameters

  try {
    const user = await User.findById(userId); //fetch user object details using userID
    const userGroupID = user.userGroup;
    const userRole = user.role; //based on the user role undergrad or postgrad, we can fetch their modules

    let activeRecSeries = []; //get the active recruitment series for the user, based on their role
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

    const recSeriesIds = activeRecSeries.map((r) => r._id);

    const appliedModules = await AppliedModules.find(
      //fetch the applied modules for the user for the active recruitment series
      { userId, recSeriesId: { $in: recSeriesIds } },
      { appliedModules: 1, availableHoursPerWeek: 1 }
    ).populate("appliedModules");

    const appliedModulesIds = appliedModules.flatMap((am) =>
      am.appliedModules.map((app) => app.moduleId)
    );

    const hoursFilter = appliedModules?.[0]?.availableHoursPerWeek
      ? { requiredTAHours: { $lte: appliedModules[0].availableHoursPerWeek } }
      : {};

    const modules = await ModuleDetails.find({
      recruitmentSeriesId: { $in: recSeriesIds },
      moduleStatus: "advertised",
      _id: { $nin: appliedModulesIds },
      ...hoursFilter,
      ...(userRole === "undergraduate"
        ? { openForUndergraduates: true }
        : { openForPostgraduates: true }),
    });
    //fetch the available modules that have been advertised by admin.
    // and required ta hours should be less than or equal to available hours per week of the user

    const allCoordinators = modules.flatMap((module) => module.coordinators); //get the names of the module co-ordinators
    const uniqueCoordinators = [...new Set(allCoordinators)];
    const coordinatorDetails = await User.find(
      { _id: { $in: uniqueCoordinators } },
      { _id: 1, name: 1 }
    );
    const coordinatorMap = coordinatorDetails.reduce((map, user) => {
      map[user._id] = user.name;
      return map;
    }, {});

    const updatedModules = modules.map((module) => {
      const obj = module.toObject();
      return {
        ...obj,
        coordinators: obj.coordinators.map((id) => coordinatorMap[id] || "-"),
      };
    });

    res.status(200).json({
      updatedModules,
      availableHoursPerWeek: appliedModules[0]?.availableHoursPerWeek !== undefined
        ? appliedModules[0].availableHoursPerWeek
        : (userRole === "undergraduate" ? 6 : 10),
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching available TA positions", error });
    console.error("Error fetching available TA positions:", error);
  }
};

// Applying for a TA position-----------------------------------------------------------------------------------------------------------
const applyForTA = async (req, res) => {
  const { userId, userRole, moduleId, recSeriesId, taHours } = req.body;
  // console.log(userId, userRole, moduleId, recSeriesId, taHours);

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    // check if the user has already applied for this module
    const existingApplication = await TaApplication.findOne({
      userId,
      moduleId,
    }).session(session);
    if (existingApplication) {
      throw new Error("You have already applied for this module");
    }
    // check available hours
    let appliedModules = await AppliedModules.findOne({
      userId,
      recSeriesId,
    }).session(session);
    if (appliedModules && appliedModules.availableHoursPerWeek < taHours) {
      throw new Error("Insufficient available hours to apply for this module");
    }
    // increase applied count
    let updateModule;
    if (userRole === "undergraduate") {
      updateModule = await ModuleDetails.findOneAndUpdate(
        {
          _id: moduleId,
          $expr: {
            $gt: [
              "$undergraduateCounts.remaining",
              0
            ],
          },
        },
        {
          $inc: { "undergraduateCounts.applied": 1 ,
          "undergraduateCounts.remaining":-1 },
        },
        { new: true, session, runValidators: true }
      );
    } else if (userRole === "postgraduate") {
      updateModule = await ModuleDetails.findOneAndUpdate(
        {
          _id: moduleId,
          $expr: {
            $gt: [
              "$postgraduateCounts.remaining",
              0
            ],
          }, 
        }, 
        {
          $inc: { "postgraduateCounts.applied": 1 ,
           "postgraduateCounts.remaining": -1 },
        },
        { new: true, session, runValidators: true }
      );
    }
    if (!updateModule) {
      throw new Error("TA positions for this module are already filled");
    }

    // create new TA application
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
        availableHoursPerWeek:
          userRole === "undergraduate" ? 6 - taHours : 10 - taHours,
      });
      await appliedModules.save({ session });
    }
    // commit transaction since everything is successful
    await session.commitTransaction();
    console.log("Transaction committed.");
    res.status(201).json({
      message: "Application submitted successfully",
      application: taApplication,
    });
  } catch (error) {
    // abort transaction in case of error
    await session.abortTransaction();
    console.error("Transaction aborted due to error:", error);
    res.status(500).json({
      message: error.message || "Error submitting application",
      error,
    });
  } finally {
    session.endSession();
    console.log("Session ended");
  }
};

// get applied modules for a user---------------------------------------------------------------------------------------------------------
const getAppliedModules = async (req, res) => {
  const userId = req.query.userId;

  try {
    const user = await User.findById(userId);
    const userGroupID = user.userGroup;
    const userRole = user.role;

    let activeRecSeries = [];
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

    // fetch AppliedModules with nested populate
    const appliedModulesDocs = await AppliedModules.find({
      userId,
      recSeriesId: { $in: activeRecSeries.map((r) => r._id) },
    }).populate({
      path: "appliedModules",
      populate: { path: "moduleId", model: "ModuleDetails" },
    });

    // flatten into actual TaApplications
    const allApplications = appliedModulesDocs.flatMap(
      (am) => am.appliedModules
    );

    // collect coordinators
    const coordinatorIds = allApplications.flatMap(
      (app) => app.moduleId.coordinators
    );
    const coordinators = await User.find({ _id: { $in: coordinatorIds } });
    const coordinatorMap = coordinators.reduce((map, user) => {
      map[user._id] = user.name;
      return map;
    }, {});

    // attach coordinator names to moduleId
    const updatedApplications = allApplications.map((app) => ({
      ...app.toObject(),
      moduleId: {
        ...app.moduleId.toObject(),
        coordinators: app.moduleId.coordinators.map(
          (id) => coordinatorMap[id] || "-"
        ),
      },
    }));

    res.status(200).json(updatedApplications);
  } catch (error) {
    console.error("Error fetching applied modules:", error);
    res.status(500).json({ message: "Error fetching applied modules", error });
  }
};

const getAcceptedModules = async (req, res) => {
  const userId = req.query.userId;

  try {
    // Find the user's active recruitment series (like before)
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const userGroupID = user.userGroup;
    const userRole = user.role;

    let activeRecSeries = [];
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

    // Fetch only accepted applications inside AppliedModules
    const acceptedApplications = await AppliedModules.find({
      userId,
      recSeriesId: { $in: activeRecSeries.map((r) => r._id) },
    }).populate({
      path: "appliedModules",
      match: { status: "accepted" }, // ✅ filter accepted only
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
    
    // Correctly fetch the document submission status
    const appliedModulesDoc = await AppliedModules.findOne({ 
      userId, 
      recSeriesId: activeRecSeries[0]._id 
    });
    const docSubmissionStatus = appliedModulesDoc?.isDocSubmitted || false;

    res.status(200).json({ acceptedApplications, docSubmissionStatus });
  } catch (error) {
    console.error("Error fetching accepted modules:", error);
    res.status(500).json({ message: "Error fetching accepted modules", error });
  }
};

module.exports = {
  getAllRequests,
  applyForTA,
  getAppliedModules,
  getAcceptedModules,
};
