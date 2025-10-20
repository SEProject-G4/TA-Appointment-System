// Mock the taControllers
jest.mock('../../../controllers/taControllers', () => ({
  getAllRequests: jest.fn((req, res) => res.json({ requests: [] })),
  applyForTA: jest.fn((req, res) => res.json({ message: 'Application submitted' })),
  getAppliedModules: jest.fn((req, res) => res.json({ modules: [] })),
  getAcceptedModules: jest.fn((req, res) => res.json({ modules: [] }))
}));

const request = require('supertest');
const express = require('express');
const taRoutes = require('../../../routes/taRoutes');
const taControllers = require('../../../controllers/taControllers');

const app = express();
app.use(express.json());
app.use('/ta', taRoutes);

describe('TA Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset all controller mocks to their default implementations
    taControllers.getAllRequests.mockImplementation((req, res) => res.json({ requests: [] }));
    taControllers.applyForTA.mockImplementation((req, res) => res.json({ message: 'Application submitted' }));
    taControllers.getAppliedModules.mockImplementation((req, res) => res.json({ modules: [] }));
    taControllers.getAcceptedModules.mockImplementation((req, res) => res.json({ modules: [] }));
  });

  describe('GET /ta/requests', () => {
    test('should call getAllRequests controller', async () => {
      const response = await request(app)
        .get('/ta/requests');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ requests: [] });
    });

    test('should handle query parameters', async () => {
      const response = await request(app)
        .get('/ta/requests?status=pending&role=undergraduate');

      expect(response.status).toBe(200);
    });
  });

  describe('POST /ta/apply', () => {
    test('should call applyForTA controller', async () => {
      const applicationData = {
        moduleId: '507f1f77bcf86cd799439011',
        userId: '507f1f77bcf86cd799439012'
      };

      const response = await request(app)
        .post('/ta/apply')
        .send(applicationData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Application submitted' });
    });

    test('should handle request body', async () => {
      const applicationData = {
        moduleId: '507f1f77bcf86cd799439011',
        userId: '507f1f77bcf86cd799439012',
        additionalInfo: 'Test application'
      };

      const response = await request(app)
        .post('/ta/apply')
        .send(applicationData);

      expect(response.status).toBe(200);
    });

    test('should handle empty request body', async () => {
      const response = await request(app)
        .post('/ta/apply')
        .send({});

      expect(response.status).toBe(200);
    });
  });

  describe('GET /ta/applied-modules', () => {
    test('should call getAppliedModules controller', async () => {
      const response = await request(app)
        .get('/ta/applied-modules');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ modules: [] });
    });

    test('should handle query parameters', async () => {
      const response = await request(app)
        .get('/ta/applied-modules?userId=123&status=pending');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /ta/accepted-modules', () => {
    test('should call getAcceptedModules controller', async () => {
      const response = await request(app)
        .get('/ta/accepted-modules');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ modules: [] });
    });

    test('should handle query parameters', async () => {
      const response = await request(app)
        .get('/ta/accepted-modules?userId=123');

      expect(response.status).toBe(200);
    });
  });

  describe('Route Registration', () => {
    test('should register all TA routes', () => {
      const routes = taRoutes.stack.map(layer => ({
        method: Object.keys(layer.route.methods)[0],
        path: layer.route.path
      }));

      expect(routes).toContainEqual({ method: 'get', path: '/requests' });
      expect(routes).toContainEqual({ method: 'post', path: '/apply' });
      expect(routes).toContainEqual({ method: 'get', path: '/applied-modules' });
      expect(routes).toContainEqual({ method: 'get', path: '/accepted-modules' });
    });

    test('should have correct number of routes', () => {
      const routes = taRoutes.stack;
      expect(routes).toHaveLength(4);
    });
  });

  describe('HTTP Methods', () => {
    test('should use correct HTTP methods for each route', () => {
      const routes = taRoutes.stack.map(layer => ({
        method: Object.keys(layer.route.methods)[0],
        path: layer.route.path
      }));

      const getRoutes = routes.filter(route => route.method === 'get');
      const postRoutes = routes.filter(route => route.method === 'post');

      expect(getRoutes).toHaveLength(3);
      expect(postRoutes).toHaveLength(1);
    });

    test('should reject wrong HTTP methods', async () => {
      const putResponse = await request(app)
        .put('/ta/requests');
      expect(putResponse.status).toBe(404);

      const deleteResponse = await request(app)
        .delete('/ta/apply');
      expect(deleteResponse.status).toBe(404);

      const postResponse = await request(app)
        .post('/ta/applied-modules');
      expect(postResponse.status).toBe(404);
    });
  });

  describe('Request/Response Handling', () => {
    test('should handle JSON requests', async () => {
      const response = await request(app)
        .post('/ta/apply')
        .send({ moduleId: '123', userId: '456' })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
    });

    test('should return JSON responses', async () => {
      const response = await request(app)
        .get('/ta/requests');

      expect(response.headers['content-type']).toMatch(/json/);
      expect(typeof response.body).toBe('object');
    });

    test('should handle different content types', async () => {
      const response = await request(app)
        .post('/ta/apply')
        .send({ moduleId: '123' })
        .set('Content-Type', 'application/x-www-form-urlencoded');

      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    test('should handle controller errors gracefully', async () => {
      taControllers.getAllRequests.mockImplementation((req, res) => {
        res.status(500).json({ error: 'Internal server error' });
      });

      const response = await request(app)
        .get('/ta/requests');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });

    test('should handle validation errors', async () => {
      taControllers.applyForTA.mockImplementation((req, res) => {
        res.status(400).json({ error: 'Validation failed' });
      });

      const response = await request(app)
        .post('/ta/apply')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Validation failed' });
    });
  });

  describe('Route Paths', () => {
    test('should have correct route paths', () => {
      const expectedPaths = ['/requests', '/apply', '/applied-modules', '/accepted-modules'];
      const actualPaths = taRoutes.stack.map(layer => layer.route.path);
      
      expectedPaths.forEach(path => {
        expect(actualPaths).toContain(path);
      });
    });

    test('should not have duplicate routes', () => {
      const paths = taRoutes.stack.map(layer => layer.route.path);
      const uniquePaths = [...new Set(paths)];
      expect(paths).toHaveLength(uniquePaths.length);
    });
  });

  describe('Controller Integration', () => {
    test('should call correct controller for each route', async () => {
      await request(app).get('/ta/requests');
      expect(taControllers.getAllRequests).toHaveBeenCalled();

      await request(app).post('/ta/apply');
      expect(taControllers.applyForTA).toHaveBeenCalled();

      await request(app).get('/ta/applied-modules');
      expect(taControllers.getAppliedModules).toHaveBeenCalled();

      await request(app).get('/ta/accepted-modules');
      expect(taControllers.getAcceptedModules).toHaveBeenCalled();
    });
  });

  describe('Middleware Considerations', () => {
    test('should work without authentication middleware (as per current implementation)', async () => {
      // Note: The current implementation doesn't use auth middleware
      // This test verifies the routes work without it
      const response = await request(app)
        .get('/ta/requests');

      expect(response.status).toBe(200);
    });

    test('should handle requests without session data', async () => {
      const response = await request(app)
        .post('/ta/apply')
        .send({ moduleId: '123' });

      expect(response.status).toBe(200);
    });
  });

  describe('Data Validation', () => {
    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/ta/apply')
        .send('invalid json')
        .set('Content-Type', 'application/json');

      // Express should return 400 for malformed JSON
      expect(response.status).toBe(400);
    });

    test('should handle large request bodies', async () => {
      const largeData = {
        moduleId: '123',
        userId: '456',
        largeField: 'x'.repeat(10000)
      };

      const response = await request(app)
        .post('/ta/apply')
        .send(largeData);

      expect(response.status).toBe(200);
    });
  });
});
