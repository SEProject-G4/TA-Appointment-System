const ModuleDetails = require('../models/ModuleDetails');
const TaApplication = require('../models/TaApplication');
const User = require('../models/User');
const TaDocumentSubmission = require('../models/TaDocumentSubmission');
const RecruitmentSeries = require('../models/recruitmentSeries');

// GET /api/lecturer/modules
// Returns modules where the logged-in lecturer (by id) is listed in coordinators
const getMyModules = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const coordinatorId = req.user._id;

    // First get all modules where user is coordinator
    const modules = await ModuleDetails
      .find({ coordinators: coordinatorId })
      .sort({ createdAt: -1 });

    // Get unique recruitment series IDs
    const recruitmentSeriesIds = [...new Set(modules.map(m => m.recruitmentSeriesId))];

    // Get recruitment series statuses
    const recruitmentSeries = await RecruitmentSeries.find({
      _id: { $in: recruitmentSeriesIds },
      status: 'initialised'  // Only get series that are initialised
    }).select('_id');

    // Filter modules to only those with active recruitment series
    const activeSeriesIds = recruitmentSeries.map(rs => rs._id);
    const activeModules = modules.filter(module => 
      activeSeriesIds.some(activeId => activeId.equals(module.recruitmentSeriesId))
    );

    console.log('lecturer getMyModules -> matched', activeModules.length, 'active modules for', coordinatorId);

    return res.status(200).json(activeModules);
  } catch (error) {
    console.error('Error fetching lecturer modules:', error);
    return res.status(500).json({ error: 'Failed to fetch modules for coordinator' });
  }
};

const editModuleRequirments = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;
    const { requiredTAHours, requiredTACount, requirements, moduleStatus } = req.body;

    // Verify the lecturer is a coordinator for this module
    const moduleDoc = await ModuleDetails.findById(id);
    if (!moduleDoc) {
      return res.status(404).json({ error: 'Module not found' });
    }

    if (!moduleDoc.coordinators.includes(req.user._id)) {
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

    console.log('lecturer editModuleRequirments -> updated module', id, 'for', req.user._id);
    return res.status(200).json(updatedModule);
  } catch (error) {
    console.error('Error updating module requirements:', error);
    return res.status(500).json({ error: 'Failed to update module requirements' });
  }
};

