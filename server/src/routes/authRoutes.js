const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/google-verify', authController.googleVerify);
router.get('/current-user', authController.getCurrentUser);
router.post('/logout', authController.logout);

module.exports = router;