# Kali Desktop MCP Server

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../LICENSE)
[![Node.js](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg)](https://docker.com)
[![MCP](https://img.shields.io/badge/MCP-0.5.0-blue.svg)](https://modelcontextprotocol.io)

A Model Context Protocol (MCP) server that provides visual AI capabilities for security testing through a Kali Linux desktop environment. Enables AI agents to interact with security tools, capture screenshots, simulate user interactions, and analyze visual elements.

## 🚀 Quick Start

### Docker Run (Recommended)

```bash
# Start Kali desktop with MCP server
docker run -d --name kali-desktop \
  -p 5901:5901 -p 6080:6080 \
  --privileged \
  kalilinux/kali-rolling bash -c "
    apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y \
      kali-desktop-xfce tightvncserver novnc websockify \
      firefox-esr nmap sqlmap wireshark metasploit-framework \
      python3-opencv python3-pip && \
    pip3 install --break-system-packages vncdotool pynput && \
    mkdir -p /root/.vnc && \
    echo 'kali' | vncpasswd -f > /root/.vnc/passwd && \
    chmod 600 /root/.vnc/passwd && \
    vncserver :1 -geometry 1920x1080 -depth 24 && \
    /usr/share/novnc/utils/launch.sh --vnc localhost:5901 --listen 6080 &
    tail -f /dev/null"

# Copy control script
docker cp vnc_control.py kali-desktop:/usr/local/bin/vnc_control.py
docker exec kali-desktop chmod +x /usr/local/bin/vnc_control.py

# Access desktop at http://localhost:6080 (password: kali)
```

### Local Installation

```bash
# Install dependencies
npm install @modelcontextprotocol/sdk

# Install system dependencies (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y tightvncserver novnc websockify \
  python3-opencv python3-pip vncdotool scrot

pip3 install pynput

# Set up VNC password
mkdir -p ~/.vnc
echo 'your_password' | vncpasswd -f > ~/.vnc/passwd
chmod 600 ~/.vnc/passwd

# Start VNC server
vncserver :1 -geometry 1920x1080 -depth 24

# Start noVNC
/usr/share/novnc/utils/launch.sh --vnc localhost:5901 --listen 6080 &
```

## 📋 Features

### 🖥️ Desktop Control
- **Screenshot Capture**: High-quality desktop screenshots with optional UI analysis
- **Mouse Control**: Click, drag, and move operations at specific coordinates
- **Keyboard Input**: Type text and send key combinations
- **Window Management**: List and interact with open windows

### 🔍 Visual AI Analysis
- **UI Element Detection**: OpenCV-based element detection and analysis
- **Screen Analysis**: Identify buttons, windows, and interactive elements
- **Visual Feedback**: Base64-encoded images for AI processing
- **Element Interaction**: Click on detected UI elements by description

### 🛡️ Security Tools Integration
- **Pre-installed Tools**: Nmap, SQLMap, Wireshark, Metasploit Framework
- **Firefox Browser**: Web application testing and analysis
- **Terminal Access**: Full shell access to Kali Linux environment
- **Custom Tool Installation**: Easy addition of security tools

### 🤖 MCP Protocol Support
- **Tool Registration**: Automatic registration with MCP registry
- **Stdio Transport**: Standard input/output communication
- **Error Handling**: Comprehensive error reporting and recovery
- **Tool Discovery**: Dynamic tool availability checking

## 🛠️ Available Tools

### kali_screenshot
Take a screenshot of the Kali desktop with optional UI analysis.

**Parameters:**
- `analyze` (boolean, optional): Use OmniParser to analyze UI elements (default: false)

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Screenshot captured successfully"
    },
    {
      "type": "image",
      "data": "base64_encoded_image_data",
      "mimeType": "image/png"
    }
  ]
}
```

### kali_click
Click at specific coordinates on the desktop.

**Parameters:**
- `x` (number): X coordinate
- `y` (number): Y coordinate
- `button` (string, optional): Mouse button ("left", "right", "middle") (default: "left")

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Successfully clicked left button at (500, 300)"
    }
  ]
}
```

### kali_type
Type text on the desktop.

**Parameters:**
- `text` (string): Text to type

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Successfully typed: Hello World"
    }
  ]
}
```

### kali_key
Press keyboard keys or combinations.

**Parameters:**
- `keys` (string): Key combination (e.g., "ctrl+c", "alt+tab", "Return")

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Successfully pressed keys: ctrl+c"
    }
  ]
}
```

### kali_execute
Execute a command in the Kali container.

