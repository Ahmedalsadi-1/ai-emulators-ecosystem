# Kali Desktop MCP Server

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)

AI-powered Kali Linux desktop control with OmniParser integration, Hawkeye pinpointing, and advanced security testing capabilities through the Model Context Protocol (MCP).

## 🌟 Features

### 🤖 AI-Powered Desktop Control
- **OmniParser Integration**: Advanced UI element detection and understanding
- **Hawkeye Pinpointing**: Precision targeting for UI elements and interactions
- **Intelligent Click**: AI-powered element selection using natural language descriptions
- **Smart Automation**: Context-aware desktop interactions and workflows

### 🔒 Advanced Security Testing
- **Automated Tool Selection**: AI chooses optimal security tools based on targets
- **Comprehensive Scanning**: Network, web, wireless, and forensics analysis
- **Real-time Analysis**: Live security assessment with actionable insights
- **Penetration Testing**: Full Kali Linux toolset integration

### 🖥️ Desktop Environment
- **Docker-based Kali Linux**: Isolated, secure testing environment
- **VNC Remote Access**: Web-based desktop access via noVNC
- **XFCE Desktop**: Lightweight, responsive Linux desktop
- **Multi-tool Integration**: Seamless access to all Kali tools

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ and npm
- At least 4GB RAM available

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/kali-desktop-mcp.git
   cd kali-desktop-mcp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build and run the Kali desktop**
   ```bash
   npm run docker:build
   npm run docker:run
   ```

4. **Start the MCP server**
   ```bash
   npm start
   ```

### Access the Desktop

- **Web Interface**: http://localhost:6080
- **VNC Direct**: localhost:5901 (password: configured in container)

## 📖 MCP Tools

### Visual Desktop Control
- **`kali_screenshot`** - Capture desktop with optional OmniParser analysis
- **`kali_click`** - Click at specific coordinates
- **`kali_click_element`** - AI-powered click using natural language descriptions
- **`kali_hawkeye_pinpoint`** - Hawkeye-style precision targeting and analysis
- **`kali_ai_interact`** - Advanced AI-powered desktop automation

### Input Control
- **`kali_type`** - Type text on desktop
- **`kali_key`** - Press keyboard keys/combinations
- **`kali_drag`** - Drag from one position to another

### Application Management
- **`kali_launch_app`** - Launch applications (firefox, wireshark, xterm, etc.)
- **`kali_execute`** - Execute commands in Kali container

### Security Testing
- **`kali_security_scan`** - AI-powered security scanning with automated tool selection

### System Monitoring
- **`kali_status`** - Check desktop container status

## 🔧 Configuration

### MCP Server Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "kali-desktop": {
      "command": "node",
      "args": ["/path/to/kali-desktop-mcp/kali-mcp-server.js"],
      "env": {
        "DOCKER_CONTAINER": "kali-desktop"
      }
    }
  }
}
```

### Environment Variables

- `DOCKER_CONTAINER`: Name of the Kali Docker container (default: "kali-desktop")
- `VNC_PASSWORD`: VNC server password (default: configured in container)
- `DISPLAY_RESOLUTION`: Desktop resolution (default: 1280x720)

## 🎯 Usage Examples

### Basic Desktop Control

```javascript
// Take a screenshot with AI analysis
await callTool('kali_screenshot', { analyze: true });

// Click on a button using AI
await callTool('kali_click_element', {
  description: "the red submit button"
});

// Launch Firefox and navigate
await callTool('kali_ai_interact', {
  instruction: "open firefox and go to google.com",
  analyze_screen: true
});
```

### Security Testing

```javascript
// Quick network scan
await callTool('kali_security_scan', {
  target: "192.168.1.1",
  scan_type: "quick"
});

// Comprehensive web application test
await callTool('kali_security_scan', {
  target: "http://example.com",
  scan_type: "web",
  tools: ["nikto", "dirb", "sqlmap"]
});

// Wireless network analysis
await callTool('kali_security_scan', {
  target: "wlan0",
  scan_type: "wireless"
});
```

### Hawkeye Pinpointing

```javascript
// Locate and analyze UI elements
await callTool('kali_hawkeye_pinpoint', {
  target: "login button",
  action: "locate"
});

