# Open-Interface Integration for Bytebot

This document provides comprehensive documentation for the Open-Interface integration within the Bytebot ecosystem, enabling AI-powered computer control through screenshot-based automation.

## Overview

Open-Interface is a Python-based computer control system that uses GPT-4V and screenshot analysis to perform computer tasks through natural language commands. This integration embeds Open-Interface as an Electron component within Bytebot, providing cross-platform computer automation capabilities.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Bytebot UI    │────│  Electron Main   │────│  Python Server  │
│                 │    │   Process        │    │  (Flask API)    │
│ - React App     │    │                  │    │                 │
│ - Settings UI   │    │ - Process Mgmt   │    │ - Core Logic    │
│ - Action UI     │    │ - IPC Bridge     │    │ - LLM Integration│
└─────────────────┘    │ - Cross-platform │    └─────────────────┘
                       │   Python Mgmt    │
                       └──────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Screen Ctrl   │
                       │   Manager       │
                       │                 │
                       │ - Action Router │
                       │ - Status Mgmt   │
                       └─────────────────┘
```

## Features

- **AI-Powered Automation**: Uses GPT-4V for intelligent computer control
- **Screenshot-Based**: Analyzes screen content for context-aware actions
- **Cross-Platform**: Supports macOS, Linux, and Windows
- **Natural Language**: Accepts human-readable commands
- **Real-time Feedback**: Provides status updates and screenshots
- **Configurable**: Extensive settings for customization
- **Secure**: Isolated Python process with IPC communication

## Quick Start

### Prerequisites

1. **Python 3.8+** installed on your system
2. **Open-Interface** repository cloned at `../Open-Interface`
3. **API Key** for OpenAI or Gemini

### Installation

1. **Install Dependencies**
   ```bash
   # Install Python dependencies
   cd ../Open-Interface
   pip install -r requirements.txt

   # For GPU support (optional)
   pip install -r requirements-cuda.txt
   ```

2. **Configure API Key**
   ```bash
   # Set your API key
   export OPENAI_API_KEY="your-api-key-here"
   ```

3. **Start Bytebot**
   ```bash
   cd bytebot-desktop-container
   npm run dev
   ```

### Basic Usage

1. **Select Controller**: Choose "Open-Interface AI Controller" from the screen controller dropdown
2. **Configure Settings**: Set your API key and preferred model
3. **Execute Commands**: Use natural language to control your computer

Example commands:
- "Move mouse to the center of the screen"
- "Click on the save button"
- "Type 'Hello World' in the text field"
- "Take a screenshot and describe what you see"

## API Reference

### Computer Actions

All standard Bytebot computer actions are supported:

- **Mouse Control**: `move_mouse`, `click_mouse`, `drag_mouse`, `scroll`
- **Keyboard Input**: `type_text`, `type_keys`, `press_keys`
- **Application Control**: `application` (launch common apps)
- **File Operations**: `write_file`, `read_file`
- **System Actions**: `screenshot`, `wait`

### REST API Endpoints

#### Screen Controllers
```
GET  /screen-controllers                    # List all controllers
GET  /screen-controllers/status/:name?     # Get controller status
POST /screen-controllers/activate/:name    # Activate controller
POST /screen-controllers/execute           # Execute computer action
GET  /screen-controllers/screenshot/:ctrl? # Take screenshot
```

#### Open-Interface Specific
```
GET  /screen-controllers/open-interface/status      # Server status
GET  /screen-controllers/open-interface/settings    # Get settings
POST /screen-controllers/open-interface/settings    # Update settings
POST /screen-controllers/open-interface/settings/validate  # Validate settings
POST /screen-controllers/open-interface/settings/reset     # Reset to defaults
GET  /screen-controllers/open-interface/settings/export    # Export settings
POST /screen-controllers/open-interface/settings/import    # Import settings
```

### IPC API (Electron)

```typescript
// Execute computer action
await window.electronAPI.executeComputerAction(action);

// Get screenshot
const screenshot = await window.electronAPI.getScreenshot();

// Manage settings
const settings = await window.electronAPI.getSettings();
await window.electronAPI.updateSettings(newSettings);
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PYTHON_PATH` | Path to Python executable | `python3` |
| `OPEN_INTERFACE_PORT` | Server port | `5001` |
| `OPENAI_API_KEY` | Your API key | - |

### Settings File

Location: `config/open-interface-settings.json`

See [Settings Configuration](./open-interface/README.md) for detailed options.

## Supported Platforms

### macOS
- **Python**: System Python or Homebrew
- **Permissions**: Screen recording permissions required
- **Browsers**: Safari, Chrome, Firefox

### Linux
- **Python**: System Python 3.8+
- **Display**: X11 or Wayland support
- **Dependencies**: `scrot`, `xdotool` for automation

### Windows
- **Python**: Official Python installer
- **Permissions**: Administrator access for some actions
- **Display**: Native Windows automation

## Troubleshooting

### Common Issues

1. **Python Not Found**
   ```
   Error: No suitable Python environment found
   ```
   **Solution**: Install Python 3.8+ and ensure it's in PATH

2. **Missing Dependencies**
   ```
   Error: Missing required packages: flask, pillow
   ```
   **Solution**: Run `pip install -r requirements.txt`

3. **API Key Invalid**
   ```
   Error: Authentication failed
   ```
   **Solution**: Check API key format and validity

4. **Screen Recording Permissions (macOS)**
   ```
   Error: Cannot take screenshot
   ```
   **Solution**: Grant screen recording permissions in System Preferences

### Debug Mode

Enable debug logging by setting `debug_mode: true` in settings.

### Logs

Check logs in:
- **Electron**: Console output
- **Python**: Server logs via IPC
- **Bytebot**: NestJS application logs

## Development

### Project Structure

```
bytebot-desktop-container/packages/
├── bytebotd/src/screen-controllers/
│   ├── open-interface/
│   │   ├── open-interface-screen-controller.service.ts
│   │   ├── open-interface-screen-controller.module.ts
│   │   ├── open-interface-settings.service.ts
│   │   └── README.md
│   ├── cross-platform-python-manager.service.ts
│   ├── screen-controller-manager.service.ts
│   └── screen-controllers.controller.ts
└── bytebot-open-interface-electron/
    ├── src/
    │   ├── main/
    │   │   ├── electronMain.js
    │   │   └── preload.js
    │   └── components/
    │       └── BytebotOpenInterface.tsx
    └── package.json
```

### Building

```bash
# Build Electron component
cd packages/bytebot-open-interface-electron
npm run build

# Build main Bytebot container
cd ../..
npm run build
```

### Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:e2e
```

## Security Considerations

- **API Keys**: Never commit to version control
- **Process Isolation**: Python runs in separate process
- **Input Validation**: All inputs validated before execution
- **File Access**: Restricted to user directories
- **Network**: Localhost-only communication

## Performance

- **Initialization**: ~3-5 seconds for Python environment setup
- **Screenshot**: ~100-500ms depending on screen size
- **Action Execution**: ~200-1000ms depending on complexity
- **Memory Usage**: ~50-200MB for Python process

## Contributing

1. **Code Style**: Follow existing TypeScript/JavaScript patterns
2. **Testing**: Add unit tests for new features
3. **Documentation**: Update this guide for changes
4. **Cross-Platform**: Test on all supported platforms

## License

This integration follows the same license as the Bytebot project.

## Support

For issues specific to Open-Interface integration:
1. Check this documentation
2. Review Open-Interface upstream documentation
3. Check Bytebot logs for errors
4. Create an issue with platform, configuration, and error details

For Open-Interface core issues, refer to: https://github.com/AmberSahdev/Open-Interface