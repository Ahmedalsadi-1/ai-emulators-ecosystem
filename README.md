<div align="center">

# 🌐 KRONOS-OS

**The Ultimate AI-Powered Desktop Automation Platform - Coming Soon: Closed Source Enterprise Edition**

![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Docker](https://img.shields.io/badge/docker-ready-green.svg)](https://github.com/Ahmedalsadi-1/ai-emulators-ecosystem)
![TypeScript](https://img.shields.io/badge/typescript-5.0+-blue.svg)](https://typescriptlang.org)

**🚀 Next-Generation AI Desktop Control for Enterprise & Power Users**

</div>

---

## 🎯 Why KRONOS-OS?

**KRONOS-OS** is a revolutionary AI-powered desktop automation platform that gives your AI agents complete control over **multiple isolated workspaces** - from virtual Linux desktops to Android emulators and browser automation.

### 💎 The KRONOS-OS Advantage

| Feature | Traditional Tools | KRONOS-OS |
|----------|------------------|--------------|
| **Multi-Workspace Control** | ❌ Single environment | ✅ 5+ isolated workspaces |
| **Mobile Integration** | ❌ Limited/None | ✅ Full Android emulator with ADB control |
| **Browser Automation** | ⚠️ Browser plugins | ✅ UI-TARS AI-powered browser with full control |
| **Real Desktops** | ❌ Headless/Container only | ✅ VNC/noVNC with full GUI access |
| **Agent Orchestration** | ⚠️ Basic task queues | ✅ Multi-provider fallback (Routeway → Groq → OpenAI) |
| **Tool-Use Enforcement** | ❌ Open access | ✅ Session-based security model |
| **Real-Time Collaboration** | ⚠️ Limited | ✅ WebSocket streaming + multi-user support |

### 🎯 Perfect For

- **Enterprise Automation**: Automate repetitive workflows across multiple environments
- **Security Research**: Use Kali Linux desktop for penetration testing
- **Mobile Testing**: Full Android emulator control with 18 MCP tools
- **Web Scraping**: AI-powered browser automation with UI-TARS
- **Development Testing**: Spin up isolated test environments on demand
- **Data Processing**: Multi-step workflows across browsers, files, and terminals

### 🔮 Future-Proof: Enterprise Edition Coming

> **⚠️ Important**: KRONOS-OS Open Source version is available now. An **Enterprise Edition with advanced features and closed-source core** will be released in Q2 2025.

**Enterprise Edition will include:**
- 🔒 Closed-source security enhancements
- 🎯 Priority support SLAs
- 📊 Advanced analytics dashboard
- 🔐 Enterprise-grade authentication (SSO, MFA)
- 🏢 Multi-tenant architecture
- 🚀 Optimized performance profiles

**Get Early Access**: Join our waitlist at [kronos-os.com](https://kronos-os.com) for Enterprise Edition announcements.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    KRONOS-OS Platform                      │
├─────────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              KRONOS-OS UI (Next.js)         │   │
│  │              localhost:9992                       │   │
│  └────────────────────┬──────────────────────────────┘   │
│                         │                                  │
│                         ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           KRONOS-OS Agent (NestJS)          │   │
│  │           localhost:9991                        │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │  Task Orchestration & Model Routing     │   │   │
│  │  │  • Routeway → Groq → OpenAI       │   │   │
│  │  │  • Tool-Use Enforcement              │   │   │
│  │  │  • Multi-Provider Support           │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                  │
│                         ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Virtual Desktop Containers            │   │
│  │                                                     │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │   │
│  │  │ KRON-1   │ │ KRON-2   │ │ KRON-3   │ │ANDROID    │ │   │
│  │  │ :9990    │ │ :9995    │ │ :9993    │ │emulator  │ │   │
│  │  │ Ubuntu   │ │ Debian   │ │ Kali     │ │ :5555    │ │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ │   │
│  │  ┌─────────┐                                  │   │
│  │  │UI-TARS  │                                  │   │
│  │  │ :8766   │                                  │   │
│  │  │Browser   │                                  │   │
│  │  └─────────┘                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Infrastructure Services               │   │
│  │  • OS-AI Backend (:8765) - Local screen   │   │
│  │  • PostgreSQL (:5432) - Task storage    │   │
│  │  • Redis (:6379) - Caching & streams    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Quick Start

### Prerequisites

- **Node.js 18+** with npm or pnpm
- **Docker & Docker Compose**
- **4GB RAM** minimum (8GB+ recommended)
- **10GB** free disk space

### Installation

```bash
# Clone repository
git clone https://github.com/Ahmedalsadi-1/ai-emulators-ecosystem.git
cd ai-emulators-ecosystem

# Start platform
docker compose -f docker-compose.ecosystem.yml up -d

# Start development services
cd bytebot/packages/bytebot-agent && npm run start:dev &
cd ../bytebot-ui && npm run dev &
```

### Access KRONOS-OS

| Service | URL | Description |
|---------|-----|-------------|
| **KRONOS-OS UI** | http://localhost:9992 | Main interface |
| **Agent API** | http://localhost:9991/api/tasks | Task management |
| **KRON-1 Desktop** | VNC on :9990 | Ubuntu workspace |
| **KRON-2 Desktop** | VNC on :9995 | Debian workspace |
| **KRON-3 Desktop** | Kali Linux on :9993 | Security testing |
| **Android Workspace** | ADB on :5555 | Mobile automation |
| **UI-TARS Browser** | WebSocket :8766 | AI browser control |
| **OS-AI Panel** | Built into /desktop | Local screen capture |

---

## 🎮 Using KRONOS-OS

### 1. Access the Interface

Open `http://localhost:9992` in your browser. You'll see the modern floating pill interface.

### 2. Choose Your Workspace

Click the "+" button in the Desktop section and select from **5 available workspaces**:

| Workspace | Use Case | Environment |
|-----------|----------|-------------|
| **KRON-1** | General automation, development, web tasks | Ubuntu Desktop (:9990) |
| **KRON-2** | Testing, custom environments | Debian Desktop (:9995) |
| **KRON-3** | Security research, penetration testing | Kali Linux (:9993) |
| **ANDROID** | Mobile testing, app automation, mobile UI research | Android Emulator (:5555) |
| **UI-TARS** | Web scraping, browser testing, automated browsing | AI Browser (:8766) |

### 3. Give Your AI Agent Tasks

```
"Download the latest 20 cybersecurity reports, extract key findings, and create a comprehensive comparison spreadsheet"
"Set up a complete Node.js development environment with VS Code, dependencies, and testing framework"
"Research competitor pricing across 5 websites and generate a detailed market analysis report"
"Test the Android app APK on emulator, capture screenshots of 20 critical flows, and document any UI issues"
```

### 4. Watch Real-Time Automation

- See your AI navigate browsers, install software, and complete tasks
- Take control anytime with "Takeover Mode"
- View live screen updates via VNC streaming
- Monitor task progress in real-time dashboard

---

## 🛠️ Workspace Deep-Dive

### KRON-1 (Ubuntu Desktop)

**Perfect for**: General-purpose automation, web browsing, document processing

- **Pre-installed**: Firefox, VS Code, LibreOffice, password managers
- **Access**: Full GUI via VNC at localhost:9990
- **Use cases**: Workflow automation, document generation, research tasks

### KRON-2 (Debian Desktop)

**Perfect for**: Development, testing, custom software installation

- **Minimal**: Clean Debian installation with essential tools
- **Access**: Full GUI via VNC at localhost:9995
- **Use cases**: Dev environment testing, package validation, CI/CD testing

### KRON-3 (Kali Desktop)

**Perfect for**: Security research, network analysis, ethical hacking

- **Pre-installed**: Security tools, penetration testing software
- **Access**: Full GUI via VNC at localhost:9993
- **Use cases**: Security testing, vulnerability scanning, tool validation

### ANDROID Workspace

**Perfect for**: Mobile testing, Android app automation, mobile UI research

**3 Connection Modes**:
1. **Docker**: `localhost:5555` - Linux KVM-based emulator
2. **Android Studio AVD**: `emulator-5554` - Development-friendly (recommended)
3. **Physical Device**: `IP:5555` - Real device via WiFi ADB

**Mobile-MCP Tools (18 total)**:
- `device_screenshot`, `tap`, `input_text`, `swipe`, `home_button`, `back_button`
- `scroll`, `open_app`, `close_app`, `list_apps`, `install_apk`, `uninstall_app`
- `clear_cache`, `get_device_info`, `logcat`, `shell_command`, `file_operations`

### UI-TARS Browser

**Perfect for**: Web scraping, browser testing, automated browsing

- **Control**: AI-powered browser via WebSocket at `ws://localhost:8766`
- **Features**: Screenshot streaming, click/scroll/type actions, URL navigation
- **Best for**: Dynamic web pages, complex form filling, data extraction

---

## 🤖 AI Provider Integration

KRONOS-OS works with all major AI providers:

```bash
# Environment variables for different providers
ANTHROPIC_API_KEY=sk-ant-...     # Claude (Recommended)
OPENAI_API_KEY=sk-...            # GPT models
GEMINI_API_KEY=...               # Google Gemini
GROQ_API_KEY=...                 # Fast inference
ROUTEWAY_API_KEY=...              # Primary provider with deepseek-v3.2
```

### Model Fallback Chain

```
Requested Model
     │
     ├── ✅ Success → Use response
     │
     └── ❌ Error (422/429/5xx/timeout)
              │
              ▼
     Routeway (deepseek-v3.2)
              │
              ├── ✅ Success → Use response
              │
              └── ❌ Error
                       │
                       ▼
              Groq (llama-3.3-70b-versatile)
                       │
              ├── ✅ Success → Use response
              │
              └── ❌ Error
                       │
                       ▼
              OpenAI (GPT-4o)
                       │
              [Continue to next provider...]
```

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

## 🔧 Setup Guide

### Production Deployment

1. **Clone and Configure**
```bash
git clone https://github.com/Ahmedalsadi-1/ai-emulators-ecosystem.git
cd ai-emulators-ecosystem
cp docker/.env.example docker/.env.production
```

2. **Configure Environment**
```bash
# docker/.env.production
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://postgres:password@postgres:5432/kronosdb
BYTEBOT_AUTH_ENABLED=true
BYTEBOT_AUTH_SECRET=your-secret-key
```

3. **Deploy**
```bash
docker compose -f docker-compose.ecosystem.yml --env-file docker/.env.production up -d
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

**Android Emulator Not Connecting**
```bash
# Check ADB devices
adb devices

# Check if emulator is running
emulator -avd-list

# Restart mobile-mcp server
cd android-emulator/mobile-mcp && npm restart
```

### Debug Commands

```bash
# View all logs
docker compose -f docker-compose.ecosystem.yml logs

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
ai-emulators-ecosystem/
├── bytebot/                      # Core platform
│   ├── packages/
│   │   ├── bytebotd/          # Desktop service (VNC, computer use)
│   │   ├── bytebot-agent/     # AI orchestration (NestJS)
│   │   └── bytebot-ui/        # Web interface (Next.js)
│   └── docs/                    # Documentation
├── docker/                      # Docker configurations
│   ├── kali-desktop/            # Kali Linux container
│   └── ...
├── docker-compose.ecosystem.yml  # Full platform deployment
└── README.md                    # This file
```

### Key Technologies

- **Backend**: NestJS, TypeScript, Prisma
- **Frontend**: Next.js, React, Tailwind CSS
- **Desktop**: Ubuntu/Debian/Kali, VNC, noVNC
- **Android**: ADB, scrcpy, mobile-mcp
- **Browser**: UI-TARS, WebSocket
- **AI**: Anthropic Claude, OpenAI, Google Gemini, Groq, Routeway
- **Database**: PostgreSQL
- **Deployment**: Docker, Docker Compose

### Contributing

**📌 Note**: This open-source version of KRONOS-OS will transition to a closed-source Enterprise Edition in Q2 2025. Contributions are welcome for the open-source version.

1. **Fork and Clone**
```bash
git clone https://github.com/your-username/ai-emulators-ecosystem.git
cd ai-emulators-ecosystem
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
# Use development docker setup
docker compose -f docker-compose.ecosystem.yml up -d
cd packages/bytebot-agent && npm run start:dev &
cd ../bytebot-ui && npm dev &
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
- **Document Generation**: Create formatted reports from data sources

### Development & Testing

- **Environment Setup**: Install dependencies, configure tools, set up databases
- **UI Testing**: Automated browser testing across different environments
- **Documentation**: Generate screenshots, create setup guides
- **Mobile Testing**: Test Android apps on emulator, capture screenshots

### Security Research

- **Vulnerability Scanning**: Use Kali desktop for penetration testing automation
- **Network Analysis**: Automated tool execution and log collection
- **Security Reports**: Generate comprehensive security assessment reports

### Web Automation

- **Web Scraping**: Extract data from dynamic websites using UI-TARS
- **Form Filling**: Automated form submission across multiple sites
- **Data Collection**: Gather and organize web data systematically

---

## 📈 Performance & Scaling

### Resource Requirements

| Level | RAM | Disk | CPU | Use Case |
|--------|-----|-------|-----|-----------|
| **Minimum** | 4GB | 10GB | 2 cores | Development, testing |
| **Recommended** | 8GB | 20GB | 4 cores | Production, small teams |
| **Production** | 16GB | 50GB | 8 cores | Enterprise, heavy workloads |

### Scaling Options

- **Horizontal**: Multiple desktop containers for different tasks
- **Vertical**: Larger containers for resource-intensive workloads
- **Kubernetes**: Helm charts for enterprise deployment (Enterprise Edition)

---

## 🤝 Community & Support

### 📚 Documentation

- **GitHub Repository**: [ai-emulators-ecosystem](https://github.com/Ahmedalsadi-1/ai-emulators-ecosystem)
- **Issues**: [GitHub Issues](https://github.com/Ahmedalsadi-1/ai-emulators-ecosystem/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Ahmedalsadi-1/ai-emulators-ecosystem/discussions)

### 💬 Community

- **Waitlist**: [kronos-os.com](https://kronos-os.com) - Sign up for Enterprise Edition updates
- **Twitter**: Follow [@KronosOS](https://twitter.com/KronosOS) for updates

### 🐛 Support

- **Bug Reports**: Use GitHub Issues with detailed reproduction steps
- **Feature Requests**: Submit via GitHub Discussions
- **Enterprise Support**: Available in Enterprise Edition (Q2 2025)

---

## 🔮 Roadmap

### Q1 2025 (Open Source)
- ✅ Multi-desktop virtualization (KRON-1/2/3)
- ✅ Android workspace with multi-mode support
- ✅ UI-TARS browser automation
- ✅ Multi-provider AI fallback
- ✅ Tool-use enforcement

### Q2 2025 (Enterprise Edition - Closed Source)
- 🔜 Enterprise-grade authentication (SSO, MFA)
- 🔜 Advanced analytics dashboard
- 🔜 Multi-tenant architecture
- 🔜 Priority support SLAs
- 🔜 Performance optimization profiles
- 🔜 Security hardening (closed-source components)

### Q3 2025+ (Enterprise Edition)
- 🔜 Cloud-native deployment
- 🔜 Advanced orchestration workflows
- 🔜 Team collaboration features
- 🔜 Custom integrations marketplace

---

## 📄 License

**Open Source Edition**: MIT License - See [LICENSE](LICENSE) for details.

**Enterprise Edition**: Commercial license with support SLAs - Coming Q2 2025.

---

<div align="center">

## 🚀 Start Automating Your Desktop Today

**Get the open-source version now:**

[![GitHub Repo](https://img.shields.io/badge/GitHub-View%20Repository-blue)](https://github.com/Ahmedalsadi-1/ai-emulators-ecosystem)
[![Docker Pulls](https://img.shields.io/docker/pulls/Ahmedalsadi-1/ai-emulators-ecosystem)](https://github.com/Ahmedalsadi-1/ai-emulators-ecosystem/pkgs/container/bytebot-desktop%2Flatest)

**Join the Enterprise Edition waitlist for closed-source features:**

[🔗 Sign Up at kronos-os.com](https://kronos-os.com)

---

*KRONOS-OS - Empowering AI-Driven Desktop Automation Since 2025*

</div>
