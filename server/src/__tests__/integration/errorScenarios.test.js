const request = require('supertest');
const app = require('../../app');

describe('Error Scenarios Integration Tests', () => {
  describe('Authentication Errors', () => {
    it('should return 401 for unauthenticated requests to protected routes', async () => {
      // Test various protected routes without authentication
      const protectedRoutes = [
        { method: 'get', path: '/api/lecturer/modules' },
        { method: 'get', path: '/api/user-management/overview' },
        { method: 'get', path: '/api/ta/requests' },
        { method: 'get', path: '/api/cse-office/view-ta-documents' },
        { method: 'get', path: '/api/recruitment-series' }
      ];

      for (const route of protectedRoutes) {
        const res = await request(app)[route.method](route.path);
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: 'Not authorized, no session ID' });
      }
    });

    it('should return 403 for unauthorized role access', async () => {
      // Mock undergraduate user trying to access admin routes
      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'undergrad123', role: 'undergraduate' };
          next();
        },
        authorize: () => (req, res, next) => {
          return res.status(403).json({ message: 'Forbidden: You do not have the required role' });
        }
      }));

      const adminRoutes = [
        '/api/user-management/overview',
        '/api/recruitment-series/create'
      ];

      for (const route of adminRoutes) {
        const res = await request(app).get(route);
        expect(res.status).toBe(403);
        expect(res.body).toEqual({ message: 'Forbidden: You do not have the required role' });
      }
    });

    it('should handle invalid session data', async () => {
      // Mock corrupted session data
      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = null; // Corrupted user data
          next();
        },
        authorize: () => (req, res, next) => {
          return res.status(401).json({ message: 'No user data found in request' });
        }
      }));

      const res = await request(app).get('/api/lecturer/modules');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: 'No user data found in request' });
    });
  });

  describe('Database Connection Errors', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should handle database connection failures gracefully', async () => {
      // Mock database connection error
      jest.doMock('../../models/User', () => ({
        find: jest.fn().mockRejectedValue(new Error('Database connection failed')),
        findById: jest.fn().mockRejectedValue(new Error('Database connection failed')),
        create: jest.fn().mockRejectedValue(new Error('Database connection failed'))
      }));

      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'admin123', role: 'admin' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      const res = await request(app).get('/api/user-management/overview');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Internal server error' });
    });

    it('should handle database timeout errors', async () => {
      jest.doMock('../../models/ModuleDetails', () => ({
        find: jest.fn().mockRejectedValue(new Error('Database timeout')),
        findById: jest.fn().mockRejectedValue(new Error('Database timeout'))
      }));

      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'lecturer123', role: 'lecturer' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      const res = await request(app).get('/api/lecturer/modules');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Internal server error' });
    });

    it('should handle MongoDB validation errors', async () => {
      jest.doMock('../../models/User', () => ({
        create: jest.fn().mockRejectedValue(new Error('ValidationError: Email is required'))
      }));

      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'admin123', role: 'admin' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      const userData = {
        name: 'Test User',
        role: 'undergraduate',
        userGroup: 'group1'
        // Missing email
      };

      const res = await request(app)
        .post('/api/user-management/add-user')
        .send(userData);

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Internal server error' });
    });
  });

  describe('Request Validation Errors', () => {
    it('should handle malformed JSON in request body', async () => {
      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'admin123', role: 'admin' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      const routesWithBody = [
        { method: 'post', path: '/api/user-management/add-user' },
        { method: 'post', path: '/api/ta/apply' },
        { method: 'post', path: '/api/recruitment-series/create' }
      ];

      for (const route of routesWithBody) {
        const res = await request(app)[route.method](route.path)
          .send('invalid json')
          .set('Content-Type', 'application/json');

        expect(res.status).toBe(400);
      }
    });

    it('should handle missing required fields', async () => {
      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'admin123', role: 'admin' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      const testCases = [
        {
          route: '/api/user-management/add-user',
          data: { name: 'Test User' }, // Missing email, role, userGroup
          expectedError: 'All required fields must be provided'
        },
        {
          route: '/api/ta/apply',
          data: { moduleId: 'module1' }, // Missing motivation
          expectedError: 'All required fields must be provided'
        },
        {
          route: '/api/recruitment-series/create',
          data: { seriesName: 'Test Series' }, // Missing startDate, endDate
          expectedError: 'Series name, start date, and end date are required'
        }
      ];

      for (const testCase of testCases) {
        const res = await request(app)
          .post(testCase.route)
          .send(testCase.data);

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: testCase.expectedError });
      }
    });

    it('should handle invalid data types', async () => {
      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'admin123', role: 'admin' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      const testCases = [
        {
          route: '/api/user-management/add-user',
          data: {
            name: 'Test User',
            email: 'test@example.com',
            role: 'invalid_role', // Invalid role
            userGroup: 'group1'
          },
          expectedError: 'Invalid role specified'
        },
        {
          route: '/api/recruitment-series/create',
          data: {
            seriesName: 'Test Series',
            startDate: 'invalid-date', // Invalid date format
            endDate: '2025-12-31'
          },
          expectedError: 'Invalid date format'
        }
      ];

      for (const testCase of testCases) {
        const res = await request(app)
          .post(testCase.route)
          .send(testCase.data);

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: testCase.expectedError });
      }
    });
  });

  describe('Resource Not Found Errors', () => {
    it('should handle requests for non-existent resources', async () => {
      jest.doMock('../../models/ModuleDetails', () => ({
        findById: jest.fn().mockResolvedValue(null)
      }));

      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'lecturer123', role: 'lecturer' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      const testCases = [
        { method: 'patch', path: '/api/lecturer/modules/nonexistent123' },
        { method: 'get', path: '/api/lecturer/modules/nonexistent123' },
        { method: 'delete', path: '/api/lecturer/modules/nonexistent123' }
      ];

      for (const testCase of testCases) {
        const res = await request(app)[testCase.method](testCase.path);
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'Module not found' });
      }
    });

    it('should handle requests for non-existent users', async () => {
      jest.doMock('../../models/User', () => ({
        findById: jest.fn().mockResolvedValue(null)
      }));

      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'admin123', role: 'admin' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      const res = await request(app).get('/api/user-management/users/nonexistent123');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'User not found' });
    });

    it('should handle requests for non-existent applications', async () => {
      jest.doMock('../../models/TaApplication', () => ({
        findById: jest.fn().mockResolvedValue(null)
      }));

      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'lecturer123', role: 'lecturer' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      const res = await request(app).patch('/api/lecturer/applications/nonexistent123/accept');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Application not found' });
    });
  });

  describe('Business Logic Errors', () => {
    it('should handle duplicate resource creation attempts', async () => {
      jest.doMock('../../models/User', () => ({
        findOne: jest.fn().mockResolvedValue({ _id: 'existing123' }), // User already exists
        create: jest.fn()
      }));

      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'admin123', role: 'admin' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      const userData = {
        name: 'Existing User',
        email: 'existing@example.com',
        role: 'undergraduate',
        userGroup: 'group1'
      };

      const res = await request(app)
        .post('/api/user-management/add-user')
        .send(userData);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'User with this email already exists' });
    });

    it('should handle invalid business operations', async () => {
      jest.doMock('../../models/TaApplication', () => ({
        findById: jest.fn().mockResolvedValue({
          _id: 'app123',
          status: 'accepted', // Already accepted
          save: jest.fn()
        })
      }));

      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'lecturer123', role: 'lecturer' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      const res = await request(app).patch('/api/lecturer/applications/app123/accept');
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Application has already been processed' });
    });

    it('should handle quota exceeded scenarios', async () => {
      jest.doMock('../../models/ModuleDetails', () => ({
        findById: jest.fn().mockResolvedValue({
          _id: 'module1',
          requiredUndergraduateTACount: 2,
          undergraduateCounts: { applied: 2, accepted: 2 } // Quota full
        })
      }));

      jest.doMock('../../models/TaApplication', () => ({
        findOne: jest.fn().mockResolvedValue(null)
      }));

      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'undergrad123', role: 'undergraduate' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      const applicationData = {
        moduleId: 'module1',
        motivation: 'I want to apply'
      };

      const res = await request(app)
        .post('/api/ta/apply')
        .send(applicationData);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'No available positions for your role in this module' });
    });
  });

  describe('Network and Infrastructure Errors', () => {
    it('should handle request timeout scenarios', async () => {
      jest.doMock('../../models/User', () => ({
        find: jest.fn().mockImplementation(() => {
          return new Promise((resolve, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 100);
          });
        })
      }));

      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'admin123', role: 'admin' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      const res = await request(app).get('/api/user-management/overview');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Internal server error' });
    });

    it('should handle memory exhaustion scenarios', async () => {
      jest.doMock('../../models/User', () => ({
        find: jest.fn().mockRejectedValue(new Error('Out of memory'))
      }));

      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'admin123', role: 'admin' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      const res = await request(app).get('/api/user-management/overview');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Internal server error' });
    });
  });

  describe('Concurrent Access Errors', () => {
    it('should handle race conditions in resource updates', async () => {
      let updateCount = 0;
      
      jest.doMock('../../models/ModuleDetails', () => ({
        findById: jest.fn().mockResolvedValue({
          _id: 'module1',
          coordinators: ['lecturer123'],
          moduleStatus: 'pending changes',
          undergraduateCounts: { required: 2, remaining: 1 }
        }),
        findByIdAndUpdate: jest.fn().mockImplementation(() => {
          updateCount++;
          if (updateCount === 1) {
            throw new Error('Concurrent modification detected');
          }
          return Promise.resolve({});
        })
      }));

      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'lecturer123', role: 'lecturer' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      const updateData = {
        requiredUndergraduateTACount: 3,
        requirements: 'Updated requirements'
      };

      const res = await request(app)
        .patch('/api/lecturer/modules/module1')
        .send(updateData);

      expect(res.status).toBe(409);
      expect(res.body).toEqual({ error: 'Resource was modified by another user. Please try again.' });
    });
  });

  describe('File Upload and Storage Errors', () => {
    it('should handle file upload failures', async () => {
      jest.doMock('../../models/TaDocumentSubmission', () => ({
        create: jest.fn().mockRejectedValue(new Error('File storage failed'))
      }));

      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'undergrad123', role: 'undergraduate' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      const documentData = {
        documents: {
          cv: { url: 'cv.pdf', fileName: 'cv.pdf' },
          transcript: { url: 'transcript.pdf', fileName: 'transcript.pdf' },
          id: { url: 'id.pdf', fileName: 'id.pdf' }
        }
      };

      const res = await request(app)
        .post('/api/ta/submit-documents')
        .send(documentData);

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Failed to save documents' });
    });

    it('should handle invalid file formats', async () => {
      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'undergrad123', role: 'undergraduate' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      const invalidDocumentData = {
        documents: {
          cv: { url: 'cv.exe', fileName: 'cv.exe' }, // Invalid format
          transcript: { url: 'transcript.pdf', fileName: 'transcript.pdf' },
          id: { url: 'id.pdf', fileName: 'id.pdf' }
        }
      };

      const res = await request(app)
        .post('/api/ta/submit-documents')
        .send(invalidDocumentData);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Invalid file format. Only PDF files are allowed.' });
    });
  });

  describe('Rate Limiting and Security Errors', () => {
    it('should handle excessive request rates', async () => {
      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'user123', role: 'undergraduate' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      // Simulate rate limiting by returning 429 status
      jest.doMock('../../controllers/taControllers', () => ({
        getAllRequests: (req, res) => {
          return res.status(429).json({ 
            error: 'Too many requests. Please try again later.',
            retryAfter: 60
          });
        }
      }));

      const res = await request(app).get('/api/ta/requests');
      expect(res.status).toBe(429);
      expect(res.body).toEqual({ 
        error: 'Too many requests. Please try again later.',
        retryAfter: 60
      });
    });

    it('should handle potential SQL injection attempts', async () => {
      jest.doMock('../../middleware/authMiddleware', () => ({
        protected: (req, res, next) => {
          req.user = { _id: 'admin123', role: 'admin' };
          next();
        },
        authorize: () => (req, res, next) => next()
      }));

      const maliciousData = {
        name: "'; DROP TABLE users; --",
        email: 'test@example.com',
        role: 'undergraduate',
        userGroup: 'group1'
      };

      const res = await request(app)
        .post('/api/user-management/add-user')
        .send(maliciousData);

      // Should either sanitize the input or reject it
      expect([400, 500]).toContain(res.status);
    });
  });
});
