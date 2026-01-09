<div align="center">

<img src="docs/images/bytebot-logo.png" width="500" alt="Bytebot Logo">

# Bytebot: AI Desktop Agent with Multi-Environment Automation

<a href="https://trendshift.io/repositories/14624" target="_blank"><img src="https://trendshift.io/api/badge/repositories/14624" alt="bytebot-ai%2Fbytebot | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>

**AI that controls multiple desktop environments to complete complex tasks autonomously**

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/bytebot?referralCode=L9lKXQ)

[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://github.com/bytebot-ai/bytebot/tree/main/docker)
[![License](https://img.shields.io/badge/license-Apache%202.0-green.svg)](LICENSE)
[![Discord](https://img.shields.io/discord/1232768900274585720?color=7289da&label=discord)](https://discord.com/invite/d9ewZkWPTP)

[🌐 Website](https://bytebot.ai) • [📚 Documentation](https://docs.bytebot.ai) • [💬 Discord](https://discord.com/invite/d9ewZkWPTP) • [𝕏 Twitter](https://x.com/bytebot_ai)

<!-- Keep these links. Translations will automatically update with the README. -->
[Deutsch](https://zdoc.app/de/bytebot-ai/bytebot) |
[Español](https://zdoc.app/es/bytebot-ai/bytebot) |
[français](https://zdoc.app/fr/bytebot-ai/bytebot) |
[日本語](https://zdoc.app/ja/bytebot-ai/bytebot) |
[한국어](https://zdoc.app/ko/bytebot-ai/bytebot) |
[Português](https://zdoc.app/pt/bytebot-ai/bytebot) |
[Русский](https://zdoc.app/ru/bytebot-ai/bytebot) |
[中文](https://zdoc.app/zh/bytebot-ai/bytebot)
</div>

---

## 🎯 What Makes Bytebot Revolutionary

Bytebot is not just another AI assistant—it's an AI that owns and controls **multiple complete desktop environments**. Unlike browser-only agents or traditional RPA tools, Bytebot provides AI with full access to:

 - **Multiple Desktop Environments**: Debian Linux, Kali Linux, custom environments, Android, and UI-TARS browser automation
- **Real Applications**: Browsers, IDEs, office tools, password managers, email clients
- **File System Access**: Download, organize, and process files autonomously
- **Complex Workflows**: Multi-step processes across different applications and websites
- **Visual Automation**: Real-time screen control with mouse and keyboard automation

**Think of Bytebot as a virtual team of AI specialists, each with their own specialized desktop environment.**

---

## 🚀 Live Demo

### Multi-Desktop Task Automation
```
User: "Research cybersecurity tools and create a comparison report"

Bytebot spins up Kali Linux desktop → Opens browser → Researches tools →
Creates comparison document → Downloads relevant PDFs → Organizes findings
```

### Real-World Business Automation
```
User: "Process vendor invoices from three different portals"

Bytebot: Debian Desktop → Portal A (login + download) → Portal B → Portal C →
Extract data from PDFs → Create consolidated report → Email results
```

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Bytebot Ecosystem                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Debian      │ │ Kali Linux  │ │ Custom Env  │  ← Desktops │
│  │ Desktop     │ │ Desktop     │ │ Desktop     │           │
│  │ (Port 9990) │ │ (Port 9993) │ │ (Port 999x) │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ AI Agent    │ │ Web UI      │ │ PostgreSQL  │  ← Services │
│  │ (Port 9991) │ │ (Port 9992) │ │ (Port 5432) │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Docker Network: bytebot-full_bytebot-network       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Services Breakdown

- **AI Agent (NestJS)**: Task orchestration, AI provider integration, WebSocket communication
- **Web UI (Next.js)**: Task management interface, real-time desktop viewing, multi-workspace support
- **Desktop Environments**: Containerized Linux environments with VNC/noVNC for remote access
- **Android Workspace**: Multi-mode Android emulator with ADB control and mobile-mcp tools
- **UI-TARS Workspace**: AI-powered browser automation via WebSocket
- **Database (PostgreSQL)**: Task persistence, user data, configuration storage

---

## ⚡ Quick Start (5 Minutes)

### Option 1: One-Command Docker Setup
```bash
git clone https://github.com/bytebot-ai/bytebot.git
cd bytebot
docker compose -f docker/docker-compose.full.yml up -d
open http://localhost:9992
```

### Option 2: Individual Services (Development)
```bash
# Start all services
cd bytebot/packages/bytebotd && npm run start:dev &
cd ../bytebot-agent && npm run start:dev &
cd ../bytebot-ui && npm run dev &
cd ../../ && npm start &
```

### Option 3: Railway (Cloud)
[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/bytebot?referralCode=L9lKXQ)

---

## 🎮 Using Bytebot

### 1. Access the Interface
Open `http://localhost:9992` in your browser. You'll see the floating pill interface.

### 2. Create Your First Workspace
- Click the "+" button in the Desktop section
- Choose your environment from available workspaces:
  - **KRON-1/2/3**: Virtual Linux desktops (Debian, Kali, custom)
  - **ANDROID**: Android emulator with multi-mode support
  - **UI-TARS**: AI-powered browser automation
- Each workspace connects to a different automation environment

### 3. Give Tasks to Your AI
```
"Download the latest security reports from NIST and create a summary"
"Set up a development environment with Node.js, Python, and VS Code"
"Research competitor pricing and create a comparison spreadsheet"
```

### 4. Watch Real-Time Automation
- See the AI navigate browsers, install software, and complete tasks
- Take control anytime with "Takeover Mode"
- View live screen updates via VNC streaming

---

## 🛠️ Advanced Features

### Multi-Desktop Environments

**Desktop 1 - Bytebot Desktop**: General-purpose Ubuntu environment
- Pre-installed: Firefox, VS Code, LibreOffice, password managers
- Best for: General automation, web tasks, document processing

**Desktop 2 - Debian Desktop**: Clean Debian Linux environment
- Minimal installation with essential tools
- Best for: Development, testing, custom software installation

 **Desktop 3 - Kali Desktop**: Cybersecurity-focused environment
- Pre-installed: Security tools, penetration testing software
- Best for: Security research, network analysis, ethical hacking

**Android Workspace**: Multi-mode Android emulator with ADB control
- Modes: Docker, Android Studio AVD, Physical Device
- Tools: mobile-mcp server with 18 Android control tools
- Best for: Mobile testing, Android app automation, mobile UI research

**UI-TARS Workspace**: AI-powered browser automation
- WebSocket-based remote browser control
- Features: Screenshot streaming, click/scroll/type actions, navigation
- Best for: Web scraping, browser testing, automated browsing tasks

### AI Provider Integration

Bytebot works with all major AI providers:

```bash
# Environment variables for different providers
ANTHROPIC_API_KEY=sk-ant-...     # Claude (Recommended)
OPENAI_API_KEY=sk-...            # GPT models
GEMINI_API_KEY=...               # Google Gemini
GROQ_API_KEY=...                 # Fast inference
```

### Real-Time Collaboration

- **WebSocket Communication**: Live task updates and desktop streaming
- **Multi-User Support**: JWT authentication with RBAC
- **Audit Logging**: Complete action tracking and compliance
- **Takeover Mode**: Human intervention when AI needs help

---

## 📊 API Reference

### REST Endpoints

```bash
# Tasks
POST   /tasks                    # Create new task
GET    /tasks                    # List tasks
GET    /tasks/:id                # Get task details
DELETE /tasks/:id                # Delete task
POST   /tasks/:id/cancel         # Cancel running task

# AI Models
GET    /tasks/models             # List available models

# Desktop Control
POST   /computer-use             # Direct desktop actions
GET    /vnc                       # VNC connection info
```

### WebSocket Events

```javascript
// Connect to task updates
const socket = io('http://localhost:9991/tasks');

// Listen for task progress
socket.on('task:progress', (data) => {
  console.log('Task update:', data);
});

// Send desktop commands
socket.emit('desktop:action', {
  action: 'click_mouse',
  coordinates: [500, 300]
});
```

### Programmatic Usage

```python
import requests

# Create a task
response = requests.post('http://localhost:9991/tasks', json={
    'description': 'Research AI trends and create a report',
    'model': 'claude-3-5-sonnet-20241022'
})

# Upload files
files = {'files': open('data.pdf', 'rb')}
requests.post('http://localhost:9991/tasks',
    data={'description': 'Analyze this document'},
    files=files
)
```

---

## 🔧 Detailed Setup Guide

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for development)
- 4GB+ RAM, 10GB+ disk space

### Production Deployment

1. **Clone and Configure**
```bash
git clone https://github.com/bytebot-ai/bytebot.git
cd bytebot
cp docker/.env.example docker/.env.production
```

2. **Configure Environment**
```bash
# docker/.env.production
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://postgres:password@postgres:5432/bytebotdb
BYTEBOT_AUTH_ENABLED=true
BYTEBOT_AUTH_SECRET=your-secret-key
```

3. **Deploy**
```bash
docker compose -f docker/docker-compose.production.yml --env-file docker/.env.production up -d
```

### Development Setup

1. **Install Dependencies**
```bash
cd bytebot
npm install
cd packages/bytebotd && npm install
cd ../bytebot-agent && npm install
cd ../bytebot-ui && npm install
```

2. **Start Services**
```bash
# Terminal 1: Desktop service
cd packages/bytebotd && npm run start:dev

# Terminal 2: AI Agent
cd packages/bytebot-agent && npm run start:dev

# Terminal 3: Web UI
cd packages/bytebot-ui && npm run dev

# Terminal 4: Electron (optional)
cd ../../ && npm start
```

### Adding Custom Desktops

1. **Create New Dockerfile**
```dockerfile
FROM ghcr.io/bytebot-ai/bytebot-desktop:edge
# Add your customizations
RUN apt-get update && apt-get install -y your-tools
```

2. **Add to docker-compose.full.yml**
```yaml
bytebot-desktop-custom:
  build:
    context: ../packages/
    dockerfile: bytebotd/custom.Dockerfile
  ports:
    - "9994:9990"
```

### Adding Android Emulator

1. **Start Android Emulator**
```bash
# Option 1: Docker-based emulator (Linux KVM)
docker-compose -f docker-compose.android-emulators.yml up -d

# Option 2: Android Studio AVD (recommended for development)
export ANDROID_SDK_ROOT=~/Library/Android/sdk
~/Library/Android/sdk/emulator/emulator -avd Medium_Phone_API_36.1 -no-window &

# Wait for emulator to start
adb devices
```

2. **Start Mobile-MCP Server**
```bash
cd android-emulator/mobile-mcp
npm install
npm start
# Server starts on port 8765
```

3. **Configure Environment Variables**
```bash
# .env.local
NEXT_PUBLIC_ANDROID_DESKTOP_VNC_URL=http://localhost:6083/android-vnc.html
NEXT_PUBLIC_UI_TARS_WS_URL=ws://localhost:8766
```

### Adding UI-TARS Browser

1. **Start UI-TARS Server**
```bash
# Clone and start UI-TARS
git clone https://github.com/UI-TARS/UI-TARS.git
cd UI-TARS
python start_server.py --port 8766
```

2. **Configure WebSocket Proxy**
```bash
# Ensure server.js proxies WebSocket connections
# Already configured in packages/bytebot-ui/server.js
```

---

## 🔍 Troubleshooting

### Common Issues

**"Failed to fetch" Error**
```bash
# Check if services are running
docker ps

# Check service logs
docker logs bytebot-agent
docker logs bytebot-ui

# Verify network connectivity
docker exec bytebot-ui curl -s http://bytebot-agent:9991/tasks/models
```

**VNC Connection Issues**
```bash
# Check desktop containers
docker ps | grep desktop

# Test VNC proxy
curl -I http://localhost:9992/api/proxy/websockify
curl -I http://localhost:9992/api/proxy/kali-websockify
```

**Port Conflicts**
```bash
# Kill conflicting processes
lsof -ti :9990,9991,9992 | xargs kill -9

# Or use different ports in docker-compose
ports:
  - "9995:9990"  # Change host port
```

**Database Connection Issues**
```bash
# Check PostgreSQL
docker logs bytebot-postgres

# Reset database
docker compose down -v
docker compose up -d
```

### Debug Commands

```bash
# View all logs
docker compose -f docker/docker-compose.full.yml logs

# Check container health
docker stats

# Access container shell
docker exec -it bytebot-ui sh
docker exec -it bytebot-agent sh
```

---

## 🧪 Development

### Project Structure
```
bytebot/
├── packages/
│   ├── bytebotd/          # Desktop service (VNC, computer use)
│   ├── bytebot-agent/     # AI orchestration (NestJS)
│   └── bytebot-ui/        # Web interface (Next.js)
├── docker/                # Container configurations
└── docs/                  # Documentation
```

### Key Technologies
- **Backend**: NestJS, TypeScript, Prisma
- **Frontend**: Next.js, React, Tailwind CSS
- **Desktop**: Ubuntu/Debian/Kali, VNC, noVNC
- **AI**: Anthropic Claude, OpenAI, Google Gemini, Groq
- **Database**: PostgreSQL
- **Deployment**: Docker, Docker Compose

### Contributing

1. **Fork and Clone**
```bash
git clone https://github.com/your-username/bytebot.git
cd bytebot
```

2. **Setup Development Environment**
```bash
npm install
cd packages/bytebot-ui && npm install
cd ../bytebot-agent && npm install
cd ../bytebotd && npm install
```

3. **Start Development Services**
```bash
# Use the development docker setup
docker compose -f docker/docker-compose.development.yml up -d
cd packages/bytebot-agent && npm run start:dev &
cd ../bytebot-ui && npm run dev &
```

4. **Run Tests**
```bash
cd packages/bytebot-agent && npm test
cd ../bytebot-ui && npm test
```

### Code Standards
- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with auto-fix
- **Formatting**: Prettier
- **Testing**: Jest for unit tests
- **Commits**: Conventional commits

---

## 🌟 Use Cases & Examples

### Business Automation
- **Invoice Processing**: Download from vendor portals, extract data, create reports
- **Data Synchronization**: Cross-reference systems, update records
- **Compliance Monitoring**: Check multiple platforms, generate audit reports

### Development & Testing
- **Environment Setup**: Install dependencies, configure tools, set up databases
- **UI Testing**: Automated browser testing across different environments
- **Documentation**: Generate screenshots, create setup guides

### Research & Analysis
- **Market Research**: Gather data from multiple sources, create comparisons
- **Security Research**: Use Kali desktop for penetration testing automation
- **Document Analysis**: Process PDFs, extract information, generate summaries

### Creative Tasks
- **Content Creation**: Research topics, gather images, create presentations
- **Data Visualization**: Process datasets, create charts and graphs
- **Report Generation**: Compile information from multiple sources

---

## 📈 Performance & Scaling

### Resource Requirements
- **Minimum**: 4GB RAM, 10GB disk, 2 CPU cores
- **Recommended**: 8GB RAM, 20GB disk, 4 CPU cores
- **Production**: 16GB RAM, 50GB disk, 8 CPU cores

### Scaling Options
- **Horizontal**: Multiple desktop containers for different tasks
- **Vertical**: Larger containers for resource-intensive workloads
- **Kubernetes**: Helm charts for enterprise deployment

---

## 🤝 Community & Support

- **📚 Documentation**: [docs.bytebot.ai](https://docs.bytebot.ai)
- **💬 Discord**: [Join our community](https://discord.com/invite/d9ewZkWPTP)
- **🐛 Issues**: [GitHub Issues](https://github.com/bytebot-ai/bytebot/issues)
- **📰 Blog**: Updates and tutorials on [bytebot.ai/blog](https://bytebot.ai/blog)

### Contributing Guidelines
- Check existing issues before creating new ones
- Use conventional commits for PRs
- Include tests for new features
- Update documentation for API changes

---

## 📄 License

Bytebot is open source under the **Apache 2.0 License**.

---

<div align="center">

**Give your AI multiple computers. Watch what it can accomplish.**

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/bytebot?referralCode=L9lKXQ)

<sub>Built by [Tantl Labs](https://tantl.com) and the open source community</sub>

</div></content>
<parameter name="filePath">bytebot/README.md