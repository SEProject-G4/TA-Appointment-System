const request = require('supertest');
const app = require('../../app');

// Mock auth middleware to inject TA users
jest.mock('../../middleware/authMiddleware', () => ({
  protected: (req, res, next) => {
    req.user = { _id: 'ta123', role: 'undergraduate' };
    next();
  },
  authorize: () => (req, res, next) => next()
}));

// Mock Models
jest.mock('../../models/TaApplication');
jest.mock('../../models/ModuleDetails');
jest.mock('../../models/User');
jest.mock('../../models/TaDocumentSubmission');

const TaApplication = require('../../models/TaApplication');
const ModuleDetails = require('../../models/ModuleDetails');
const User = require('../../models/User');
const TaDocumentSubmission = require('../../models/TaDocumentSubmission');

describe('TA Routes Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/ta/requests - Get Available TA Positions', () => {
    it('should return available TA positions for undergraduate', async () => {
      const mockModules = [
        {
          _id: 'module1',
          moduleCode: 'CS101',
          moduleName: 'Introduction to Programming',
          semester: 1,
          year: 2025,
          requiredTACount: 3,
          requiredUndergraduateTACount: 2,
          requiredPostgraduateTACount: 1,
          requiredTAHours: 8,
          requirements: 'Good programming skills'
        },
        {
          _id: 'module2',
          moduleCode: 'CS102',
          moduleName: 'Data Structures',
          semester: 1,
          year: 2025,
          requiredTACount: 2,
          requiredUndergraduateTACount: 1,
          requiredPostgraduateTACount: 1,
          requiredTAHours: 6,
          requirements: 'Understanding of algorithms'
        }
      ];

      ModuleDetails.find.mockReturnValue({
        select: () => ({
          populate: () => mockModules
        })
      });

      // Mock that user hasn't applied to any modules
      TaApplication.find.mockReturnValue({
        select: () => []
      });

      const res = await request(app).get('/api/ta/requests');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        modules: mockModules,
        userApplications: []
      });
    });

    it('should return available TA positions for postgraduate', async () => {
      // Mock postgraduate user
      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'postgrad123', role: 'postgraduate' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      const mockModules = [
        {
          _id: 'module1',
          moduleCode: 'CS501',
          moduleName: 'Advanced Algorithms',
          semester: 1,
          year: 2025,
          requiredTACount: 2,
          requiredUndergraduateTACount: 0,
          requiredPostgraduateTACount: 2,
          requiredTAHours: 10,
          requirements: 'Masters level programming'
        }
      ];

      ModuleDetails.find.mockReturnValue({
        select: () => ({
          populate: () => mockModules
        })
      });

      TaApplication.find.mockReturnValue({
        select: () => []
      });

      const res = await request(app).get('/api/ta/requests');

      expect(res.status).toBe(200);
      expect(res.body.modules).toEqual(mockModules);
    });

    it('should filter out modules user has already applied to', async () => {
      const mockModules = [
        {
          _id: 'module1',
          moduleCode: 'CS101',
          moduleName: 'Introduction to Programming',
          requiredUndergraduateTACount: 2
        },
        {
          _id: 'module2',
          moduleCode: 'CS102',
          moduleName: 'Data Structures',
          requiredUndergraduateTACount: 1
        }
      ];

      const mockUserApplications = [
        { moduleId: 'module1', status: 'pending' }
      ];

      ModuleDetails.find.mockReturnValue({
        select: () => ({
          populate: () => mockModules
        })
      });

      TaApplication.find.mockReturnValue({
        select: () => mockUserApplications
      });

      const res = await request(app).get('/api/ta/requests');

      expect(res.status).toBe(200);
      expect(res.body.modules).toHaveLength(2); // All modules shown
      expect(res.body.userApplications).toHaveLength(1);
      expect(res.body.userApplications[0].moduleId).toBe('module1');
    });

    it('should handle database errors gracefully', async () => {
      ModuleDetails.find.mockReturnValue({
        select: () => ({
          populate: () => {
            throw new Error('Database connection failed');
          }
        })
      });

      const res = await request(app).get('/api/ta/requests');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Internal server error' });
    });
  });

  describe('POST /api/ta/apply - Apply for TA Position', () => {
    it('should successfully apply for TA position', async () => {
      const applicationData = {
        moduleId: 'module1',
        motivation: 'I am passionate about teaching programming',
        relevantExperience: 'I have tutored programming for 2 years',
        availability: 'Monday, Wednesday, Friday afternoons'
      };

      const mockModule = {
        _id: 'module1',
        moduleCode: 'CS101',
        requiredUndergraduateTACount: 2,
        undergraduateCounts: { applied: 1, accepted: 0 }
      };

      const mockNewApplication = {
        _id: 'app123',
        userId: 'ta123',
        moduleId: 'module1',
        status: 'pending',
        ...applicationData
      };

      ModuleDetails.findById.mockResolvedValue(mockModule);
      TaApplication.findOne.mockResolvedValue(null); // No existing application
      TaApplication.create.mockResolvedValue(mockNewApplication);
      ModuleDetails.findByIdAndUpdate.mockResolvedValue({});

      const res = await request(app)
        .post('/api/ta/apply')
        .send(applicationData);

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        message: 'Application submitted successfully',
        application: mockNewApplication
      });
      expect(TaApplication.create).toHaveBeenCalledWith({
        userId: 'ta123',
        moduleId: 'module1',
        ...applicationData
      });
    });

    it('should reject application for non-existent module', async () => {
      const applicationData = {
        moduleId: 'nonexistent123',
        motivation: 'I want to apply'
      };

      ModuleDetails.findById.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/ta/apply')
        .send(applicationData);

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Module not found' });
    });

    it('should reject duplicate application', async () => {
      const applicationData = {
        moduleId: 'module1',
        motivation: 'I want to apply'
      };

      const mockExistingApplication = {
        _id: 'existing123',
        userId: 'ta123',
        moduleId: 'module1',
        status: 'pending'
      };

      ModuleDetails.findById.mockResolvedValue({ _id: 'module1' });
      TaApplication.findOne.mockResolvedValue(mockExistingApplication);

      const res = await request(app)
        .post('/api/ta/apply')
        .send(applicationData);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'You have already applied for this module' });
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        moduleId: 'module1'
        // Missing motivation
      };

      const res = await request(app)
        .post('/api/ta/apply')
        .send(incompleteData);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'All required fields must be provided' });
    });

    it('should reject application when module has no available positions', async () => {
      const applicationData = {
        moduleId: 'module1',
        motivation: 'I want to apply'
      };

      const mockModule = {
        _id: 'module1',
        requiredUndergraduateTACount: 2,
        undergraduateCounts: { applied: 2, accepted: 0 } // No more positions
      };

      ModuleDetails.findById.mockResolvedValue(mockModule);
      TaApplication.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/ta/apply')
        .send(applicationData);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'No available positions for your role in this module' });
    });
  });

  describe('GET /api/ta/applied-modules - Get Applied Modules', () => {
    it('should return user\'s applied modules with status', async () => {
      const mockApplications = [
        {
          _id: 'app1',
          moduleId: 'module1',
          status: 'pending',
          motivation: 'I love programming',
          createdAt: new Date('2025-01-01')
        },
        {
          _id: 'app2',
          moduleId: 'module2',
          status: 'accepted',
          motivation: 'I want to teach',
          createdAt: new Date('2025-01-02')
        }
      ];

      const mockModules = [
        {
          _id: 'module1',
          moduleCode: 'CS101',
          moduleName: 'Introduction to Programming',
          coordinators: ['coord1']
        },
        {
          _id: 'module2',
          moduleCode: 'CS102',
          moduleName: 'Data Structures',
          coordinators: ['coord2']
        }
      ];

      TaApplication.find.mockReturnValue({
        populate: () => ({
          sort: () => mockApplications
        })
      });

      const res = await request(app).get('/api/ta/applied-modules');

      expect(res.status).toBe(200);
      expect(res.body.applications).toEqual(mockApplications);
    });

    it('should return empty array when no applications', async () => {
      TaApplication.find.mockReturnValue({
        populate: () => ({
          sort: () => []
        })
      });

      const res = await request(app).get('/api/ta/applied-modules');

      expect(res.status).toBe(200);
      expect(res.body.applications).toEqual([]);
    });
  });

  describe('GET /api/ta/accepted-modules - Get Accepted Modules', () => {
    it('should return accepted modules with document status', async () => {
      const mockAcceptedApplications = [
        {
          _id: 'app1',
          moduleId: 'module1',
          status: 'accepted',
          createdAt: new Date('2025-01-01')
        }
      ];

      const mockDocuments = [
        {
          userId: 'ta123',
          documents: {
            cv: { submitted: true, url: 'cv.pdf' },
            transcript: { submitted: false },
            id: { submitted: true, url: 'id.pdf' }
          },
          status: 'submitted'
        }
      ];

      TaApplication.find.mockReturnValue({
        populate: () => ({
          sort: () => mockAcceptedApplications
        })
      });

      TaDocumentSubmission.find.mockReturnValue({
        select: () => ({
          lean: () => mockDocuments
        })
      });

      const res = await request(app).get('/api/ta/accepted-modules');

      expect(res.status).toBe(200);
      expect(res.body.acceptedApplications).toEqual(mockAcceptedApplications);
      expect(res.body.documentStatus).toEqual(mockDocuments);
    });
  });

  describe('POST /api/ta/submit-documents - Submit Documents', () => {
    it('should successfully submit TA documents', async () => {
      const documentData = {
        cv: { url: 'cv.pdf', fileName: 'my_cv.pdf' },
        transcript: { url: 'transcript.pdf', fileName: 'transcript.pdf' },
        id: { url: 'id.pdf', fileName: 'id.pdf' }
      };

      const mockDocumentSubmission = {
        _id: 'doc123',
        userId: 'ta123',
        documents: documentData,
        status: 'submitted'
      };

      TaDocumentSubmission.findOne.mockResolvedValue(null); // No existing submission
      TaDocumentSubmission.create.mockResolvedValue(mockDocumentSubmission);

      const res = await request(app)
        .post('/api/ta/submit-documents')
        .send({ documents: documentData });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        message: 'Documents submitted successfully',
        documentSubmission: mockDocumentSubmission
      });
    });

    it('should update existing document submission', async () => {
      const documentData = {
        cv: { url: 'updated_cv.pdf', fileName: 'updated_cv.pdf' }
      };

      const existingSubmission = {
        _id: 'doc123',
        userId: 'ta123',
        documents: { cv: { url: 'old_cv.pdf' } },
        save: jest.fn().mockResolvedValue(true)
      };

      TaDocumentSubmission.findOne.mockResolvedValue(existingSubmission);

      const res = await request(app)
        .post('/api/ta/submit-documents')
        .send({ documents: documentData });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: 'Documents updated successfully'
      });
      expect(existingSubmission.save).toHaveBeenCalled();
    });

    it('should validate required documents', async () => {
      const incompleteDocuments = {
        cv: { url: 'cv.pdf' }
        // Missing transcript and id
      };

      const res = await request(app)
        .post('/api/ta/submit-documents')
        .send({ documents: incompleteDocuments });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'CV, transcript, and ID are required' });
    });
  });

  describe('Role-specific Tests', () => {
    it('should handle postgraduate user applying for undergraduate-only position', async () => {
      // Mock postgraduate user
      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'postgrad123', role: 'postgraduate' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      const applicationData = {
        moduleId: 'module1',
        motivation: 'I want to apply'
      };

      const mockModule = {
        _id: 'module1',
        requiredUndergraduateTACount: 2,
        requiredPostgraduateTACount: 0 // No postgraduate positions
      };

      ModuleDetails.findById.mockResolvedValue(mockModule);
      TaApplication.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/ta/apply')
        .send(applicationData);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'No available positions for your role in this module' });
    });

    it('should handle undergraduate user applying for postgraduate-only position', async () => {
      const applicationData = {
        moduleId: 'module1',
        motivation: 'I want to apply'
      };

      const mockModule = {
        _id: 'module1',
        requiredUndergraduateTACount: 0, // No undergraduate positions
        requiredPostgraduateTACount: 2
      };

      ModuleDetails.findById.mockResolvedValue(mockModule);
      TaApplication.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/ta/apply')
        .send(applicationData);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'No available positions for your role in this module' });
    });
  });

  describe('Authorization Tests', () => {
    it('should reject non-TA users from TA routes', async () => {
      // Mock lecturer user trying to access TA routes
      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'lecturer123', role: 'lecturer' };
          next();
        },
        authorize: () => (req, res, next) => {
          return res.status(403).json({ message: 'Forbidden: You do not have the required role' });
        }
      }));

      const res = await request(app).get('/api/ta/requests');

      expect(res.status).toBe(403);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in request body', async () => {
      const res = await request(app)
        .post('/api/ta/apply')
        .send('invalid json')
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(400);
    });

    it('should handle database connection errors', async () => {
      ModuleDetails.find.mockReturnValue({
        select: () => ({
          populate: () => {
            throw new Error('Database connection failed');
          }
        })
      });

      const res = await request(app).get('/api/ta/requests');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Internal server error' });
    });
  });
});
