const request = require('supertest');
const express = require('express');

// Mock auth middleware to inject an admin user and bypass real auth
// Must mock before importing app to avoid parsing errors with reserved word 'protected'
jest.mock('../../middleware/authMiddleware', () => ({
  protected: (req, res, next) => {
    req.user = { _id: 'admin123', role: 'admin' };
    next();
  },
  authorize: () => (req, res, next) => next()
}));

// Mock routes files that use destructuring with 'protected' (reserved word) to avoid Babel parsing errors
// We replace the problematic destructuring with property access
jest.mock('../../routes/recruitmentSeriesRoutes', () => {
  // Read the actual module but intercept the require of authMiddleware within it
  const express = require('express');
  const router = express.Router();
  const recruitmentController = require('../../controllers/recruitmentController');
  const authMiddleware = require('../../middleware/authMiddleware');
  
  // Replicate routes using property access instead of destructuring
  router.post('/create', authMiddleware.protected, authMiddleware.authorize(['admin']), recruitmentController.createRecruitmentRound);
  router.get('/', authMiddleware.protected, authMiddleware.authorize(['admin']), recruitmentController.getAllRecruitmentRounds);
  router.post('/:seriesId/add-module', authMiddleware.protected, authMiddleware.authorize(['admin']), recruitmentController.addModuleToRecruitmentRound);
  router.get('/:seriesId/modules', authMiddleware.protected, authMiddleware.authorize(['admin']), recruitmentController.getModuleDetailsBySeriesId);
  router.get('/:seriesId/eligible-undergraduates', authMiddleware.protected, authMiddleware.authorize(['admin']), recruitmentController.getEligibleUndergraduates);
  router.get('/:seriesId/eligible-postgraduates', authMiddleware.protected, authMiddleware.authorize(['admin']), recruitmentController.getEligiblePostgraduates);
  router.post('/copy/:seriesId', authMiddleware.protected, authMiddleware.authorize(['admin']), recruitmentController.copyRecruitmentRound);
  router.put('/:seriesId/deadlines', authMiddleware.protected, authMiddleware.authorize(['admin']), recruitmentController.updateRecruitmentRoundDeadlines);
  router.put('/:seriesId/hour-limits', authMiddleware.protected, authMiddleware.authorize(['admin']), recruitmentController.updateRecruitmentRoundHourLimits);
  router.post('/:seriesId/notify-modules', authMiddleware.protected, authMiddleware.authorize(['admin']), recruitmentController.notifyModules);
  router.post('/:seriesId/advertise-modules', authMiddleware.protected, authMiddleware.authorize(['admin']), recruitmentController.advertiseModules);
  router.delete('/:seriesId', authMiddleware.protected, authMiddleware.authorize(['admin']), recruitmentController.deleteRecruitmentRound);
  
  return router;
});

jest.mock('../../routes/jobRoutes', () => {
  const express = require('express');
  const router = express.Router();
  const authMiddleware = require('../../middleware/authMiddleware');
  
  // Simple mock for job routes - not fully implemented in this test
  router.get('/:jobId/status', authMiddleware.protected, authMiddleware.authorize(['admin']), (req, res) => {
    res.status(200).json({ success: true, job: { id: req.params.jobId, status: 'completed' } });
  });
  router.get('/queue/stats', authMiddleware.protected, authMiddleware.authorize(['admin']), (req, res) => {
    res.status(200).json({ success: true, stats: { waiting: 0, active: 0, completed: 0 } });
  });
  
  return router;
});

const app = require('../../app');

// Mock Models used by admin controllers
jest.mock('../../models/User');
jest.mock('../../models/UserGroup');
jest.mock('../../models/RecruitmentRound');
jest.mock('../../models/ModuleDetails');
jest.mock('../../models/TaApplication');
jest.mock('../../models/AppliedModules');
jest.mock('../../models/TaDocumentSubmission');

