const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { protected, authorize } = require('../middleware/authMiddleware');

router.delete('/:applicationId', protected, authorize(['admin']), applicationController.deleteApplication);

module.exports = router;