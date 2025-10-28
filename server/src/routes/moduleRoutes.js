const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const authMiddleware = require('../middleware/authMiddleware');

router.put('/:moduleId/change-status', authMiddleware.protected, authMiddleware.authorize(['admin']), moduleController.changeModuleStatus);
router.get('/:moduleId', authMiddleware.protected, authMiddleware.authorize(['admin']), moduleController.getModuleDetailsById);
router.put('/:moduleId/advertise', authMiddleware.protected, authMiddleware.authorize(['admin']), moduleController.advertiseModule);
router.put('/:moduleId/notify', authMiddleware.protected, authMiddleware.authorize(['admin']), moduleController.notifyModule);
router.put('/:moduleId', authMiddleware.protected, authMiddleware.authorize(['admin']), moduleController.updateModule);
router.post('/:moduleId/add-applicants', authMiddleware.protected, authMiddleware.authorize(['admin']), moduleController.addApplicants);
router.get('/:moduleId/applications', authMiddleware.protected, authMiddleware.authorize(['admin']), moduleController.getModuleApplications);

module.exports = router;