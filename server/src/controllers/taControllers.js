const { get } = require("mongoose");
const app = require("../app");
const ModuleDetails = require("../models/ModuleDetails");
const TaApplication = require("../models/TaApplication");
const User = require("../models/User");
const authController = require("./authController");
const RecruitmentSeries = require("../models/recruitmentSeries");

const getAllRequests = async (req, res) => {
  const userId = req.query.userId;  //fetch userID from query parameters

  try {
    const user = await User.findById(userId);  //fetch user object details using userID
    // console.log(user);
    const userGroupID = user.userGroup;
    const userRole = user.role;

    let activeRecSeries = [];  //get the active recruitment series for the user based on their role
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
    // console.log(userRole, userGroupID, activeRecSeries); 
    const recSeriesIds = activeRecSeries.map((r) => r._id);
    // console.log(recSeriesIds);

    const modules = await ModuleDetails.find({
      recruitmentSeriesId: { $in: recSeriesIds, moduleStatus: "advertised" },
    }); //fetch the available modules that have been advertised by admin.
  
    const allCoordinators = modules.flatMap((module) => module.coordinators);  //get the names of the module co-ordinators
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

const applyForTA = async (req, res) => {
  const taApplication = new TaApplication({
    userId: req.body.userId,
    moduleId: req.body.moduleId,
  });

  try {
    await taApplication.save();
    res.status(201).json({
      message: "Application submitted successfully",
      application: taApplication,
    });
  } catch (error) {
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
