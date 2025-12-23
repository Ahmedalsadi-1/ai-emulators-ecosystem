# FactifAIService Integration

The `FactifAIService.ts` module provides integration with the Factif AI test automation service for the TuriX unified app.

## Overview

Factif AI is an AI-powered test automation platform that uses computer vision and natural language processing to automate testing workflows. It supports multiple AI models (Claude, GPT-4o, Gemini) and can control both web browsers and desktop applications.

## Capabilities

- **AI-Powered Testing**: Automated test execution using AI vision and reasoning
- **Visual Testing**: Screenshot capture and visual verification
- **Computer Control**: Mouse clicks, keyboard input, scrolling, and navigation
- **Browser Automation**: Web page navigation and interaction
- **Screen Parsing**: Element detection using OmniParser
- **Test Case Generation**: AI-generated test cases from natural language descriptions
- **UI Validation**: Automated UI validation against requirements

## Supported Commands

- `run test action` - Execute a specific test action
- `take screenshot` - Capture screenshot for visual testing
- `click element` - Click on element at specified coordinates
- `type text` - Type text into focused element
- `press key` - Press a specific keyboard key
- `scroll page` - Scroll page up or down
- `navigate to` - Navigate to a URL
- `verify visual` - Perform visual verification
- `parse screen` - Parse screen elements using OmniParser
- `generate test` - Generate test case from description
- `automate workflow` - Execute multi-step workflow
- `validate ui` - Validate UI against requirements
- `extract elements` - Extract clickable elements from screen

## API Endpoints

The service communicates with Factif AI backend at:
- Base URL: `http://localhost:3001`
- API Base: `http://localhost:3001/api`

## Supported Sources

- `chrome-puppeteer`: Browser automation using Puppeteer
- `ubuntu-docker-vnc`: Desktop control using Docker VNC

## Usage Examples

```typescript
// Initialize the service
FactifAIService.init();

// Take a screenshot
const screenshot = await FactifAIService.takeScreenshot('chrome-puppeteer');

// Click on an element
await FactifAIService.clickElement({ x: 100, y: 200 }, 'chrome-puppeteer');

// Navigate to a URL
await FactifAIService.navigateTo('https://example.com', 'chrome-puppeteer');

// Generate a test case
const testCase = await FactifAIService.generateTestCase(
  'Test user login functionality',
  'chrome-puppeteer'
);

// Automate a workflow
await FactifAIService.automateWorkflow([
  { action: 'navigate', params: { url: 'https://example.com' } },
  { action: 'click', params: { coordinates: { x: 100, y: 200 } } },
  { action: 'type', params: { text: 'username' } }
], 'chrome-puppeteer');
```

## Integration with TuriX

The service integrates with the TuriX unified app through:

1. **Service Registry**: Registered via `TuriX.registerService()`
2. **Command Processing**: Natural language command processing
3. **MCP Compatibility**: Tool invocation for AI agent integration
4. **Status Monitoring**: Health checks and status reporting

## Health Monitoring

The service includes health check functionality:

```typescript
const isHealthy = await FactifAIService.checkHealth();
```

## Error Handling

All methods include comprehensive error handling and return structured responses with success status, data, and descriptive messages.