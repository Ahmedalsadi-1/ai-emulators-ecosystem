import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { randomIntBetween, randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const errorRate = new Rate('errors');
const successfulRequests = new Rate('successful_requests');
const responseTimeTrend = new Trend('response_time_trend');

// Test configuration
export const options = {
  scenarios: {
    // Ramp up test
    ramp_up_test: {
      executor: 'ramping-vus',
      stages: [
        { duration: '30s', target: 10 },   // Ramp up to 10 users over 30s
        { duration: '1m', target: 50 },    // Ramp up to 50 users over 1m
        { duration: '2m', target: 100 },   // Ramp up to 100 users over 2m
        { duration: '1m', target: 100 },   // Stay at 100 users for 1m
        { duration: '30s', target: 0 },    // Ramp down to 0 users
      ],
      tags: { test_type: 'ramp_up' },
    },

    // Stress test
    stress_test: {
      executor: 'constant-vus',
      vus: 200,
      duration: '3m',
      tags: { test_type: 'stress' },
    },

    // Spike test
    spike_test: {
      executor: 'ramping-vus',
      stages: [
        { duration: '10s', target: 10 },   // Normal load
        { duration: '10s', target: 1000 }, // Spike to 1000 users
        { duration: '10s', target: 10 },   // Back to normal
      ],
      tags: { test_type: 'spike' },
    },

    // Breakpoint test
    breakpoint_test: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1m', target: 100 },
        { duration: '2m', target: 100 },
        { duration: '2m', target: 200 },
        { duration: '2m', target: 200 },
        { duration: '2m', target: 300 },
        { duration: '2m', target: 300 },
        { duration: '2m', target: 400 },
        { duration: '5m', target: 400 },
      ],
      tags: { test_type: 'breakpoint' },
    },
  },

  thresholds: {
    // Response time targets
    http_req_duration: ['p(95)<500', 'p(99)<1000'],

    // Error rate targets
    errors: ['rate<0.1'], // Less than 10% error rate

    // Successful requests
    successful_requests: ['rate>0.95'], // More than 95% success rate
  },
};

// Base URL and test data
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_BASE_URL = __ENV.API_BASE_URL || 'http://localhost:8080';

// Test user data
const testUsers = Array.from({ length: 100 }, (_, i) => ({
  id: `user-${i + 1}`,
  email: `user${i + 1}@example.com`,
  name: `Test User ${i + 1}`,
  role: i % 10 === 0 ? 'admin' : 'user',
}));

// Authentication tokens cache
const authTokens = new Map();

export function setup() {
  // Pre-authenticate some users for testing
  console.log('Setting up test data...');

  for (let i = 0; i < 10; i++) {
    const user = testUsers[i];
    const loginPayload = {
      email: user.email,
      password: 'test-password-123',
    };

    const response = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(loginPayload), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      const data = JSON.parse(response.body);
      authTokens.set(user.id, data.token);
    }
  }

  console.log(`Pre-authenticated ${authTokens.size} users`);
  return { authTokens: Array.from(authTokens.entries()) };
}

export default function (data) {
  // Restore auth tokens from setup
  data.authTokens.forEach(([userId, token]) => {
    authTokens.set(userId, token);
  });

  // Random test user for this iteration
  const randomUser = testUsers[randomIntBetween(0, testUsers.length - 1)];
  const authToken = authTokens.get(randomUser.id);

  // Test scenarios based on user type and random selection
  const scenario = randomIntBetween(1, 10);

  switch (scenario) {
    case 1:
      authenticateUser(randomUser);
      break;
    case 2:
      fetchUserProfile(randomUser, authToken);
      break;
    case 3:
      listUserResources(randomUser, authToken);
      break;
    case 4:
      createUserResource(randomUser, authToken);
      break;
    case 5:
      updateUserResource(randomUser, authToken);
      break;
    case 6:
      searchResources(randomUser, authToken);
      break;
    case 7:
      performWorkflowAction(randomUser, authToken);
      break;
    case 8:
      uploadFile(randomUser, authToken);
      break;
    case 9:
      realTimeUpdates(randomUser, authToken);
      break;
    case 10:
      adminOperations(randomUser, authToken);
      break;
  }

  // Random sleep between 1-5 seconds to simulate user think time
  sleep(randomIntBetween(1, 5));
}

