const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/google', authController.googlleLogin);
router.get|('/google/callback', authController.googleCallback);
router.get('/current-user', authController.getCurrentUser);
router.get('/logout', authController.logout);

module.exports = router;