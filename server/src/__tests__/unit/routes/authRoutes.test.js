const request = require('supertest');
const express = require('express');
const authRoutes = require('../../../routes/authRoutes');

// Mock the authController
jest.mock('../../../controllers/authController', () => ({
  googleVerify: jest.fn((req, res) => res.json({ message: 'Google verification successful' })),
  getCurrentUser: jest.fn((req, res) => res.json({ user: { id: '123', name: 'Test User' } })),
  logout: jest.fn((req, res) => res.json({ message: 'Logged out successfully' }))
}));

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/google-verify', () => {
    test('should call googleVerify controller', async () => {
      const response = await request(app)
        .post('/auth/google-verify')
        .send({ token: 'test-token' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Google verification successful' });
    });

    test('should handle request body', async () => {
      const requestBody = { token: 'google-token-123' };
      
      const response = await request(app)
        .post('/auth/google-verify')
        .send(requestBody);

      // The controller should receive the request body
      expect(response.status).toBe(200);
    });
  });

  describe('GET /auth/current-user', () => {
    test('should call getCurrentUser controller', async () => {
      const response = await request(app)
        .get('/auth/current-user');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ user: { id: '123', name: 'Test User' } });
    });

    test('should handle session data', async () => {
      const response = await request(app)
        .get('/auth/current-user')
        .set('Cookie', 'sessionId=test-session');

      expect(response.status).toBe(200);
    });
  });

  describe('POST /auth/logout', () => {
    test('should call logout controller', async () => {
      const response = await request(app)
        .post('/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Logged out successfully' });
    });

    test('should handle session destruction', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Cookie', 'sessionId=test-session');

      expect(response.status).toBe(200);
    });
  });

  describe('Route Registration', () => {
    test('should register all auth routes', () => {
      const routes = authRoutes.stack.map(layer => ({
        method: Object.keys(layer.route.methods)[0],
        path: layer.route.path
      }));

      expect(routes).toContainEqual({ method: 'post', path: '/google-verify' });
      expect(routes).toContainEqual({ method: 'get', path: '/current-user' });
      expect(routes).toContainEqual({ method: 'post', path: '/logout' });
    });

    test('should have correct number of routes', () => {
      const routes = authRoutes.stack;
      expect(routes).toHaveLength(3);
    });
  });

  describe('HTTP Methods', () => {
    test('should use POST for google-verify', async () => {
      const response = await request(app)
        .post('/auth/google-verify')
        .send({});

      expect(response.status).toBe(200);
    });

    test('should use GET for current-user', async () => {
      const response = await request(app)
        .get('/auth/current-user');

      expect(response.status).toBe(200);
    });

    test('should use POST for logout', async () => {
      const response = await request(app)
        .post('/auth/logout');

      expect(response.status).toBe(200);
    });

    test('should reject wrong HTTP methods', async () => {
      const getResponse = await request(app)
        .get('/auth/google-verify');
      expect(getResponse.status).toBe(404);

      const postResponse = await request(app)
        .post('/auth/current-user');
      expect(postResponse.status).toBe(404);

      const getLogoutResponse = await request(app)
        .get('/auth/logout');
      expect(getLogoutResponse.status).toBe(404);
    });
  });

  describe('Request/Response Handling', () => {
    test('should handle JSON requests', async () => {
      const response = await request(app)
        .post('/auth/google-verify')
        .send({ token: 'test-token' })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
    });

    test('should handle empty request bodies', async () => {
      const response = await request(app)
        .post('/auth/google-verify')
        .send({});

      expect(response.status).toBe(200);
    });

    test('should return JSON responses', async () => {
      const response = await request(app)
        .get('/auth/current-user');

      expect(response.headers['content-type']).toMatch(/json/);
      expect(typeof response.body).toBe('object');
    });
  });

  describe('Error Handling', () => {
    test('should handle controller errors gracefully', async () => {
      // Mock controller to throw error
      const authController = require('../../../controllers/authController');
      authController.googleVerify.mockImplementation((req, res) => {
        res.status(500).json({ error: 'Internal server error' });
      });

      const response = await request(app)
        .post('/auth/google-verify')
        .send({ token: 'test-token' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });
  });

  describe('Route Paths', () => {
    test('should have correct route paths', () => {
      const expectedPaths = ['/google-verify', '/current-user', '/logout'];
      const actualPaths = authRoutes.stack.map(layer => layer.route.path);
      
      expectedPaths.forEach(path => {
        expect(actualPaths).toContain(path);
      });
    });

    test('should not have duplicate routes', () => {
      const paths = authRoutes.stack.map(layer => layer.route.path);
      const uniquePaths = [...new Set(paths)];
      expect(paths).toHaveLength(uniquePaths.length);
    });
  });
});
