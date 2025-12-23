# Comprehensive Testing Suite Documentation

## Overview

This document provides comprehensive guidelines for using and maintaining the unified testing suite for the future-app ecosystem. The testing suite covers unit tests, integration tests, end-to-end tests, performance tests, and security tests across all projects.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Testing Architecture](#testing-architecture)
3. [Writing Tests](#writing-tests)
4. [Running Tests](#running-tests)
5. [CI/CD Integration](#ci-cd-integration)
6. [Performance Testing](#performance-testing)
7. [Security Testing](#security-testing)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [Contributing](#contributing)

## Quick Start

### Prerequisites

```bash
# Install dependencies for all projects
npm install
pip install -r requirements.txt

# Install shared testing utilities
cd testing/shared/typescript && npm install && npm run build
cd ../python && pip install -e .

# Install Playwright for E2E tests
npx playwright install --with-deps

# Install k6 for performance tests
# Download from https://k6.io/docs/get-started/installation/
```

### Run All Tests

```bash
# Run tests for all projects
node testing/bin/test-runner.js

# Run specific test types
node testing/bin/test-runner.js --unit          # Unit tests only
node testing/bin/test-runner.js --integration   # Integration tests only
node testing/bin/test-runner.js --e2e          # E2E tests only

# Run tests for specific project
node testing/bin/test-runner.js bytebot         # Test bytebot only
node testing/bin/test-runner.js AIOS --unit     # Unit tests for AIOS only
```

### Run Tests in Development

```bash
# TypeScript projects
cd bytebot/packages/bytebot-agent
npm test
npm run test:integration
npm run test:e2e

# Python projects
cd AIOS
python -m pytest tests/ -v
python -m pytest tests/ -v -m integration
python -m pytest tests/ -v -m e2e
```

## Testing Architecture

### Test Categories

#### 1. Unit Tests
- **Scope**: Individual functions, classes, and modules
- **Isolation**: Mock all external dependencies
- **Coverage**: 85%+ line coverage required
- **Location**: `src/**/*.spec.ts` (TypeScript), `tests/test_*.py` (Python)

#### 2. Integration Tests
- **Scope**: Service-to-service communication, API endpoints, database operations
- **Isolation**: Use test databases and mock external services
- **Coverage**: All critical integration points
- **Location**: `src/**/*.integration.spec.ts`, `tests/integration/`

#### 3. Cross-Communication Tests
- **Scope**: Inter-service communication, WebSocket connections, message queues
- **Isolation**: Use Docker Compose for multi-service testing
- **Coverage**: All communication protocols
- **Location**: `tests/cross-communication/`

#### 4. Embedded UI Integration Tests
- **Scope**: Embedded widgets, UI state management, cross-origin communication
- **Isolation**: Use Playwright with test servers
- **Coverage**: All embedding contexts
- **Location**: `tests/embedded-ui/`

#### 5. End-to-End Tests
- **Scope**: Complete user workflows from start to finish
- **Isolation**: Full application stack with test data
- **Coverage**: Critical user journeys
- **Location**: `tests/e2e/`

#### 6. Performance Tests
- **Scope**: Load testing, stress testing, performance benchmarking
- **Isolation**: Dedicated performance environment
- **Coverage**: All performance-critical paths
- **Location**: `tests/performance/`

#### 7. Security Tests
- **Scope**: Authentication, authorization, vulnerability scanning
- **Isolation**: Isolated security testing environment
- **Coverage**: All security-critical functionality
- **Location**: `tests/security/`

### Project Structure

```
testing/
├── bin/
│   └── test-runner.js          # Unified test runner
├── shared/                     # Shared testing utilities
│   ├── typescript/
│   │   ├── src/
│   │   │   └── index.ts        # TypeScript utilities
│   │   └── package.json
│   └── python/
│       ├── src/
│       │   └── testing_utils.py # Python utilities
│       └── setup.py
├── README.md                   # This documentation
tests/                          # Test files (organized by type)
├── performance/                # Performance tests
├── security/                   # Security tests
└── e2e/                       # End-to-end tests
```

## Writing Tests

### TypeScript/JavaScript Tests

#### Unit Tests with Jest

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { mockAuthService, generateTestUser } from '@future-app/testing-shared';

describe('UserService', () => {
  let service: UserService;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: AuthService,
          useValue: mockAuthService(),
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    authService = module.get(AuthService);
  });

  it('should create user successfully', async () => {
    // Arrange
    const userData = generateTestUser({ name: 'John Doe' });
    authService.validateUser.mockResolvedValue(true);

    // Act
    const result = await service.createUser(userData);

    // Assert
    expect(result).toBeDefined();
    expect(result.name).toBe('John Doe');
    expect(authService.validateUser).toHaveBeenCalledWith(userData);
  });
});
```

#### Integration Tests

```typescript
describe('User API Integration', () => {
  let app: INestApplication;
  let database: TestDatabase;

  beforeAll(async () => {
    // Setup test database
    database = await setupTestDatabase();

    // Setup NestJS app
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await teardownTestDatabase(database);
  });

  it('should create and retrieve user', async () => {
    const userData = generateTestUser();

    // Create user
    const createResponse = await request(app.getHttpServer())
      .post('/users')
      .send(userData)
      .expect(201);

    const userId = createResponse.body.id;

    // Retrieve user
    const getResponse = await request(app.getHttpServer())
      .get(`/users/${userId}`)
      .expect(200);

    expect(getResponse.body.name).toBe(userData.name);
  });
});
```

#### E2E Tests with Playwright

```typescript
import { test, expect } from '@playwright/test';
import { generateTestUser } from '@future-app/testing-shared';

test.describe('User Registration Flow', () => {
  test('should complete full registration', async ({ page }) => {
    const userData = generateTestUser();

    // Navigate to registration page
    await page.goto('/register');

    // Fill registration form
    await page.fill('[data-testid="email-input"]', userData.email);
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.fill('[data-testid="confirm-password-input"]', 'SecurePass123!');
    await page.fill('[data-testid="name-input"]', userData.name);

    // Submit form
    await page.click('[data-testid="register-button"]');

    // Verify success
    await expect(page.locator('[data-testid="registration-success"]')).toBeVisible();

    // Check email verification
    await expect(page.locator('[data-testid="email-verification-sent"]')).toBeVisible();
  });
});
```

### Python Tests

#### Unit Tests with pytest

```python
import pytest
from unittest.mock import Mock, AsyncMock
from testing_utils import mock_auth_service, generate_test_user

class TestUserService:
    @pytest.fixture
    def user_service(self):
        from myapp.services.user_service import UserService
        return UserService()

    @pytest.fixture
    def auth_service(self):
        return mock_auth_service()

    @pytest.mark.asyncio
    async def test_create_user(self, user_service, auth_service):
        # Arrange
        user_data = generate_test_user(name='John Doe')
        auth_service.validate_user = AsyncMock(return_value=True)

        # Act
        result = await user_service.create_user(user_data)

        # Assert
        assert result is not None
        assert result['name'] == 'John Doe'
        auth_service.validate_user.assert_called_once_with(user_data)
```

#### Integration Tests

```python
import pytest
from httpx import AsyncClient
from testing_utils import setup_test_database, teardown_test_database

@pytest.mark.asyncio
class TestUserAPIIntegration:
    @pytest.fixture
    async def client(self):
        from myapp.main import app
        async with AsyncClient(app=app, base_url="http://testserver") as client:
            yield client

    @pytest.fixture(autouse=True)
    async def setup_database(self):
        self.database = await setup_test_database()
        yield
        await teardown_test_database(self.database)

    async def test_create_and_retrieve_user(self, client):
        user_data = generate_test_user()

        # Create user
        create_response = await client.post("/users", json=user_data)
        assert create_response.status_code == 201

        user_id = create_response.json()["id"]

        # Retrieve user
        get_response = await client.get(f"/users/{user_id}")
        assert get_response.status_code == 200

        retrieved_user = get_response.json()
        assert retrieved_user["name"] == user_data["name"]
```

## Running Tests

### Local Development

```bash
# Run all tests
npm run test:all

# Run tests for specific project
npm run test --workspace=bytebot

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- src/user.service.spec.ts

# Run tests matching pattern
npm test -- --testNamePattern="authentication"
```

### CI/CD Pipeline

Tests are automatically run in GitHub Actions on:
- Push to main/develop branches
- Pull requests
- Scheduled nightly runs
- Manual workflow dispatch

### Test Filtering

```bash
# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only E2E tests
npm run test:e2e

# Run performance tests
npm run test:performance

# Run security tests
npm run test:security
```

### Parallel Execution

```bash
# Run tests in parallel across projects
node testing/bin/test-runner.js --parallel

# Run tests with specific concurrency
npm test -- --maxWorkers=4

# Run tests with load balancing
npm run test:load-balanced
```

## CI/CD Integration

### GitHub Actions Workflows

The testing suite integrates with GitHub Actions through:

1. **Comprehensive Testing Suite** (`.github/workflows/comprehensive-testing-suite.yml`)
   - Unit tests for all projects
   - Integration tests
   - E2E tests with Playwright
   - Performance tests with k6
   - Security tests

2. **Quality Gates**
   - Coverage thresholds (85%+)
   - Test success rates (95%+)
   - Performance benchmarks
   - Security scan results

3. **Automated Reporting**
   - Test results uploaded to GitHub
   - Coverage reports generated
   - Performance metrics tracked
   - Security findings reported

### Quality Gates

```yaml
# Example quality gate configuration
quality-gates:
  coverage:
    minimum: 85%
    branches: true
    functions: true
    lines: true

  performance:
    response_time_p95: 500ms
    error_rate: 5%
    throughput: 1000rpm

  security:
    critical_vulnerabilities: 0
    high_vulnerabilities: 0
    dependency_scan: enabled
```

## Performance Testing

### Running Performance Tests

```bash
# Run API load tests
k6 run tests/performance/api-load-test.js

# Run WebSocket stress tests
k6 run tests/performance/websocket-load-test.js

# Run database performance tests
k6 run tests/performance/database-load-test.js

# Run with custom configuration
k6 run --vus 100 --duration 5m tests/performance/api-load-test.js
```

### Performance Test Scenarios

1. **Ramp Up Test**: Gradually increase load to find breaking points
2. **Stress Test**: Constant high load to test system limits
3. **Spike Test**: Sudden load spikes to test resilience
4. **Breakpoint Test**: Find maximum capacity limits

### Performance Metrics

- **Response Time**: p50, p95, p99 percentiles
- **Throughput**: Requests per second
- **Error Rate**: Percentage of failed requests
- **Resource Usage**: CPU, memory, disk I/O
- **Concurrent Users**: Number of simultaneous users

### Performance Baselines

```javascript
// Example performance baseline
const performanceBaselines = {
  api_response_time: {
    p95: 500,  // ms
    p99: 1000, // ms
  },
  websocket_latency: {
    p95: 100,  // ms
  },
  error_rate: {
    max: 0.05, // 5%
  },
  throughput: {
    min: 1000, // requests per second
  },
};
```

## Security Testing

### Running Security Tests

```bash
# Run authentication security tests
npm run test:security -- --grep="authentication"

# Run API security tests
npm run test:security -- --grep="api"

# Run dependency vulnerability scans
npm audit
safety check

# Run SAST (Static Application Security Testing)
semgrep --config auto .
bandit -r . -f json

# Run container security scans
docker scan myapp:latest
```

### Security Test Categories

1. **Authentication & Authorization**
   - JWT token validation
   - Role-based access control
   - Session management
   - Password policies

2. **API Security**
   - Input validation
   - SQL injection prevention
   - XSS protection
   - CSRF protection

3. **Infrastructure Security**
   - Container security
   - Network security
   - Secret management
   - SSL/TLS configuration

### Security Scanning Tools

- **SAST**: semgrep, bandit, eslint security plugins
- **DAST**: OWASP ZAP, nuclei
- **Container Security**: Trivy, Clair
- **Dependency Scanning**: npm audit, safety, Snyk
- **Secret Detection**: git-secrets, truffleHog

## Best Practices

### Test Organization

```typescript
// ✅ Good: Clear test structure
describe('UserService', () => {
  describe('User Creation', () => {
    it('should create user with valid data', () => {
      // Test implementation
    });

    it('should reject invalid email', () => {
      // Test implementation
    });
  });

  describe('User Authentication', () => {
    it('should authenticate valid credentials', () => {
      // Test implementation
    });
  });
});

// ❌ Bad: Unorganized tests
describe('UserService tests', () => {
  it('test1', () => {});
  it('test2', () => {});
  it('user creation edge case', () => {});
});
```

### Mock Usage

```typescript
// ✅ Good: Proper mocking
const mockRepository = {
  findById: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

// ❌ Bad: Over-mocking
const mockEverything = jest.fn().mockReturnValue('mocked');
// This makes tests meaningless
```

### Test Data Management

```typescript
// ✅ Good: Use test data builders
const testUser = generateTestUser({
  role: 'admin',
  permissions: ['read', 'write'],
});

// ✅ Good: Clean up after tests
afterEach(async () => {
  await cleanupTestData();
  jest.clearAllMocks();
});
```

### Performance Considerations

```typescript
// ✅ Good: Fast unit tests
it('should validate email quickly', () => {
  const result = validateEmail('test@example.com');
  expect(result).toBe(true);
});

// ❌ Bad: Slow integration tests in unit test suite
it('should create user in database', async () => {
  // This should be in integration tests
  await createUserInDatabase(userData);
});
```

### Async Testing

```typescript
// ✅ Good: Proper async testing
it('should create user asynchronously', async () => {
  const result = await userService.createUser(userData);
  expect(result).toBeDefined();
});

// ✅ Good: Timeout handling
it('should timeout slow operations', async () => {
  await expect(
    slowOperation()
  ).rejects.toThrow('timeout');
}, 10000);
```

## Troubleshooting

### Common Issues

#### Tests Failing Intermittently

```bash
# Run tests multiple times to identify flakes
npm run test:flaky

# Check for race conditions
npm run test:race-conditions

# Debug with verbose output
npm test -- --verbose --detectOpenHandles
```

#### Slow Tests

```bash
# Profile test execution
npm run test:profile

# Identify slow tests
npm run test:slow

# Optimize database setup
# Use in-memory databases for unit tests
# Mock external services
```

#### Coverage Issues

```bash
# Check coverage report
npm run coverage:report

# Identify uncovered lines
npm run coverage:missing

# Add missing test cases
# Remove unreachable code
# Add /* istanbul ignore */ for external code
```

#### CI/CD Failures

```bash
# Run tests locally with same environment
docker-compose -f docker-compose.test.yml up -d
npm run test:ci

# Check environment variables
# Verify service dependencies
# Check network connectivity
```

### Debugging Tools

```bash
# Debug tests in IDE
npm run test:debug

# Step through test execution
npm run test:inspect

# Log test execution details
DEBUG=test:* npm test

# Record test sessions
npx playwright test --headed --debug
```

## Contributing

### Adding New Tests

1. **Identify Test Type**: Determine if it's unit, integration, or E2E
2. **Follow Naming Conventions**: `*.spec.ts`, `*.test.ts`, `test_*.py`
3. **Use Shared Utilities**: Import from `@future-app/testing-shared`
4. **Add Proper Documentation**: Describe what the test validates
5. **Include Edge Cases**: Test error conditions and boundary values

### Test File Template

```typescript
/**
 * Unit tests for FeatureName
 *
 * Tests Description:
 * - Test case 1
 * - Test case 2
 * - Edge cases
 */

import { Test, TestingModule } from '@nestjs/testing';
import { FeatureService } from './feature.service';
import { generateTestData } from '@future-app/testing-shared';

describe('FeatureService', () => {
  let service: FeatureService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FeatureService],
    }).compile();

    service = module.get<FeatureService>(FeatureService);
  });

  describe('Core Functionality', () => {
    it('should perform main operation', async () => {
      // Arrange
      const testData = generateTestData();

      // Act
      const result = await service.performOperation(testData);

      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle error conditions', async () => {
      // Arrange
      const invalidData = generateTestData({ invalid: true });

      // Act & Assert
      await expect(
        service.performOperation(invalidData)
      ).rejects.toThrow('ValidationError');
    });
  });
});
```

### Code Review Checklist

- [ ] Tests follow naming conventions
- [ ] Tests use shared utilities where appropriate
- [ ] Tests include proper setup and teardown
- [ ] Tests cover happy path and error cases
- [ ] Tests are isolated and don't depend on each other
- [ ] Tests run in reasonable time (< 30 seconds)
- [ ] Tests include meaningful assertions
- [ ] Test code is readable and well-documented
- [ ] Coverage meets requirements (85%+)
- [ ] No console.log statements in tests

### Submitting Changes

1. Run full test suite locally
2. Ensure all tests pass
3. Check coverage requirements
4. Update documentation if needed
5. Create pull request with test results
6. Address review feedback
7. Merge after approval

## Support

### Getting Help

- **Documentation**: Check this guide first
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub discussions for questions
- **Slack**: Join #testing channel for real-time help

### Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [k6 Documentation](https://k6.io/docs/)
- [Testing Library](https://testing-library.com/docs/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

---

## Conclusion

This comprehensive testing suite provides the foundation for reliable, maintainable, and scalable software development across the unified application ecosystem. Following these guidelines ensures high-quality code and reliable deployments.

Remember: **Well-tested code is maintainable code. Well-tested code is reliable code. Well-tested code is confident code.**