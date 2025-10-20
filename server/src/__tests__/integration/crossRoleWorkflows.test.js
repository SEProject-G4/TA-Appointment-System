const request = require('supertest');

// Mock routes files that use destructuring with 'protected' (reserved word) to avoid Babel parsing errors
jest.mock('../../routes/recruitmentSeriesRoutes', () => {
  const express = require('express');
  const router = express.Router();
  const recruitmentController = require('../../controllers/recruitmentController');
  const authMiddleware = require('../../middleware/authMiddleware');
  
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
  
  router.get('/:jobId/status', authMiddleware.protected, authMiddleware.authorize(['admin']), (req, res) => {
    res.status(200).json({ success: true, job: { id: req.params.jobId, status: 'completed' } });
  });
  router.get('/queue/stats', authMiddleware.protected, authMiddleware.authorize(['admin']), (req, res) => {
    res.status(200).json({ success: true, stats: { waiting: 0, active: 0, completed: 0 } });
  });
  
  return router;
});

const app = require('../../app');

// Mock Models
jest.mock('../../models/User');
jest.mock('../../models/ModuleDetails');
jest.mock('../../models/TaApplication');
jest.mock('../../models/TaDocumentSubmission');
jest.mock('../../models/RecruitmentRound');
jest.mock('../../models/UserGroup');
jest.mock('../../models/AppliedModules');

const User = require('../../models/User');
const ModuleDetails = require('../../models/ModuleDetails');
const TaApplication = require('../../models/TaApplication');
const TaDocumentSubmission = require('../../models/TaDocumentSubmission');
const RecruitmentRound = require('../../models/RecruitmentRound');
const UserGroup = require('../../models/UserGroup');