function authenticateUser(user) {
  const payload = {
    email: user.email,
    password: 'test-password-123',
  };

  const response = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { operation: 'authenticate' },
  });

  const checkResult = check(response, {
    'auth status is 200': (r) => r.status === 200,
    'auth response has token': (r) => JSON.parse(r.body).token !== undefined,
    'auth response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  errorRate.add(!checkResult);
  successfulRequests.add(checkResult);

  if (checkResult && response.status === 200) {
    const data = JSON.parse(response.body);
    authTokens.set(user.id, data.token);
  }

  responseTimeTrend.add(response.timings.duration);
}

function fetchUserProfile(user, authToken) {
  const headers = authToken ? {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  } : {
    'Content-Type': 'application/json',
  };

  const response = http.get(`${API_BASE_URL}/api/users/${user.id}/profile`, {
    headers,
    tags: { operation: 'fetch_profile' },
  });

  const checkResult = check(response, {
    'profile status is 200': (r) => r.status === 200,
    'profile has user data': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.id === user.id;
      } catch {
        return false;
      }
    },
    'profile response time < 300ms': (r) => r.timings.duration < 300,
  });

  errorRate.add(!checkResult);
  successfulRequests.add(checkResult);
  responseTimeTrend.add(response.timings.duration);
}

function listUserResources(user, authToken) {
  const headers = authToken ? {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  } : {
    'Content-Type': 'application/json',
  };

  // Random pagination
  const page = randomIntBetween(1, 5);
  const limit = randomIntBetween(10, 50);

  const response = http.get(`${API_BASE_URL}/api/users/${user.id}/resources?page=${page}&limit=${limit}`, {
    headers,
    tags: { operation: 'list_resources' },
  });

  const checkResult = check(response, {
    'list status is 200': (r) => r.status === 200,
    'list has data array': (r) => {
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data.data || data);
      } catch {
        return false;
      }
    },
    'list response time < 500ms': (r) => r.timings.duration < 500,
  });

  errorRate.add(!checkResult);
  successfulRequests.add(checkResult);
  responseTimeTrend.add(response.timings.duration);
}

function createUserResource(user, authToken) {
  if (!authToken) return; // Skip if not authenticated

  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  };

  const resourceData = {
    name: `Test Resource ${randomString(10)}`,
    description: `Auto-generated test resource for user ${user.id}`,
    type: ['document', 'task', 'note'][randomIntBetween(0, 2)],
    tags: Array.from({ length: randomIntBetween(1, 5) }, () => randomString(8)),
    metadata: {
      createdBy: user.id,
      priority: ['low', 'medium', 'high'][randomIntBetween(0, 2)],
      category: randomString(12),
    },
  };

  const response = http.post(`${API_BASE_URL}/api/users/${user.id}/resources`, JSON.stringify(resourceData), {
    headers,
    tags: { operation: 'create_resource' },
  });

  const checkResult = check(response, {
    'create status is 201': (r) => r.status === 201,
    'create returns resource ID': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.id !== undefined;
      } catch {
        return false;
      }
    },
    'create response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  errorRate.add(!checkResult);
  successfulRequests.add(checkResult);
  responseTimeTrend.add(response.timings.duration);
}

function updateUserResource(user, authToken) {
  if (!authToken) return;

  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  };

  // First get a resource to update
  const listResponse = http.get(`${API_BASE_URL}/api/users/${user.id}/resources?limit=1`, { headers });

  if (listResponse.status !== 200) return;

  try {
    const listData = JSON.parse(listResponse.body);
    const resources = listData.data || listData;

    if (!resources || resources.length === 0) return;

    const resourceToUpdate = resources[0];
    const updateData = {
      name: `${resourceToUpdate.name} (Updated ${Date.now()})`,
      description: `${resourceToUpdate.description} - Modified`,
      tags: [...(resourceToUpdate.tags || []), 'updated'],
    };

    const response = http.put(`${API_BASE_URL}/api/users/${user.id}/resources/${resourceToUpdate.id}`, JSON.stringify(updateData), {
      headers,
      tags: { operation: 'update_resource' },
    });

    const checkResult = check(response, {
      'update status is 200': (r) => r.status === 200,
      'update response time < 800ms': (r) => r.timings.duration < 800,
    });

    errorRate.add(!checkResult);
    successfulRequests.add(checkResult);
    responseTimeTrend.add(response.timings.duration);
  } catch (error) {
    errorRate.add(true);
  }
}

