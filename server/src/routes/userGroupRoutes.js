const express = require('express');
const router = express.Router();
const userGroupController = require('../controllers/userGroupController');

// Route to add new users to a group
router.post('/users', userGroupController.createNewUsers);
router.get('/groups/admin-office-hod-users', userGroupController.getAdminOfficeHoDUserGroups);
router.get('/groups/:groupType', userGroupController.getUserGroupsByType);
router.post('/groups', userGroupController.createNewUserGroup);
router.get('/groups/:groupId/users', userGroupController.getUsersFromGroup);
router.delete('/groups/:groupId', userGroupController.deleteWholeUserGroup);
router.delete('/users/:userId', userGroupController.deleteUserById);
router.post('/users/delete', userGroupController.deleteUsers);
router.put('/groups/:groupId', userGroupController.updateUserGroupName);
router.put('/users/:userId', userGroupController.updateUserDetails);
router.get('/lecturers', userGroupController.getAllLecturers);

module.exports = router;