# Multi-App Screen Control System - Test Suite Documentation

## Overview

This document provides comprehensive testing documentation for the multi-app screen control system, covering E2E tests, integration tests, unit tests, and manual testing procedures specifically for the screen control functionality.

## Test Architecture

### Test Types Implemented

1. **E2E Tests (Playwright)**: Full user journey tests from UI to backend to database
2. **Integration Tests (Jest)**: API endpoints, WebSocket communication, database operations
3. **Unit Tests (Jest + React Testing Library)**: Individual component and service testing

### Test Coverage Areas

- ✅ Screen selection and switching
- ✅ Task creation and management
- ✅ Model selection and configuration
- ✅ WebSocket real-time streaming
- ✅ Backend API endpoints
- ✅ Database operations
- ✅ UI component interactions

## Test File Structure

```
unified-app/
├── e2e/                          # E2E tests
│   ├── screen-control.spec.ts    # Screen switching tests
│   ├── task-management.spec.ts   # Task CRUD tests
│   └── websocket-streaming.spec.ts # Real-time tests
├── src/
│   ├── components/__tests__/     # Component unit tests
│   │   └── ui-components.spec.tsx
│   ├── services/__tests__/       # Service integration tests
│   │   ├── integration.spec.ts
│   │   └── websocket.spec.ts
│   ├── test/                     # Test utilities
│   │   ├── setup.ts              # Jest setup
│   │   ├── test-utils.ts         # Test helpers
│   │   ├── test-database.ts      # Test DB utilities
│   │   └── e2e-utils.ts          # E2E helpers

bytebot-desktop-container/packages/bytebotd/
├── test/                         # Backend tests
│   ├── jest-e2e.json            # E2E config
│   ├── test-database-manager.ts # DB test utilities
│   └── task-api.spec.ts         # API tests
```

## Test Setup Instructions

### Prerequisites

```bash
# Node.js 18+ and pnpm
npm install -g pnpm

# Install dependencies
cd unified-app
pnpm install

# Install Playwright browsers
pnpm playwright:install
```

### Configuration Files

#### Jest Configuration (unified-app/jest.config.js)

```javascript
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx)',
    '<rootDir>/src/**/*.(test|spec).(ts|tsx)',
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.(ts|tsx)',
    '!src/**/*.d.ts',
    '!src/main.tsx',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};
```

#### Playwright Configuration (unified-app/playwright.config.ts)

```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Running Tests

### Quick Start Commands

```bash
# Run all screen control tests
cd unified-app
pnpm test

# Run specific test types
pnpm test:e2e         # E2E tests only
pnpm test -- --testPathPattern=integration  # Integration tests only
pnpm test -- --testPathPattern=ui-components  # Component tests only

# Run with coverage
pnpm test:coverage

# Run E2E tests in different browsers
pnpm test:e2e -- --project=chromium
pnpm test:e2e -- --project=firefox
```

### Detailed Test Execution

#### E2E Tests

```bash
# Full E2E test suite
pnpm test:e2e

# Specific E2E test files
pnpm test:e2e -- --grep "screen control"
pnpm test:e2e -- --grep "websocket"

# E2E with debugging
pnpm test:e2e:ui  # Visual debugging
pnpm test:e2e -- --headed --debug  # Step-by-step debugging

# E2E with video recording
RECORD_VIDEO=1 pnpm test:e2e
```

#### Integration Tests

```bash
# Run all integration tests
pnpm test -- --testPathPattern="integration\|websocket"

# Run specific integration areas
pnpm test -- --testPathPattern=database  # Database tests only
pnpm test -- --testPathPattern=websocket # WebSocket tests only
```

#### Unit Tests

```bash
# Component unit tests
pnpm test -- --testPathPattern=ui-components

# Run specific component tests
pnpm test -- --testNamePattern="ScreenSelector"
pnpm test -- --testNamePattern="TaskInput"
```

#### Backend Tests

```bash
# Backend API tests
cd bytebot-desktop-container/packages/bytebotd
npm run test:e2e

