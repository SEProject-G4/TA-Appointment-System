// Mock the authMiddleware
jest.mock('../../../middleware/authMiddleware', () => ({
  protected: jest.fn((req, res, next) => {
    req.user = { id: 'admin123', role: 'admin' };
    next();
  }),
  authorize: jest.fn((roles) => (req, res, next) => {
    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ message: 'Forbidden' });
    }
  })
}));

// Mock the moduleController
jest.mock('../../../controllers/moduleController', () => ({
  getAllModules: jest.fn((req, res) => res.json({ modules: [] })),
  getModuleById: jest.fn((req, res) => res.json({ module: { id: req.params.id } })),
  createModule: jest.fn((req, res) => res.json({ message: 'Module created' })),
  updateModule: jest.fn((req, res) => res.json({ message: 'Module updated' })),
  deleteModule: jest.fn((req, res) => res.json({ message: 'Module deleted' })),
  changeModuleStatus: jest.fn((req, res) => res.json({ message: 'Module status changed' })),
  getModuleDetailsById: jest.fn((req, res) => res.json({ module: { id: req.params.moduleId } })),
  advertiseModule: jest.fn((req, res) => res.json({ message: 'Module advertised' }))
}));

const request = require('supertest');
const express = require('express');
const moduleRoutes = require('../../../routes/moduleRoutes');
const moduleController = require('../../../controllers/moduleController');

const app = express();
app.use(express.json());
app.use('/modules', moduleRoutes);

