const ModuleDetails = require('../models/ModuleDetails');

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

module.exports = { getMyModules, editModuleRequirments };

// POST /api/lecturer/modules
// Creates a new module document
const createModule = async (req, res) => {
  try {
    const {
      moduleCode,
      moduleName,
      semester,
      year,
      coordinators,
      applicationDueDate,
      documentDueDate,
      requiredTAHours = null,
      requiredTACount = null,
      requirements = null,
      moduleStatus, // optional, defaults in schema
    } = req.body;

    // Basic validation for required fields
    if (!moduleCode || !moduleName || !semester || !year || !coordinators || !applicationDueDate || !documentDueDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Use coordinators provided in the request body when unauthenticated
    const coordinatorIds = Array.isArray(coordinators) ? coordinators.map(String) : [];

    const moduleDoc = await ModuleDetails.create({
      moduleCode,
      moduleName,
      semester,
      year,
      coordinators: coordinatorIds,
      applicationDueDate,
      documentDueDate,
      requiredTAHours,
      requiredTACount,
      requirements,
      moduleStatus, // will use default if undefined
    });

    return res.status(201).json(moduleDoc);
  } catch (error) {
    console.error('Error creating module:', error);
    return res.status(500).json({ error: 'Failed to create module' });
  }
};

module.exports.createModule = createModule;