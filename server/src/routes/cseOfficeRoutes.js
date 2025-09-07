const express = require('express');
const router = express.Router();
const { protected, authorize } = require('../middleware/authMiddleware');
const cseOfficeController = require('../controllers/cseOfficeController');

router.get('/view-ta-documents', protected, authorize(['cse-office', 'cse office', 'admin']), cseOfficeController.viewTADocuments);

module.exports = router;