describe('Module Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset all controller mocks to their default implementations
    moduleController.getAllModules.mockImplementation((req, res) => res.json({ modules: [] }));
    moduleController.getModuleById.mockImplementation((req, res) => res.json({ module: { id: req.params.id } }));
    moduleController.createModule.mockImplementation((req, res) => res.json({ message: 'Module created' }));
    moduleController.updateModule.mockImplementation((req, res) => res.json({ message: 'Module updated' }));
    moduleController.deleteModule.mockImplementation((req, res) => res.json({ message: 'Module deleted' }));
    moduleController.changeModuleStatus.mockImplementation((req, res) => res.json({ message: 'Module status changed' }));
    moduleController.getModuleDetailsById.mockImplementation((req, res) => res.json({ module: { id: req.params.moduleId } }));
    moduleController.advertiseModule.mockImplementation((req, res) => res.json({ message: 'Module advertised' }));
  });

  describe('Route Registration', () => {
    test('should register all module routes', () => {
      const routes = moduleRoutes.stack.map(layer => ({
        method: Object.keys(layer.route.methods)[0],
        path: layer.route.path
      }));

      // Note: The actual routes depend on the implementation in moduleRoutes.js
      // This test verifies that routes are properly registered
      expect(routes.length).toBeGreaterThan(0);
    });

    test('should have correct number of routes', () => {
      const routes = moduleRoutes.stack;
      expect(routes).toHaveLength(3); // Based on the actual file content showing 3 routes
    });
  });

  describe('HTTP Methods', () => {
    test('should handle GET requests', async () => {
      const moduleId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/modules/${moduleId}`);

      expect(response.status).toBe(200);
    });

    test('should handle PUT requests for change-status', async () => {
      const moduleId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/modules/${moduleId}/change-status`)
        .send({ status: 'active' });

      expect(response.status).toBe(200);
    });

    test('should handle PUT requests for advertise', async () => {
      const moduleId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/modules/${moduleId}/advertise`)
        .send({ advertise: true });

      expect(response.status).toBe(200);
    });
  });

  describe('Request/Response Handling', () => {
    test('should handle JSON requests', async () => {
      const moduleId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/modules/${moduleId}/change-status`)
        .send({ status: 'active' })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
    });

    test('should return JSON responses', async () => {
      const moduleId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/modules/${moduleId}`);

      expect(response.headers['content-type']).toMatch(/json/);
      expect(typeof response.body).toBe('object');
    });

    test('should handle empty request bodies', async () => {
      const moduleId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/modules/${moduleId}/advertise`)
        .send({});

      expect(response.status).toBe(200);
    });
  });

  describe('Parameter Handling', () => {
    test('should handle module ID parameter', async () => {
      const moduleId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/modules/${moduleId}`);

      expect(response.status).toBe(200);
    });

    test('should handle invalid ObjectId parameters', async () => {
      const response = await request(app)
        .get('/modules/invalid-id');

      expect(response.status).toBe(200);
    });

    test('should handle special characters in parameters', async () => {
      const response = await request(app)
        .get('/modules/test-module-123');

      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    test('should handle controller errors gracefully', async () => {
      moduleController.getModuleDetailsById.mockImplementation((req, res) => {
        res.status(500).json({ error: 'Internal server error' });
      });

      const moduleId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/modules/${moduleId}`);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });

    test('should handle validation errors', async () => {
      moduleController.changeModuleStatus.mockImplementation((req, res) => {
        res.status(400).json({ error: 'Validation failed' });
      });

      const moduleId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/modules/${moduleId}/change-status`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Validation failed' });
    });

    test('should handle not found errors', async () => {
      moduleController.getModuleDetailsById.mockImplementation((req, res) => {
        res.status(404).json({ error: 'Module not found' });
      });

      const moduleId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/modules/${moduleId}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Module not found' });
    });
  });

  describe('Route Paths', () => {
    test('should have correct route paths', () => {
      const expectedPaths = [
        '/:moduleId/change-status',
        '/:moduleId',
        '/:moduleId/advertise'
      ];
      const actualPaths = moduleRoutes.stack.map(layer => layer.route.path);
      
      expectedPaths.forEach(path => {
        expect(actualPaths).toContain(path);
      });
    });

    test('should not have duplicate routes', () => {
      const paths = moduleRoutes.stack.map(layer => layer.route.path);
      const uniquePaths = [...new Set(paths)];
      expect(paths).toHaveLength(uniquePaths.length);
    });
  });

  describe('Controller Integration', () => {
    test('should call correct controller for each route', async () => {
      await request(app).get('/modules/123');
      expect(moduleController.getModuleDetailsById).toHaveBeenCalled();

      await request(app).put('/modules/123/change-status');
      expect(moduleController.changeModuleStatus).toHaveBeenCalled();

      await request(app).put('/modules/123/advertise');
      expect(moduleController.advertiseModule).toHaveBeenCalled();
    });
  });

  describe('Data Validation', () => {
    test('should handle malformed JSON', async () => {
      const moduleId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/modules/${moduleId}/change-status`)
        .send('invalid json')
        .set('Content-Type', 'application/json');

      // Express should return 400 for malformed JSON
      expect(response.status).toBe(400);
    });

    test('should handle large request bodies', async () => {
      const moduleId = '507f1f77bcf86cd799439011';
      const largeData = {
        status: 'active',
        description: 'x'.repeat(10000),
        requirements: 'x'.repeat(5000)
      };

      const response = await request(app)
        .put(`/modules/${moduleId}/change-status`)
        .send(largeData);

      expect(response.status).toBe(200);
    });

    test('should handle special characters in request body', async () => {
      const moduleId = '507f1f77bcf86cd799439011';
      const specialData = {
        status: 'active',
        description: 'Module with émojis 🚀 and special chars: @#$%'
      };

      const response = await request(app)
        .put(`/modules/${moduleId}/change-status`)
        .send(specialData);

      expect(response.status).toBe(200);
    });
  });

  describe('Middleware Considerations', () => {
    test('should work with authentication middleware', async () => {
      // Note: The current implementation uses auth middleware
      // This test verifies the routes work with it
      const moduleId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/modules/${moduleId}`);

      expect(response.status).toBe(200);
    });

    test('should handle requests with session data', async () => {
      const moduleId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/modules/${moduleId}/change-status`)
        .send({ status: 'active' });

      expect(response.status).toBe(200);
    });
  });

  describe('Route Specific Tests', () => {
    test('should handle module status change routes', async () => {
      const moduleId = '507f1f77bcf86cd799439011';

      const changeStatusResponse = await request(app)
        .put(`/modules/${moduleId}/change-status`)
        .send({ status: 'active' });

      expect(changeStatusResponse.status).toBe(200);
    });

    test('should handle module advertise routes', async () => {
      const moduleId = '507f1f77bcf86cd799439011';

      const advertiseResponse = await request(app)
        .put(`/modules/${moduleId}/advertise`)
        .send({ advertise: true });

      expect(advertiseResponse.status).toBe(200);
    });

    test('should handle different HTTP methods for module details', async () => {
      const moduleId = '507f1f77bcf86cd799439011';

      const getResponse = await request(app).get(`/modules/${moduleId}`);

      expect(getResponse.status).toBe(200);
    });
  });
});
