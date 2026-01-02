# Unified App End-to-End Test Suite

This comprehensive test suite covers all screen controllers, AI models, and user workflows for the unified AI ecosystem using Playwright.

## Test Structure

### Test Files
- `e2e/screen-controller-navigation.spec.ts` - Navigation between all 5 screen controllers
- `e2e/ai-model-selection.spec.ts` - AI model selection and task creation workflows
- `e2e/websocket-terminal.spec.ts` - WebSocket terminal functionality and real-time features
- `e2e/complete-workflows.spec.ts` - End-to-end user journey tests
- `e2e/error-handling.spec.ts` - Error scenarios and recovery flows
- `e2e/cross-browser.spec.ts` - Cross-browser compatibility testing
- `e2e/visual-regression.spec.ts` - Visual regression testing capabilities
- `e2e/test-reporting.spec.ts` - Test reporting and CI/CD integration
- `e2e/test-utils.ts` - Test utilities, page objects, and fixtures

## Prerequisites

1. **Services Running**: Ensure all backend services are running:
   - Frontend: `http://localhost:9992`
   - Bytebot Agent: `http://localhost:9991`
   - Bytebot Daemon: `http://localhost:9990`
   - AIOS: `http://localhost:8000`
   - Factif: `http://localhost:3001`
   - Turix: `http://localhost:3000`

2. **Dependencies**: Install test dependencies:
   ```bash
   npm install
   npm run playwright:install
   ```

## Running Tests

### Local Development
```bash
# Run all tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (visible browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test e2e/screen-controller-navigation.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### CI/CD Environment
```bash
# Run tests in headless mode with reports
npm run test:e2e

# Generate HTML report
npx playwright show-report
```

## Test Coverage

### Screen Controllers (5 controllers)
- ✅ **AI Automation** - Bytebot UI, AIOS Service, Factif AI
- ✅ **Desktop** - Bytebot VNC Desktop, GBox Sandbox Environment
- ✅ **Automation** - Unified Automation with Turix
- ✅ **Content Creation** - Video Generation, Social Media
- ✅ **Infrastructure** - Monitoring, Docker Management

### AI Models (22+ models tested)
- GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
- Claude-3 Opus, Sonnet, Haiku
- Gemini Pro, Pro Vision
- Llama 2 (70B, 13B), CodeLlama 34B
- Mistral 7B, Mixtral 8x7B
- Phi-2, Orca 2 13B, Vicuna 13B
- Falcon 40B, Stable Diffusion XL, DALL-E 3, Midjourney V5, Flux Dev, Imagen 2

### WebSocket Terminal Features
- ✅ Connection establishment and status monitoring
- ✅ Real-time command execution
- ✅ Command history and tab completion
- ✅ Streaming output handling
- ✅ Error recovery and reconnection
- ✅ File upload/download capabilities
- ✅ Multiple terminal sessions

### User Workflows
- ✅ Data Analysis Pipeline (AIOS → Bytebot → Reporting)
- ✅ Content Creation Workflow (Video Gen → Social Media)
- ✅ Automation Workflows (Cross-environment chaining)
- ✅ Desktop Automation (VNC recording/playback)
- ✅ Cross-Service Communication (Data flow between apps)

### Error Handling
- ✅ Service unavailability scenarios
- ✅ WebSocket connection failures
- ✅ Invalid task inputs and validation
- ✅ AI model loading errors
- ✅ Network timeouts and recovery
- ✅ Authentication failures

### Cross-Browser Support
- ✅ Chromium (Chrome/Edge)
- ✅ Firefox
- ✅ WebKit (Safari)
- ✅ Mobile viewports (iOS/Android)
- ✅ Browser-specific feature detection

### Visual Regression
- ✅ Layout consistency across viewports
- ✅ Component state visualization
- ✅ Interactive element states
- ✅ Content and data visualization
- ✅ Theme and color consistency

## Test Reports and Artifacts

### Generated Files
```
test-results/
├── html-report/          # HTML test report
├── screenshots/          # Failure screenshots
├── videos/              # Failure videos (on failure)
├── junit.xml            # JUnit format for CI
├── results.json         # JSON test results
└── traces/              # Playwright traces
```

### CI/CD Integration
- JUnit XML reports for test result parsing
- HTML reports for detailed analysis
- Screenshots and videos on failures
- JSON results for custom processing
- Configurable retry logic and parallel execution

## Configuration

### Playwright Config (`playwright.config.ts`)
- Base URL: `http://localhost:9992`
- Browsers: Chromium, Firefox, WebKit
- Viewports: Desktop, Tablet, Mobile
- Timeouts: 30s for API calls, 10s for navigation
- Parallel execution with worker management
- Screenshot and video capture on failures

### Environment Variables
```bash
# CI mode detection
CI=true

# Browser configuration
BROWSER=chromium

# Test filtering
TEST_TAG=@smoke

# Report configuration
REPORT_DIR=test-results
```

## Test Utilities

### Page Objects
- `UnifiedAppPage` - Main app navigation and controls
- `AIOSPage` - AIOS service interactions
- `BytebotPage` - Bytebot service interactions

### Test Fixtures
- Sample tasks and workflows
- AI model configurations
- Error scenarios
- Test data factories

### Helper Functions
- WebSocket connection utilities
- Visual regression helpers
- Cross-browser compatibility checks
- Performance monitoring tools

## Best Practices

### Writing Tests
1. Use descriptive test names that explain the user journey
2. Leverage page objects for maintainable selectors
3. Include proper error handling and recovery testing
4. Test both happy path and error scenarios
5. Use data-driven tests for repetitive scenarios

### Debugging Tests
```bash
# Run with debug mode
npx playwright test --debug

# Run with inspector
npx playwright test --headed --timeout=0

# Generate code with codegen
npx playwright codegen http://localhost:9992
```

### Performance Considerations
- Tests run in parallel across browsers
- Shared browser contexts for efficiency
- Selective screenshot capture
- Configurable timeouts based on environment

## Troubleshooting

### Common Issues
1. **Services not running**: Ensure all backend services are started
2. **Port conflicts**: Check that ports 9990-9992, 8000, 3000+ are available
3. **Browser compatibility**: Some features may behave differently across browsers
4. **Network timeouts**: Adjust timeouts for slower environments

### Debug Commands
```bash
# Check service availability
curl http://localhost:9992
curl http://localhost:8000/health

# Run single test with verbose output
npx playwright test e2e/screen-controller-navigation.spec.ts --reporter=line

# Check browser installation
npx playwright install-deps
```

## Contributing

When adding new tests:
1. Follow the existing file structure and naming conventions
2. Add appropriate data-testid attributes to new UI components
3. Include error scenarios and edge cases
4. Update this README with new test coverage
5. Ensure tests run in CI/CD pipeline

## CI/CD Pipeline

### GitHub Actions Example
```yaml
- name: Run E2E Tests
  run: npm run test:e2e
- name: Upload test results
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: test-results/
```

### Parallel Execution
Tests automatically run in parallel across:
- Multiple browser instances
- Different viewport sizes
- Various test scenarios

This ensures comprehensive coverage while maintaining reasonable execution times.