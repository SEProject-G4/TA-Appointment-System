const express = require('express');
const router = express.Router();
const recruitmentController = require('../controllers/recruitmentController');
const { protected, authorize } = require('../middleware/authMiddleware');

router.post('/create', protected, authorize(['admin']), recruitmentController.createRecruitmentSeries);
router.get('/', protected, authorize(['admin']), recruitmentController.getAllRecruitmentSeries);
router.post('/:seriesId/add-module', protected, authorize(['admin']), recruitmentController.addModuleToRecruitmentSeries);

module.exports = router;