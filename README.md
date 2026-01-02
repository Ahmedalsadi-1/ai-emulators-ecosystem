# 🚀 KRONOS-OS

**The Ultimate AI-Powered Desktop Automation Platform**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg)](https://docker.com)
[![Node.js](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.0+-blue.svg)](https://typescriptlang.org)

---

## 🎯 What is KRONOS-OS?

**KRONOS-OS** is our revolutionary AI-powered desktop automation platform that combines intelligent multi-agent orchestration with powerful virtual desktop infrastructure. Built with ❤️ by our team, KRONOS-OS enables you to create, manage, and control multiple AI-powered desktop environments through a unified, modern interface.

### ✨ Key Features

- 🖥️ **Multi-Desktop Virtualization** - Run 4 isolated virtual desktops simultaneously
- 🤖 **AI Agent Integration** - Powerful agents with tool-calling capabilities
- 🌐 **BrowserOS Integration** - Web automation directly from your desktop
- 🔄 **Smart Fallback Routing** - Routeway → Groq → OpenAI automatic failover
- 🔧 **Tool-Use Enforcement** - Enterprise-grade tool call validation
- 📊 **Real-time Monitoring** - Live task tracking and OS-AI panel
- 🐳 **Docker-Native** - All services containerized for easy deployment
- 🔐 **Enterprise Security** - JWT auth, RBAC, and audit logging

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    KRONOS-OS Platform                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              KRONOS-OS UI (Next.js)                 │   │
│  │              localhost:9992                          │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                  │
│                         ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           KRONOS-OS Agent (NestJS)                 │   │
│  │           localhost:9991                            │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │  Task Orchestration & Model Routing        │   │   │
│  │  │  • Routeway → Groq → OpenAI Fallback      │   │   │
│  │  │  • Tool-Use Enforcement                   │   │   │
│  │  │  • Multi-Provider Support                │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                  │
│                         ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Virtual Desktop Containers            │   │
│  │                                                     │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │   │
│  │  │ Desktop │ │ Desktop │ │ Desktop │ │BrowserOS│  │   │
│  │  │    1    │ │    2    │ │    3    │ │         │  │   │
│  │  │  :9990  │ │  :9995  │ │  :9993  │ │  :9994  │  │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Infrastructure Services               │   │
│  │  • OS-AI Backend (:8765) - Local screen capture   │   │
│  │  • PostgreSQL (:5432) - Task persistence          │   │
│  │  • Redis (:6379) - Caching & real-time            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎮 Quick Start

### Prerequisites

- **Node.js 18+** with npm or pnpm
- **Docker & Docker Compose**
- **4GB RAM** minimum (8GB recommended)
- **10GB** free disk space

### Installation

```bash
# Clone our repository
git clone https://github.com/your-org/kronos-os.git
cd kronos-os

# Start the platform
docker-compose -f docker-compose.ecosystem.yml up -d

# Start development services
cd bytebot/packages/bytebot-agent && npm run start:dev &
cd ../bytebot-ui && npm run dev &
```

### Access KRONOS-OS

| Service | URL | Description |
|---------|-----|-------------|
| **KRONOS-OS UI** | http://localhost:9992 | Main interface |
| **Agent API** | http://localhost:9991/api/tasks | Task management |
| **Desktop 1** | VNC on :9990 | Primary workspace |
| **Desktop 2** | VNC on :9995 | Secondary workspace |
| **Desktop 3** | VNC on :9993 | Kali Linux desktop |
| **BrowserOS** | http://localhost:9992/web | Web automation |
| **OS-AI Panel** | Built into /desktop | Local screen capture |

---

## 🛠️ Services

### Core Services

| Service | Port | Status | Description |
|---------|------|--------|-------------|
| **bytebot-ui** | 9992 | ✅ Active | KRONOS-OS main interface |
| **bytebot-agent** | 9991 | ✅ Active | AI orchestration engine |
| **bytebot-desktop** | 9990 | ✅ Active | Primary virtual desktop |
| **debian-desktop** | 9995 | ✅ Active | Debian workspace |
| **kali-desktop** | 9993 | ✅ Active | Security testing desktop |
| **browseros-desktop** | 9994 | ✅ Active | Web automation desktop |
| **os-ai-backend** | 8765 | ✅ Active | Screen capture & control |
| **postgres** | 5432 | ✅ Active | Task persistence |

### Model Providers

| Provider | Status | Tool-Capable | Notes |
|----------|--------|--------------|-------|
| **Routeway** | ✅ Active | ✅ Yes | Primary provider |
| **Groq** | ✅ Active | ✅ Yes | Fast inference |
| **OpenAI** | ⚠️ Configurable | ✅ Yes | GPT-4o, o3 |
| **Google** | ✅ Active | ✅ Yes | Gemini 2.5 |
| **LM Studio** | ⚠️ Optional | ⚠️ Configurable | Local models |

---

## 🤖 AI Agents & Tool Use

### Supported Tools

KRONOS-OS agents can use the following tool categories:

- **Computer Control** - Screenshot, click, type, scroll
- **File Operations** - Read, write, navigate files
- **Terminal Execution** - Run shell commands
- **Web Automation** - BrowserOS integration
- **Task Management** - Create, update, complete tasks

### Tool Call Enforcement

All tool calls **must** include a `session_id` parameter:

```json
{
  "tool": "computer_screenshot",
  "parameters": {
    "session_id": "desktop-1"
  }
}
```

**Invalid** tool calls (missing `session_id`) will be rejected with an error.

### Desktop Sessions

| Session ID | Port | Environment |
|------------|------|-------------|
| `desktop-1` | 9990 | Primary workspace |
| `desktop-2` | 9995 | Debian workspace |
| `desktop-3` | 9993 | Kali Linux |
| `browseros` | 9994 | Web automation only |

---

## 🔄 Model Fallback Chain

KRONOS-OS implements intelligent fallback routing:

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

### Configuration

```bash
# In bytebot/packages/bytebot-agent/.env

# Primary provider
ROUTEWAY_API_KEY=your-routeway-key
ROUTEWAY_BASE_URL=https://api.routeway.ai/v1

# Fallback providers
GROQ_API_KEY=your-groq-key
OPENAI_API_KEY=your-openai-key

# Optional: LM Studio local proxy
BYTEBOT_LLM_PROXY_URL=http://192.168.1.118:1234/v1
BYTEBOT_PROXY_MODELS=ui-tars-7b-dpo@tool,microsoft_fara-7b
```

---

## 🌐 BrowserOS Integration

### Accessing BrowserOS

1. Navigate to **http://localhost:9992/web**
2. BrowserOS loads in the VNC viewer
3. Use password: `browseros`

### Features

- Full browser automation through VNC
- noVNC fallback for restricted environments
- Secure WebSocket connection to :9994
- Compatible with all KRONOS-OS agents

---

## 📁 Project Structure

```
kronos-os/
├── bytebot/                      # Core platform
│   ├── packages/
│   │   ├── bytebot-agent/       # NestJS API server (:9991)
│   │   ├── bytebot-ui/          # Next.js UI (:9992)
│   │   ├── bytebotd/            # Desktop service (:9990)
│   │   └── shared/              # Shared types & utilities
│   └── docs/                    # Documentation
├── docker/                      # Docker configurations
│   ├── kali-desktop/            # Kali Linux container
│   └── ...
├── docker-compose.ecosystem.yml  # Full platform deployment
├── nginx/                       # Reverse proxy configuration
└── README.md                    # This file
```

---

## 🏃 Development

### Running Locally

```bash
# Start database
docker-compose -f docker-compose.databases.yml up -d

# Start agent (port 9991)
cd bytebot/packages/bytebot-agent
npm run start:dev

# Start UI (port 9992) - in new terminal
cd bytebot/packages/bytebot-ui
npm run dev
```

### Building

```bash
# Build shared types
cd bytebot/packages/shared
npm run build

# Build agent
cd ../bytebot-agent
npm run build

# Build UI
cd ../bytebot-ui
npm run build
```

### Testing

```bash
# Agent tests
cd bytebot/packages/bytebot-agent
npm run test

# UI tests
cd ../bytebot-ui
npm run test:e2e
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bytebotdb

# API Keys (at least one required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=...
ROUTEWAY_API_KEY=...

# Desktop
BYTEBOT_DESKTOP_BASE_URL=http://localhost:9990

# Auth (optional)
BYTEBOT_AUTH_ENABLED=false
BYTEBOT_AUTH_SECRET=your-secret
```

---

## 📚 Documentation

- [AGENTS.md](AGENTS.md) - Development guidelines
- [COMPREHENSIVE_IMPLEMENTATION_REPORT.md](COMPREHENSIVE_IMPLEMENTATION_REPORT.md) - Architecture details
- [KRONOS_READINESS_REPORT.md](KRONOS_READINESS_REPORT.md) - System health
- [LOCAL_DEV_STARTUP_SEQUENCE.md](LOCAL_DEV_STARTUP_SEQUENCE.md) - Dev setup guide

---

## 🤝 Contributing

We welcome contributions! Please see our [AGENTS.md](AGENTS.md) for:

1. **Code Standards** - TypeScript, naming, formatting
2. **Commit Conventions** - Conventional commits with agent attribution
3. **Testing Requirements** - 80%+ coverage, property-based tests
4. **Pull Request Process** - Review, approval, merge

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

## 🎬 Demo Videos

Watch KRONOS-OS in action! These recordings showcase the platform's capabilities:

### 📹 Featured Demos

| Video | Description | Duration |
|-------|-------------|----------|
| [System Overview](Screen%20Recording%202025-12-21%20at%209.52.50%E2%80%AFPM.mov) | Complete walkthrough of KRONOS-OS features and UI | ~2 min |
| [UI Preview](Screen%20Recording%202026-01-01%20at%203.25.32%E2%80%AFAM.mov) | Detailed look at the new dashboard and service health monitoring | ~1 min |

### 🎥 What's Covered

- ✅ **System Overview** - Complete platform tour showing multi-desktop setup, AI agent orchestration, and real-time monitoring
- ✅ **Dashboard Demo** - New KRONOS-OS UI with service health indicators, task tracking, and model performance metrics
- ✅ **Task Execution** - Watch AI agents execute tasks across multiple virtual desktops
- ✅ **BrowserOS Integration** - Web automation capabilities in action

### 🚀 Quick Preview

https://github.com/user-attachments/assets/video-placeholder

> **Note:** Click the links above to view the demo recordings from the repository.

### 📂 Video Location
All demo videos are stored in the repository root:
- `Screen Recording 2025-12-21 at 9.52.50 PM.mov` - Main system demo
- `Screen Recording 2026-01-01 at 3.25.32 AM.mov` - UI showcase

---

## 🙏 Acknowledgments

Built with ❤️ by our development team using:

- [NestJS](https://nestjs.com/) - Backend framework
- [Next.js](https://nextjs.org/) - Frontend framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [Docker](https://www.docker.com/) - Containerization
- [VNC/noVNC](https://novnc.com/) - Remote desktop
- [TypeScript](https://www.typescriptlang.org/) - Type safety

---

**KRONOS-OS** - *Empowering AI-Driven Desktop Automation* 🌍

