# KRONOS-OS Browser Extension

**Version**: 1.0.0
**Status**: In Development
**Manifest Version**: Manifest V3 (Chrome Extension)

---

## 🎯 Overview

KRONOS-OS Browser Extension provides native Chrome integration for web tasks, parallel AI agents, deterministic workflows, and local LLM support.

**Architecture**: VibeSurf-Inspired with KRONOS-OS backend integration
**Installation**: Chrome Web Store ready (Enterprise Edition)

---

## ✨ Key Features

### 1. Multi-Tab Parallel Agents
- Run multiple AI agents simultaneously in different browser tabs
- Massive efficiency gains for research tasks
- Unified control interface

### 2. Deterministic Workflows
- Drag-and-drop workflow builder
- Conversation-based task definitions
- Zero recurring token cost (executes once, runs forever)
- Fast, reliable, predictable results

### 3. Local LLM Support
- Ollama, LM Studio, custom model APIs
- Privacy-first approach (data stays local)
- No external API rate limits
- Reduced operational costs

### 4. Smart Skills System
- `/search` - Quick information retrieval
- `/crawl` - Automatic website data extraction
- `/code` - Webpage JavaScript execution
- Native API integrations (Xiaohongshu, Douyin, Weibo, YouTube)

### 5. Native Chrome UI
- Popup interface (workspace switcher + chat)
- Side panel (configuration and settings)
- Content scripts (page interaction)
- Background service worker (API hub)
- Seamless browser integration

### 6. KRONOS-OS Backend Integration
- WebSocket communication with `localhost:9991`
- Workspace synchronization
- Task status updates
- Desktop workspace control (KRON-1/2/3, Android, UI-TARS)

---

## 📁 Extension Structure

```
browser-extension/
├── manifest.json                    # Chrome Extension Manifest V3
├── icons/                          # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   └── icon512.png
├── popup/
│   └── popup.html              # Main interface (workspace + chat)
├── side-panel/
│   └── side-panel.html         # Settings & configuration
├── background/
│   └── service-worker.js      # Background service, API hub
├── content/
│   ├── content-script.js        # Page interaction scripts
│   └── styles.css            # Content script styles
└── README.md                     # This file
```

---

## 🏗️ Architecture

### Component Communication Flow

```
┌─────────────────────────────────────────────────────────┐
│           Chrome Browser Instance                  │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────┐  │
│  │  Extension Components (Context Scripts)    │  │
│  │  • popup.html                         │  │
│  │  • side-panel.html                    │  │
│  │  • content-script.js                  │  │
│  └──────────────────┬────────────────────────┘  │
│                     │ Chrome Message Passing      │
│                     ▼                              │
│  ┌───────────────────────────────────────────┐  │
│  │  Background Service Worker             │  │
│  │  • Task routing                     │  │
│  │  • Tab management                    │  │
│  │  • API communication                │  │
│  └──────────────────┬────────────────────────┘  │
│                     │                            │
│                     ▼                            │
│  ┌───────────────────────────────────────────┐   │
│  │  KRONOS-OS Backend API         │   │
│  │  • localhost:9991/tasks          │   │
│  │  • WebSocket (real-time)       │   │
│  │  • REST (task management)      │   │
│  └───────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|---------|---------|
| `/tasks` | POST | Create new task |
| `/tasks` | GET | List all tasks |
| `/tasks/:id` | GET | Get task details |
| `/tasks/:id/cancel` | POST | Cancel running task |
| `/tasks/models` | GET | List available AI models |
| `/workspaces` | GET | Get workspace configuration |
| `/extensions/agent` | POST | Run parallel agent |

### WebSocket Events

**Connection**: `ws://localhost:9991/tasks`

**Client → Server:**
- `agent:run` - Start parallel agent in new tab
- `agent:close` - Close agent tab
- `workflow:execute` - Run deterministic workflow
- `skills:search` - Execute search skill
- `skills:crawl` - Execute crawl skill
- `skills:code` - Execute code skill

**Server → Client:**
- `task:progress` - Task progress update
- `task:complete` - Task finished
- `agent:state` - Agent state change
- `workflow:status` - Workflow execution status

---

## 🎨 UI Components

### Popup (popup.html)
- Workspace switcher (KRON-1/2/3, Android, UI-TARS)
- AI task chat interface
- Quick actions (new task, settings)
- Connection status indicator

### Side Panel (side-panel.html)
- Workflow builder
- Agent management (parallel tabs)
- Skills configuration
- Local LLM settings
- KRONOS-OS backend connection

### Background Worker (service-worker.js)
- Task routing and orchestration
- Tab lifecycle management
- WebSocket connection management
- API request/response handling
- Message passing between components

---

## 🛠️ Installation

### Development Mode
1. **Load Unpacked Extension**
   ```bash
   # Chrome 142+
   # Open: chrome://extensions/
   # Enable Developer mode
   # Click "Load unpacked"
   # Navigate to extension folder
   ```

2. **Background Worker Auto-Load**
   Chrome 142+ auto-loads background service worker
   On first load, extension shows popup with extension path

**Manual Load Location**:
- **Windows**: `C:\Users\<username>\AppData\Roaming\v\tools\vibesurf\Lib\site-packages\vibe_surf\chrome_extension`
- **macOS**: `~/.local/share/uv/tools/vibesurf/lib/python3.<version>/site-packages/vibe_surf/chrome_extension`
- **Linux**: `~/.local/share/uv/tools/vibesurf/lib/python3.<version>/site-packages/vibe_surf/chrome_extension`

