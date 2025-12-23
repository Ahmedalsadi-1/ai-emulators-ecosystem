# Turix-Style Automation Cards

This directory contains production-ready automation services designed in the style of the Sora video generation service. Each automation card provides comprehensive automation capabilities for specific platforms and use cases.

## Available Automation Cards

### 1. Bytebot Computer Automation (`puter-bytebot-automation`)
**Purpose**: Screen control, mouse/keyboard input, application management, and file operations
**Platforms**: Linux, Windows, macOS
**Capabilities**:
- Mouse control (move, click, drag, scroll)
- Keyboard input (type text, press keys)
- Screenshot capture
- Application launching and management
- File operations (read/write)
- Screen control automation

### 2. Open-Interface Automation (`puter-openinterface-automation`)
**Purpose**: LLM-driven computer control with natural language instructions
**Platforms**: Cross-platform
**Capabilities**:
- Natural language to automation translation
- Screen control via pyautogui
- Web automation workflows
- Desktop task automation
- AI-powered error recovery

### 3. macOS Use Automation (`puter-macosuse-automation`)
**Purpose**: macOS-specific automation using accessibility APIs
**Platforms**: macOS
**Capabilities**:
- Accessibility API interactions
- UI element manipulation
- Application control
- Element tree traversal
- macOS-specific actions

### 4. Factif AI Browser Automation (`puter-factifai-automation`)
**Purpose**: Advanced browser automation with visual testing
**Platforms**: Cross-platform (Browser-based)
**Capabilities**:
- Browser session management
- Web page interactions
- Visual regression testing
- Scenario-based automation
- Screenshot comparison

### 5. Kali Desktop Security Automation (`puter-kalidesktop-automation`)
**Purpose**: Security testing and penetration testing automation
**Platforms**: Linux (Kali)
**Capabilities**:
- Security scanning (nmap, nikto)
- Penetration testing
- Command execution
- Vulnerability analysis
- Security report generation

## Architecture

Each automation card follows the same architectural pattern:

### Core Components
- **Parameter Validation**: Strict input validation with detailed error messages
- **Resource Management**: Usage estimation and metering
- **Retry Logic**: Exponential backoff for transient failures
- **Error Handling**: Comprehensive error recovery and reporting
- **Result Aggregation**: Structured output with timing and status information

### Key Features
- **Timeout Management**: Configurable timeouts with graceful degradation
- **Usage Metering**: Credits-based resource tracking
- **Test Mode**: Safe testing without actual execution
- **Progress Tracking**: Real-time status updates
- **Screenshot Integration**: Visual feedback for debugging

## Usage Examples

### Bytebot Screen Control
```javascript
const result = await bytebotService.automate({
  type: 'screen-control',
  actions: [
    { action: 'move_mouse', coordinates: { x: 100, y: 200 } },
    { action: 'click_mouse', button: 'left', clickCount: 1 },
    { action: 'type_text', text: 'Hello World' }
  ],
  target: { endpoint: 'http://localhost:4000', apiKey: 'key' }
});
```

### Open-Interface LLM Automation
```javascript
const result = await openInterfaceService.automate({
  type: 'web-automation',
  objective: 'Fill out the contact form on example.com',
  context: { url: 'https://example.com/contact' }
});
```

### Factif AI Browser Testing
```javascript
const result = await factifAIService.automate({
  type: 'visual-testing',
  scenario: {
    name: 'Login Flow Test',
    steps: [
      { type: 'navigate', url: 'https://app.com/login' },
      { type: 'type', selector: '#email', text: 'user@example.com' },
      { type: 'click', selector: '#login-button' }
    ]
  }
});
```

### Kali Desktop Security Scan
```javascript
const result = await kaliService.automate({
  type: 'security-scan',
  commands: [
    { tool: 'nmap', args: ['-sV', '-p', '1-1000', 'target.com'] },
    { tool: 'nikto', args: ['-h', 'https://target.com'] }
  ]
});
```

## Error Handling

All cards implement comprehensive error handling:

- **Timeout Errors**: Operations exceeding time limits
- **Network Errors**: API communication failures
- **Validation Errors**: Invalid parameters or configurations
- **Execution Errors**: Platform-specific failures
- **Resource Errors**: Insufficient credits or system resources

## Security Considerations

- **Input Sanitization**: All inputs are validated and sanitized
- **Rate Limiting**: Built-in usage controls prevent abuse
- **Audit Logging**: All operations are logged for security review
- **Access Control**: API key-based authentication
- **Error Masking**: Sensitive information is not exposed in error messages

## Integration

These automation cards integrate with the existing Puter ecosystem:

- **Metering Service**: Resource usage tracking
- **Context Service**: User session management
- **Logger Service**: Structured logging
- **API Error Handling**: Consistent error responses

## Development Notes

- All cards follow the same interface pattern for consistency
- Modular design allows for easy extension and maintenance
- Comprehensive test coverage ensures reliability
- Performance optimized for production workloads