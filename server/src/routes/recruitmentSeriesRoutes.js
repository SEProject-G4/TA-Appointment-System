const express = require('express');
const router = express.Router();
const recruitmentController = require('../controllers/recruitmentController');
const { protected, authorize } = require('../middleware/authMiddleware');

router.post('/create', protected, authorize(['admin']), recruitmentController.createRecruitmentSeries);
router.get('/', protected, authorize(['admin']), recruitmentController.getAllRecruitmentSeries);
router.post('/:seriesId/add-module', protected, authorize(['admin']), recruitmentController.addModuleToRecruitmentSeries);
router.get('/:seriesId/modules', protected, authorize(['admin']), recruitmentController.getModuleDetailsBySeriesId);
router.get('/:seriesId/eligible-undergraduates', protected, authorize(['admin']), recruitmentController.getEligibleUndergraduates);
router.get('/:seriesId/eligible-postgraduates', protected, authorize(['admin']), recruitmentController.getEligiblePostgraduates);

module.exports = router;