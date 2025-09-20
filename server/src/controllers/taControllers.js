const { get } = require("mongoose");
const app = require("../app");
const ModuleDetails = require("../models/ModuleDetails");
const TaApplication = require("../models/TaApplication");
const User = require("../models/User");
const RecruitmentSeries = require("../models/recruitmentSeries");
const AppliedModules = require("../models/AppliedModules");

// fetching all the available modules that have been advertised by admin for the active recruitment series
const getAllRequests = async (req, res) => {
  const userId = req.query.userId; //fetch userID from query parameters

  try {
    const user = await User.findById(userId); //fetch user object details using userID
    console.log(user);
    const userGroupID = user.userGroup;
    const userRole = user.role;

    let activeRecSeries = []; //get the active recruitment series for the user based on their role
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
    console.log(userRole, userGroupID, activeRecSeries);
    const recSeriesIds = activeRecSeries.map((r) => r._id);
    console.log(recSeriesIds);
    const appliedModules = await AppliedModules.find({ userId, recSeriesId: { $in: recSeriesIds } }, { appliedModules: 1 }).populate('appliedModules'); ;
    console.log("applied modules",appliedModules);
    const appliedModulesIds= appliedModules.flatMap(am => am.appliedModules.map(app => app.moduleId));
    console.log("applied module ids",appliedModulesIds);

    const modules = await ModuleDetails.find({
      recruitmentSeriesId: { $in: recSeriesIds },
      moduleStatus: "advertised",
      _id: { $nin: appliedModulesIds}
    }); //fetch the available modules that have been advertised by admin.
    
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
    console.log(coordinatorMap);
    const updatedModules = modules.map((module) => {
      const obj = module.toObject();
      return {
        ...obj,
        coordinators: obj.coordinators.map((id) => coordinatorMap[id] || "-"),
      };
    });

    res.status(200).json(updatedModules);
  } catch (error) {
    res.status(500).json({ message: "Error fetching modules", error });
    console.error("Error fetching modules:", error);
  }
};

// Applying for a TA position
const applyForTA = async (req, res) => {
  const { userId, userRole, moduleId, recSeriesId, taHours } = req.body;
  console.log(userId, userRole, moduleId, recSeriesId, taHours);
  try {
    const taApplication = new TaApplication({
      userId,
      moduleId,
    });
    // create ne TA application
    await taApplication.save();
    console.log("application saved successfully", taApplication);

    // update the applied modules collection
    let appliedModules = await AppliedModules.findOneAndUpdate(
      {
        userId,
        recSeriesId,
        availableHoursPerWeek: { $gte: taHours },
      },
      {
        $inc: { availableHoursPerWeek: -taHours },
        $push: { appliedModules: taApplication._id },
      },
      { new: true }
    );
    if (!appliedModules) {
      const existing = await AppliedModules.findOne({ userId, recSeriesId });
      if (existing) {
        return res.status(400).json({
          message: "Insufficient available hours to apply for this module",
        });
      }
      appliedModules = new AppliedModules({
        userId,
        recSeriesId,
        appliedModules: [taApplication._id],
        availableHoursPerWeek:
          userRole === "undergraduate" ? 6 - taHours : 10 - taHours,
      });
      await appliedModules.save();
      console.log(appliedModules);

      res.status(201).json({
        message: "Application submitted successfully",
        application: taApplication,
      });
    }
  } catch (error) {
    console.error("Error submitting application");
    res.status(500).json({ message: "Error submitting application", error });
  }
};

const getAppliedModules = async (req, res) => {
  const userId = req.query.userId;

  try {
    const applications = await TaApplication.find({ userId }).populate(
      "moduleId"
    );
    const coordinatorIds = applications.flatMap(
      (app) => app.moduleId.coordinators
    ); //may have repititions
    const coordinators = await User.find({ googleId: { $in: coordinatorIds } });
    const coordinatorMap = coordinators.reduce((map, user) => {
      map[user.googleId] = user.name;
      return map;
    }, {});
    const updatedApplications = applications.map((app) => ({
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
    res.status(500).json({ message: "Error fetching applied modules", error });
    console.error("Error fetching applied modules:", error);
  }
};

const getAcceptedModules = async (req, res) => {
  const userId = req.query.userId;

  try {
    const applications = await TaApplication.find({
      userId,
      status: "accepted",
    }).populate("moduleId");
    const coordinatorIds = applications.flatMap(
      (app) => app.moduleId.coordinators
    ); //may have repititions
    const coordinators = await User.find({ googleId: { $in: coordinatorIds } });
    const coordinatorMap = coordinators.reduce((map, user) => {
      map[user.googleId] = user.name;
      return map;
    }, {});
    const updatedApplications = applications.map((app) => ({
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
    res.status(500).json({ message: "Error fetching applied modules", error });
    console.error("Error fetching applied modules:", error);
  }
};

module.exports = {
  getAllRequests,
  applyForTA,
  getAppliedModules,
  getAcceptedModules,
};