**Parameters:**
- `command` (string): Shell command to execute

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Command: ls -la\n\nOutput:\ndrwxr-xr-x 1 root root 4096 Jan 1 10:00 .\ndrwxr-xr-x 1 root root 4096 Jan 1 10:00 ..\n-rw-r--r-- 1 root root    0 Jan 1 10:00 file.txt\n"
    }
  ]
}
```

### kali_launch_app
Launch an application on the desktop.

**Parameters:**
- `app` (string): Application command (e.g., "firefox", "wireshark", "xterm")

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Launched application: firefox"
    }
  ]
}
```

### kali_status
Check if Kali desktop is running.

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Kali Desktop is running"
    }
  ]
}
```

## 🔧 Configuration

### Environment Variables

```bash
# VNC Configuration
VNC_DISPLAY=:1
VNC_GEOMETRY=1920x1080
VNC_DEPTH=24
VNC_PASSWORD=kali

# Desktop Environment
DESKTOP_ENVIRONMENT=xfce
DESKTOP_THEME=Kali-Dark

# MCP Configuration
MCP_SERVER_NAME=kali-desktop-mcp
MCP_SERVER_VERSION=1.0.0
MCP_REGISTRY_URL=http://mcp-registry:8002

# Security Settings
ALLOW_ROOT_LOGIN=true
ENABLE_SUDO=true
```

### OpenCode Configuration

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "opencode/big-pickle",
  "mcp": {
    "kali-desktop": {
      "type": "local",
      "command": ["node", "/path/to/kali-mcp-server.js"],
      "enabled": true,
      "env": {
        "VNC_PASSWORD": "kali",
        "DISPLAY": ":1"
      }
    }
  }
}
```

## 🎯 Usage Examples

### Basic Desktop Automation

```javascript
const { MCPClient } = require('@ai-ecosystem/mcp-client');

async function automateSecurityScan() {
    const client = new MCPClient({
        registryURL: 'http://localhost:8002'
    });

    // Connect to Kali desktop
    await client.connect('kali-desktop');

    // Launch Wireshark for network analysis
    await client.callTool('kali_launch_app', { app: 'wireshark' });

    // Wait for application to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Take screenshot to verify
    const screenshot = await client.callTool('kali_screenshot', {
        analyze: true
    });

    console.log('Wireshark launched successfully');
    console.log('UI Analysis:', screenshot.content[1].text);
}
```

### Penetration Testing Workflow

```javascript
async function penetrationTestingWorkflow(targetIP) {
    const client = new MCPClient();

    // Launch terminal
    await client.callTool('kali_launch_app', { app: 'xterm' });

    // Run Nmap scan
    const nmapCommand = `nmap -sV -O ${targetIP}`;
    const nmapResult = await client.callTool('kali_execute', {
        command: nmapCommand
    });

    console.log('Nmap Scan Results:', nmapResult.content[0].text);

    // If web ports found, launch browser
    if (nmapResult.content[0].text.includes('80/tcp') ||
        nmapResult.content[0].text.includes('443/tcp')) {

        await client.callTool('kali_launch_app', { app: 'firefox' });

        // Navigate to web interface (would need more automation here)
        // This demonstrates the capability for web app testing
    }

    // Take final screenshot
    const finalScreenshot = await client.callTool('kali_screenshot', {
        analyze: true
    });

    return {
        scanResults: nmapResult,
        finalState: finalScreenshot
    };
}
```

### AI-Powered Security Analysis

```javascript
async function aiPoweredSecurityAnalysis() {
    const client = new MCPClient();
    const aiClient = new AIClient({ apiKey: 'your-openai-key' });

    // Take screenshot of security tool output
    const screenshot = await client.callTool('kali_screenshot', {
        analyze: true
    });

    // Use AI to analyze the screenshot
    const analysis = await aiClient.analyzeImage(
        screenshot.content[1].data,
        'Analyze this security tool output and identify any vulnerabilities or interesting findings'
    );

    console.log('AI Analysis:', analysis);

    // Take action based on AI recommendations
    if (analysis.includes('vulnerability found')) {
        // Launch additional tools for deeper analysis
        await client.callTool('kali_launch_app', { app: 'metasploit' });
    }

    return analysis;
}
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   MCP Client    │───▶│  Kali MCP Server │───▶│   VNC Control   │
│   (AI Agent)    │    │                  │    │   (Python)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                          │
                                ▼                          ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   Tool Registry  │    │  Kali Desktop   │
                       │   & Discovery    │    │  Environment    │
                       └──────────────────┘    └─────────────────┘
```

### Components

1. **MCP Server** (`kali-mcp-server.js`): Handles MCP protocol communication
2. **VNC Control** (`vnc_control.py`): Python script for desktop automation
3. **Kali Desktop**: XFCE desktop environment with security tools
4. **NoVNC**: Web-based VNC client for browser access

