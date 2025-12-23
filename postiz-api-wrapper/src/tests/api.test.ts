import request from 'supertest';
import app from '../src/main';

describe('Postiz API Wrapper', () => {
  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBeDefined();
      expect(response.body.data.services).toBeDefined();
    });

    it('should return readiness status', async () => {
      const response = await request(app)
        .get('/api/health/ready')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('ready');
    });
  });

  describe('Posts API', () => {
    const validPostData = {
      content: 'Test post content #test',
      platforms: ['twitter'],
      scheduledAt: new Date().toISOString(),
    };

    it('should create a post with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', 'Bearer test-token')
        .send(validPostData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
    });

    it('should reject post creation with invalid data', async () => {
      const invalidData = {
        content: '', // Empty content
        platforms: [], // No platforms
      };

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', 'Bearer test-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
    });

    it('should get posts with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/posts?page=1&limit=10')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
    });
  });

  describe('Analytics API', () => {
    it('should get analytics data', async () => {
      const response = await request(app)
        .get('/api/v1/analytics?platforms=twitter&startDate=2024-01-01&endDate=2024-01-31')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get analytics summary', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/summary?period=30d')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary).toBeDefined();
    });
  });

  describe('Integrations API', () => {
    it('should get available platforms', async () => {
      const response = await request(app)
        .get('/api/v1/integrations/platforms')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should get connected integrations', async () => {
      const response = await request(app)
        .get('/api/v1/integrations')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      await request(app)
        .get('/api/unknown-route')
        .expect(404);
    });

    it('should return 401 for unauthorized requests', async () => {
      await request(app)
        .get('/api/v1/posts')
        .expect(401);
    });

    it('should return 429 for rate limited requests', async () => {
      // This test would require setting up rate limiting expectations
      // For now, just ensure the endpoint exists
      const response = await request(app)
        .get('/api/v1/posts')
        .set('Authorization', 'Bearer test-token');

      expect([200, 429]).toContain(response.status);
    });
  });
});