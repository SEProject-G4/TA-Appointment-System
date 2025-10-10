const request = require('supertest');
const app = require('../../app');

// Mock auth middleware to inject CSE office user
jest.mock('../../middleware/authMiddleware', () => ({
  protected: (req, res, next) => {
    req.user = { _id: 'cse123', role: 'cse-office' };
    next();
  },
  authorize: () => (req, res, next) => next()
}));

// Mock Models
jest.mock('../../models/TaDocumentSubmission');
jest.mock('../../models/TaApplication');
jest.mock('../../models/User');
jest.mock('../../models/ModuleDetails');

const TaDocumentSubmission = require('../../models/TaDocumentSubmission');
const TaApplication = require('../../models/TaApplication');
const User = require('../../models/User');
const ModuleDetails = require('../../models/ModuleDetails');

describe('CSE Office Routes Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/cse-office/view-ta-documents - View TA Documents', () => {
    it('should return all TA documents with user and module details', async () => {
      const mockDocumentSubmissions = [
        {
          _id: 'doc1',
          userId: 'user1',
          documents: {
            cv: { submitted: true, url: 'cv1.pdf', fileName: 'cv1.pdf' },
            transcript: { submitted: true, url: 'transcript1.pdf', fileName: 'transcript1.pdf' },
            id: { submitted: true, url: 'id1.pdf', fileName: 'id1.pdf' }
          },
          status: 'submitted',
          submittedAt: new Date('2025-01-01')
        },
        {
          _id: 'doc2',
          userId: 'user2',
          documents: {
            cv: { submitted: true, url: 'cv2.pdf', fileName: 'cv2.pdf' },
            transcript: { submitted: false },
            id: { submitted: true, url: 'id2.pdf', fileName: 'id2.pdf' }
          },
          status: 'incomplete',
          submittedAt: new Date('2025-01-02')
        }
      ];

      const mockUsers = [
        {
          _id: 'user1',
          name: 'John Doe',
          email: 'john@example.com',
          indexNumber: 'E/20/001',
          role: 'undergraduate'
        },
        {
          _id: 'user2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          indexNumber: 'E/20/002',
          role: 'postgraduate'
        }
      ];

      const mockApplications = [
        {
          _id: 'app1',
          userId: 'user1',
          moduleId: 'module1',
          status: 'accepted'
        },
        {
          _id: 'app2',
          userId: 'user2',
          moduleId: 'module2',
          status: 'accepted'
        }
      ];

      const mockModules = [
        {
          _id: 'module1',
          moduleCode: 'CS101',
          moduleName: 'Introduction to Programming'
        },
        {
          _id: 'module2',
          moduleCode: 'CS102',
          moduleName: 'Data Structures'
        }
      ];

      TaDocumentSubmission.find.mockReturnValue({
        populate: () => ({
          sort: () => mockDocumentSubmissions
        })
      });

      User.find.mockReturnValue({
        select: () => mockUsers
      });

      TaApplication.find.mockReturnValue({
        populate: () => mockApplications
      });

      ModuleDetails.find.mockReturnValue({
        select: () => mockModules
      });

      const res = await request(app).get('/api/cse-office/view-ta-documents');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        documentSubmissions: mockDocumentSubmissions,
        users: mockUsers,
        applications: mockApplications,
        modules: mockModules
      });
    });

    it('should filter documents by status', async () => {
      const mockDocumentSubmissions = [
        {
          _id: 'doc1',
          userId: 'user1',
          status: 'submitted',
          documents: {
            cv: { submitted: true },
            transcript: { submitted: true },
            id: { submitted: true }
          }
        }
      ];

      TaDocumentSubmission.find.mockReturnValue({
        populate: () => ({
          sort: () => mockDocumentSubmissions
        })
      });

      User.find.mockReturnValue({ select: () => [] });
      TaApplication.find.mockReturnValue({ populate: () => [] });
      ModuleDetails.find.mockReturnValue({ select: () => [] });

      const res = await request(app)
        .get('/api/cse-office/view-ta-documents')
        .query({ status: 'submitted' });

      expect(res.status).toBe(200);
      expect(TaDocumentSubmission.find).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'submitted'
        })
      );
    });

    it('should return empty arrays when no documents exist', async () => {
      TaDocumentSubmission.find.mockReturnValue({
        populate: () => ({
          sort: () => []
        })
      });

      User.find.mockReturnValue({ select: () => [] });
      TaApplication.find.mockReturnValue({ populate: () => [] });
      ModuleDetails.find.mockReturnValue({ select: () => [] });

      const res = await request(app).get('/api/cse-office/view-ta-documents');

      expect(res.status).toBe(200);
      expect(res.body.documentSubmissions).toEqual([]);
      expect(res.body.users).toEqual([]);
      expect(res.body.applications).toEqual([]);
      expect(res.body.modules).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      TaDocumentSubmission.find.mockReturnValue({
        populate: () => ({
          sort: () => {
            throw new Error('Database connection failed');
          }
        })
      });

      const res = await request(app).get('/api/cse-office/view-ta-documents');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Internal server error' });
    });
  });

  describe('POST /api/cse-office/verify-documents - Verify Documents', () => {
    it('should approve complete document submission', async () => {
      const verificationData = {
        documentSubmissionId: 'doc1',
        action: 'approve',
        comments: 'All documents verified successfully'
      };

      const mockDocumentSubmission = {
        _id: 'doc1',
        userId: 'user1',
        status: 'submitted',
        documents: {
          cv: { submitted: true, url: 'cv.pdf' },
          transcript: { submitted: true, url: 'transcript.pdf' },
          id: { submitted: true, url: 'id.pdf' }
        },
        save: jest.fn().mockResolvedValue(true)
      };

      TaDocumentSubmission.findById.mockResolvedValue(mockDocumentSubmission);

      const res = await request(app)
        .post('/api/cse-office/verify-documents')
        .send(verificationData);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: 'Documents approved successfully'
      });
      expect(mockDocumentSubmission.status).toBe('approved');
      expect(mockDocumentSubmission.verificationComments).toBe('All documents verified successfully');
      expect(mockDocumentSubmission.verifiedBy).toBe('cse123');
      expect(mockDocumentSubmission.save).toHaveBeenCalled();
    });

    it('should reject incomplete document submission', async () => {
      const verificationData = {
        documentSubmissionId: 'doc1',
        action: 'reject',
        comments: 'Missing transcript document'
      };

      const mockDocumentSubmission = {
        _id: 'doc1',
        userId: 'user1',
        status: 'submitted',
        documents: {
          cv: { submitted: true, url: 'cv.pdf' },
          transcript: { submitted: false },
          id: { submitted: true, url: 'id.pdf' }
        },
        save: jest.fn().mockResolvedValue(true)
      };

      TaDocumentSubmission.findById.mockResolvedValue(mockDocumentSubmission);

      const res = await request(app)
        .post('/api/cse-office/verify-documents')
        .send(verificationData);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: 'Documents rejected successfully'
      });
      expect(mockDocumentSubmission.status).toBe('rejected');
      expect(mockDocumentSubmission.verificationComments).toBe('Missing transcript document');
      expect(mockDocumentSubmission.verifiedBy).toBe('cse123');
      expect(mockDocumentSubmission.save).toHaveBeenCalled();
    });

    it('should request additional documents', async () => {
      const verificationData = {
        documentSubmissionId: 'doc1',
        action: 'request_additional',
        comments: 'Please provide updated CV with recent experience',
        additionalDocuments: ['updated_cv']
      };

      const mockDocumentSubmission = {
        _id: 'doc1',
        userId: 'user1',
        status: 'submitted',
        documents: {
          cv: { submitted: true, url: 'cv.pdf' },
          transcript: { submitted: true, url: 'transcript.pdf' },
          id: { submitted: true, url: 'id.pdf' }
        },
        save: jest.fn().mockResolvedValue(true)
      };

      TaDocumentSubmission.findById.mockResolvedValue(mockDocumentSubmission);

      const res = await request(app)
        .post('/api/cse-office/verify-documents')
        .send(verificationData);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: 'Additional documents requested successfully'
      });
      expect(mockDocumentSubmission.status).toBe('additional_documents_required');
      expect(mockDocumentSubmission.verificationComments).toBe('Please provide updated CV with recent experience');
      expect(mockDocumentSubmission.additionalDocumentsRequired).toEqual(['updated_cv']);
      expect(mockDocumentSubmission.save).toHaveBeenCalled();
    });

    it('should reject verification for non-existent document submission', async () => {
      const verificationData = {
        documentSubmissionId: 'nonexistent123',
        action: 'approve',
        comments: 'Documents look good'
      };

      TaDocumentSubmission.findById.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/cse-office/verify-documents')
        .send(verificationData);

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Document submission not found' });
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        documentSubmissionId: 'doc1'
        // Missing action and comments
      };

      const res = await request(app)
        .post('/api/cse-office/verify-documents')
        .send(incompleteData);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Action and comments are required' });
    });

    it('should validate action type', async () => {
      const invalidData = {
        documentSubmissionId: 'doc1',
        action: 'invalid_action',
        comments: 'Some comments'
      };

      const mockDocumentSubmission = {
        _id: 'doc1',
        status: 'submitted'
      };

      TaDocumentSubmission.findById.mockResolvedValue(mockDocumentSubmission);

      const res = await request(app)
        .post('/api/cse-office/verify-documents')
        .send(invalidData);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Invalid action. Must be approve, reject, or request_additional' });
    });
  });

  describe('GET /api/cse-office/document-statistics - Get Document Statistics', () => {
    it('should return document verification statistics', async () => {
      const mockStats = [
        { status: 'submitted', count: 15 },
        { status: 'approved', count: 12 },
        { status: 'rejected', count: 2 },
        { status: 'additional_documents_required', count: 1 }
      ];

      TaDocumentSubmission.aggregate.mockResolvedValue(mockStats);

      const res = await request(app).get('/api/cse-office/document-statistics');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        statistics: mockStats,
        total: 30
      });
    });

    it('should handle empty statistics', async () => {
      TaDocumentSubmission.aggregate.mockResolvedValue([]);

      const res = await request(app).get('/api/cse-office/document-statistics');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        statistics: [],
        total: 0
      });
    });
  });

  describe('POST /api/cse-office/bulk-verify - Bulk Document Verification', () => {
    it('should approve multiple document submissions', async () => {
      const bulkData = {
        documentSubmissionIds: ['doc1', 'doc2', 'doc3'],
        action: 'approve',
        comments: 'All documents verified in bulk'
      };

      const mockDocumentSubmissions = [
        { _id: 'doc1', status: 'submitted', save: jest.fn().mockResolvedValue(true) },
        { _id: 'doc2', status: 'submitted', save: jest.fn().mockResolvedValue(true) },
        { _id: 'doc3', status: 'submitted', save: jest.fn().mockResolvedValue(true) }
      ];

      TaDocumentSubmission.find.mockReturnValue({
        where: () => ({
          in: () => mockDocumentSubmissions
        })
      });

      const res = await request(app)
        .post('/api/cse-office/bulk-verify')
        .send(bulkData);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: '3 documents verified successfully',
        processed: 3
      });

      mockDocumentSubmissions.forEach(doc => {
        expect(doc.status).toBe('approved');
        expect(doc.save).toHaveBeenCalled();
      });
    });

    it('should handle partial failures in bulk verification', async () => {
      const bulkData = {
        documentSubmissionIds: ['doc1', 'doc2', 'doc3'],
        action: 'approve',
        comments: 'Bulk verification'
      };

      const mockDocumentSubmissions = [
        { _id: 'doc1', status: 'submitted', save: jest.fn().mockResolvedValue(true) },
        { _id: 'doc2', status: 'submitted', save: jest.fn().mockResolvedValue(false) }, // Save fails
        { _id: 'doc3', status: 'submitted', save: jest.fn().mockResolvedValue(true) }
      ];

      TaDocumentSubmission.find.mockReturnValue({
        where: () => ({
          in: () => mockDocumentSubmissions
        })
      });

      const res = await request(app)
        .post('/api/cse-office/bulk-verify')
        .send(bulkData);

      expect(res.status).toBe(207); // Multi-status
      expect(res.body).toEqual({
        message: 'Bulk verification completed with some failures',
        processed: 2,
        failed: 1,
        failedIds: ['doc2']
      });
    });

    it('should validate bulk verification data', async () => {
      const invalidData = {
        documentSubmissionIds: [],
        action: 'approve',
        comments: 'Bulk verification'
      };

      const res = await request(app)
        .post('/api/cse-office/bulk-verify')
        .send(invalidData);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'At least one document submission ID is required' });
    });
  });

  describe('Authorization Tests', () => {
    it('should reject non-CSE office users from CSE routes', async () => {
      // Mock lecturer user trying to access CSE office routes
      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'lecturer123', role: 'lecturer' };
          next();
        },
        authorize: () => (req, res, next) => {
          return res.status(403).json({ message: 'Forbidden: You do not have the required role' });
        }
      }));

      const res = await request(app).get('/api/cse-office/view-ta-documents');

      expect(res.status).toBe(403);
    });

    it('should allow admin users to access CSE office routes', async () => {
      // Mock admin user
      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'admin123', role: 'admin' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      TaDocumentSubmission.find.mockReturnValue({
        populate: () => ({
          sort: () => []
        })
      });

      User.find.mockReturnValue({ select: () => [] });
      TaApplication.find.mockReturnValue({ populate: () => [] });
      ModuleDetails.find.mockReturnValue({ select: () => [] });

      const res = await request(app).get('/api/cse-office/view-ta-documents');

      expect(res.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in request body', async () => {
      const res = await request(app)
        .post('/api/cse-office/verify-documents')
        .send('invalid json')
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(400);
    });

    it('should handle database connection errors', async () => {
      TaDocumentSubmission.find.mockReturnValue({
        populate: () => ({
          sort: () => {
            throw new Error('Database connection failed');
          }
        })
      });

      const res = await request(app).get('/api/cse-office/view-ta-documents');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Internal server error' });
    });

    it('should handle save errors during verification', async () => {
      const verificationData = {
        documentSubmissionId: 'doc1',
        action: 'approve',
        comments: 'Documents approved'
      };

      const mockDocumentSubmission = {
        _id: 'doc1',
        status: 'submitted',
        save: jest.fn().mockRejectedValue(new Error('Save failed'))
      };

      TaDocumentSubmission.findById.mockResolvedValue(mockDocumentSubmission);

      const res = await request(app)
        .post('/api/cse-office/verify-documents')
        .send(verificationData);

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Failed to update document submission' });
    });
  });
});
