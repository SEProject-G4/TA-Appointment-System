const express = require('express');
const router = express.Router();
const recruitmentController = require('../controllers/recruitmentController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create', authMiddleware.protected, authMiddleware.authorize(['admin']), recruitmentController.createRecruitmentRound);
router.get('/', authMiddleware.protected, authMiddleware.authorize(['admin']), recruitmentController.getAllRecruitmentRounds);
router.post('/:seriesId/add-module', authMiddleware.protected, authMiddleware.authorize(['admin']), recruitmentController.addModuleToRecruitmentRound);
router.get('/:seriesId/modules', authMiddleware.protected, authMiddleware.authorize(['admin']), recruitmentController.getModuleDetailsBySeriesId);
router.get('/:seriesId/eligible-undergraduates', authMiddleware.protected, authMiddleware.authorize(['admin']), recruitmentController.getEligibleUndergraduates);
router.get('/:seriesId/eligible-postgraduates', authMiddleware.protected, authMiddleware.authorize(['admin']), recruitmentController.getEligiblePostgraduates);

module.exports = router;