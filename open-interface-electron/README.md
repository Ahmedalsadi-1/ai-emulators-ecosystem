# Open-Interface Electron Wrapper

Electron application that embeds the Open-Interface Python screen automation tool as a native desktop application.

## Features

- 🚀 Native Electron wrapper for Open-Interface
- 🐍 Automatic Python Flask server management
- ⚛️ React-based UI for natural language commands
- 📡 REST API communication between frontend and Python backend
- 🔧 Settings management and configuration
- 📦 Cross-platform builds (macOS, Windows, Linux)

## Prerequisites

- Node.js 16+
- Python 3.8+
- Open-Interface dependencies (see ../Open-Interface/requirements.txt)

## Installation

1. Install Node.js dependencies:
```bash
npm install
```

2. Install Python dependencies:
```bash
cd ../Open-Interface
pip install -r requirements.txt
```

## Development

1. Start the React development server:
```bash
npm run react-dev
```

2. In another terminal, start the Electron app:
```bash
npm start
```

Or use the combined development command:
```bash
npm run dev
```

## Building

### Development Build
```bash
npm run build
```

### Production Builds
```bash
# All platforms
npm run dist

# Specific platforms
npm run dist:mac
npm run dist:win
npm run dist:linux
```

## Project Structure

```
open-interface-electron/
├── main.js              # Electron main process
├── preload.js           # IPC preload script
├── package.json         # Electron configuration
├── electron-builder.json # Build configuration
├── tsconfig.json        # TypeScript configuration
├── public/
│   └── index.html       # HTML template
└── src/
    ├── App.tsx          # Main React app
    ├── index.tsx        # React entry point
    └── components/
        └── OpenInterface.tsx # Main UI component
```

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Electron App  │    │  Flask API Server│    │   Open-Interface│
│                 │    │                  │    │   Core Engine   │
│  ┌────────────┐ │    │  ┌─────────────┐ │    │                 │
│  │  React UI  │◄┼────┼──►│ REST API    │◄┼────┼──┐             │
│  └────────────┘ │    │  └─────────────┘ │    │  │ Interpreter │
│                 │    │                  │    │  └─────────────┘│
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                       │
         └────────────────────────┴───────────────────────┘
                      IPC & HTTP Communication
```

## Configuration

### Environment Variables

- `OPEN_INTERFACE_PORT`: Port for Flask server (default: 5000)
- `OPEN_INTERFACE_HOST`: Host for Flask server (default: 127.0.0.1)
- `PYTHON_PATH`: Path to Python executable (default: python3)
- `NODE_ENV`: Set to 'development' for dev mode

### Python Server

The Electron app automatically starts a Flask server that exposes Open-Interface functionality via REST API endpoints:

- `GET /health` - Health check
- `POST /execute` - Execute natural language commands
- `POST /stop` - Stop current execution
- `GET /status` - Get current status
- `GET|POST /settings` - Get/update settings
- `GET /screenshot` - Take screenshot

## Integration with Turix

This app is designed to be launched as a service from the Turix Electron app. The communication happens through:

1. Turix launches Open-Interface via `launchService('open-interface')`
2. Open-Interface runs as a separate Electron process
3. Screen control commands are sent via REST API

## Troubleshooting

### Python Server Issues
- Ensure Python 3.8+ is installed
- Check that all dependencies in `requirements.txt` are installed
- Verify that the Open-Interface directory is accessible

### Build Issues
- Ensure all Node.js dependencies are installed
- Check that electron-builder is properly configured
- For production builds, consider using PyInstaller to bundle Python first

### Communication Issues
- Check that the Flask server is running on the expected port
- Verify CORS settings allow communication
- Check browser developer tools for network errors

## Contributing

1. Follow the existing code style and structure
2. Add TypeScript types for new functionality
3. Test both development and production builds
4. Update documentation for new features

## License

See ../Open-Interface/LICENSE.md