function searchResources(user, authToken) {
  const headers = authToken ? {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  } : {
    'Content-Type': 'application/json',
  };

  const searchQueries = [
    'test',
    'document',
    'task',
    'important',
    'urgent',
    randomString(8),
  ];

  const query = searchQueries[randomIntBetween(0, searchQueries.length - 1)];
  const searchType = ['basic', 'advanced', 'semantic'][randomIntBetween(0, 2)];

  const response = http.get(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}&type=${searchType}&userId=${user.id}`, {
    headers,
    tags: { operation: 'search' },
  });

  const checkResult = check(response, {
    'search status is 200': (r) => r.status === 200,
    'search returns results': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.results !== undefined;
      } catch {
        return false;
      }
    },
    'search response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  errorRate.add(!checkResult);
  successfulRequests.add(checkResult);
  responseTimeTrend.add(response.timings.duration);
}

function performWorkflowAction(user, authToken) {
  if (!authToken) return;

  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  };

  // Create a simple workflow
  const workflowData = {
    name: `Test Workflow ${randomString(8)}`,
    description: 'Auto-generated test workflow',
    steps: [
      {
        id: 'step-1',
        name: 'Initial Step',
        type: 'manual',
        assignee: user.id,
      },
      {
        id: 'step-2',
        name: 'Review Step',
        type: 'approval',
        assignee: user.role === 'admin' ? user.id : 'admin-user',
      },
    ],
    metadata: {
      createdBy: user.id,
      priority: 'medium',
      category: 'test',
    },
  };

  const createResponse = http.post(`${API_BASE_URL}/api/workflows`, JSON.stringify(workflowData), {
    headers,
    tags: { operation: 'create_workflow' },
  });

  if (createResponse.status === 201) {
    try {
      const workflow = JSON.parse(createResponse.body);

      // Execute workflow action
      const actionData = {
        action: 'complete_step',
        stepId: 'step-1',
        comment: 'Test completion comment',
      };

      const actionResponse = http.post(`${API_BASE_URL}/api/workflows/${workflow.id}/actions`, JSON.stringify(actionData), {
        headers,
        tags: { operation: 'workflow_action' },
      });

      const checkResult = check(actionResponse, {
        'workflow action status is 200': (r) => r.status === 200,
        'workflow action response time < 1500ms': (r) => r.timings.duration < 1500,
      });

      errorRate.add(!checkResult);
      successfulRequests.add(checkResult);
      responseTimeTrend.add(actionResponse.timings.duration);
    } catch (error) {
      errorRate.add(true);
    }
  }
}

function uploadFile(user, authToken) {
  if (!authToken) return;

  const headers = {
    'Authorization': `Bearer ${authToken}`,
  };

  // Generate random file content
  const fileContent = randomString(randomIntBetween(1024, 10240)); // 1KB to 10KB
  const fileName = `test-file-${randomString(8)}.txt`;

  const binaryFile = http.file(fileContent, fileName, 'text/plain');

  const response = http.post(`${API_BASE_URL}/api/files/upload`, {
    file: binaryFile,
    metadata: JSON.stringify({
      uploadedBy: user.id,
      category: 'test',
      tags: ['performance-test', 'auto-generated'],
    }),
  }, {
    headers,
    tags: { operation: 'file_upload' },
  });

  const checkResult = check(response, {
    'upload status is 201': (r) => r.status === 201,
    'upload returns file URL': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.url !== undefined;
      } catch {
        return false;
      }
    },
    'upload response time < 5000ms': (r) => r.timings.duration < 5000,
  });

  errorRate.add(!checkResult);
  successfulRequests.add(checkResult);
  responseTimeTrend.add(response.timings.duration);
}

function realTimeUpdates(user, authToken) {
  if (!authToken) return;

  // Test WebSocket connection for real-time updates
  const wsUrl = `ws://localhost:8080/ws?token=${authToken}&userId=${user.id}`;

  const response = http.get(wsUrl, {
    tags: { operation: 'websocket_connect' },
  });

  // Note: Full WebSocket testing would require WebSocket support in k6
  // This is a basic connectivity test
  const checkResult = check(response, {
    'websocket endpoint accessible': (r) => r.status < 400,
    'websocket response time < 500ms': (r) => r.timings.duration < 500,
  });

  errorRate.add(!checkResult);
  successfulRequests.add(checkResult);
  responseTimeTrend.add(response.timings.duration);
}

function adminOperations(user, authToken) {
  // Only perform admin operations if user has admin role
  if (user.role !== 'admin' || !authToken) return;

  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  };

  // Admin: Get system metrics
  const metricsResponse = http.get(`${API_BASE_URL}/api/admin/metrics`, {
    headers,
    tags: { operation: 'admin_metrics' },
  });

  const metricsCheck = check(metricsResponse, {
    'admin metrics status is 200': (r) => r.status === 200,
    'admin metrics response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  errorRate.add(!metricsCheck);
  successfulRequests.add(metricsCheck);
  responseTimeTrend.add(metricsResponse.timings.duration);

  // Admin: List all users (with pagination)
  const page = randomIntBetween(1, 5);
  const usersResponse = http.get(`${API_BASE_URL}/api/admin/users?page=${page}&limit=20`, {
    headers,
    tags: { operation: 'admin_users' },
  });

  const usersCheck = check(usersResponse, {
    'admin users status is 200': (r) => r.status === 200,
    'admin users response time < 1500ms': (r) => r.timings.duration < 1500,
  });

  errorRate.add(!usersCheck);
  successfulRequests.add(usersCheck);
  responseTimeTrend.add(usersResponse.timings.duration);
}

export function teardown(data) {
  console.log('Performance test completed');
  console.log(`Total requests: ${http_reqs}`);
  console.log(`Average response time: ${responseTimeTrend}`);
  console.log(`Error rate: ${errorRate}`);
  console.log(`Success rate: ${successful_requests}`);
}