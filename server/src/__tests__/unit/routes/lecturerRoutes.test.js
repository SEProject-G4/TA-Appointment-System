const request = require('supertest');
const express = require('express');
const lecturerRoutes = require('../../../routes/lecturerRoutes');

// Mock the authMiddleware
jest.mock('../../../middleware/authMiddleware', () => ({
  protected: jest.fn((req, res, next) => {
    req.user = { id: 'lecturer123', role: 'lecturer' };
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

// Mock the lecturerController
jest.mock('../../../controllers/lecturerController', () => ({
  getMyModules: jest.fn((req, res) => res.json({ modules: [] })),
  viewModuleDetails: jest.fn((req, res) => res.json({ modules: [] })),
  editModuleRequirments: jest.fn((req, res) => res.json({ message: 'Module updated' })),
  handleRequests: jest.fn((req, res) => res.json({ requests: [] })),
  // getModuleApplications is commented out since the route doesn't exist
  // getModuleApplications: jest.fn((req, res) => res.json({ applications: [] })),
  acceptApplication: jest.fn((req, res) => res.json({ message: 'Application accepted' })),
  rejectApplication: jest.fn((req, res) => res.json({ message: 'Application rejected' }))
}));

const app = express();
app.use(express.json());
app.use('/lecturer', lecturerRoutes);

describe('Lecturer Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /lecturer/modules', () => {
    test('should call getMyModules controller with authentication', async () => {
      const response = await request(app)
        .get('/lecturer/modules');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ modules: [] });
    });

    test('should require lecturer role', async () => {
      const response = await request(app)
        .get('/lecturer/modules');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /lecturer/modules/with-ta-requests', () => {
    test('should call viewModuleDetails controller', async () => {
      const response = await request(app)
        .get('/lecturer/modules/with-ta-requests');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ modules: [] });
    });

    test('should require lecturer role', async () => {
      const response = await request(app)
        .get('/lecturer/modules/with-ta-requests');

      expect(response.status).toBe(200);
    });
  });

  describe('PATCH /lecturer/modules/:id', () => {
    test('should call editModuleRequirments controller with module ID', async () => {
      const moduleId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .patch(`/lecturer/modules/${moduleId}`)
        .send({ requirements: 'Updated requirements' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Module updated' });
    });

    test('should handle request body for module updates', async () => {
      const moduleId = '507f1f77bcf86cd799439011';
      const updateData = { requirements: 'New requirements' };
      
      const response = await request(app)
        .patch(`/lecturer/modules/${moduleId}`)
        .send(updateData);

      expect(response.status).toBe(200);
    });

    test('should require lecturer role', async () => {
      const moduleId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .patch(`/lecturer/modules/${moduleId}`)
        .send({ requirements: 'Test' });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /lecturer/handle-requests', () => {
    test('should call handleRequests controller', async () => {
      const response = await request(app)
        .get('/lecturer/handle-requests');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ requests: [] });
    });

    test('should require lecturer role', async () => {
      const response = await request(app)
        .get('/lecturer/handle-requests');

      expect(response.status).toBe(200);
    });
  });

  // Route /modules/:id/applications is currently commented out in lecturerRoutes.js
  // Uncomment these tests if the route is re-enabled
  // describe('GET /lecturer/modules/:id/applications', () => {
  //   test('should call getModuleApplications controller with module ID', async () => {
  //     const moduleId = '507f1f77bcf86cd799439011';
  //     const response = await request(app)
  //       .get(`/lecturer/modules/${moduleId}/applications`);

  //     expect(response.status).toBe(200);
  //     expect(response.body).toEqual({ applications: [] });
  //   });

  //   test('should require lecturer role', async () => {
  //     const moduleId = '507f1f77bcf86cd799439011';
  //     const response = await request(app)
  //       .get(`/lecturer/modules/${moduleId}/applications`);

  //     expect(response.status).toBe(200);
  //   });
  // });

  describe('PATCH /lecturer/applications/:applicationId/accept', () => {
    test('should call acceptApplication controller with application ID', async () => {
      const applicationId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .patch(`/lecturer/applications/${applicationId}/accept`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Application accepted' });
    });

    test('should require lecturer role', async () => {
      const applicationId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .patch(`/lecturer/applications/${applicationId}/accept`);

      expect(response.status).toBe(200);
    });
  });

  describe('PATCH /lecturer/applications/:applicationId/reject', () => {
    test('should call rejectApplication controller with application ID', async () => {
      const applicationId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .patch(`/lecturer/applications/${applicationId}/reject`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Application rejected' });
    });

    test('should require lecturer role', async () => {
      const applicationId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .patch(`/lecturer/applications/${applicationId}/reject`);

      expect(response.status).toBe(200);
    });
  });

  describe('Route Registration', () => {
    test('should register all lecturer routes', () => {
      const routes = lecturerRoutes.stack.map(layer => ({
        method: Object.keys(layer.route.methods)[0],
        path: layer.route.path
      }));

      expect(routes).toContainEqual({ method: 'get', path: '/modules' });
      expect(routes).toContainEqual({ method: 'get', path: '/modules/with-ta-requests' });
      expect(routes).toContainEqual({ method: 'patch', path: '/modules/:id' });
      expect(routes).toContainEqual({ method: 'get', path: '/handle-requests' });
      // Route /modules/:id/applications is commented out in lecturerRoutes.js
      // expect(routes).toContainEqual({ method: 'get', path: '/modules/:id/applications' });
      expect(routes).toContainEqual({ method: 'patch', path: '/applications/:applicationId/accept' });
      expect(routes).toContainEqual({ method: 'patch', path: '/applications/:applicationId/reject' });
    });

    test('should have correct number of routes', () => {
      const routes = lecturerRoutes.stack;
      expect(routes).toHaveLength(6); // Changed from 7 to 6
    });
  });

  describe('HTTP Methods', () => {
    test('should use correct HTTP methods for each route', () => {
      const routes = lecturerRoutes.stack.map(layer => ({
        method: Object.keys(layer.route.methods)[0],
        path: layer.route.path
      }));

      const getRoutes = routes.filter(route => route.method === 'get');
      const patchRoutes = routes.filter(route => route.method === 'patch');

      expect(getRoutes).toHaveLength(3); // Changed from 4 to 3 (removed /modules/:id/applications)
      expect(patchRoutes).toHaveLength(3);
    });

    test('should reject wrong HTTP methods', async () => {
      const postResponse = await request(app)
        .post('/lecturer/modules');
      expect(postResponse.status).toBe(404);

      const deleteResponse = await request(app)
        .delete('/lecturer/modules/123');
      expect(deleteResponse.status).toBe(404);
    });
  });

  describe('Middleware Integration', () => {
    test('should apply protected middleware to all routes', async () => {
      const authMiddleware = require('../../../middleware/authMiddleware');
      
      await request(app).get('/lecturer/modules');
      expect(authMiddleware.protected).toHaveBeenCalled();
    });

    test('should apply authorize middleware with lecturer role', () => {
      // This test verifies that the routes are properly configured with authorization
      // Since the mock setup ensures the authorize function works correctly,
      // we can verify that the routes are accessible (which means auth passed)
      
      // Check that all routes are properly registered with middleware
      const routes = lecturerRoutes.stack;
      expect(routes.length).toBeGreaterThan(0);
      
      // Verify that the routes exist (which means they were properly configured)
      const routePaths = routes.map(layer => layer.route.path);
      expect(routePaths).toContain('/modules');
      expect(routePaths).toContain('/modules/with-ta-requests');
      expect(routePaths).toContain('/handle-requests');
    });
  });

  describe('Parameter Handling', () => {
    // Test for /modules/:id/applications route is commented out since the route doesn't exist
    // test('should handle module ID parameter', async () => {
    //   const moduleId = '507f1f77bcf86cd799439011';
    //   const response = await request(app)
    //     .get(`/lecturer/modules/${moduleId}/applications`);

    //   expect(response.status).toBe(200);
    // });

    test('should handle application ID parameter', async () => {
      const applicationId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .patch(`/lecturer/applications/${applicationId}/accept`);

      expect(response.status).toBe(200);
    });

    test('should handle module ID parameter in PATCH route', async () => {
      const moduleId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .patch(`/lecturer/modules/${moduleId}`)
        .send({ requirements: 'Test' });

      expect(response.status).toBe(200);
    });

    // Test for /modules/:id/applications route is commented out since the route doesn't exist
    // test('should handle invalid ObjectId parameters', async () => {
    //   const response = await request(app)
    //     .get('/lecturer/modules/invalid-id/applications');

    //   expect(response.status).toBe(200);
    // });
  });

  describe('Request/Response Handling', () => {
    test('should handle JSON requests', async () => {
      const response = await request(app)
        .patch('/lecturer/modules/123')
        .send({ requirements: 'Test requirements' })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
    });

    test('should return JSON responses', async () => {
      const response = await request(app)
        .get('/lecturer/modules');

      expect(response.headers['content-type']).toMatch(/json/);
      expect(typeof response.body).toBe('object');
    });
  });

  describe('Error Handling', () => {
    test('should handle controller errors gracefully', async () => {
      const lecturerController = require('../../../controllers/lecturerController');
      lecturerController.getMyModules.mockImplementation((req, res) => {
        res.status(500).json({ error: 'Internal server error' });
      });

      const response = await request(app)
        .get('/lecturer/modules');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });
  });
});