const handleRequests = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const coordinatorId = req.user._id;

    // First, get all modules where the coordinator is responsible
    const coordinatorModulesAll = await ModuleDetails.find({
      coordinators: coordinatorId
    }).select('_id moduleCode moduleName semester year requiredTACount recruitmentSeriesId');
    console.log('edit modules -> matched', coordinatorModulesAll.length, 'modules for', coordinatorId);

    // Filter to only modules whose recruitment series is initialised
    const rsIds = [...new Set(coordinatorModulesAll.map(m => m.recruitmentSeriesId))];
    const activeSeries = await RecruitmentSeries.find({ _id: { $in: rsIds }, status: 'initialised' }).select('_id');
    const activeSeriesIds = activeSeries.map(rs => rs._id);
    const coordinatorModules = coordinatorModulesAll.filter(m => 
      activeSeriesIds.some(activeId => activeId.equals(m.recruitmentSeriesId))
    );
    console.log('handleRequests -> active modules after RS filter', coordinatorModules.length);

    if (coordinatorModules.length === 0) {
      return res.status(200).json({ 
        message: 'No modules found for this coordinator',
        applications: [] 
      });
    }

    // Get module IDs
    const moduleIds = coordinatorModules.map(module => module._id);
    console.log("handle req module id", moduleIds);

    // Find all TA applications for these modules
    const moduleIdStrings = moduleIds.map(id => id.toString());
    
    // Query TA applications for ONLY active modules (moduleId ObjectId)
    const taApplications = await TaApplication.find({
      moduleId: { $in: moduleIds }
    }).lean();

    // Add detailed debug logging
    console.log('Module IDs being queried (ObjectIds):', moduleIds.map(id => id.toString()));
    console.log('Module IDs being queried (Strings):', moduleIdStrings);
    
    console.log('Query results:', taApplications);

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
      _id: { $in: userIds }
    }).select('googleId name indexNumber');
    console.log("users", users);

    // Create a map of user details for quick lookup
    const userMap = {};
    users.forEach(user => {
      userMap[user._id] = {
        name: user.name,
        indexNumber: user.indexNumber
      };
    });

    // Group applications by moduleId so same module (same id) stays in one card
    const moduleMap = new Map();
    console.log('Starting grouping process...');
    console.log('TA Applications to group:', taApplications.length);
    console.log('Available modules:', coordinatorModules.map(m => ({ id: m._id.toString(), code: m.moduleCode })));
    
    for (const app of taApplications) {
      const rawModuleId = app.moduleId;
      const moduleIdStr = typeof rawModuleId === 'string' ? rawModuleId : (rawModuleId && typeof rawModuleId.toString === 'function' ? rawModuleId.toString() : null);
      if (!moduleIdStr) {
        console.log('Skipping app without module id:', app._id);
        continue;
      }
      console.log('Processing app with moduleId:', moduleIdStr);
      const module = coordinatorModules.find(m => m._id.toString() === moduleIdStr);
      if (!module) {
        console.log('No matching module found for app.moduleId:', moduleIdStr);
        continue;
      }
      console.log('Found matching module:', module.moduleCode);

      if (!moduleMap.has(moduleIdStr)) {
        moduleMap.set(moduleIdStr, {
          moduleId: rawModuleId,
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

      const group = moduleMap.get(moduleIdStr);
      const userDetails = userMap[app.userId] || { name: 'Unknown', indexNumber: 'N/A' };
      group.totalApplications += 1;
      const statusLower = String(app.status || '').toLowerCase();
      if (statusLower === 'pending') group.pendingCount += 1;
      else if (statusLower === 'approved') group.acceptedCount += 1;
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

    console.log('lecturer handleRequests -> grouped modules', groupedModules.length, 'for', coordinatorId);

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
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { applicationId } = req.params;
    const coordinatorId = req.user._id;
    console.log("applicationId", applicationId);
    console.log("coordinatorId", coordinatorId);

    // Find the application
    const application = await TaApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    console.log("application", application);

    // Verify the coordinator is responsible for this module
    const applicationModuleId = application.moduleId;
    console.log("applicationModuleId", applicationModuleId);

    const module = await ModuleDetails.findById(applicationModuleId);
    if (!module || !module.coordinators.includes(req.user._id)) {
      return res.status(403).json({ error: 'Not authorized to manage this application' });
    }

    // Update application status
    application.status = 'approved';
    await application.save();

    console.log('lecturer acceptApplication -> accepted application', applicationId, 'for', coordinatorId);

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
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { applicationId } = req.params;
    const coordinatorId = req.user._id;

    // Find the application
    const application = await TaApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Verify the coordinator is responsible for this module
    const applicationModuleId = application.moduleId;
    const module = await ModuleDetails.findById(applicationModuleId);
    if (!module || !module.coordinators.includes(req.user._id)) {
      return res.status(403).json({ error: 'Not authorized to manage this application' });
    }

    // Update application status
    application.status = 'rejected';
    await application.save();

    console.log('lecturer rejectApplication -> rejected application', applicationId, 'for', coordinatorId);

    return res.status(200).json({ 
      message: 'Application rejected successfully',
      application: application
    });

  } catch (error) {
    console.error('Error rejecting application:', error);
    return res.status(500).json({ error: 'Failed to reject application' });
  }
};

// Returns modules coordinated by logged lecturer that have at least one TA request
// and includes approved TA details with document info
const viewModuleDetails = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const coordinatorId = req.user._id;

    // Get modules coordinated by the lecturer
    const coordinatorModulesAll = await ModuleDetails.find({
      coordinators: coordinatorId
    }).select('_id moduleCode moduleName semester year requiredTACount requiredTAHours requirements recruitmentSeriesId');
    console.log("coordinatorModules (all)", coordinatorModulesAll);

    // Filter modules to those whose recruitment series is initialised
    const seriesIds = [...new Set(coordinatorModulesAll.map(m => m.recruitmentSeriesId))];
    const activeSeriesDocs = await RecruitmentSeries.find({ _id: { $in: seriesIds }, status: 'initialised' }).select('_id');
    const activeSeriesIds = activeSeriesDocs.map(s => s._id);
    const coordinatorModules = coordinatorModulesAll.filter(m => 
      activeSeriesIds.some(activeId => activeId.equals(m.recruitmentSeriesId))
    );
    console.log('viewModuleDetails -> active modules after RS filter', coordinatorModules.length);

    if (coordinatorModules.length === 0) {
      return res.status(200).json({ modules: [] });
    }

    const moduleIdObjects = coordinatorModules.map(m => m._id);
    const moduleIdStrings = moduleIdObjects.map(id => id.toString());

    // Get all applications for these modules
    const applications = await TaApplication.find({ moduleId: { $in: moduleIdObjects } });
    console.log("TA Applications to view status", applications);

    // Build map of approved applications per module
    const approvedByModule = new Map();
    for (const app of applications) {
      const statusLower = String(app.status || '').toLowerCase();
      if (statusLower === 'approved') {
        const key = app.moduleId.toString();
        if (!approvedByModule.has(key)) approvedByModule.set(key, []);
        approvedByModule.get(key).push(app);
      }
    }
    console.log("approvedByModule", approvedByModule);

    // If no requests at all, return empty
    const modulesWithAnyRequests = new Set(applications.map(a => a.moduleId.toString()));
    if (modulesWithAnyRequests.size === 0) {
      return res.status(200).json({ modules: [] });
    }

    // Collect userIds from approved applications to fetch user + docs
    const approvedUserIds = [...new Set(applications.filter(a => String(a.status || '').toLowerCase() === 'approved').map(a => a.userId))];

    const users = await User.find({ _id: { $in: approvedUserIds } }).select('Id name indexNumber');
    console.log("users", users);

    const userMap = users.reduce((acc, u) => { acc[u._id] = { name: u.name, indexNumber: u.indexNumber }; return acc; }, {});

    // TaDocumentSubmission.userId is stored as String, so convert approved user ObjectIds to strings
    const approvedUserIdStrings = approvedUserIds.map(id => id.toString());
    console.log("approvedUserIdStrings", approvedUserIdStrings);

    const docSubs = await TaDocumentSubmission.find({ userId: { $in: approvedUserIdStrings } }).select('userId documents status').lean();
    console.log("docSubs", docSubs);
    
    const docMap = docSubs.reduce((acc, d) => { acc[d.userId] = { documents: d.documents || null, status: d.status || 'pending' }; return acc; }, {});

    // Count ALL applications per module using aggregation (more robust)
    const countsAll = await TaApplication.aggregate([
      { $match: { moduleId: { $in: moduleIdObjects } } },
      { $group: { _id: '$moduleId', total: { $sum: 1 } } }
    ]);
    console.log("countsAll", countsAll);
    
    const applicationsCountMap = countsAll.reduce((acc, c) => {
      acc[String(c._id)] = c.total;
      return acc;
    }, {});
    console.log("applicationsCountMap", applicationsCountMap);

    // Build response (only modules with at least one APPROVED/accepted application)
    const modules = coordinatorModules
      .filter(m => (approvedByModule.get(m._id.toString()) || []).length > 0)
      .map(m => {
        const modId = m._id.toString();
        const approvedApps = approvedByModule.get(modId) || [];
        const approvedTAs = approvedApps.map(a => {
          const userIdStr = a.userId?.toString?.() || String(a.userId);
          const docEntry = docMap[userIdStr] || { documents: {}, status: 'pending' };
          const docs = docEntry.documents || {};
          const normalize = (d) => {
            if (!d) return { submitted: false };
            if (typeof d === 'string') {
              return {
                submitted: true,
                fileUrl: d,
                fileName: undefined,
                uploadedAt: undefined
              }
            }
            return {
              submitted: Boolean(d.submitted),
              fileUrl: d.fileUrl,
              fileName: d.fileName,
              uploadedAt: d.uploadedAt
            }
          };
          const documents = {
            bankPassbookCopy: normalize(docs.bankPassbookCopy),
            nicCopy: normalize(docs.nicCopy),
            cv: normalize(docs.cv),
            degreeCertificate: normalize(docs.degreeCertificate)
          };
          const submittedCount = [documents.bankPassbookCopy, documents.nicCopy, documents.cv, documents.degreeCertificate]
            .filter(d => d.submitted).length;
          const documentSummary = {
            submittedCount,
            total: 4,
            allSubmitted: submittedCount === 4
          };
          return {
            userId: a.userId,
            name: userMap[a.userId]?.name || 'Unknown',
            indexNumber: userMap[a.userId]?.indexNumber || 'N/A',
            documents,
            docStatus: docEntry.status,
            documentSummary
          };
        });

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
    console.log("modules", modules);

    return res.status(200).json({ modules });
  } catch (error) {
    console.error('Error fetching modules with TA requests:', error);
    return res.status(500).json({ error: 'Failed to fetch modules with TA requests' });
  }
}


module.exports = { getMyModules, editModuleRequirments, handleRequests, acceptApplication, rejectApplication, viewModuleDetails };