// Highlight security vulnerabilities
await callTool('kali_hawkeye_pinpoint', {
  target: "password field",
  action: "analyze"
});
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   MCP Client    │────│  Kali MCP Server │────│  Docker Container│
│                 │    │                  │    │                 │
│ - Claude Desktop│    │ - AI Controllers │    │ - Kali Linux    │
│ - VS Code       │    │ - Tool Handlers  │    │ - XFCE Desktop  │
│ - Custom Apps   │    │ - VNC Control    │    │ - Security Tools │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │                          │
                              ▼                          ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   AI Models      │    │   VNC/noVNC     │
                       │                  │    │                 │
                       │ - OmniParser     │    │ - Remote Access │
                       │ - Hawkeye        │    │ - Web Interface │
                       │ - NLP Processing │    │ - Real-time     │
                       └──────────────────┘    └─────────────────┘
```

## 🔍 AI Capabilities

### OmniParser Integration
- **Advanced UI Detection**: Identifies buttons, text fields, icons, and interactive elements
- **Layout Analysis**: Understands UI hierarchies and relationships
- **Accessibility Support**: Works with screen readers and accessibility tools

### Hawkeye Pinpointing System
- **Precision Targeting**: Sub-pixel accuracy for UI interactions
- **Context Awareness**: Understands element relationships and states
- **Dynamic Adaptation**: Adjusts to UI changes and animations

### Intelligent Automation
- **Natural Language Processing**: Understands complex instructions
- **Workflow Planning**: Breaks down multi-step tasks automatically
- **Error Recovery**: Handles UI changes and unexpected states

## 🛡️ Security Features

### Container Isolation
- **Docker Security**: Isolated execution environment
- **Network Segmentation**: Controlled access to host network
- **Resource Limits**: Memory and CPU restrictions

### Access Control
- **VNC Authentication**: Password-protected remote access
- **MCP Authorization**: Tool-level permission controls
- **Audit Logging**: Comprehensive activity tracking

### Penetration Testing
- **Ethical Boundaries**: Configurable testing scopes
- **Legal Compliance**: Built-in safety checks
- **Responsible Disclosure**: Automated reporting templates

## 🐛 Troubleshooting

### Common Issues

**VNC Connection Failed**
```bash
# Check container status
docker ps | grep kali-desktop

# Restart container
docker restart kali-desktop

# Check VNC logs
docker logs kali-desktop
```

**MCP Server Not Responding**
```bash
# Verify Node.js installation
node --version

# Check server logs
npm start 2>&1 | tee server.log

# Test MCP connection
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'
```

**AI Features Not Working**
```bash
# Check Docker container resources
docker stats kali-desktop

# Verify Python dependencies
docker exec kali-desktop python3 -c "import cv2, numpy; print('AI deps OK')"

# Test VNC control
docker exec kali-desktop python3 /usr/local/bin/vnc_control.py click 100 100
```

## 📊 Performance

- **Startup Time**: ~30 seconds for full desktop initialization
- **Screenshot Analysis**: <2 seconds with OmniParser
- **AI Interactions**: <5 seconds for complex instructions
- **Memory Usage**: ~2GB baseline + tools as needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Setup

```bash
# Install development dependencies
npm install --save-dev

# Run tests
npm test

# Development mode with auto-restart
npm run dev

# Build Docker image
npm run docker:build
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Kali Linux Team** - For the comprehensive penetration testing platform
- **Model Context Protocol** - For the standardized AI integration framework
- **OmniParser** - For advanced UI understanding capabilities
- **noVNC** - For web-based VNC access

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/kali-desktop-mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/kali-desktop-mcp/discussions)
- **Documentation**: [Wiki](https://github.com/yourusername/kali-desktop-mcp/wiki)

---

**⚠️ Disclaimer**: This tool is for authorized security testing and educational purposes only. Users are responsible for complying with applicable laws and regulations. Always obtain proper authorization before conducting security assessments.