const ModuleDetails = require('../models/ModuleDetails');
const TaApplication = require('../models/TaApplication');
const User = require('../models/User');
const TaDocumentSubmission = require('../models/TaDocumentSubmission');

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
    console.log('edit modules -> matched', coordinatorModules.length, 'modules for', coordinatorGoogleId);

    if (coordinatorModules.length === 0) {
      return res.status(200).json({ 
        message: 'No modules found for this coordinator',
        applications: [] 
      });
    }

    // Get module IDs
    const moduleIds = coordinatorModules.map(module => module._id.toString());
    console.log("handle req module id", moduleIds);

    // Find all TA applications for these modules
    const taApplications = await TaApplication.find({
      moduleID: { $in: moduleIds }
    });
    console.log("TA Applications", taApplications);

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

    // Group applications by moduleID so same module (same id) stays in one card
    const moduleMap = new Map();
    for (const app of taApplications) {
      const module = coordinatorModules.find(m => m._id.toString() === app.moduleID);
      if (!module) continue;

      if (!moduleMap.has(app.moduleID)) {
        moduleMap.set(app.moduleID, {
          moduleId: app.moduleID,
          moduleCode: module.moduleCode,
          moduleName: module.moduleName,
          semester: module.semester,
          year: module.year,
          requiredTACount: module.requiredTACount,
          requiredTAHours: module.requiredTAHours || 0,
          totalApplications: 0,
          pendingCount: 0,
          acceptedCount: 0,
          rejectedCount: 0,
          applications: []
        })
      }

      const group = moduleMap.get(app.moduleID);
      const userDetails = userMap[app.userId] || { name: 'Unknown', indexNumber: 'N/A' };
      group.totalApplications += 1;
      const statusLower = String(app.status || '').toLowerCase();
      if (statusLower === 'pending') group.pendingCount += 1;
      else if (statusLower === 'accepted') group.acceptedCount += 1;
      else if (statusLower === 'rejected') group.rejectedCount += 1;

      group.applications.push({
        applicationId: app._id,
        userId: app.userId,
        studentName: userDetails.name,
        indexNumber: userDetails.indexNumber,
        status: app.status,
        appliedAt: app.createdAt
      })
    }

    const groupedModules = Array.from(moduleMap.values());

    console.log('lecturer handleRequests -> grouped modules', groupedModules.length, 'for', coordinatorGoogleId);

    return res.status(200).json({
      message: 'TA applications retrieved successfully',
      modules: groupedModules
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

// GET /api/lecturer/modules/with-ta-requests
// Returns modules coordinated by logged lecturer that have at least one TA request
// and includes approved TA details with document info
const viewModuleDetails = async (req, res) => {
  try {
    if (!req.user || !req.user.googleId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const coordinatorGoogleId = String(req.user.googleId);

    // Get modules coordinated by the lecturer
    const coordinatorModules = await ModuleDetails.find({
      coordinators: coordinatorGoogleId
    }).select('_id moduleCode moduleName semester year requiredTACount requiredTAHours requirements');

    if (coordinatorModules.length === 0) {
      return res.status(200).json({ modules: [] });
    }

    const moduleIds = coordinatorModules.map(m => m._id.toString());

    // Get all applications for these modules
    const applications = await TaApplication.find({ moduleID: { $in: moduleIds } });

    // Build map of approved applications per module
    const approvedByModule = new Map();
    for (const app of applications) {
      if (app.status === 'accepted') {
        const key = app.moduleID;
        if (!approvedByModule.has(key)) approvedByModule.set(key, []);
        approvedByModule.get(key).push(app);
      }
    }

    // If no requests at all, return empty
    const modulesWithAnyRequests = new Set(applications.map(a => a.moduleID));
    if (modulesWithAnyRequests.size === 0) {
      return res.status(200).json({ modules: [] });
    }

    // Collect userIds from approved applications to fetch user + docs
    const approvedUserIds = [...new Set(applications.filter(a => a.status === 'accepted').map(a => a.userId))];

    const users = await User.find({ googleId: { $in: approvedUserIds } }).select('googleId name indexNumber');
    const userMap = users.reduce((acc, u) => { acc[u.googleId] = { name: u.name, indexNumber: u.indexNumber }; return acc; }, {});

    const docSubs = await TaDocumentSubmission.find({ userId: { $in: approvedUserIds } }).select('userId documents');
    const docMap = docSubs.reduce((acc, d) => { acc[d.userId] = d.documents || null; return acc; }, {});

    // Count ALL applications per module using aggregation (more robust)
    const countsAll = await TaApplication.aggregate([
      { $match: { moduleID: { $in: moduleIds } } },
      { $group: { _id: '$moduleID', total: { $sum: 1 } } }
    ]);
    const applicationsCountMap = countsAll.reduce((acc, c) => {
      acc[c._id] = c.total;
      return acc;
    }, {});

    // Build response (only modules with at least one APPROVED/accepted application)
    const modules = coordinatorModules
      .filter(m => (approvedByModule.get(m._id.toString()) || []).length > 0)
      .map(m => {
        const modId = m._id.toString();
        const approvedApps = approvedByModule.get(modId) || [];
        const approvedTAs = approvedApps.map(a => ({
          userId: a.userId,
          name: userMap[a.userId]?.name || 'Unknown',
          indexNumber: userMap[a.userId]?.indexNumber || 'N/A',
          documents: docMap[a.userId] || null
        }));

        return {
          moduleId: m._id,
          moduleCode: m.moduleCode,
          moduleName: m.moduleName,
          semester: m.semester,
          year: m.year,
          requiredTAHours: m.requiredTAHours,
          assignedTAsCount: approvedTAs.length,
          requiredTACount: m.requiredTACount,
          approvedTAs,
          applicationsCount: applicationsCountMap[modId] || 0
        }
      });

    return res.status(200).json({ modules });
  } catch (error) {
    console.error('Error fetching modules with TA requests:', error);
    return res.status(500).json({ error: 'Failed to fetch modules with TA requests' });
  }
}


module.exports = { getMyModules, editModuleRequirments, handleRequests, acceptApplication, rejectApplication, viewModuleDetails };