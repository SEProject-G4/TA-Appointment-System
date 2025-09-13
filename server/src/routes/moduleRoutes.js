const express = require('express');
const router = express.Router();
const recruitmentController = require('../controllers/recruitmentController');
const { protected, authorize } = require('../middleware/authMiddleware');

router.put('/:moduleId/change-status', protected, authorize(['admin']), recruitmentController.changeModuleStatus);
router.get('/:moduleId', protected, authorize(['admin']), recruitmentController.getModuleDetailsById);

module.exports = router;