describe('Cross-Role Workflows Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete TA Recruitment Workflow', () => {
    it('should handle complete workflow from admin creating recruitment to TA getting appointed', async () => {
      // Step 1: Admin creates recruitment series
      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'admin123', role: 'admin' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      const recruitmentData = {
        seriesName: 'Spring 2025 TA Recruitment',
        startDate: '2025-01-01',
        endDate: '2025-03-31',
        description: 'Recruitment for Spring 2025 semester'
      };

      const mockRecruitmentSeries = { _id: 'series123', ...recruitmentData };
      RecruitmentRound.create.mockResolvedValue(mockRecruitmentSeries);

      let res = await request(app)
        .post('/api/recruitment-series/create')
        .send(recruitmentData);

      expect(res.status).toBe(201);
      expect(res.body.recruitmentSeries._id).toBe('series123');

      // Step 2: Admin adds module to recruitment series
      const moduleData = {
        moduleId: 'module123',
        requiredTAHours: 8,
        requiredUndergraduateTACount: 2,
        requiredPostgraduateTACount: 1,
        requirements: 'Good programming skills'
      };

      const mockModule = { _id: 'module123', moduleCode: 'CS101' };
      RecruitmentRound.findById.mockResolvedValue(mockRecruitmentSeries);
      ModuleDetails.findById.mockResolvedValue(mockModule);
      RecruitmentRound.findByIdAndUpdate.mockResolvedValue({});

      res = await request(app)
        .post('/api/recruitment-series/series123/add-module')
        .send(moduleData);

      expect(res.status).toBe(200);

      // Step 3: TA applies for position
      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'ta123', role: 'undergraduate' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      const applicationData = {
        moduleId: 'module123',
        motivation: 'I am passionate about teaching programming',
        relevantExperience: 'I have tutored programming for 2 years'
      };

      const mockNewApplication = {
        _id: 'app123',
        userId: 'ta123',
        moduleId: 'module123',
        status: 'pending',
        ...applicationData
      };

      ModuleDetails.findById.mockResolvedValue({
        _id: 'module123',
        requiredUndergraduateTACount: 2,
        undergraduateCounts: { applied: 0, accepted: 0 }
      });
      TaApplication.findOne.mockResolvedValue(null);
      TaApplication.create.mockResolvedValue(mockNewApplication);
      ModuleDetails.findByIdAndUpdate.mockResolvedValue({});

      res = await request(app)
        .post('/api/ta/apply')
        .send(applicationData);

      expect(res.status).toBe(201);
      expect(res.body.application._id).toBe('app123');

      // Step 4: Lecturer reviews and accepts application
      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'lecturer123', role: 'lecturer' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      const mockApplication = {
        _id: 'app123',
        moduleId: 'module123',
        userId: 'ta123',
        status: 'pending',
        save: jest.fn().mockResolvedValue(true)
      };

      const mockUser = { _id: 'ta123', role: 'undergraduate' };

      TaApplication.findById.mockResolvedValue(mockApplication);
      ModuleDetails.findById.mockResolvedValue({
        _id: 'module123',
        coordinators: ['lecturer123']
      });
      User.findById.mockReturnValue({
        select: () => mockUser
      });
      ModuleDetails.findByIdAndUpdate.mockResolvedValue({});

      res = await request(app).patch('/api/lecturer/applications/app123/accept');

      expect(res.status).toBe(200);
      expect(mockApplication.status).toBe('accepted');

      // Step 5: TA submits documents
      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'ta123', role: 'undergraduate' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      const documentData = {
        cv: { url: 'cv.pdf', fileName: 'cv.pdf' },
        transcript: { url: 'transcript.pdf', fileName: 'transcript.pdf' },
        id: { url: 'id.pdf', fileName: 'id.pdf' }
      };

      const mockDocumentSubmission = {
        _id: 'doc123',
        userId: 'ta123',
        documents: documentData,
        status: 'submitted'
      };

      TaDocumentSubmission.findOne.mockResolvedValue(null);
      TaDocumentSubmission.create.mockResolvedValue(mockDocumentSubmission);

      res = await request(app)
        .post('/api/ta/submit-documents')
        .send({ documents: documentData });

      expect(res.status).toBe(201);
      expect(res.body.documentSubmission._id).toBe('doc123');

      // Step 6: CSE Office verifies documents
      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'cse123', role: 'cse-office' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      const verificationData = {
        documentSubmissionId: 'doc123',
        action: 'approve',
        comments: 'All documents verified successfully'
      };

      const mockDocumentSubmissionToVerify = {
        _id: 'doc123',
        userId: 'ta123',
        status: 'submitted',
        documents: documentData,
        save: jest.fn().mockResolvedValue(true)
      };

      TaDocumentSubmission.findById.mockResolvedValue(mockDocumentSubmissionToVerify);

      res = await request(app)
        .post('/api/cse-office/verify-documents')
        .send(verificationData);

      expect(res.status).toBe(200);
      expect(mockDocumentSubmissionToVerify.status).toBe('approved');
    });
  });

  describe('Module Management Workflow', () => {
    it('should handle module creation to TA assignment workflow', async () => {
      // Step 1: Admin creates module
      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'admin123', role: 'admin' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      const moduleData = {
        moduleCode: 'CS101',
        moduleName: 'Introduction to Programming',
        semester: 1,
        year: 2025,
        coordinators: ['lecturer123'],
        requiredTAHours: 8,
        requiredUndergraduateTACount: 2,
        requiredPostgraduateTACount: 1,
        requirements: 'Good programming skills'
      };

      const mockNewModule = { _id: 'module456', ...moduleData };
      ModuleDetails.create.mockResolvedValue(mockNewModule);

      let res = await request(app)
        .post('/api/modules')
        .send(moduleData);

      expect(res.status).toBe(201);
      expect(res.body.module._id).toBe('module456');

      // Step 2: Lecturer views and edits module details
      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'lecturer123', role: 'lecturer' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      const mockModule = {
        _id: 'module456',
        coordinators: ['lecturer123'],
        moduleStatus: 'pending changes',
        undergraduateCounts: { required: 2, remaining: 2, applied: 0, accepted: 0 }
      };

      ModuleDetails.findById.mockResolvedValue(mockModule);
      ModuleDetails.findByIdAndUpdate.mockResolvedValue({});

      const updateData = {
        requiredTAHours: 10,
        requirements: 'Updated requirements'
      };

      res = await request(app)
        .patch('/api/lecturer/modules/module456')
        .send(updateData);

      expect(res.status).toBe(200);

      // Step 3: Lecturer views TA applications
      const mockApplications = [
        {
          _id: 'app1',
          moduleId: 'module456',
          userId: 'ta1',
          status: 'pending',
          createdAt: new Date()
        }
      ];

      const mockModulesWithApps = [
        {
          _id: 'module456',
          moduleCode: 'CS101',
          moduleName: 'Introduction to Programming',
          totalApplications: 1,
          pendingCount: 1,
          acceptedCount: 0
        }
      ];

      ModuleDetails.find.mockReturnValue({
        select: () => mockModulesWithApps
      });

      TaApplication.find.mockReturnValue({
        lean: () => mockApplications
      });

      User.find.mockReturnValue({
        select: () => [
          { _id: 'ta1', name: 'John Doe', indexNumber: 'E/20/001', role: 'undergraduate' }
        ]
      });

      res = await request(app).get('/api/lecturer/handle-requests');

      expect(res.status).toBe(200);
      expect(res.body.modules).toHaveLength(1);
      expect(res.body.modules[0].totalApplications).toBe(1);
    });
  });

  describe('User Management Workflow', () => {
    it('should handle complete user lifecycle from creation to role changes', async () => {
      // Step 1: Admin creates user group
      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'admin123', role: 'admin' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      const userGroupData = {
        name: 'Undergraduate 2025',
        groupType: 'undergraduate'
      };

      const mockUserGroup = { _id: 'group123', ...userGroupData };
      UserGroup.create.mockResolvedValue(mockUserGroup);

      let res = await request(app)
        .post('/api/user-management/user-groups')
        .send(userGroupData);

      expect(res.status).toBe(201);
      expect(res.body.userGroup._id).toBe('group123');

      // Step 2: Admin creates users in the group
      const userData = {
        name: 'New Student',
        email: 'student@example.com',
        indexNumber: 'E/20/999',
        role: 'undergraduate',
        userGroup: 'group123'
      };

      const mockNewUser = { _id: 'user123', ...userData };
      UserGroup.findById.mockResolvedValue(mockUserGroup);
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockNewUser);
      UserGroup.findByIdAndUpdate.mockResolvedValue({});

      res = await request(app)
        .post('/api/user-management/add-user')
        .send(userData);

      expect(res.status).toBe(201);
      expect(res.body.user._id).toBe('user123');

      // Step 3: Admin views user overview
      const mockUserGroups = [
        { _id: 'group123', name: 'Undergraduate 2025', groupType: 'undergraduate', userCount: 1 }
      ];

      UserGroup.find.mockReturnValue({
        populate: () => mockUserGroups
      });

      res = await request(app).get('/api/user-management/overview');

      expect(res.status).toBe(200);
      expect(res.body.userGroups).toHaveLength(1);
      expect(res.body.totalUsers).toBe(1);

      // Step 4: Admin updates user role
      const updateUserData = {
        role: 'postgraduate'
      };

      User.findById.mockResolvedValue(mockNewUser);
      User.findByIdAndUpdate.mockResolvedValue({ ...mockNewUser, role: 'postgraduate' });

      res = await request(app)
        .patch('/api/user-management/users/user123')
        .send(updateUserData);

      expect(res.status).toBe(200);
    });
  });

  describe('Data Consistency Tests', () => {
    it('should maintain data consistency across role interactions', async () => {
      // Test that when a TA application is accepted, counts are updated correctly
      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'lecturer123', role: 'lecturer' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      const mockApplication = {
        _id: 'app123',
        moduleId: 'module123',
        userId: 'ta123',
        status: 'pending',
        save: jest.fn().mockResolvedValue(true)
      };

      const mockModule = {
        _id: 'module123',
        coordinators: ['lecturer123'],
        undergraduateCounts: {
          required: 2,
          remaining: 2,
          applied: 1,
          accepted: 0,
          docSubmitted: 0,
          appointed: 0
        }
      };

      const mockUser = { _id: 'ta123', role: 'undergraduate' };

      TaApplication.findById.mockResolvedValue(mockApplication);
      ModuleDetails.findById.mockResolvedValue(mockModule);
      User.findById.mockReturnValue({
        select: () => mockUser
      });

      // Mock the update to ensure counts are decremented correctly
      ModuleDetails.findByIdAndUpdate.mockImplementation((id, update) => {
        expect(update.$inc).toEqual({
          'undergraduateCounts.remaining': -1,
          'undergraduateCounts.accepted': 1
        });
        return Promise.resolve({});
      });

      const res = await request(app).patch('/api/lecturer/applications/app123/accept');

      expect(res.status).toBe(200);
      expect(ModuleDetails.findByIdAndUpdate).toHaveBeenCalledWith(
        'module123',
        expect.objectContaining({
          $inc: expect.objectContaining({
            'undergraduateCounts.remaining': -1,
            'undergraduateCounts.accepted': 1
          })
        })
      );
    });

    it('should maintain referential integrity across related entities', async () => {
      // Test that when a user is deleted, related applications are handled correctly
      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'admin123', role: 'admin' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      const mockUser = { _id: 'user123', name: 'Test User' };
      const mockApplications = [
        { _id: 'app1', userId: 'user123', moduleId: 'module1' },
        { _id: 'app2', userId: 'user123', moduleId: 'module2' }
      ];

      User.findById.mockResolvedValue(mockUser);
      TaApplication.find.mockReturnValue({
        populate: () => mockApplications
      });
      User.findByIdAndDelete.mockResolvedValue(mockUser);
      TaApplication.deleteMany.mockResolvedValue({ deletedCount: 2 });

      const res = await request(app).delete('/api/user-management/users/user123');

      expect(res.status).toBe(200);
      expect(TaApplication.deleteMany).toHaveBeenCalledWith({ userId: 'user123' });
    });
  });

  describe('Concurrent Operations Tests', () => {
    it('should handle concurrent TA applications for the same position', async () => {
      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'ta123', role: 'undergraduate' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      const mockModule = {
        _id: 'module123',
        requiredUndergraduateTACount: 1, // Only 1 position available
        undergraduateCounts: { applied: 0, accepted: 0 }
      };

      const applicationData = {
        moduleId: 'module123',
        motivation: 'I want to apply'
      };

      // First application succeeds
      ModuleDetails.findById.mockResolvedValueOnce(mockModule);
      TaApplication.findOne.mockResolvedValueOnce(null);
      TaApplication.create.mockResolvedValueOnce({ _id: 'app1', ...applicationData });
      ModuleDetails.findByIdAndUpdate.mockResolvedValueOnce({});

      let res1 = await request(app)
        .post('/api/ta/apply')
        .send(applicationData);

      expect(res1.status).toBe(201);

      // Update module counts for second application
      const updatedModule = {
        ...mockModule,
        undergraduateCounts: { applied: 1, accepted: 0 }
      };

      // Second application should fail due to quota
      ModuleDetails.findById.mockResolvedValueOnce(updatedModule);
      TaApplication.findOne.mockResolvedValueOnce(null);

      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'ta456', role: 'undergraduate' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      let res2 = await request(app)
        .post('/api/ta/apply')
        .send(applicationData);

      expect(res2.status).toBe(400);
      expect(res2.body).toEqual({ error: 'No available positions for your role in this module' });
    });

    it('should handle concurrent document submissions', async () => {
      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'ta123', role: 'undergraduate' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      const documentData = {
        cv: { url: 'cv.pdf', fileName: 'cv.pdf' },
        transcript: { url: 'transcript.pdf', fileName: 'transcript.pdf' },
        id: { url: 'id.pdf', fileName: 'id.pdf' }
      };

      // First submission creates new document submission
      TaDocumentSubmission.findOne.mockResolvedValueOnce(null);
      TaDocumentSubmission.create.mockResolvedValueOnce({
        _id: 'doc123',
        userId: 'ta123',
        documents: documentData,
        status: 'submitted'
      });

      let res1 = await request(app)
        .post('/api/ta/submit-documents')
        .send({ documents: documentData });

      expect(res1.status).toBe(201);

      // Second submission should update existing document submission
      TaDocumentSubmission.findOne.mockResolvedValueOnce({
        _id: 'doc123',
        userId: 'ta123',
        documents: documentData,
        save: jest.fn().mockResolvedValue(true)
      });

      let res2 = await request(app)
        .post('/api/ta/submit-documents')
        .send({ documents: documentData });

      expect(res2.status).toBe(200);
    });
  });

  describe('Error Propagation Tests', () => {
    it('should handle cascading failures gracefully', async () => {
      // Test that when one service fails, the error is properly propagated
      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'lecturer123', role: 'lecturer' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      // Mock database failure during application acceptance
      TaApplication.findById.mockResolvedValue({
        _id: 'app123',
        status: 'pending',
        save: jest.fn().mockRejectedValue(new Error('Database save failed'))
      });

      ModuleDetails.findById.mockResolvedValue({
        _id: 'module123',
        coordinators: ['lecturer123']
      });

      User.findById.mockReturnValue({
        select: () => ({ _id: 'ta123', role: 'undergraduate' })
      });

      const res = await request(app).patch('/api/lecturer/applications/app123/accept');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Failed to update application' });
    });
  });
});
