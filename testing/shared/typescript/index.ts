/**
 * Shared testing utilities for TypeScript projects
 * Assumes Jest is available globally
 */

// Mock implementations
export const mockAuthService = () => ({
  validateToken: jest.fn(),
  generateToken: jest.fn(),
  refreshToken: jest.fn(),
  verifyPermissions: jest.fn(),
});

export const mockDatabaseService = () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  query: jest.fn(),
  transaction: jest.fn(),
});

export const mockWebSocketService = () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  send: jest.fn(),
  on: jest.fn(),
  emit: jest.fn(),
});

export const mockExternalAPIService = () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
});

// Test data generators
export const generateTestUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const generateTestAgent = (overrides = {}) => ({
  id: 'test-agent-id',
  name: 'Test Agent',
  type: 'automation',
  status: 'active',
  capabilities: ['web-navigation', 'data-extraction'],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const generateTestWorkflow = (overrides = {}) => ({
  id: 'test-workflow-id',
  name: 'Test Workflow',
  description: 'A test workflow',
  steps: [],
  status: 'draft',
  createdBy: 'test-user-id',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Test helpers
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const createMockRequest = (overrides = {}) => ({
  user: generateTestUser(),
  headers: {},
  body: {},
  query: {},
  params: {},
  ...overrides,
});

export const createMockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

// Authentication helpers
export const createAuthToken = (userId = 'test-user-id', role = 'user') => {
  return `mock-jwt-token-${userId}-${role}`;
};

export const mockAuthMiddleware = (user = generateTestUser()) => {
  return (req: any, res: any, next: any) => {
    req.user = user;
    next();
  };
};

// Database helpers
export const setupTestDatabase = async () => {
  const mockDb = mockDatabaseService();
  mockDb.connect.mockResolvedValue(true);
  return mockDb;
};

export const teardownTestDatabase = async (mockDb: any) => {
  mockDb.disconnect.mockResolvedValue(true);
};

// WebSocket helpers
export const createMockWebSocketServer = () => {
  const wss: any = {};
  wss.clients = new Set();
  wss.on = jest.fn();
  wss.emit = jest.fn();
  wss.close = jest.fn();
  return wss;
};

export const createMockWebSocketClient = () => {
  const ws: any = {};
  ws.send = jest.fn();
  ws.close = jest.fn();
  ws.on = jest.fn();
  ws.once = jest.fn();
  ws.readyState = 1; // OPEN
  return ws;
};

// API testing helpers
export const createApiTestContext = () => {
  const req = createMockRequest();
  const res = createMockResponse();
  const next = jest.fn();

  return { req, res, next };
};

// Cross-service communication helpers
export const mockServiceCommunication = () => ({
  publish: jest.fn(),
  subscribe: jest.fn(),
  request: jest.fn(),
  respond: jest.fn(),
});

// Performance testing helpers
export const measureExecutionTime = async (fn: Function) => {
  const start = Date.now();
  const result = await fn();
  const end = Date.now();
  return { result, executionTime: end - start };
};

export const createPerformanceTestSuite = (testName: string, iterations = 100) => {
  return {
    run: async (fn: Function) => {
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const { executionTime } = await measureExecutionTime(fn);
        times.push(executionTime);
      }

      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);

      console.log(`${testName} Performance Results:`);
      console.log(`  Average: ${avg.toFixed(2)}ms`);
      console.log(`  Min: ${min}ms`);
      console.log(`  Max: ${max}ms`);
      console.log(`  Iterations: ${iterations}`);

      return { avg, min, max, times };
    },
  };
};