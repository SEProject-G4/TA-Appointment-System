const express = require('express');
const router = express.Router();
const recruitmentController = require('../controllers/recruitmentController');
const { protected: protectedMiddleware, authorize } = require('../middleware/authMiddleware');

router.post('/create', protectedMiddleware, authorize(['admin']), recruitmentController.createRecruitmentRound);
router.get('/', protectedMiddleware, authorize(['admin']), recruitmentController.getAllRecruitmentRounds);
router.post('/:seriesId/add-module', protectedMiddleware, authorize(['admin']), recruitmentController.addModuleToRecruitmentRound);
router.get('/:seriesId/modules', protectedMiddleware, authorize(['admin']), recruitmentController.getModuleDetailsBySeriesId);
router.get('/:seriesId/eligible-undergraduates', protectedMiddleware, authorize(['admin']), recruitmentController.getEligibleUndergraduates);
router.get('/:seriesId/eligible-postgraduates', protectedMiddleware, authorize(['admin']), recruitmentController.getEligiblePostgraduates);

module.exports = router;