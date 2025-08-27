const ModuleDetails = require('../models/ModuleDetails');
const TaApplication = require('../models/TaApplication');
const User = require('../models/User');

// GET /api/lecturer/modules
// Returns modules where the logged-in lecturer (by googleId) is listed in coordinators
const getMyModules = async (req, res) => {
  try {
    if (!req.user || !req.user.googleId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const coordinatorGoogleId = String(req.user.googleId);
    const modules = await ModuleDetails
      .find({ coordinators: coordinatorGoogleId })
      .sort({ createdAt: -1 });
    console.log('lecturer getMyModules -> matched', modules.length, 'modules for', coordinatorGoogleId);

    return res.status(200).json(modules);
  } catch (error) {
    console.error('Error fetching lecturer modules:', error);
    return res.status(500).json({ error: 'Failed to fetch modules for coordinator' });
  }
};

const editModuleRequirments = async (req, res) => {
  try {
    if (!req.user || !req.user.googleId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;
    const { requiredTAHours, requiredTACount, requirements, moduleStatus } = req.body;

    // Verify the lecturer is a coordinator for this module
    const moduleDoc = await ModuleDetails.findById(id);
    if (!moduleDoc) {
      return res.status(404).json({ error: 'Module not found' });
    }

    if (!moduleDoc.coordinators.includes(req.user.googleId)) {
      return res.status(403).json({ error: 'Not authorized to edit this module' });
    }

    // Update the lecturer fields including moduleStatus
    const updatedModule = await ModuleDetails.findByIdAndUpdate(
      id,
      {
        $set: {
          requiredTAHours,
          requiredTACount,
          requirements,
          moduleStatus: 'submitted', // Automatically set to submitted
          updatedBy: req.user._id,
        },
      },
      { new: true, runValidators: true }
    );

    console.log('lecturer editModuleRequirments -> updated module', id, 'for', req.user.googleId);
    return res.status(200).json(updatedModule);
  } catch (error) {
    console.error('Error updating module requirements:', error);
    return res.status(500).json({ error: 'Failed to update module requirements' });
  }
};

const handleRequests = async (req, res) => {
  try {
    if (!req.user || !req.user.googleId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const coordinatorGoogleId = String(req.user.googleId);

    // First, get all modules where the coordinator is responsible
    const coordinatorModules = await ModuleDetails.find({
      coordinators: coordinatorGoogleId
    }).select('_id moduleCode moduleName semester year requiredTACount');

    if (coordinatorModules.length === 0) {
      return res.status(200).json({ 
        message: 'No modules found for this coordinator',
        applications: [] 
      });
    }

    // Get module IDs
    const moduleIds = coordinatorModules.map(module => module._id.toString());

    // Find all TA applications for these modules
    const taApplications = await TaApplication.find({
      moduleID: { $in: moduleIds }
    });

    if (taApplications.length === 0) {
      return res.status(200).json({ 
        message: 'No TA applications found for your modules',
        applications: [] 
      });
    }

    // Get unique user IDs from applications
    const userIds = [...new Set(taApplications.map(app => app.userId))];

    // Fetch user details (name and index number)
    const users = await User.find({
      googleId: { $in: userIds }
    }).select('googleId name indexNumber');

    // Create a map of user details for quick lookup
    const userMap = {};
    users.forEach(user => {
      userMap[user.googleId] = {
        name: user.name,
        indexNumber: user.indexNumber
      };
    });

    // Combine the data
    const applicationsWithUserDetails = taApplications.map(app => {
      const userDetails = userMap[app.userId] || { name: 'Unknown', indexNumber: 'N/A' };
      const module = coordinatorModules.find(m => m._id.toString() === app.moduleID);
      
      return {
        applicationId: app._id,
        userId: app.userId,
        moduleId: app.moduleID,
        moduleCode: module ? module.moduleCode : 'Unknown',
        moduleName: module ? module.moduleName : 'Unknown',
        semester: module ? module.semester : 'Unknown',
        year: module ? module.year : 'Unknown',
        requiredTACount: module ? module.requiredTACount : 0,
        status: app.status,
        studentName: userDetails.name,
        indexNumber: userDetails.indexNumber,
        appliedAt: app.createdAt
      };
    });

    console.log('lecturer handleRequests -> found', applicationsWithUserDetails.length, 'applications for', coordinatorGoogleId);

    return res.status(200).json({
      message: 'TA applications retrieved successfully',
      applications: applicationsWithUserDetails
    });

  } catch (error) {
    console.error('Error fetching TA applications:', error);
    return res.status(500).json({ error: 'Failed to fetch TA applications' });
  }
};

const acceptApplication = async (req, res) => {
  try {
    if (!req.user || !req.user.googleId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { applicationId } = req.params;
    const coordinatorGoogleId = String(req.user.googleId);

    // Find the application
    const application = await TaApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Verify the coordinator is responsible for this module
    const module = await ModuleDetails.findById(application.moduleID);
    if (!module || !module.coordinators.includes(coordinatorGoogleId)) {
      return res.status(403).json({ error: 'Not authorized to manage this application' });
    }

    // Update application status
    application.status = 'accepted';
    await application.save();

    console.log('lecturer acceptApplication -> accepted application', applicationId, 'for', coordinatorGoogleId);

    return res.status(200).json({ 
      message: 'Application accepted successfully',
      application: application
    });

  } catch (error) {
    console.error('Error accepting application:', error);
    return res.status(500).json({ error: 'Failed to accept application' });
  }
};

const rejectApplication = async (req, res) => {
  try {
    if (!req.user || !req.user.googleId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { applicationId } = req.params;
    const coordinatorGoogleId = String(req.user.googleId);

    // Find the application
    const application = await TaApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Verify the coordinator is responsible for this module
    const module = await ModuleDetails.findById(application.moduleID);
    if (!module || !module.coordinators.includes(coordinatorGoogleId)) {
      return res.status(403).json({ error: 'Not authorized to manage this application' });
    }

    // Update application status
    application.status = 'rejected';
    await application.save();

    console.log('lecturer rejectApplication -> rejected application', applicationId, 'for', coordinatorGoogleId);

    return res.status(200).json({ 
      message: 'Application rejected successfully',
      application: application
    });

  } catch (error) {
    console.error('Error rejecting application:', error);
    return res.status(500).json({ error: 'Failed to reject application' });
  }
};

module.exports = { getMyModules, editModuleRequirments, handleRequests, acceptApplication, rejectApplication };