# Backend unit tests
npm run test
```

## Test Coverage Reports

### Coverage Areas Breakdown

#### Frontend Coverage (unified-app)
- **Screen Control Components**: Screen selector, screen switching logic
- **Task Management**: Task creation, status updates, model selection
- **WebSocket Integration**: Real-time message handling, streaming
- **Services**: API calls, state management, error handling

#### Backend Coverage (bytebot-desktop-container)
- **API Endpoints**: Task CRUD operations, model management
- **WebSocket Handling**: Connection management, message routing
- **Database Operations**: Data persistence, queries, transactions

#### E2E Coverage
- **User Journeys**: Complete task creation to completion flows
- **Screen Navigation**: Switching between all screen types
- **Real-time Features**: WebSocket streaming and updates
- **Error Scenarios**: Network failures, invalid inputs

### Coverage Thresholds

```json
{
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements: 80
    },
    "./src/components/": {
      "branches": 85,
      "functions": 85,
      "lines": 85,
      "statements": 85
    }
  }
}
```

## Manual Testing Checklists

### Critical User Journeys

#### 1. Screen Navigation Flow
- [ ] Load unified app successfully
- [ ] Verify all screen selector buttons are visible
- [ ] Click each screen selector (Desktop, Code, Agent, Web, Settings)
- [ ] Verify correct screen loads for each selection
- [ ] Verify screen content displays properly
- [ ] Test keyboard navigation (Tab, Enter, arrow keys)
- [ ] Verify screen state persists on refresh

#### 2. Task Creation and Management
- [ ] Navigate to Desktop screen
- [ ] Enter task description in input field
- [ ] Select different AI models from dropdown
- [ ] Click "Create Task" button
- [ ] Verify task appears in task list with correct model
- [ ] Verify task status updates (pending → running → completed)
- [ ] Test task editing functionality
- [ ] Test task deletion with confirmation

#### 3. WebSocket Real-time Features
- [ ] Create a task and monitor WebSocket connection
- [ ] Verify real-time status updates appear
- [ ] Switch to Code screen during task execution
- [ ] Verify code streams in real-time to code editor
- [ ] Switch to Agent screen
- [ ] Verify agent responses stream in real-time
- [ ] Test WebSocket reconnection after disconnect

#### 4. Model Selection and Persistence
- [ ] Select different models (GPT-4, Claude 3, Gemini)
- [ ] Create tasks with each model
- [ ] Verify model selection persists across screen changes
- [ ] Verify model-specific features work correctly
- [ ] Test invalid model selection handling

### Error Scenarios

#### 1. Network Connectivity Issues
- [ ] Disconnect internet during task creation
- [ ] Verify appropriate error messages display
- [ ] Test offline task queuing (if implemented)
- [ ] Verify reconnection handling and data sync

#### 2. Invalid Input Handling
- [ ] Try creating task with empty description
- [ ] Try extremely long task descriptions (10,000+ characters)
- [ ] Try selecting non-existent models
- [ ] Verify validation messages appear
- [ ] Test XSS prevention in task descriptions

#### 3. WebSocket Connection Issues
- [ ] Force WebSocket disconnection during streaming
- [ ] Verify connection retry logic
- [ ] Test message buffering during disconnection
- [ ] Verify data consistency after reconnection

#### 4. Concurrent Operations
- [ ] Open multiple browser tabs with the app
- [ ] Create tasks simultaneously in different tabs
- [ ] Verify no data corruption or conflicts
- [ ] Test screen switching during active operations

### Performance Testing

#### 1. Load Testing
- [ ] Create 50+ concurrent tasks
- [ ] Monitor WebSocket message throughput
- [ ] Check UI responsiveness under load
- [ ] Verify memory usage stays within limits

#### 2. Large Data Handling
- [ ] Create tasks with very large descriptions
- [ ] Test uploading large files with tasks
- [ ] Verify streaming handles large responses
- [ ] Check database performance with many tasks

#### 3. Browser Performance
- [ ] Test in Chrome, Firefox, Safari, Edge
- [ ] Verify performance on different screen sizes
- [ ] Test with 100+ tasks in list
- [ ] Check memory usage with long-running tasks

### Accessibility Testing

#### 1. Keyboard Navigation
- [ ] Navigate all screens using Tab key only
- [ ] Activate buttons with Enter/Space keys
- [ ] Test keyboard shortcuts for common actions
- [ ] Verify focus indicators are visible

#### 2. Screen Reader Support
- [ ] Enable screen reader (NVDA, JAWS, VoiceOver)
- [ ] Navigate through all interfaces
- [ ] Verify ARIA labels and roles
- [ ] Test dynamic content announcements

#### 3. High Contrast and Zoom
- [ ] Test with high contrast mode enabled
- [ ] Verify text readability at 200% zoom
- [ ] Check color-coded elements have text alternatives
- [ ] Test with increased font sizes

## Troubleshooting Common Issues

### E2E Test Failures

```bash
# Check if dev server is running
curl http://localhost:3000