### Production Mode
1. **Package Extension**
   ```bash
   cd browser-extension
   zip -r kronos-os-extension.zip .
   # Upload to Chrome Web Store
   ```

2. **Enterprise Features**
   - SSO authentication
   - License-based feature access
   - Priority support channels
   - Closed-source security components

---

## 📋 Development Roadmap

### Phase 1: Core Infrastructure (Current)
- [x] Extension structure created
- [x] Manifest V3 configuration
- [ ] Popup UI implementation
- [ ] Background service worker
- [ ] Content scripts for page interaction
- [ ] KRONOS-OS backend integration

### Phase 2: VibeSurf-Inspired Features
- [ ] Multi-tab parallel agents
- [ ] Deterministic workflow system
- [ ] Local LLM support (Ollama, LM Studio)
- [ ] Smart skills system (/search, /crawl, /code)

### Phase 3: Enterprise Edition
- [ ] Chrome Web Store packaging
- [ ] SSO authentication
- [ ] License management
- [ ] Closed-source security features

---

## 🔐 Permissions

The extension requires the following permissions:

| Permission | Purpose | Required For |
|-----------|---------|--------------|
| `storage` | Save user preferences and workflows | Workflow Builder |
| `tabs` | Manage browser tabs for parallel agents | Multi-Tab Agents |
| `scripting` | Execute JavaScript on web pages | Code Skill |
| `activeTab` | Access current tab URL and content | Crawl/Code Skills |
| `webNavigation` | Navigate to URLs | All Features |
| `background` | Persistent background service | Service Worker |

---

## 🎯 User Stories

### As a Power User
- [ ] Switch between KRON-OS workspaces directly from browser
- [ ] Run AI tasks in browser tabs instead of opening desktop UI
- [ ] Use deterministic workflows for repetitive web tasks
- [ ] Configure local LLMs for privacy

### As an Enterprise Admin
- [ ] Install extension across organization via Chrome Web Store
- [ ] Configure SSO and license-based access
- [ ] Monitor extension usage and activity
- [ ] Manage which AI models users can access

### As a Researcher
- [ ] Run parallel research agents across multiple tabs
- [ ] Use smart skills to extract data from websites
- [ ] Execute custom JavaScript on target pages
- [ ] Save massive token costs with deterministic workflows

---

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/Ahmedalsadi-1/ai-emulators-ecosystem.git
cd ai-emulators-ecosystem/bytebot/browser-extension
```

### 2. Development Setup
```bash
# Load extension in Chrome Dev Mode
# Open: chrome://extensions/
# Enable Developer mode
# Click "Load unpacked"
# Navigate to extension folder
```

### 3. Start KRONOS-OS Backend
```bash
cd ../bytebot-agent
npm run start:dev
```

### 4. Use Extension
1. Click extension icon in browser toolbar
2. Switch workspace in popup
3. Start AI task or run workflow
4. Watch parallel agents execute in multiple tabs

---

## 📄 License

**Open Source Edition**: MIT License - See LICENSE in root repository

**Enterprise Edition**: Commercial license with support SLAs - Coming Q2 2025

---

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Test in Chrome Dev Mode**
5. **Submit a pull request**

### Code Standards

- JavaScript: ES6+ with modern syntax
- TypeScript: Strict mode for new code
- Formatting: Prettier
- Testing: Jest for service worker logic

---

## 🆚 Troubleshooting

### Extension Not Loading

**Symptom**: Extension folder shown but not loading

**Solution**:
1. Close Chrome completely
2. Reopen Chrome
3. Check if extension is enabled in extensions menu
4. Use manual load from unpacked folder

### Background Worker Not Starting

**Symptom**: Service worker shows errors

**Solution**:
1. Check Chrome console for JavaScript errors
2. Verify manifest.json syntax
3. Check file permissions
4. Verify backend API is running (localhost:9991)

### WebSocket Connection Failed

**Symptom**: Extension shows disconnected

**Solution**:
1. Verify KRONOS-OS backend is running
2. Check WebSocket URL in settings
3. Test connection with `wscat` or similar tool
4. Check browser console for connection errors

---

## 📞 Support & Resources

- **GitHub Issues**: https://github.com/Ahmedalsadi-1/ai-emulators-ecosystem/issues
- **Documentation**: See root repository README.md
- **VibeSurf Reference**: https://github.com/vibesurf-ai/VibeSurf (architecture inspiration)

---

## 🎯 Vision

**KRONOS-OS Browser Extension transforms the browser from a passive content viewer into an active, intelligent workspace.**

By combining native Chrome APIs, parallel AI agents, deterministic workflows, and KRONOS-OS's powerful backend, we create:
- **Unified Experience**: Desktop and browser in one platform
- **Massive Efficiency**: 10x+ faster than sequential processing
- **Privacy-First**: Local LLMs keep data private
- **Enterprise-Ready**: Publishable to Chrome Web Store with advanced features

---

<div align="center">

## 🚀 KRONOS-OS Browser Extension - Native Chrome Integration

**Open Source Development • Enterprise Edition Coming Q2 2025**

[![GitHub](https://img.shields.io/badge/GitHub-View%20Repository-blue)](https://github.com/Ahmedalsadi-1/ai-emulators-ecosystem)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

*KRONOS-OS - Empowering AI-Driven Browser Automation Since 2025*

</div>
