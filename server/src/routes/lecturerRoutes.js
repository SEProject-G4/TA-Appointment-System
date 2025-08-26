const express = require('express');
const router = express.Router();
const { protected, authorize } = require('../middleware/authMiddleware');
const lecturerController = require('../controllers/lecturerController');

// List modules for which the logged-in lecturer is a coordinator (by googleId)
router.get('/modules', protected, authorize(['lecturer']), lecturerController.getMyModules);

// Update module requirements for a specific module
router.patch('/modules/:id', protected, authorize(['lecturer']), lecturerController.editModuleRequirments);
router.get('/handle-requests', protected, authorize(["lecturer"]), lecturerController.handleRequests);

module.exports = router;