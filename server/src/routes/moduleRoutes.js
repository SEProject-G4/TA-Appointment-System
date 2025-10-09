const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const { protected: protectedMiddleware, authorize } = require('../middleware/authMiddleware');

router.put('/:moduleId/change-status', protectedMiddleware, authorize(['admin']), moduleController.changeModuleStatus);
router.get('/:moduleId', protectedMiddleware, authorize(['admin']), moduleController.getModuleDetailsById);
router.put('/:moduleId/advertise', protectedMiddleware, authorize(['admin']), moduleController.advertiseModule);

module.exports = router;