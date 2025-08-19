const express = require('express');
const router = express.Router();
const userGroupController = require('../controllers/userGroupController');

// Route to add new users to a group
router.post('/users', userGroupController.createNewUsers);
router.get('/groups/:groupType', userGroupController.getUserGroupsByType);
router.post('/groups', userGroupController.createNewUserGroup);

module.exports = router;