# Clear browser cache and reinstall Playwright
pnpm playwright:install --force

# Run tests with extended timeout
TIMEOUT=60000 pnpm test:e2e

# Debug specific test
pnpm test:e2e -- --grep "failing test name" --debug
```

### WebSocket Test Issues

```bash
# Verify backend WebSocket server
curl http://localhost:9990/health

# Check browser WebSocket connection
# Open browser dev tools → Network → WS tab

# Test WebSocket manually
# Use a WebSocket client to connect to ws://localhost:8080
```

### Component Test Issues

```bash
# Check React Testing Library setup
pnpm test -- --testPathPattern=ui-components --verbose

# Debug component rendering
# Add console.log statements in test setup

# Check for missing test IDs
# Search for data-testid attributes in components
```

### Database Test Issues

```bash
# Reset test database
cd unified-app
pnpm test:db:reset

# Check database connection
pnpm test:db:health

# View test database logs
docker logs test-postgres
```

## Test Data Management

### Test Fixtures

The test suite uses predefined fixtures for consistent testing:

```typescript
// Available in src/test/test-utils.ts
export const TestFixtures = {
  tasks: [
    { id: 'task-1', description: 'Analyze sales data', status: 'pending', modelId: 'gpt-4' },
    { id: 'task-2', description: 'Generate report', status: 'completed', modelId: 'claude-3' },
  ],
  models: [
    { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI' },
    { id: 'claude-3', name: 'Claude 3', provider: 'Anthropic' },
    { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google' },
  ],
};
```

### Custom Test Data Generation

```typescript
import { TestUtils } from '../src/test/test-utils';

// Generate custom test data
const customTask = TestUtils.createMockTask('custom-task', 'Custom test task');
const customMessage = TestUtils.createMockMessage('task-1', 'Custom message content');
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Screen Control Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm playwright:install
      - run: pnpm test:coverage
      - run: pnpm test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: unified-app/test-results/
```

### Quality Gates

- **Test Success Rate**: 95%+ of tests must pass
- **Coverage**: 80%+ overall coverage required
- **Performance**: No performance regression >10%
- **Accessibility**: WCAG 2.1 AA compliance

## Contributing to Tests

### Adding New E2E Tests

1. Create test file in `unified-app/e2e/` directory
2. Follow naming pattern: `*.spec.ts`
3. Use `data-testid` attributes for element selection
4. Include proper error handling and timeouts
5. Add test to this documentation

### Adding New Component Tests

1. Create test file in `src/components/__tests__/` directory
2. Use React Testing Library patterns
3. Mock external dependencies appropriately
4. Test user interactions, not implementation details
5. Include accessibility testing

### Test Best Practices

```typescript
// ✅ Good: Descriptive test names
it('should create task and display in list when form is submitted', async () => {
  // Test implementation
});

// ✅ Good: Use data-testid for reliable element selection
await page.click('[data-testid="create-task-btn"]');

// ✅ Good: Proper async handling
await waitFor(() => {
  expect(screen.getByTestId('task-list')).toContainText('New Task');
});

// ❌ Bad: Brittle CSS selector
await page.click('.btn-primary');

// ❌ Bad: No timeout handling
expect(page.locator('.loading')).not.toBeVisible();
```

## Performance Benchmarks

### Target Metrics

- **E2E Test Execution**: < 5 minutes for full suite
- **Component Tests**: < 2 minutes for all components
- **Integration Tests**: < 3 minutes for all APIs
- **WebSocket Latency**: < 100ms for message delivery
- **UI Responsiveness**: < 100ms for user interactions

### Monitoring Performance

```bash
# Run performance tests
pnpm test:performance

# Generate performance report
pnpm test:performance:report

# Compare against baselines
pnpm test:performance:compare
```

## Support and Resources

### Getting Help

1. **Check this documentation** first
2. **Review test error logs** for specific error messages
3. **Check GitHub Issues** for similar problems
4. **Create detailed bug reports** with reproduction steps

### Key Files and Directories

- `unified-app/e2e/`: E2E test specifications
- `unified-app/src/test/`: Test utilities and helpers
- `unified-app/playwright.config.ts`: E2E test configuration
- `unified-app/jest.config.js`: Unit/integration test configuration

### External Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)

---

This test suite ensures the multi-app screen control system provides a reliable, performant, and accessible user experience across all supported platforms and browsers.