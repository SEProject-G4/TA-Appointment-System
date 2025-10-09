const express = require('express');
const router = express.Router();
const { protected: protectedMiddleware, authorize } = require('../middleware/authMiddleware');
const lecturerController = require('../controllers/lecturerController');

// List modules for which the logged-in lecturer is a coordinator (by googleId)
router.get('/modules', protectedMiddleware, authorize(['lecturer']), lecturerController.getMyModules);

// Modules that have at least one TA request, for the logged coordinator
router.get('/modules/with-ta-requests', protectedMiddleware, authorize(['lecturer']), lecturerController.viewModuleDetails);

// Update module requirements for a specific module
router.patch('/modules/:id', protectedMiddleware, authorize(['lecturer']), lecturerController.editModuleRequirments);

// Get TA applications for coordinator's modules
router.get('/handle-requests', protectedMiddleware, authorize(["lecturer"]), lecturerController.handleRequests);

// Accept a TA application
router.patch('/applications/:applicationId/accept', protectedMiddleware, authorize(["lecturer"]), lecturerController.acceptApplication);

// Reject a TA application
router.patch('/applications/:applicationId/reject', protectedMiddleware, authorize(["lecturer"]), lecturerController.rejectApplication);

// kept for backward compatibility: if previously used, remove or update callers

module.exports = router;