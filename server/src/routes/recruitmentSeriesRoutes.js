const express = require('express');
const router = express.Router();
const recruitmentController = require('../controllers/recruitmentController');
const { protected, authorize } = require('../middleware/authMiddleware');

router.post('/create', protected, authorize(['admin']), recruitmentController.createRecruitmentRound);
router.get('/', protected, authorize(['admin']), recruitmentController.getAllRecruitmentRounds);
router.post('/:seriesId/add-module', protected, authorize(['admin']), recruitmentController.addModuleToRecruitmentRound);
router.get('/:seriesId/modules', protected, authorize(['admin']), recruitmentController.getModuleDetailsBySeriesId);
router.get('/:seriesId/eligible-undergraduates', protected, authorize(['admin']), recruitmentController.getEligibleUndergraduates);
router.get('/:seriesId/eligible-postgraduates', protected, authorize(['admin']), recruitmentController.getEligiblePostgraduates);
router.post('/copy/:seriesId', protected, authorize(['admin']), recruitmentController.copyRecruitmentRound);
router.put('/:seriesId', protected, authorize(['admin']), recruitmentController.updateRecruitmentRound);
router.put('/:seriesId/deadlines', protected, authorize(['admin']), recruitmentController.updateRecruitmentRoundDeadlines);
router.put('/:seriesId/hour-limits', protected, authorize(['admin']), recruitmentController.updateRecruitmentRoundHourLimits);
router.put('/:seriesId/close', protected, authorize(['admin']), recruitmentController.closeRecruitmentRound);
router.put('/:seriesId/archive', protected, authorize(['admin']), recruitmentController.archiveRecruitmentRound);
router.post('/:seriesId/notify-modules', protected, authorize(['admin']), recruitmentController.notifyModules);
router.post('/:seriesId/advertise-modules', protected, authorize(['admin']), recruitmentController.advertiseModules);
router.delete('/:seriesId', protected, authorize(['admin']), recruitmentController.deleteRecruitmentRound);

module.exports = router;