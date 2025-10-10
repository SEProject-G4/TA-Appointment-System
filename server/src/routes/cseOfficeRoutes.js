const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const cseOfficeController = require('../controllers/cseOfficeController');

router.get('/view-ta-documents', authMiddleware.protected, authMiddleware.authorize(['cse-office', 'cse office', 'admin']), cseOfficeController.viewTADocuments);

module.exports = router;
