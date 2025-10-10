const userGroupController = require('../../controllers/userGroupController');
const User = require('../../models/User');
const UserGroup = require('../../models/UserGroup');

jest.mock('../../models/User');
jest.mock('../../models/UserGroup');

describe('userGroupController (admin user management)', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = { params: {}, body: {} };
    mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  describe('initializeUserGroups', () => {
    it('creates default groups if not existing', async () => {
      UserGroup.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const saved = [];
      UserGroup.mockImplementation(({ name, groupType }) => ({ name, groupType, userCount: 0, save: jest.fn().mockImplementation(function() { saved.push({ name, groupType }); return Promise.resolve(); }) }));

      await userGroupController.initializeUserGroups();

      expect(saved.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('createNewUsers', () => {
    it('assigns Ungrouped when groupId empty and validates undergraduates', async () => {
      mockReq.body = {
        users: [{ email: 'u1@example.com', indexNumber: 'E/12/345' }],
        userRole: 'undergraduate',
        groupId: ''
      };

      UserGroup.findOne.mockResolvedValue({ _id: 'group-ung-ug' });
      User.insertMany.mockResolvedValue({});

      await userGroupController.createNewUsers(mockReq, mockRes);

      expect(UserGroup.findOne).toHaveBeenCalledWith({ name: 'Ungrouped', groupType: 'undergraduate' });
      expect(User.insertMany).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ role: 'undergraduate', userGroup: 'group-ung-ug' })
      ]));
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('returns 400 when required field missing for undergraduates', async () => {
      mockReq.body = {
        users: [{ email: 'u1@example.com' }],
        userRole: 'undergraduate',
        groupId: 'some'
      };

      await userGroupController.createNewUsers(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Index Number is required for this user type.' });
    });

    it('validates lecturer displayName', async () => {
      mockReq.body = {
        users: [{ email: 'l1@example.com' }],
        userRole: 'lecturer',
        groupId: 'gid'
      };

      await userGroupController.createNewUsers(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Display Name is required for this user type.' });
    });
  });

  describe('getUserGroupsByType', () => {
    it('fetches by groupType', async () => {
      mockReq.params = { groupType: 'undergraduate' };
      UserGroup.find.mockResolvedValue([{ _id: 'g1', name: 'A' }]);

      await userGroupController.getUserGroupsByType(mockReq, mockRes);

      expect(UserGroup.find).toHaveBeenCalledWith({ groupType: 'undergraduate' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([{ _id: 'g1', name: 'A' }]);
    });
  });

  describe('getUsersFromGroup', () => {
    it('maps users to payload shape', async () => {
      mockReq.params = { groupId: 'g1' };
      User.find.mockResolvedValue([
        { _id: 'u1', name: 'N', email: 'e', profilePicture: 'p', createdAt: 'd', indexNumber: 'idx' }
      ]);

      await userGroupController.getUsersFromGroup(mockReq, mockRes);

      expect(User.find).toHaveBeenCalledWith({ userGroup: 'g1' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([
        { _id: 'u1', name: 'N', email: 'e', profilePicUrl: 'p', dateAdded: 'd', indexNumber: 'idx' }
      ]);
    });
  });

  describe('deleteUserById', () => {
    it('deletes single user', async () => {
      mockReq.params = { userId: 'u1' };
      User.findByIdAndDelete.mockResolvedValue({ _id: 'u1' });

      await userGroupController.deleteUserById(mockReq, mockRes);

      expect(User.findByIdAndDelete).toHaveBeenCalledWith('u1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('returns 404 when user missing', async () => {
      mockReq.params = { userId: 'u1' };
      User.findByIdAndDelete.mockResolvedValue(null);

      await userGroupController.deleteUserById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteUsers', () => {
    it('bulk delete', async () => {
      mockReq.body = { userIds: ['u1', 'u2'] };
      User.deleteMany.mockResolvedValue({ deletedCount: 2 });

      await userGroupController.deleteUsers(mockReq, mockRes);

      expect(User.deleteMany).toHaveBeenCalledWith({ _id: { $in: ['u1', 'u2'] } });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Users deleted successfully', deletedCount: 2 });
    });
  });

  describe('deleteWholeUserGroup', () => {
    it('deletes users and group in transaction', async () => {
      mockReq.params = { groupId: 'g1' };

      const session = { startTransaction: jest.fn(), commitTransaction: jest.fn(), abortTransaction: jest.fn(), endSession: jest.fn() };
      User.startSession.mockResolvedValue(session);
      User.deleteMany.mockReturnValue({ session: () => Promise.resolve({ deletedCount: 3 }) });
      UserGroup.findByIdAndDelete.mockReturnValue({ session: () => Promise.resolve({ _id: 'g1' }) });

      await userGroupController.deleteWholeUserGroup(mockReq, mockRes);

      expect(session.startTransaction).toHaveBeenCalled();
      expect(session.commitTransaction).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('returns 404 if group not found', async () => {
      mockReq.params = { groupId: 'g1' };

      const session = { startTransaction: jest.fn(), commitTransaction: jest.fn(), abortTransaction: jest.fn(), endSession: jest.fn() };
      User.startSession.mockResolvedValue(session);
      User.deleteMany.mockReturnValue({ session: () => Promise.resolve({ deletedCount: 0 }) });
      UserGroup.findByIdAndDelete.mockReturnValue({ session: () => Promise.resolve(null) });

      await userGroupController.deleteWholeUserGroup(mockReq, mockRes);

      expect(session.abortTransaction).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateUserGroupName', () => {
    it('updates group name', async () => {
      mockReq.params = { groupId: 'g1' };
      mockReq.body = { newName: 'New' };
      UserGroup.findByIdAndUpdate.mockResolvedValue({ _id: 'g1', name: 'New' });

      await userGroupController.updateUserGroupName(mockReq, mockRes);

      expect(UserGroup.findByIdAndUpdate).toHaveBeenCalledWith('g1', { name: 'New' }, { new: true });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('returns 404 when group missing', async () => {
      mockReq.params = { groupId: 'g1' };
      mockReq.body = { newName: 'New' };
      UserGroup.findByIdAndUpdate.mockResolvedValue(null);

      await userGroupController.updateUserGroupName(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateUserDetails', () => {
    it('updates user fields', async () => {
      mockReq.params = { userId: 'u1' };
      mockReq.body = { name: 'A', email: 'b@example.com', role: 'ignored', indexNumber: 'IDX' };
      User.findByIdAndUpdate.mockResolvedValue({ _id: 'u1' });

      await userGroupController.updateUserDetails(mockReq, mockRes);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('u1', { name: 'A', email: 'b@example.com', indexNumber: 'IDX' }, { new: true });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('returns 404 when user missing', async () => {
      mockReq.params = { userId: 'u1' };
      mockReq.body = { name: 'A' };
      User.findByIdAndUpdate.mockResolvedValue(null);

      await userGroupController.updateUserDetails(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getAllLecturers', () => {
    it('returns lecturers', async () => {
      User.find.mockResolvedValue([{ _id: 'l1' }]);

      await userGroupController.getAllLecturers({}, mockRes);

      expect(User.find).toHaveBeenCalledWith({ role: { $in: ['lecturer'] } });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('createNewUserGroup', () => {
    it('creates group', async () => {
      mockReq.body = { name: 'G', groupType: 'undergraduate' };
      UserGroup.mockImplementation((doc) => ({ ...doc, save: jest.fn().mockResolvedValue({}) }));

      await userGroupController.createNewUserGroup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User group created successfully', group: expect.objectContaining({ name: 'G', groupType: 'undergraduate', userCount: 0 }) });
    });
  });
});