### Security Considerations

- **Container Isolation**: Runs in Docker with privileged access for GUI
- **VNC Encryption**: Password-protected VNC connections
- **Tool Sandboxing**: Commands executed in isolated environment
- **Access Control**: MCP authentication and authorization
- **Audit Logging**: All actions logged for security review

## 🔧 Development

### Local Development Setup

```bash
# Clone repository
git clone https://github.com/ai-ecosystem/future-app.git
cd future-app

# Install dependencies
npm install

# Start development VNC server
vncserver :1 -geometry 1920x1080 -depth 24

# Start noVNC
./noVNC/utils/launch.sh --vnc localhost:5901 --listen 6080 &

# Run MCP server in development mode
npm run dev
```

### Testing

```bash
# Run unit tests
npm test

# Run integration tests (requires running Kali desktop)
npm run test:integration

# Test MCP protocol compliance
npm run test:mcp
```

### Debugging

```bash
# Enable debug logging
DEBUG=kali-mcp:* npm run dev

# Test VNC connection
python3 vnc_control.py test

# Check VNC server status
vncserver -list

# View VNC logs
tail -f ~/.vnc/*.log
```

## 🐛 Troubleshooting

### Common Issues

#### VNC Server Won't Start
```bash
# Kill existing VNC processes
vncserver -kill :1

# Remove lock files
rm -rf /tmp/.X1-lock /tmp/.X11-unix/X1

# Check for port conflicts
netstat -tlnp | grep :5901

# Restart VNC server
vncserver :1 -geometry 1920x1080 -depth 24
```

#### MCP Server Connection Failed
```bash
# Check if MCP server is running
ps aux | grep kali-mcp-server

# Verify port availability
netstat -tlnp | grep :3001

# Test MCP connection
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "initialize", "params": {}}'
```

#### Screenshot Capture Issues
```bash
# Test scrot installation
scrot --version

# Check display variable
echo $DISPLAY

# Test manual screenshot
scrot /tmp/test.png

# Verify VNC control script
python3 vnc_control.py screenshot
```

#### Application Launch Failures
```bash
# Check if application is installed
which firefox

# Verify DISPLAY variable
echo $DISPLAY

# Test manual launch
DISPLAY=:1 firefox &
```

### Performance Optimization

```bash
# Reduce screenshot quality for better performance
# In tool call
await client.callTool('kali_screenshot', {
    quality: 70  // Lower quality for faster capture
});

# Increase VNC color depth for better quality
vncserver :1 -geometry 1920x1080 -depth 32

# Optimize Python script performance
# Use faster screenshot method
import mss  # Alternative to scrot for better performance
```

## 📚 API Reference

### MCP Protocol Implementation

The server implements the full MCP protocol specification:

- **Tool Listing**: `tools/list` - Returns available tools
- **Tool Calling**: `tools/call` - Executes specific tools
- **Error Handling**: Standardized error responses
- **Type Safety**: Full TypeScript definitions

### Tool Schemas

All tools follow JSON Schema specification for input validation:

```typescript
interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}
```

## 🤝 Contributing

### Adding New Tools

1. **Define Tool Schema**:
```javascript
const newTool = {
  name: 'kali_custom_tool',
  description: 'Custom security analysis tool',
  inputSchema: {
    type: 'object',
    properties: {
      target: { type: 'string', description: 'Target to analyze' },
      options: { type: 'object', description: 'Additional options' }
    },
    required: ['target']
  }
};
```

2. **Implement Tool Logic**:
```javascript
async function handleCustomTool(args) {
  const { target, options } = args;

  // Implement tool logic
  const result = await performCustomAnalysis(target, options);

  return {
    content: [{
      type: 'text',
      text: `Analysis complete: ${result.summary}`
    }]
  };
}
```

3. **Register Tool**:
```javascript
// Add to tool list
this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [/* existing tools */, newTool]
}));

// Add handler
this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'kali_custom_tool') {
    return await this.handleCustomTool(args);
  }

  // Handle other tools...
});
```

### Testing Contributions

```bash
# Add unit tests for new tools
describe('KaliCustomTool', () => {
  test('should analyze target successfully', async () => {
    const result = await callTool('kali_custom_tool', {
      target: 'example.com'
    });

    expect(result.content[0].text).toContain('Analysis complete');
  });
});
```

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details.

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io) for the AI agent integration framework
- [Kali Linux](https://www.kali.org) for the comprehensive security testing platform
- [noVNC](https://novnc.com) for web-based VNC access
- [OpenCV](https://opencv.org) for computer vision capabilities

---

**Kali Desktop MCP Server** - AI-powered security testing through visual desktop automation.