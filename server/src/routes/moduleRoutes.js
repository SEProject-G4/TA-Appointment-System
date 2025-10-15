const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const { protected, authorize } = require('../middleware/authMiddleware');

router.put('/:moduleId/change-status', protected, authorize(['admin']), moduleController.changeModuleStatus);
router.get('/:moduleId', protected, authorize(['admin']), moduleController.getModuleDetailsById);
router.put('/:moduleId/advertise', protected, authorize(['admin']), moduleController.advertiseModule);

module.exports = router;