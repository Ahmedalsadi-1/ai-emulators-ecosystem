# Unified Visual Automation Interface

A comprehensive visual automation platform that combines Turix GUI visualization, OpenInterface computer control, and Factif visual testing capabilities into a unified workflow-based interface.

## Overview

This interface provides:

- **Visual Workflow Creation**: Drag-and-drop automation workflows with real-time execution
- **Cross-Platform Element Detection**: Unified element detection across desktop and web platforms
- **Automated Interactions**: Execute complex automation sequences across different backends
- **Visual Testing**: Screenshot comparison and visual regression testing
- **LLM Integration**: Natural language automation creation and guidance

## Architecture

### Components

1. **Frontend (React/TypeScript)**
   - Workflow canvas with drag-and-drop interface
   - Screen capture and element inspection
   - Real-time visual feedback
   - Cross-platform automation controls

2. **Backend API (Node.js/TypeScript)**
   - Workflow management and execution
   - Element detection orchestration
   - Action routing across automation backends
   - Visual testing and comparison

3. **Automation Backends**
   - **OpenInterface**: Desktop computer control via pyautogui
   - **Factif AI**: Web automation with OmniParser element detection
   - **Turix Cards**: Modular automation services

### Key Features

#### Visual Workflow Builder
- Drag-and-drop node-based workflow creation
- Real-time execution visualization
- Conditional branching and loops
- Screenshot and assertion nodes

#### Unified Element Detection
- Cross-platform element detection (desktop/web/mobile)
- Real-time screen capture with annotation
- Element property inspection
- Confidence-based detection

#### Automated Interactions
- Platform-agnostic action library
- Parameter validation and type checking
- Error handling and retry logic
- Execution progress tracking

#### Visual Testing Suite
- Baseline screenshot management
- Pixel-perfect visual regression testing
- Difference highlighting and analysis
- Test history and reporting

#### LLM Integration
- Natural language workflow generation
- Context-aware action suggestions
- Error explanation and fixing
- Automated workflow optimization

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.8+ (for OpenInterface)
- Docker (for Factif AI backend)

### Installation

1. Clone the repository:
```bash
cd unified-visual-automation
```

2. Install dependencies:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

3. Configure environment variables:
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your API endpoints
```

4. Start the development servers:
```bash
npm run dev
```

This will start:
- Backend API on http://localhost:3002
- Frontend on http://localhost:3000

## Usage

### Creating Workflows

1. **Select Platform**: Choose desktop, web, or mobile automation
2. **Capture Screen**: Take screenshots and detect UI elements
3. **Build Workflow**: Drag actions onto the canvas and connect them
4. **Configure Actions**: Set parameters for each automation step
5. **Execute**: Run the workflow with real-time progress tracking

### Visual Testing

1. **Capture Baseline**: Take initial screenshots of your application
2. **Run Tests**: Execute workflows that include visual assertions
3. **Compare Results**: View pixel-level differences and test reports
4. **Update Baselines**: Accept new baselines when UI changes are expected

### LLM Assistance

- **Generate Workflows**: Describe what you want to automate in natural language
- **Get Suggestions**: Receive context-aware action recommendations
- **Fix Errors**: Get explanations and fixes for automation failures

## API Reference

### Workflows

- `GET /api/workflows` - List all workflows
- `POST /api/workflows` - Create new workflow
- `GET /api/workflows/:id` - Get workflow details
- `POST /api/workflows/:id/execute` - Execute workflow

### Elements

- `POST /api/elements/detect` - Detect elements in screenshot
- `POST /api/elements/detect-at` - Detect element at coordinates

### Actions

- `GET /api/actions` - Get available actions
- `POST /api/actions/execute` - Execute automation action

### Visual Testing

- `POST /api/visual-tests` - Create visual test
- `POST /api/visual-tests/compare` - Compare screenshots
- `POST /api/visual-tests/baseline` - Update baseline

### LLM Integration

- `POST /api/llm/generate-workflow` - Generate workflow from text
- `POST /api/llm/suggest-actions` - Get action suggestions

## Configuration

### Backend Environment Variables

```env
PORT=3002
OPENINTERFACE_URL=http://localhost:8000
FACTIF_URL=http://localhost:3001
TURIX_URL=http://localhost:4000
```

### Platform-Specific Setup

#### Desktop Automation (OpenInterface)
1. Install Python dependencies
2. Start OpenInterface server
3. Enable screen recording permissions

#### Web Automation (Factif AI)
1. Start Factif AI backend with Docker
2. Configure browser session management
3. Set up OmniParser for element detection

#### Turix Integration
1. Deploy Turix automation cards
2. Configure API authentication
3. Map actions to card services

## Development

### Project Structure

```
unified-visual-automation/
├── shared/
│   └── types/                 # Shared TypeScript types
├── backend/
│   ├── src/
│   │   ├── controllers/       # API route handlers
│   │   ├── services/          # Business logic services
│   │   └── server.ts          # Express server setup
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── hooks/            # Custom React hooks
│   │   └── App.tsx           # Main application
│   └── package.json
└── package.json              # Root package.json
```

### Adding New Actions

1. Define action in `ActionExecutionService`
2. Add parameters and validation
3. Map to appropriate backend executor
4. Update frontend action library

### Extending Platforms

1. Add platform type to shared types
2. Implement element detection in `ElementDetectionService`
3. Add platform-specific actions
4. Update UI platform selector

## Testing

```bash
# Run all tests
npm test

# Run backend tests only
npm run test:backend

# Run frontend tests only
npm run test:frontend
```

## Contributing

1. Follow the existing code style and patterns
2. Add tests for new functionality
3. Update documentation for API changes
4. Ensure cross-platform compatibility

## License

MIT License - see LICENSE file for details

## Related Projects

- [OpenInterface](https://github.com/albsheralsadi/future-app/tree/main/Open-Interface) - Desktop computer control
- [Factif AI](https://github.com/albsheralsadi/future-app/tree/main/factif-ai) - Browser automation with visual testing
- [Turix Automation Cards](https://github.com/albsheralsadi/future-app/tree/main/automation-cards) - Modular automation services