// Mock Services
jest.mock('../../services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}));

const User = require('../../models/User');
const UserGroup = require('../../models/UserGroup');
const RecruitmentRound = require('../../models/RecruitmentRound');
const ModuleDetails = require('../../models/ModuleDetails');
const TaApplication = require('../../models/TaApplication');
const TaDocumentSubmission = require('../../models/TaDocumentSubmission');
const emailService = require('../../services/emailService');

describe('Admin Routes Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Close database connections and cleanup
    const mongoose = require('mongoose');
    await mongoose.connection.close();
    
    // Give Jest time to close all handles
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  describe('User Management Routes (/api/user-management)', () => {
    describe('GET /api/user-management/overview', () => {
      it('should return user overview with statistics', async () => {
        const mockUserGroups = [
          { _id: 'group1', name: 'Undergraduate 2025', groupType: 'undergraduate', userCount: 150 },
          { _id: 'group2', name: 'Postgraduate 2025', groupType: 'postgraduate', userCount: 25 },
          { _id: 'group3', name: 'Lecturers', groupType: 'lecturer', userCount: 20 }
        ];

        UserGroup.find.mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockUserGroups)
        });

        User.countDocuments.mockResolvedValue(195);

        const res = await request(app).get('/api/user-management/overview');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
          userGroups: mockUserGroups,
          totalUsers: 195
        });
        expect(UserGroup.find).toHaveBeenCalled();
        expect(User.countDocuments).toHaveBeenCalled();
      });

      it('should handle empty user groups', async () => {
        UserGroup.find.mockReturnValue({
          populate: jest.fn().mockResolvedValue([])
        });
        User.countDocuments.mockResolvedValue(0);

        const res = await request(app).get('/api/user-management/overview');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
          userGroups: [],
          totalUsers: 0
        });
      });

      it('should handle database errors gracefully', async () => {
        UserGroup.find.mockReturnValue({
          populate: jest.fn().mockRejectedValue(new Error('Database error'))
        });

        const res = await request(app).get('/api/user-management/overview');

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: 'Internal server error' });
      });
    });

    describe('POST /api/user-management/groups', () => {
      it('should create a new user group', async () => {
        const groupData = {
          name: 'Undergraduate 2026',
          groupType: 'undergraduate',
          description: 'New undergraduate batch'
        };

        const mockGroup = {
          _id: 'newgroup123',
          name: groupData.name,
          groupType: groupData.groupType,
          userCount: 0
        };

        UserGroup.prototype.save = jest.fn().mockResolvedValue(mockGroup);

        const res = await request(app)
          .post('/api/user-management/groups')
          .send(groupData);

        expect(res.status).toBe(201);
        expect(res.body).toEqual({ message: "User group created successfully", group: expect.any(Object) });
      });

      it('should validate required fields', async () => {
        const invalidData = {
          name: 'Test Group'
          // Missing groupType
        };

        UserGroup.prototype.save = jest.fn().mockRejectedValue(new Error('Validation error'));

        const res = await request(app)
          .post('/api/user-management/groups')
          .send(invalidData);

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ message: 'Internal server error' });
      });

      it('should handle duplicate group names', async () => {
        const groupData = {
          name: 'Existing Group',
          groupType: 'undergraduate'
        };

        UserGroup.prototype.save = jest.fn().mockRejectedValue(new Error('Duplicate key error'));

        const res = await request(app)
          .post('/api/user-management/groups')
          .send(groupData);

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ message: 'Internal server error' });
      });
    });

    describe('GET /api/user-management/groups/:groupId/users', () => {
      it('should return users in a specific group', async () => {
        const mockUsers = [
          { _id: 'user1', name: 'John Doe', email: 'john@cse.mrt.ac.lk', indexNumber: 'E/20/001', profilePicture: null, createdAt: new Date() },
          { _id: 'user2', name: 'Jane Smith', email: 'jane@cse.mrt.ac.lk', indexNumber: 'E/20/002', profilePicture: null, createdAt: new Date() }
        ];

        const expectedPayload = [
          { _id: 'user1', name: 'John Doe', email: 'john@cse.mrt.ac.lk', indexNumber: 'E/20/001', profilePicUrl: null, dateAdded: expect.any(String) },
          { _id: 'user2', name: 'Jane Smith', email: 'jane@cse.mrt.ac.lk', indexNumber: 'E/20/002', profilePicUrl: null, dateAdded: expect.any(String) }
        ];

        User.find.mockResolvedValue(mockUsers);

        const res = await request(app).get('/api/user-management/groups/group123/users');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(expectedPayload);
        expect(User.find).toHaveBeenCalledWith({ userGroup: 'group123' });
      });

      it('should handle non-existent group', async () => {
        User.find.mockResolvedValue([]);

        const res = await request(app).get('/api/user-management/groups/nonexistent/users');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
      });
    });

    describe('POST /api/user-management/groups/:groupId/users', () => {
      it('should create a new user in a group', async () => {
        const userData = {
          name: 'New Student',
          email: 'newstudent@cse.mrt.ac.lk',
          indexNumber: 'E/20/999',
          role: 'undergraduate'
        };

        const mockUser = {
          _id: 'newuser123',
          ...userData,
          userGroup: 'group123',
          createdAt: expect.any(String)
        };

        User.create.mockResolvedValue(mockUser);

        const res = await request(app)
          .post('/api/user-management/groups/group123/users')
          .send(userData);

        expect(res.status).toBe(201);
        expect(res.body).toEqual(mockUser);
        expect(User.create).toHaveBeenCalledWith({
          ...userData,
          userGroup: 'group123'
        });
      });

      it('should validate user data', async () => {
        const invalidData = {
          name: 'Test User'
          // Missing required fields
        };

        const res = await request(app)
          .post('/api/user-management/groups/group123/users')
          .send(invalidData);

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Email is required' });
      });
    });

    describe('PUT /api/user-management/users/:userId', () => {
      it('should update user information', async () => {
        const updateData = {
          name: 'Updated Name',
          role: 'postgraduate'
        };

        const mockUpdatedUser = {
          _id: 'user123',
          name: 'Updated Name',
          email: 'user@cse.mrt.ac.lk',
          role: 'postgraduate'
        };

        User.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

        const res = await request(app)
          .put('/api/user-management/users/user123')
          .send(updateData);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
          message: "User details updated successfully",
          user: mockUpdatedUser
        });
        expect(User.findByIdAndUpdate).toHaveBeenCalledWith('user123', { name: 'Updated Name', email: undefined }, { new: true });
      });

      it('should handle non-existent user', async () => {
        User.findByIdAndUpdate.mockResolvedValue(null);

        const res = await request(app)
          .put('/api/user-management/users/nonexistent')
          .send({ name: 'Updated Name' });

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ message: 'User not found' });
      });
    });

    describe('DELETE /api/user-management/users/:userId', () => {
      it('should delete a user', async () => {
        User.findByIdAndDelete.mockResolvedValue({ _id: 'user123' });

        const res = await request(app).delete('/api/user-management/users/user123');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: 'User deleted successfully' });
        expect(User.findByIdAndDelete).toHaveBeenCalledWith('user123');
      });

      it('should handle non-existent user deletion', async () => {
        User.findByIdAndDelete.mockResolvedValue(null);

        const res = await request(app).delete('/api/user-management/users/nonexistent');

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ message: 'User not found' });
      });
    });
  });

  describe('Recruitment Series Management Routes (/api/recruitment-series)', () => {
    describe('POST /api/recruitment-series/create', () => {
      it('should create a new recruitment series', async () => {
        const seriesData = {
          name: 'Fall 2025 TA Recruitment',
          description: 'Recruitment for Fall 2025 semester',
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          status: 'active'
        };

        const mockSeries = {
          _id: 'series123',
          ...seriesData,
          createdAt: expect.any(String)
        };

        RecruitmentRound.create.mockResolvedValue(mockSeries);

        const res = await request(app)
          .post('/api/recruitment-series/create')
          .send(seriesData);

        expect(res.status).toBe(201);
        expect(res.body).toEqual(mockSeries);
        expect(RecruitmentRound.create).toHaveBeenCalledWith(seriesData);
      });

      it('should validate required fields', async () => {
        const invalidData = {
          name: 'Test Series'
          // Missing required fields
        };

        const res = await request(app)
          .post('/api/recruitment-series/create')
          .send(invalidData);

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Start date and end date are required' });
      });
    });

    describe('GET /api/recruitment-series', () => {
      it('should return all recruitment series', async () => {
        const mockSeries = [
          { _id: 'series1', name: 'Fall 2025', status: 'active' },
          { _id: 'series2', name: 'Spring 2025', status: 'completed' }
        ];

        RecruitmentRound.find.mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockSeries)
        });

        const res = await request(app).get('/api/recruitment-series');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockSeries);
        expect(RecruitmentRound.find).toHaveBeenCalled();
      });

      it('should handle empty recruitment series', async () => {
        RecruitmentRound.find.mockReturnValue({
          sort: jest.fn().mockResolvedValue([])
        });

        const res = await request(app).get('/api/recruitment-series');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
      });
    });

    describe('POST /api/recruitment-series/:seriesId/add-module', () => {
      it('should add a module to recruitment series', async () => {
        const moduleData = {
          moduleId: 'module123'
        };

        const mockModule = {
          _id: 'module123',
          moduleCode: 'CS101',
          moduleName: 'Introduction to Programming'
        };

        ModuleDetails.findById.mockResolvedValue(mockModule);
        RecruitmentRound.findByIdAndUpdate.mockResolvedValue({ _id: 'series123' });

        const res = await request(app)
          .post('/api/recruitment-series/series123/add-module')
          .send(moduleData);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: 'Module added to recruitment series' });
        expect(ModuleDetails.findById).toHaveBeenCalledWith('module123');
        expect(RecruitmentRound.findById).toHaveBeenCalledWith('series123');
      });

      it('should handle non-existent module', async () => {
        RecruitmentRound.findById.mockResolvedValue({ _id: 'series123' });
        ModuleDetails.findById.mockResolvedValue(null);

        const res = await request(app)
          .post('/api/recruitment-series/series123/add-module')
          .send({ moduleId: 'nonexistent' });

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'Module not found' });
      });
    });

    describe('GET /api/recruitment-series/:seriesId/modules', () => {
      it('should return modules in a recruitment series', async () => {
        const mockModules = [
          { _id: 'module1', moduleCode: 'CS101', moduleName: 'Intro to Programming' },
          { _id: 'module2', moduleCode: 'CS102', moduleName: 'Data Structures' }
        ];

        RecruitmentRound.findById.mockReturnValue({
          populate: jest.fn().mockResolvedValue({
            _id: 'series123',
            modules: mockModules
          })
        });

        const res = await request(app).get('/api/recruitment-series/series123/modules');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockModules);
      });
    });

    describe('GET /api/recruitment-series/:seriesId/eligible-undergraduates', () => {
      it('should return eligible undergraduate students', async () => {
        const mockStudents = [
          { _id: 'student1', name: 'John Doe', indexNumber: 'E/20/001', role: 'undergraduate' },
          { _id: 'student2', name: 'Jane Smith', indexNumber: 'E/20/002', role: 'undergraduate' }
        ];

        User.find.mockReturnValue({
          select: jest.fn().mockResolvedValue(mockStudents)
        });

        const res = await request(app).get('/api/recruitment-series/series123/eligible-undergraduates');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockStudents);
        expect(User.find).toHaveBeenCalledWith({ role: 'undergraduate' });
      });
    });

    describe('GET /api/recruitment-series/:seriesId/eligible-postgraduates', () => {
      it('should return eligible postgraduate students', async () => {
        const mockStudents = [
          { _id: 'student1', name: 'Alice Johnson', indexNumber: 'E/20/001', role: 'postgraduate' },
          { _id: 'student2', name: 'Bob Wilson', indexNumber: 'E/20/002', role: 'postgraduate' }
        ];

        User.find.mockReturnValue({
          select: jest.fn().mockResolvedValue(mockStudents)
        });

        const res = await request(app).get('/api/recruitment-series/series123/eligible-postgraduates');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockStudents);
        expect(User.find).toHaveBeenCalledWith({ role: 'postgraduate' });
      });
    });
  });

  describe('Module Management Routes (/api/modules)', () => {
    describe('PUT /api/modules/:moduleId/change-status', () => {
      it('should change module status', async () => {
        const statusData = {
          status: 'advertised'
        };

        const mockModule = {
          _id: 'module123',
          moduleCode: 'CS101',
          moduleStatus: 'advertised'
        };

        ModuleDetails.findByIdAndUpdate.mockResolvedValue(mockModule);

        const res = await request(app)
          .put('/api/modules/module123/change-status')
          .send(statusData);

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockModule);
        expect(ModuleDetails.findByIdAndUpdate).toHaveBeenCalledWith(
          'module123',
          { moduleStatus: 'advertised' },
          { new: true }
        );
      });

      it('should handle invalid status', async () => {
        const statusData = {
          status: 'invalid-status'
        };

        const res = await request(app)
          .put('/api/modules/module123/change-status')
          .send(statusData);

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Invalid status' });
      });
    });

    describe('GET /api/modules/:moduleId', () => {
      it('should return module details by ID', async () => {
        const mockModule = {
          _id: 'module123',
          moduleCode: 'CS101',
          moduleName: 'Introduction to Programming',
          semester: 1,
          year: 2025,
          coordinators: ['lecturer123'],
          moduleStatus: 'advertised'
        };

        ModuleDetails.findById.mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockModule)
        });

        const res = await request(app).get('/api/modules/module123');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockModule);
        expect(ModuleDetails.findById).toHaveBeenCalledWith('module123');
      });

      it('should handle non-existent module', async () => {
        ModuleDetails.findById.mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        });

        const res = await request(app).get('/api/modules/nonexistent');

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'Module not found' });
      });
    });

    describe('PUT /api/modules/:moduleId/advertise', () => {
      it('should advertise a module', async () => {
        const mockModule = {
          _id: 'module123',
          moduleCode: 'CS101',
          moduleStatus: 'advertised'
        };

        ModuleDetails.findByIdAndUpdate.mockResolvedValue(mockModule);

        const res = await request(app).put('/api/modules/module123/advertise');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockModule);
        expect(ModuleDetails.findByIdAndUpdate).toHaveBeenCalledWith(
          'module123',
          { moduleStatus: 'advertised' },
          { new: true }
        );
      });
    });
  });

  describe('CSE Office Routes (/api/cse-office)', () => {
    describe('GET /api/cse-office/view-ta-documents', () => {
      it('should return TA documents for admin review', async () => {
        const mockDocuments = [
          {
            _id: 'doc1',
            userId: 'user123',
            documents: {
              cv: { submitted: true, url: 'cv.pdf' },
              transcript: { submitted: true, url: 'transcript.pdf' }
            },
            status: 'submitted'
          }
        ];

        TaDocumentSubmission.find.mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockDocuments)
        });

        const res = await request(app).get('/api/cse-office/view-ta-documents');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockDocuments);
        expect(TaDocumentSubmission.find).toHaveBeenCalled();
      });

      it('should handle empty document submissions', async () => {
        TaDocumentSubmission.find.mockReturnValue({
          populate: jest.fn().mockResolvedValue([])
        });

        const res = await request(app).get('/api/cse-office/view-ta-documents');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
      });
    });
  });

  describe('Admin Authorization Tests', () => {
    it('should allow admin access to all admin routes', async () => {
      const adminRoutes = [
        { method: 'get', path: '/api/user-management/overview' },
        { method: 'post', path: '/api/user-management/groups' },
        { method: 'get', path: '/api/recruitment-series' },
        { method: 'post', path: '/api/recruitment-series/create' },
        { method: 'get', path: '/api/modules/module123' },
        { method: 'put', path: '/api/modules/module123/change-status' },
        { method: 'get', path: '/api/cse-office/view-ta-documents' }
      ];

      for (const route of adminRoutes) {
        const res = await request(app)[route.method](route.path);
        // Should not return 403 (forbidden) since admin has access
        expect(res.status).not.toBe(403);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection errors', async () => {
      User.find.mockRejectedValue(new Error('Database connection failed'));

      const res = await request(app).get('/api/user-management/overview');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Internal server error' });
    });

    it('should handle malformed request data', async () => {
      const res = await request(app)
        .post('/api/user-management/groups')
        .send('invalid json');

      expect(res.status).toBe(400);
    });

    it('should handle concurrent admin operations', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@cse.mrt.ac.lk'
      };

      User.create.mockResolvedValue(mockUser);

      // Send multiple concurrent requests
      const promises = Array(5).fill().map(() =>
        request(app)
          .post('/api/user-management/groups/group123/users')
          .send({
            name: 'Concurrent User',
            email: 'concurrent@cse.mrt.ac.lk',
            role: 'undergraduate'
          })
      );

      const responses = await Promise.all(promises);

      responses.forEach(res => {
        expect(res.status).toBe(201);
      });
    });

    it('should handle large data sets efficiently', async () => {
      const largeUserList = Array(1000).fill().map((_, i) => ({
        _id: `user${i}`,
        name: `User ${i}`,
        email: `user${i}@cse.mrt.ac.lk`,
        profilePicture: null,
        createdAt: new Date(),
        indexNumber: `E/20/${i.toString().padStart(3, '0')}`
      }));

      User.find.mockResolvedValue(largeUserList);

      const res = await request(app).get('/api/user-management/groups/group123/users');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1000);
    });
  });

  describe('Integration Workflows', () => {
    it('should handle complete user management workflow', async () => {
      // Step 1: Create user group
      const groupData = {
        name: 'Test Group',
        groupType: 'undergraduate'
      };

      const mockGroup = { _id: 'group123', ...groupData };
      UserGroup.create.mockResolvedValue(mockGroup);

      const groupRes = await request(app)
        .post('/api/user-management/groups')
        .send(groupData);

      expect(groupRes.status).toBe(201);

      // Step 2: Add user to group
      const userData = {
        name: 'Test User',
        email: 'test@cse.mrt.ac.lk',
        role: 'undergraduate'
      };

      const mockUser = { _id: 'user123', ...userData, userGroup: 'group123' };
      User.create.mockResolvedValue(mockUser);

      const userRes = await request(app)
        .post('/api/user-management/groups/group123/users')
        .send(userData);

      expect(userRes.status).toBe(201);

      // Step 3: Update user
      const updateData = { role: 'postgraduate' };
      const mockUpdatedUser = { ...mockUser, ...updateData };
      User.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

      const updateRes = await request(app)
        .put('/api/user-management/users/user123')
        .send(updateData);

      expect(updateRes.status).toBe(200);

      // Step 4: Delete user
      User.findByIdAndDelete.mockResolvedValue(mockUser);

      const deleteRes = await request(app)
        .delete('/api/user-management/users/user123');

      expect(deleteRes.status).toBe(200);
    });

    it('should handle complete recruitment series workflow', async () => {
      // Step 1: Create recruitment series
      const seriesData = {
        name: 'Test Recruitment',
        startDate: '2025-01-01',
        endDate: '2025-01-31'
      };

      const mockSeries = { _id: 'series123', ...seriesData };
      RecruitmentRound.create.mockResolvedValue(mockSeries);

      const seriesRes = await request(app)
        .post('/api/recruitment-series/create')
        .send(seriesData);

      expect(seriesRes.status).toBe(201);

      // Step 2: Add module to series
      const mockModule = { _id: 'module123', moduleCode: 'CS101' };
      ModuleDetails.findById.mockResolvedValue(mockModule);
      RecruitmentRound.findById.mockResolvedValue(mockSeries);

      const moduleRes = await request(app)
        .post('/api/recruitment-series/series123/add-module')
        .send({ moduleId: 'module123' });

      expect(moduleRes.status).toBe(200);

      // Step 3: Get series modules
      RecruitmentRound.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: 'series123',
          modules: [mockModule]
        })
      });

      const modulesRes = await request(app)
        .get('/api/recruitment-series/series123/modules');

      expect(modulesRes.status).toBe(200);
      expect(modulesRes.body).toEqual([mockModule]);
    });
  });
});
