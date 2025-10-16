const ModuleDetails = require('../models/ModuleDetails');
const TaApplication = require('../models/TaApplication');
const User = require('../models/User');
const documentModel = require('../models/documentModel');
const RecruitmentSeries = require('../models/RecruitmentRound');
const AppliedModules = require('../models/AppliedModules');
const { sendEmail } = require('../services/emailService');

// GET /api/lecturer/modules
// Returns modules where the logged-in lecturer (by id) is listed in coordinators
const getMyModules = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const coordinatorId = req.user._id;

    // Get all modules where user is coordinator with displayable statuses
    const modules = await ModuleDetails
      .find({ 
        coordinators: coordinatorId,
        moduleStatus: { 
          $in: ['pending changes', 'changes submitted', 'advertised', 'full', 'getting-documents', 'closed'] 
        }
      })
      .select('_id moduleCode moduleName semester year coordinators applicationDueDate documentDueDate requiredTAHours requiredUndergraduateTACount requiredPostgraduateTACount requirements moduleStatus undergraduateCounts postgraduateCounts')
      .sort({ createdAt: -1 });

    // No recruitment series status filtering; consider all modules for the coordinator
    const activeModules = modules;

    // Group modules by status
    const groupedModules = {
      pendingChanges: activeModules.filter(m => m.moduleStatus === 'pending changes'),
      changesSubmitted: activeModules.filter(m => m.moduleStatus === 'changes submitted'),
      advertised: activeModules.filter(m => m.moduleStatus === 'advertised'),
      full: activeModules.filter(m => m.moduleStatus === 'full'),
      gettingDocuments: activeModules.filter(m => m.moduleStatus === 'getting-documents'),
      closed: activeModules.filter(m => m.moduleStatus === 'closed')
    };

    console.log('lecturer getMyModules -> matched', 
      groupedModules.pendingChanges.length, 'pending changes,',
      groupedModules.changesSubmitted.length, 'changes submitted,',
      groupedModules.advertised.length, 'advertised,',
      groupedModules.full.length, 'full,',
      groupedModules.gettingDocuments.length, 'getting-documents, and',
      groupedModules.closed.length, 'closed modules for', 
      coordinatorId
    );

    return res.status(200).json(groupedModules);
  } catch (error) {
    console.error('Error fetching lecturer modules:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const editModuleRequirments = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;
    const { 
      requiredTAHours, 
      requiredUndergraduateTACount, 
      requiredPostgraduateTACount, 
      requirements 
    } = req.body;

    // Validate presence of at least one field to update
    const hasAnyField = [requiredTAHours, requiredUndergraduateTACount, requiredPostgraduateTACount, requirements]
      .some(v => v !== undefined);
    if (!hasAnyField) {
      return res.status(400).json({ error: 'At least one field must be provided for update' });
    }

    // Validate counts if provided
    const isProvidedAndInvalid = (val) => val !== undefined && (!Number.isInteger(Number(val)) || Number(val) < 0);
    if (isProvidedAndInvalid(requiredUndergraduateTACount) || isProvidedAndInvalid(requiredPostgraduateTACount)) {
      return res.status(400).json({ error: 'TA counts must be non-negative integers' });
    }

    // Verify the lecturer is a coordinator for this module
    const moduleDoc = await ModuleDetails.findById(id);
    if (!moduleDoc) {
      return res.status(404).json({ error: 'Module not found' });
    }

    if (!moduleDoc.coordinators.includes(req.user._id)) {
      return res.status(403).json({ error: 'Not authorized to edit this module' });
    }

    // Verify the module is in an editable status
    const editableStatuses = ['pending changes', 'changes submitted', 'advertised', 'full', 'getting-documents'];
    if (!editableStatuses.includes(moduleDoc.moduleStatus)) {
      return res.status(400).json({ error: 'Module is not in an editable status' });
    }

    // Prepare update object
    const updateFields = {
      requiredTAHours,
      requiredUndergraduateTACount,
      requiredPostgraduateTACount,
      requirements,
      updatedBy: req.user._id,
    };

    // Handle undergraduate and postgraduate TA count changes
    // Convert to numbers and handle undefined/null cases
    // If not provided, use existing values from moduleDoc
    const currentUndergradRequired = moduleDoc.undergraduateCounts?.required || 0;
    const currentPostgradRequired = moduleDoc.postgraduateCounts?.required || 0;
    const undergradCount = requiredUndergraduateTACount !== undefined ? Number(requiredUndergraduateTACount) : currentUndergradRequired;
    const postgradCount = requiredPostgraduateTACount !== undefined ? Number(requiredPostgraduateTACount) : currentPostgradRequired;
    
    // Validation for advertised, full, and getting-documents modules: check if applied count exceeds new required count
    const statusesRequiringValidation = ['advertised', 'full', 'getting-documents'];
    if (statusesRequiringValidation.includes(moduleDoc.moduleStatus)) {
      const currentAppliedUndergrad = moduleDoc.undergraduateCounts?.applied || 0;
      const currentAppliedPostgrad = moduleDoc.postgraduateCounts?.applied || 0;
      
      // Only validate undergraduate count if it's being changed
      if (requiredUndergraduateTACount !== undefined) {
        // Prevent setting undergraduate count to 0 when there are applied TAs
        if (undergradCount === 0 && currentAppliedUndergrad > 0) {
          return res.status(400).json({ 
            error: `Cannot set undergraduate TA count to 0 because ${currentAppliedUndergrad} student${currentAppliedUndergrad > 1 ? 's have' : ' has'} already applied.` 
          });
        }
        
        // Prevent reducing undergraduate count below applied count
        if (undergradCount > 0 && currentAppliedUndergrad > undergradCount) {
          return res.status(400).json({ 
            error: `Cannot reduce undergraduate TA count to ${undergradCount} because ${currentAppliedUndergrad} student${currentAppliedUndergrad > 1 ? 's have' : ' has'} already applied.` 
          });
        }
      }
      
      // Only validate postgraduate count if it's being changed
      if (requiredPostgraduateTACount !== undefined) {
        // Prevent setting postgraduate count to 0 when there are applied TAs
        if (postgradCount === 0 && currentAppliedPostgrad > 0) {
          return res.status(400).json({ 
            error: `Cannot set postgraduate TA count to 0 because ${currentAppliedPostgrad} student${currentAppliedPostgrad > 1 ? 's have' : ' has'} already applied.` 
          });
        }
        
        // Prevent reducing postgraduate count below applied count
        if (postgradCount > 0 && currentAppliedPostgrad > postgradCount) {
          return res.status(400).json({ 
            error: `Cannot reduce postgraduate TA count to ${postgradCount} because ${currentAppliedPostgrad} student${currentAppliedPostgrad > 1 ? 's have' : ' has'} already applied.` 
          });
        }
      }
    }
    
    if (undergradCount > 0) {
      // Set openForUndergraduates to true
      updateFields.openForUndergraduates = true;
      
      // Get current counts or initialize with zeros
      const currentApplied = moduleDoc.undergraduateCounts?.applied || 0;
      const currentAccepted = moduleDoc.undergraduateCounts?.accepted || 0;
      const currentReviewed = moduleDoc.undergraduateCounts?.reviewed || 0;
      const currentDocSubmitted = moduleDoc.undergraduateCounts?.docSubmitted || 0;
      const currentAppointed = moduleDoc.undergraduateCounts?.appointed || 0;
      const currentRemaining = moduleDoc.undergraduateCounts?.remaining || 0;
      const oldRequired = moduleDoc.undergraduateCounts?.required || 0;
      
      // Calculate new remaining: remaining = remaining + new_required - old_required
      const newRemaining = Math.max(0, currentRemaining + undergradCount - oldRequired);
      
      // Initialize or update undergraduateCounts
      updateFields.undergraduateCounts = {
        required: undergradCount,
        remaining: newRemaining,
        applied: currentApplied,
        reviewed: currentReviewed,
        accepted: currentAccepted,
        docSubmitted: currentDocSubmitted,
        appointed: currentAppointed
      };
    } else {
      // If undergraduate count is 0 or undefined, set openForUndergraduates to false
      updateFields.openForUndergraduates = false;
      
      // Reset all undergraduate counts to 0
      updateFields.undergraduateCounts = {
        required: 0,
        remaining: 0,
        applied: 0,
        reviewed: 0,
        accepted: 0,
        docSubmitted: 0,
        appointed: 0
      };
    }

    // Handle postgraduate TA count changes
    
    if (postgradCount > 0) {
      // Set openForPostgraduates to true
      updateFields.openForPostgraduates = true;
      
      // Get current counts or initialize with zeros
      const currentApplied = moduleDoc.postgraduateCounts?.applied || 0;
      const currentAccepted = moduleDoc.postgraduateCounts?.accepted || 0;
      const currentReviewed = moduleDoc.postgraduateCounts?.reviewed || 0;
      const currentDocSubmitted = moduleDoc.postgraduateCounts?.docSubmitted || 0;
      const currentAppointed = moduleDoc.postgraduateCounts?.appointed || 0;
      const currentRemaining = moduleDoc.postgraduateCounts?.remaining || 0;
      const oldRequired = moduleDoc.postgraduateCounts?.required || 0;
      
      // Calculate new remaining: remaining = remaining + new_required - old_required
      const newRemaining = Math.max(0, currentRemaining + postgradCount - oldRequired);
      
      // Initialize or update postgraduateCounts
      updateFields.postgraduateCounts = {
        required: postgradCount,
        remaining: newRemaining,
        applied: currentApplied,
        reviewed: currentReviewed,
        accepted: currentAccepted,
        docSubmitted: currentDocSubmitted,
        appointed: currentAppointed
      };
    } else {
      // If postgraduate count is 0 or undefined, set openForPostgraduates to false
      updateFields.openForPostgraduates = false;
      
      // Reset all postgraduate counts to 0
      updateFields.postgraduateCounts = {
        required: 0,
        remaining: 0,
        applied: 0,
        reviewed: 0,
        accepted: 0,
        docSubmitted: 0,
        appointed: 0
      };
    }

    // Determine the new status based on current status
    let newStatus = moduleDoc.moduleStatus;
    if (moduleDoc.moduleStatus === 'pending changes') {
      newStatus = 'changes submitted';
    } else if (moduleDoc.moduleStatus === 'changes submitted' || moduleDoc.moduleStatus === 'advertised') {
      // Keep the same status for these stages
      newStatus = moduleDoc.moduleStatus;
    }

    updateFields.moduleStatus = newStatus;

    // Update the module fields with appropriate status
    const updatedModule = await ModuleDetails.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    console.log('lecturer editModuleRequirments -> updated module', id, 'for', req.user._id);
    console.log('Request body:', req.body);
    console.log('Update fields before save:', updateFields);
    console.log('Undergraduate count set to:', undergradCount, 'Postgraduate count set to:', postgradCount);
    console.log('Open for undergraduates:', updateFields.openForUndergraduates ? 'enabled' : 'disabled');
    console.log('Open for postgraduates:', updateFields.openForPostgraduates ? 'enabled' : 'disabled');
    console.log('Updated module after save:', {
      openForUndergraduates: updatedModule.openForUndergraduates,
      openForPostgraduates: updatedModule.openForPostgraduates,
      undergraduateCounts: updatedModule.undergraduateCounts,
      postgraduateCounts: updatedModule.postgraduateCounts
    });
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
    }).select('_id moduleCode moduleName semester year requiredTACount requiredUndergraduateTACount requiredPostgraduateTACount recruitmentSeriesId');
    console.log('edit modules -> matched', coordinatorModulesAll.length, 'modules for', coordinatorId);

    // No recruitment series status filtering; consider all modules for the coordinator
    const coordinatorModules = coordinatorModulesAll;
    console.log('handleRequests -> modules (no RS filter)', coordinatorModules.length);

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
      return res.status(200).json({ modules: [] });
    }

    // Get unique user IDs from applications
    const userIds = [...new Set(taApplications.map(app => app.userId))];

    // Fetch user details (name and index number)
    const users = await User.find({
      _id: { $in: userIds }
    }).select('googleId name indexNumber role');
    console.log("users", users);

    // Create a map of user details for quick lookup
    const userMap = {};
    users.forEach(user => {
      userMap[user._id] = {
        name: user.name,
        indexNumber: user.indexNumber,
        role: user.role
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
          requiredUndergraduateTACount: module.requiredUndergraduateTACount || 0,
          requiredPostgraduateTACount: module.requiredPostgraduateTACount || 0,
          requiredTAHours: module.requiredTAHours || 0,
          totalApplications: 0,
          pendingCount: 0,
          acceptedCount: 0,
          rejectedCount: 0,
          applications: []
        })
      }

      const group = moduleMap.get(moduleIdStr);
      const userDetails = userMap[app.userId] || { name: 'Unknown', indexNumber: 'N/A', role: 'undergraduate' };
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
        role: userDetails.role,
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
      return res.status(403).json({ error: 'Not authorized to process this application' });
    }

    // Get user details to determine role (undergraduate/postgraduate)
    const user = await User.findById(application.userId).select('role name email');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent re-processing already processed applications
    if (String(application.status || '').toLowerCase() !== 'pending') {
      return res.status(400).json({ error: 'Application has already been processed' });
    }

    // Update application status and module counts in parallel
    const updatePromises = [
      application.save()
    ];

    // Update module counts based on user role
    if (user.role === 'undergraduate') {
      updatePromises.push(
        ModuleDetails.findByIdAndUpdate(applicationModuleId, {
          $inc: {
            'undergraduateCounts.reviewed': 1,
            'undergraduateCounts.accepted': 1
          }
        })
      );
    } else if (user.role === 'postgraduate') {
      updatePromises.push(
        ModuleDetails.findByIdAndUpdate(applicationModuleId, {
          $inc: {
            'postgraduateCounts.reviewed': 1,
            'postgraduateCounts.accepted': 1
          }
        })
      );
    }

    // Execute all updates in parallel
    application.status = 'accepted';
    await Promise.all(updatePromises);

    // Send email notification asynchronously (don't block the response)
    setImmediate(async () => {
      try {
        const subject = `Congratulations! Your TA Application for ${module.moduleCode} - ${module.moduleName} has been Accepted`;
        const htmlContent = `
          <p><strong>TA Application Accepted!</strong></p>
          
          <p>Dear ${user.name},</p>
          
          <p>We are pleased to inform you that your Teaching Assistant application for the following module has been accepted:</p>
          
          <p><strong>Module Details:</strong></p>
          <ul>
            <li><strong>Module Code:</strong> ${module.moduleCode}</li>
            <li><strong>Module Name:</strong> ${module.moduleName}</li>
            <li><strong>Semester:</strong> ${module.semester}</li>
          </ul>
          
          <p>Please log into the TA Appointment System to provide the necessary personal details and complete your onboarding process. You will need to submit the following documents:</p>
          
          <ul>
            <li>Bank Passbook Copy</li>
            <li>NIC Copy</li>
            <li>CV (Curriculum Vitae)</li>
            ${user.role === 'postgraduate' ? '<li>Degree Certificate</li>' : ''}
          </ul>
          
          <p><strong>Important:</strong> Please complete your profile and submit all required documents as soon as possible to proceed with your TA appointment.</p>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact the module coordinator or the CSE office.</p>
          
          <p>Best regards,</p>
          <p>The TA Recruitment Team</p>
        `;

        await sendEmail(user.email, subject, htmlContent);
        console.log('Acceptance email sent successfully to:', user.email);
      } catch (emailError) {
        console.error('Failed to send acceptance email:', emailError);
      }
    });

    console.log('lecturer acceptApplication -> accepted application', applicationId, 'for', coordinatorId);

    return res.status(200).json({ 
      message: 'Application accepted successfully',
      application: application
    });

  } catch (error) {
    console.error('Error accepting application:', error);
    return res.status(500).json({ error: 'Failed to update application' });
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
      return res.status(403).json({ error: 'Not authorized to process this application' });
    }

    // Get user details to determine role (undergraduate/postgraduate)
    const user = await User.findById(application.userId).select('role');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update application status
    application.status = 'rejected';
    if (req.body && typeof req.body.reason === 'string' && req.body.reason.trim().length > 0) {
      application.rejectionReason = req.body.reason.trim();
    }

    // Prepare parallel updates
    const updatePromises = [application.save()];

    // Update module counts based on user role
    if (user.role === 'undergraduate') {
      updatePromises.push(
        ModuleDetails.findByIdAndUpdate(applicationModuleId, {
          $inc: {
            'undergraduateCounts.reviewed': 1,
            'undergraduateCounts.remaining': 1
          }
        })
      );
    } else if (user.role === 'postgraduate') {
      updatePromises.push(
        ModuleDetails.findByIdAndUpdate(applicationModuleId, {
          $inc: {
            'postgraduateCounts.reviewed': 1,
            'postgraduateCounts.remaining': 1
          }
        })
      );
    }

    // Get the module details to retrieve requiredTAHours and update hours
    const moduleDetails = await ModuleDetails.findById(applicationModuleId).select('requiredTAHours');
    if (moduleDetails && moduleDetails.requiredTAHours) {
      // Find and update AppliedModules record in one operation
      updatePromises.push(
        AppliedModules.findOneAndUpdate(
          { userId: application.userId },
          {
            $inc: {
              availableHoursPerWeek: moduleDetails.requiredTAHours
            }
          }
        ).then(result => {
          if (result) {
            console.log(`Incremented availableHoursPerWeek by ${moduleDetails.requiredTAHours} for user ${application.userId}`);
          } else {
            console.log(`No AppliedModules record found for user ${application.userId}`);
          }
        })
      );
    }

    // Execute all updates in parallel
    await Promise.all(updatePromises);

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
// and includes accepted TA details with document info
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

    const coordinatorModules = coordinatorModulesAll;
    if (coordinatorModules.length === 0) {
      return res.status(200).json({ modules: [] });
    }

    const moduleIdObjects = coordinatorModules.map(m => m._id);

    // Get all applications for these modules
    const applications = await TaApplication.find({ moduleId: { $in: moduleIdObjects } });

    // Build map of accepted applications per module
    const acceptedByModule = new Map();
    for (const app of applications) {
      const statusLower = String(app.status || '').toLowerCase();
      if (statusLower === 'accepted') {
        const key = app.moduleId && typeof app.moduleId.toString === 'function' ? app.moduleId.toString() : String(app.moduleId || '');
        if (!key) continue;
        if (!acceptedByModule.has(key)) acceptedByModule.set(key, []);
        acceptedByModule.get(key).push(app);
      }
    }

    // Collect userIds from accepted applications to fetch user + appliedModules
    const acceptedUserIds = [...new Set(applications.filter(a => String(a.status || '').toLowerCase() === 'accepted').map(a => a.userId))];

    const users = await User.find({ _id: { $in: acceptedUserIds } }).select('_id name indexNumber role');
    const userMap = users.reduce((acc, u) => { acc[u._id.toString()] = { name: u.name, indexNumber: u.indexNumber, role: u.role }; return acc; }, {});

    // Fetch TA document submissions for these users from documentModel
    const docSubs = await documentModel.find({ userId: { $in: acceptedUserIds } })
      .select('userId driveFiles updatedAt createdAt')
      .lean();

    const buildFileMeta = (fileData, uploadedAt) => {
      if (!fileData) return { submitted: false };
      return {
        submitted: true,
        fileUrl: fileData.viewLink || fileData.downloadLink || '',
        fileName: fileData.name || '',
        uploadedAt: uploadedAt || null
      };
    };

    const docMap = docSubs.reduce((acc, d) => {
      const ts = d.updatedAt || d.createdAt;
      const files = d.driveFiles || {};
      acc[String(d.userId)] = {
        bankPassbook: buildFileMeta(files.bankPassbook, ts),
        nicCopy: buildFileMeta(files.nicCopy, ts),
        cv: buildFileMeta(files.cv, ts),
        degreeCertificate: buildFileMeta(files.degreeCertificate, ts),
        declarationForm: buildFileMeta(files.declarationForm, ts)
      };
      return acc;
    }, {});

    // Also fetch AppliedModules status to honor isDocSubmitted flag
    const appliedModulesDocs = await AppliedModules.find({ userId: { $in: acceptedUserIds } }).select('userId isDocSubmitted').lean();
    const isDocSubmittedByUser = appliedModulesDocs.reduce((acc, d) => { acc[String(d.userId)] = Boolean(d.isDocSubmitted); return acc; }, {});

    // Build response (include modules even if no accepted applications)
    const modules = coordinatorModules.map(m => {
      const modId = m._id.toString();
      const acceptedApps = acceptedByModule.get(modId) || [];
      const acceptedTAs = acceptedApps.map(a => {
        const userIdStr = a.userId?.toString?.() || String(a.userId);
        const role = userMap[userIdStr]?.role;
        const docs = docMap[userIdStr] || {
          bankPassbook: { submitted: false },
          nicCopy: { submitted: false },
          cv: { submitted: false },
          degreeCertificate: { submitted: false },
          declarationForm: { submitted: false }
        };

        // Compute submitted counts; degreeCertificate only required for postgraduates
        const requiredDocs = role === 'undergraduate'
          ? [docs.bankPassbook, docs.nicCopy, docs.cv, docs.declarationForm]
          : [docs.bankPassbook, docs.nicCopy, docs.cv, docs.degreeCertificate, docs.declarationForm];
        const submittedCountComputed = requiredDocs.filter(d => d.submitted).length;
        const totalRequired = requiredDocs.length;

        // If AppliedModules says submitted, trust it
        const isSubmittedFlag = isDocSubmittedByUser[userIdStr] === true;
        const allSubmitted = isSubmittedFlag || (submittedCountComputed === totalRequired);
        const submittedCount = allSubmitted ? totalRequired : submittedCountComputed;

        return {
          userId: a.userId,
          name: userMap[userIdStr]?.name || 'Unknown',
          indexNumber: userMap[userIdStr]?.indexNumber || 'N/A',
          role,
          documents: docs,
          docStatus: allSubmitted ? 'submitted' : 'pending',
          documentSummary: { submittedCount, total: totalRequired, allSubmitted }
        };
      });

      return {
        moduleId: m._id,
        moduleCode: m.moduleCode,
        moduleName: m.moduleName,
        semester: m.semester,
        year: m.year,
        requiredTAHours: m.requiredTAHours || 0,
        assignedTAsCount: acceptedTAs.length,
        requiredTACount: m.requiredTACount || 0,
        acceptedTAs,
        applicationsCount: applications.filter(a => String(a.moduleId) === modId).length
      };
    });

    return res.status(200).json({ modules });
  } catch (error) {
    console.error('Error fetching modules with TA requests:', error);
    return res.status(500).json({ error: 'Failed to fetch modules with TA requests' });
  }
}


// GET /api/lecturer/modules/:id/applications
// Returns all applications for a specific module if requester is a coordinator
// const getModuleApplications = async (req, res) => {
//   try {
//     if (!req.user || !req.user._id) {
//       return res.status(401).json({ error: 'Not authenticated' });
//     }

//     const { id } = req.params;
//     const moduleDoc = await ModuleDetails.findById(id);
//     if (!moduleDoc) {
//       return res.status(404).json({ error: 'Module not found' });
//     }

//     if (!moduleDoc.coordinators.includes(req.user._id)) {
//       return res.status(403).json({ error: 'Not authorized to view applications for this module' });
//     }

//     const applications = await TaApplication.find({ moduleId: moduleDoc._id }).lean();

//     return res.status(200).json({ applications });
//   } catch (error) {
//     console.error('Error fetching module applications:', error);
//     return res.status(500).json({ error: 'Failed to fetch module applications' });
//   }
// };

module.exports = { getMyModules, editModuleRequirments, handleRequests, acceptApplication, rejectApplication, viewModuleDetails};