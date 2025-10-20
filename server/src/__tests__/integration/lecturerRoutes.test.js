const request = require('supertest');

// Mock auth middleware to inject a lecturer user and bypass real auth
jest.mock('../../middleware/authMiddleware', () => ({
  protected: (req, res, next) => {
    req.user = { _id: 'lecturer123', role: 'lecturer' };
    next();
  },
  authorize: () => (req, res, next) => next()
}));

// Mock routes files that use destructuring with 'protected' (reserved word)
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

// Mock Models used by the lecturer controller
jest.mock('../../models/ModuleDetails');
jest.mock('../../models/TaApplication');
jest.mock('../../models/User');
jest.mock('../../models/TaDocumentSubmission');
jest.mock('../../models/AppliedModules');
jest.mock('../../models/documentModel');

const ModuleDetails = require('../../models/ModuleDetails');
const TaApplication = require('../../models/TaApplication');
const User = require('../../models/User');
const TaDocumentSubmission = require('../../models/TaDocumentSubmission');
const AppliedModules = require('../../models/AppliedModules');
const documentModel = require('../../models/documentModel');

describe('Lecturer Routes Integration', () => {
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

  describe('GET /api/lecturer/modules', () => {
    it('returns modules grouped by status for coordinator', async () => {
      const modules = [
        { _id: 'm1', moduleStatus: 'pending changes' },
        { _id: 'm2', moduleStatus: 'changes submitted' },
        { _id: 'm3', moduleStatus: 'advertised' }
      ];
      ModuleDetails.find.mockReturnValue({
        select: () => ({ sort: () => modules })
      });

      const res = await request(app).get('/api/lecturer/modules');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(expect.objectContaining({
        pendingChanges: [{ _id: 'm1', moduleStatus: 'pending changes' }],
        changesSubmitted: [{ _id: 'm2', moduleStatus: 'changes submitted' }],
        advertised: [{ _id: 'm3', moduleStatus: 'advertised' }]
      }));
    });
  });

  describe('PATCH /api/lecturer/modules/:id', () => {
    it('updates module requirements when user is coordinator', async () => {
      const moduleDoc = {
        _id: 'm1',
        coordinators: ['lecturer123'],
        moduleStatus: 'pending changes',
        undergraduateCounts: { required: 0, remaining: 0, applied: 0, reviewed: 0, accepted: 0, docSubmitted: 0, appointed: 0 },
        postgraduateCounts: { required: 0, remaining: 0, applied: 0, reviewed: 0, accepted: 0, docSubmitted: 0, appointed: 0 }
      };
      ModuleDetails.findById.mockResolvedValue(moduleDoc);
      ModuleDetails.findByIdAndUpdate.mockResolvedValue({ _id: 'm1' });

      const res = await request(app)
        .patch('/api/lecturer/modules/m1')
        .send({ requiredTAHours: 8, requiredUndergraduateTACount: 2, requiredPostgraduateTACount: 1, requirements: 'Reqs' });

      expect(res.status).toBe(200);
      expect(ModuleDetails.findById).toHaveBeenCalledWith('m1');
      expect(ModuleDetails.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('rejects when user is not a coordinator', async () => {
      const moduleDoc = { _id: 'm1', coordinators: ['other'], moduleStatus: 'pending changes' };
      ModuleDetails.findById.mockResolvedValue(moduleDoc);

      const res = await request(app)
        .patch('/api/lecturer/modules/m1')
        .send({ requiredUndergraduateTACount: 1 });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Not authorized to edit this module' });
    });
  });

  describe('GET /api/lecturer/handle-requests', () => {
    it('groups TA applications by module with counts', async () => {
      const modules = [
        { _id: 'm1', moduleCode: 'CS101', moduleName: 'Intro', semester: 1, year: 2025, requiredTACount: 3, requiredUndergraduateTACount: 2, requiredPostgraduateTACount: 1, requiredTAHours: 6 }
      ];
      ModuleDetails.find.mockReturnValue({ select: () => modules });

      const apps = [
        { _id: 'a1', moduleId: 'm1', userId: 'u1', status: 'pending', createdAt: new Date() },
        { _id: 'a2', moduleId: 'm1', userId: 'u2', status: 'accepted', createdAt: new Date() },
        { _id: 'a3', moduleId: 'm1', userId: 'u3', status: 'rejected', createdAt: new Date() }
      ];
      TaApplication.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(apps) });
      User.find.mockReturnValue({ select: () => ([{ _id: 'u1', name: 'A', indexNumber: 'E/00/001', role: 'undergraduate' }, { _id: 'u2', name: 'B', indexNumber: 'E/00/002', role: 'postgraduate' }, { _id: 'u3', name: 'C', indexNumber: 'E/00/003', role: 'undergraduate' }]) });

      const res = await request(app).get('/api/lecturer/handle-requests');

      if (res.status !== 200) {
        console.log('Response status:', res.status);
        console.log('Response body:', res.body);
      }
      expect(res.status).toBe(200);
      expect(res.body.modules).toHaveLength(1);
      expect(res.body.modules[0]).toEqual(expect.objectContaining({
        moduleCode: 'CS101',
        totalApplications: 3,
        pendingCount: 1,
        acceptedCount: 1,
        rejectedCount: 1
      }));
      expect(res.body.modules[0].applications).toHaveLength(3);
    });
  });

  describe('PATCH /api/lecturer/applications/:id/accept', () => {
    it('accepts application and updates counts based on role', async () => {
      const appDoc = { _id: 'a1', moduleId: 'm1', userId: 'u1', status: 'pending', save: jest.fn().mockResolvedValue(true) };
      const moduleDoc = { _id: 'm1', coordinators: ['lecturer123'] };
      const userDoc = { _id: 'u1', role: 'undergraduate' };

      TaApplication.findById = jest.fn().mockResolvedValue(appDoc);
      ModuleDetails.findById = jest.fn().mockResolvedValue(moduleDoc);
      User.findById = jest.fn().mockReturnValue({ select: () => userDoc });
      ModuleDetails.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      const res = await request(app).patch('/api/lecturer/applications/a1/accept');

      expect(res.status).toBe(200);
      expect(appDoc.save).toHaveBeenCalled();
      expect(ModuleDetails.findByIdAndUpdate).toHaveBeenCalledWith('m1', expect.objectContaining({ $inc: expect.any(Object) }));
    });
  });

  describe('PATCH /api/lecturer/applications/:id/reject', () => {
    it('rejects application and increments remaining based on role', async () => {
      const appDoc = { _id: 'a1', moduleId: 'm1', userId: 'u1', status: 'pending', save: jest.fn().mockResolvedValue(true) };
      const moduleDoc = { _id: 'm1', coordinators: ['lecturer123'] };
      const moduleDetailsDoc = { _id: 'm1', requiredTAHours: 6 };
      const userDoc = { _id: 'u1', role: 'postgraduate' };

      TaApplication.findById = jest.fn().mockResolvedValue(appDoc);
      ModuleDetails.findById = jest.fn()
        .mockResolvedValueOnce(moduleDoc) // First call for authorization check
        .mockReturnValueOnce({ select: () => moduleDetailsDoc }); // Second call for requiredTAHours
      User.findById = jest.fn().mockReturnValue({ select: () => userDoc });
      ModuleDetails.findByIdAndUpdate = jest.fn().mockResolvedValue({});
      AppliedModules.findOneAndUpdate = jest.fn().mockResolvedValue({ userId: 'u1' });

      const res = await request(app).patch('/api/lecturer/applications/a1/reject');

      expect(res.status).toBe(200);
      expect(appDoc.save).toHaveBeenCalled();
      expect(ModuleDetails.findByIdAndUpdate).toHaveBeenCalledWith('m1', expect.objectContaining({ $inc: expect.any(Object) }));
    });
  });

  describe('GET /api/lecturer/modules/with-ta-requests', () => {
    it('returns modules with accepted TAs and document status', async () => {
      const modules = [
        { _id: 'm1', moduleCode: 'CS101', moduleName: 'Intro', semester: 1, year: 2025, requiredTACount: 2, requiredTAHours: 6, requiredUndergraduateTACount: 1, requiredPostgraduateTACount: 1 }
      ];
      ModuleDetails.find.mockReturnValue({ select: () => modules });

      const apps = [
        { _id: 'a1', moduleId: 'm1', userId: 'u1', status: 'accepted' }
      ];
      TaApplication.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(apps) });

      User.find.mockReturnValue({ select: () => ([{ _id: 'u1', name: 'Alice', indexNumber: 'E/00/001', role: 'undergraduate' }]) });
      
      // Mock AppliedModules to return document submission info
      AppliedModules.find.mockReturnValue({ 
        select: () => ([{ 
          userId: 'u1', 
          isDocSubmitted: true, 
          Documents: 'doc1' 
        }]) 
      });
      
      // Mock documentModel to return document details
      documentModel.find.mockReturnValue({ 
        lean: jest.fn().mockResolvedValue([{ 
          _id: 'doc1', 
          userId: 'u1', 
          cv: { submitted: true, status: 'approved' } 
        }]) 
      });

      // For aggregation counts
      TaApplication.aggregate = jest.fn().mockResolvedValue([{ _id: 'm1', total: 1 }]);

      const res = await request(app).get('/api/lecturer/modules/with-ta-requests');

      if (res.status !== 200) {
        console.log('Response status:', res.status);
        console.log('Response body:', res.body);
      }
      expect(res.status).toBe(200);
      expect(res.body.modules).toHaveLength(1);
      expect(res.body.modules[0]).toEqual(expect.objectContaining({
        moduleCode: 'CS101',
        moduleName: 'Intro',
        semester: 1,
        requiredTAHours: 6
      }));
      expect(res.body.modules[0].acceptedTAs).toHaveLength(1);
      expect(res.body.modules[0].acceptedTAs[0]).toEqual(expect.objectContaining({ 
        name: 'Alice',
        indexNumber: 'E/00/001',
        role: 'undergraduate'
      }));
    });
  });
});


