# Unified Testing Framework

Shared testing utilities and frameworks for the unified application ecosystem.

## Overview

This testing framework provides shared utilities, mock services, test data generators, and common testing patterns that can be used across all projects in the unified ecosystem.

## Installation

### TypeScript/JavaScript Projects

```bash
npm install @future-app/testing-shared --save-dev
# or
pnpm add @future-app/testing-shared --save-dev
```

### Python Projects

```bash
pip install future-app-testing-utils
# or
uv pip install future-app-testing-utils
```

## Usage

### TypeScript/JavaScript

```typescript
import {
  mockAuthService,
  generateTestUser,
  createMockRequest,
  createMockResponse,
  createPerformanceTestSuite
} from '@future-app/testing-shared';

// Mock services
const authService = mockAuthService();

// Test data
const user = generateTestUser({ role: 'admin' });

// API testing
const { req, res, next } = createApiTestContext();

// Performance testing
const perfSuite = createPerformanceTestSuite('User Creation', 100);
await perfSuite.run(async () => {
  // Your test function
});
```

### Python

```python
from testing_utils import (
    mock_auth_service,
    generate_test_user,
    create_mock_request,
    create_performance_test_suite
)

# Mock services
auth_service = mock_auth_service()

# Test data
user = generate_test_user(role='admin')

# API testing
request = create_mock_request()

# Performance testing
perf_suite = create_performance_test_suite('User Creation', 100)
await perf_suite.run(async_test_function)
```

## Features

### Mock Services
- Authentication service mocks
- Database service mocks
- WebSocket service mocks
- External API service mocks
- Cross-service communication mocks

### Test Data Generators
- User data generation
- Agent data generation
- Workflow data generation
- Customizable test fixtures

### Testing Helpers
- HTTP request/response mocks
- Authentication middleware mocks
- Database setup/teardown helpers
- WebSocket client/server mocks

### Performance Testing
- Execution time measurement
- Performance test suites
- Benchmarking utilities

### Security Testing
- SQL injection payloads
- XSS attack vectors
- Path traversal tests
- Command injection tests

## Project Structure

```
testing/
├── bin/
│   └── test-runner.js          # Unified test runner
├── shared/
│   ├── typescript/             # TypeScript utilities
│   │   ├── src/
│   │   │   └── index.ts        # Main exports
│   │   ├── package.json        # NPM package config
│   │   └── tsconfig.json       # TypeScript config
│   └── python/                 # Python utilities
│       ├── src/
│       │   └── testing_utils.py # Main utilities
│       └── setup.py            # Python package config
└── README.md                   # This file
```

## Running Tests

### Run All Tests

```bash
# Run tests for all projects
node testing/bin/test-runner.js

# Run specific test types
node testing/bin/test-runner.js --unit
node testing/bin/test-runner.js --integration
node testing/bin/test-runner.js --e2e

# Run tests for specific project
node testing/bin/test-runner.js bytebot
node testing/bin/test-runner.js AIOS --integration
```

### Individual Project Testing

Each project can use its own testing commands:

```bash
# TypeScript projects
npm test
npm run test:integration
npm run test:e2e

# Python projects
python -m pytest tests/
python -m pytest tests/ -m integration
python -m pytest tests/ -m e2e
```

## Contributing

### Adding New Utilities

1. Add utilities to the appropriate language directory
2. Update exports in the main index files
3. Add documentation and examples
4. Update version numbers

### Testing the Utilities

```bash
# TypeScript utilities
cd testing/shared/typescript
npm install
npm test
npm run build

# Python utilities
cd testing/shared/python
pip install -e .
python -m pytest
```

## Best Practices

### Test Organization
- Group related tests in describe blocks (Jest) or classes (pytest)
- Use clear, descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests isolated and independent

### Mock Usage
- Mock external dependencies
- Use realistic test data
- Verify mock interactions when necessary
- Clean up mocks between tests

### Performance Testing
- Run performance tests separately from unit tests
- Use sufficient iterations for statistical significance
- Monitor memory usage for memory leaks
- Compare results against baselines

### Security Testing
- Test authentication and authorization thoroughly
- Validate input sanitization
- Test for common vulnerabilities
- Use parameterized tests for attack vectors

## CI/CD Integration

The testing framework is designed to work with GitHub Actions:

- Parallel test execution across projects
- Coverage reporting and quality gates
- Artifact collection for debugging
- Performance regression detection

See `.github/workflows/comprehensive-testing.yml` for the full CI/CD pipeline.