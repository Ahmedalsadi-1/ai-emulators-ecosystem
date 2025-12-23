# AI Emulators Ecosystem

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg)](https://docker.com)
[![Python](https://img.shields.io/badge/python-3.9+-blue.svg)](https://python.org)
[![Node.js](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org)
[![Go](https://img.shields.io/badge/go-1.19+-blue.svg)](https://golang.org)

The AI Emulators Ecosystem is a comprehensive orchestration platform that integrates 10 specialized AI services with Model Context Protocol (MCP) support, providing unified access to diverse AI capabilities through a microservices architecture.

## 🚀 Quick Start

### One-Command Ecosystem Launch

```bash
# Clone the repository
git clone https://github.com/ai-ecosystem/future-app.git
cd future-app

# Copy environment template
cp .env.example .env

# Edit environment variables (add your API keys)
nano .env

# Launch the complete ecosystem
docker-compose -f docker-compose.ecosystem.yml up -d

# Access services
open http://localhost:3000  # Grafana Dashboard
open http://localhost:8000  # AIOS API
```

### Individual Service Quick Starts

#### Kali Desktop MCP Server
```bash
# Start security testing environment
docker run -d --name kali-desktop \
  -p 5901:5901 -p 6080:6080 \
  --privileged \
  kalilinux/kali-rolling bash -c "
    apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y \
      kali-desktop-xfce tightvncserver novnc websockify \
      firefox-esr nmap sqlmap wireshark metasploit-framework \
      python3-opencv python3-pip && \
    pip3 install vncdotool pynput && \
    mkdir -p /root/.vnc && \
    echo 'kali' | vncpasswd -f > /root/.vnc/passwd && \
    chmod 600 /root/.vnc/passwd && \
    vncserver :1 -geometry 1920x1080 -depth 24 && \
    /usr/share/novnc/utils/launch.sh --vnc localhost:5901 --listen 6080 &
    tail -f /dev/null"

# Access at http://localhost:6080 (password: kali)
```

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Services](#-services)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Development](#-development)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 🤖 AI/LLM Operating Systems
- **AIOS**: Complete AI Agent Operating System with LLM routing, memory management, and tool integration
- **gbox**: Environment provider for AI agents with sandboxing and resource management

### 🖥️ Computer Control & Automation
- **bytebot**: AI desktop agent with virtual environment and VNC integration
- **Open-Interface**: Cross-platform computer control with API-first design
- **macOS-use**: macOS automation with Apple ecosystem integration
- **factif-ai**: AI-powered test automation with visual testing capabilities

### 🎨 Specialized Applications
- **postiz-app**: Social media scheduling and content management platform
- **onlysnarf**: OnlyFans automation and content distribution platform
- **reels-clips-automator**: Instagram Reels and video clip automation
- **Wan2GP**: Video generation platform with AI-powered content creation

### 🛠️ Infrastructure & Tooling
- **MCP Registry**: Service discovery and tool registration for MCP clients
- **Comprehensive Monitoring**: Prometheus, Grafana, and alerting
- **Centralized Logging**: Elasticsearch, Logstash, Kibana stack
- **Health Checks**: Automated service health monitoring
- **Security**: JWT authentication, rate limiting, encryption

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      AI Emulators Ecosystem                         │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    User Interface Layer                        │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │ │
│  │  │   Web UI    │  │   API       │  │   CLI       │             │ │
│  │  │ (Grafana)   │  │ Gateway     │  │ Tools       │             │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘             │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                 Orchestration & Control Layer                  │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │ │
│  │  │   AIOS      │  │ MCP Registry│  │   Agent     │             │ │
│  │  │ (Agent OS)  │  │   Service   │  │   System    │             │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘             │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                   Specialized Services Layer                    │ │
│  │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐         │ │
│  │  │GBox │  │Byte│  │Open │  │macOS│  │Factif│  │Postiz│        │ │
│  │  │Env  │  │bot │  │Intf │  │-use │  │-AI  │  │-app │         │ │
│  │  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘         │ │
│  │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐         │ │
│  │  │Only │  │Reels│  │Wan2 │  │Kali │  │     │  │     │         │ │
│  │  │Snarf│  │Auto │  │GP   │  │Desk │  │     │  │     │         │ │
│  │  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘         │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                 Infrastructure & Data Layer                     │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │ │
│  │  │ PostgreSQL  │  │    Redis    │  │ Prometheus  │             │ │
│  │  │   Database  │  │    Cache    │  │ Monitoring  │             │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘             │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

For detailed architecture information, see [ARCHITECTURE.md](./docs/ARCHITECTURE.md)

## 📦 Services

### Core Services

| Service | Description | Port | Status |
|---------|-------------|------|--------|
| **AIOS** | AI Agent Operating System | 8000 | 🟢 Active |
| **gbox** | AI Environment Provider | 3000 | 🟢 Active |
| **MCP Registry** | Tool Discovery Service | 8002 | 🟢 Active |

### Computer Control Services

| Service | Description | Port | Status |
|---------|-------------|------|--------|
| **bytebot** | AI Desktop Agent | 4000 | 🟢 Active |
| **Open-Interface** | Cross-platform Control | 5000 | 🟢 Active |
| **macOS-use** | macOS Automation | 6000 | 🟢 Active |
| **factif-ai** | AI Test Automation | 7000 | 🟢 Active |
| **Kali Desktop** | Security Testing | 6080 | 🟢 Active |

### Content & Social Services

| Service | Description | Port | Status |
|---------|-------------|------|--------|
| **postiz-app** | Social Media Scheduler | 9000 | 🟢 Active |
| **onlysnarf** | Content Distribution | 10000 | 🟢 Active |
| **reels-clips-automator** | Video Automation | 11000 | 🟢 Active |
| **Wan2GP** | Video Generation | 12000/7860 | 🟢 Active |

### Infrastructure Services

| Service | Description | Port | Status |
|---------|-------------|------|--------|
| **PostgreSQL** | Primary Database | 5432 | 🟢 Active |
| **Redis** | Cache & Message Queue | 6379 | 🟢 Active |
| **Prometheus** | Metrics Collection | 9090 | 🟢 Active |
| **Grafana** | Monitoring Dashboard | 3000 | 🟢 Active |
| **Nginx** | Reverse Proxy | 80/443 | 🟢 Active |

## 🛠️ Installation

### System Requirements

- **OS**: Linux/macOS/Windows with Docker support
- **CPU**: 4+ cores (8+ recommended)
- **RAM**: 16GB minimum (32GB+ recommended)
- **Storage**: 50GB free space
- **GPU**: NVIDIA GPU (optional, for AI/ML services)

### Docker Installation

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# For GPU support (optional)
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt-get update && sudo apt-get install -y nvidia-docker2
sudo systemctl restart docker
```

### Environment Setup

```bash
# Clone repository
git clone https://github.com/ai-ecosystem/future-app.git
cd future-app

# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

Required environment variables:
```bash
# Database
POSTGRES_PASSWORD=your_secure_password
GRAFANA_PASSWORD=your_grafana_password

# AI Services
OPENAI_API_KEY=sk-your-openai-key
HUGGINGFACE_TOKEN=hf_your-huggingface-token

# Authentication
JWT_SECRET=your-256-bit-jwt-secret

# VNC/Desktop
VNC_PASSWORD=your-vnc-password
```

## ⚙️ Configuration

### Development Configuration

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View service logs
docker-compose -f docker-compose.dev.yml logs -f [service-name]

# Run tests
npm run test
python -m pytest tests/
```

### Production Configuration

```bash
# Start production environment
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale aios=3

# Update services
docker-compose -f docker-compose.prod.yml up -d --no-deps [service-name]
```

For detailed configuration options, see [CONFIGURATION.md](./docs/CONFIGURATION.md)

## 🎯 Usage

### Basic Usage Examples

#### AI Text Generation
```python
from ai_ecosystem_sdk import AIEcosystemClient

client = AIEcosystemClient(api_key="your-api-key")

response = client.ai.generate_completion(
    prompt="Explain quantum computing",
    model="gpt-4-turbo-preview",
    max_tokens=500
)

print(response.choices[0].text)
```

#### Computer Automation
```python
# Take screenshot
screenshot = client.computer.capture_screenshot()
print(f"Screenshot captured: {screenshot.id}")

# Simulate user input
client.computer.click_at(x=500, y=300)
client.computer.type_text("Hello World!")
```

#### Social Media Management
```python
# Schedule a post
post = client.social.schedule_post(
    content="Exciting AI developments! #AI #Tech",
    platforms=["twitter", "linkedin"],
    scheduled_time="2024-01-02T10:00:00Z"
)

print(f"Post scheduled: {post.id}")
```

#### MCP Tool Usage
```javascript
const { MCPClient } = require('@ai-ecosystem/mcp-client');

const client = new MCPClient({
    registryURL: 'http://localhost:8002'
});

// Discover tools
const tools = await client.discoverTools();
console.log('Available tools:', tools.map(t => t.name));

// Use Kali desktop tools
const screenshot = await client.callTool('kali_screenshot', {
    analyze: true
});
```

### Advanced Usage

#### Workflow Orchestration
```python
from ai_ecosystem_sdk import Workflow

# Create a content creation workflow
workflow = Workflow(client)

@workflow.step
async def generate_content():
    return await client.ai.generate_completion(
        prompt="Write an engaging social media post about AI",
        model="gpt-4-turbo-preview"
    )

@workflow.step(depends_on=generate_content)
async def create_visual(content):
    return await client.video.generate_video(
        prompt=f"Create visuals for: {content}",
        duration=15
    )

@workflow.step(depends_on=[generate_content, create_visual])
async def schedule_post(content, video):
    return await client.social.schedule_post(
        content=content,
        media_urls=[video.download_url],
        platforms=["twitter", "instagram"]
    )

# Execute workflow
result = await workflow.execute()
print("Content workflow completed:", result)
```

#### Real-time Monitoring
```javascript
const monitor = client.monitor.createDashboard({
    services: ['aios', 'kali-desktop', 'wan2gp'],
    metrics: ['cpu_usage', 'memory_usage', 'request_rate'],
    alerts: {
        high_cpu: { threshold: 90, duration: '5m' },
        high_memory: { threshold: 85, duration: '3m' }
    }
});

monitor.on('alert', (alert) => {
    console.log('Alert triggered:', alert);
});

monitor.on('metric_update', (service, metrics) => {
    console.log(`${service} metrics:`, metrics);
});
```

## 📚 API Documentation

### REST API Endpoints

#### AI Operations
- `POST /api/v1/ai/generate` - Generate AI completions
- `POST /api/v1/ai/chat` - Multi-turn conversations
- `GET /api/v1/ai/models` - List available models

#### Computer Control
- `POST /api/v1/computer/screenshot` - Capture screenshots
- `POST /api/v1/computer/click` - Simulate mouse clicks
- `POST /api/v1/computer/type` - Send keyboard input
- `GET /api/v1/computer/windows` - List open windows

#### Social Media
- `GET /api/v1/social/posts` - List scheduled posts
- `POST /api/v1/social/posts` - Schedule new posts
- `DELETE /api/v1/social/posts/{id}` - Delete scheduled posts

#### Video Generation
- `POST /api/v1/video/generate` - Generate videos
- `GET /api/v1/video/generation/{id}/progress` - Check progress
- `GET /api/v1/video/generation/{id}/result` - Get results

### MCP Tool Specifications

All services expose MCP tools for AI agent integration:

```typescript
// Available tool categories
const toolCategories = {
    ai: ['generate_completion', 'chat_completion', 'analyze_text'],
    computer: ['screenshot', 'click', 'type_text', 'get_windows'],
    social: ['schedule_post', 'get_posts', 'analyze_engagement'],
    video: ['generate_video', 'edit_video', 'add_subtitles'],
    security: ['scan_network', 'analyze_vulnerability', 'penetration_test']
};
```

For complete API documentation, see [API.md](./docs/API.md)

## 💻 Development

### Development Setup

```bash
# Install development dependencies
pip install -r requirements-dev.txt
npm install

# Set up pre-commit hooks
pre-commit install

# Run development server
docker-compose -f docker-compose.dev.yml up -d
npm run dev
```

### Testing

```bash
# Run all tests
npm run test:all

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:coverage

# Run performance tests
npm run test:performance
```

### Code Quality

```bash
# Lint code
npm run lint
python -m flake8 .

# Format code
npm run format
python -m black .

# Type checking
npm run type-check
python -m mypy .
```

For detailed development information, see [DEVELOPMENT.md](./docs/DEVELOPMENT.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./docs/DEVELOPMENT.md#contributing-guidelines) for details.

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following our code standards
4. Add tests for your changes
5. Ensure all tests pass
6. Submit a pull request

### Development Workflow

- Use [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/) branching strategy
- Follow conventional commit messages
- Write comprehensive tests
- Update documentation
- Ensure CI/CD passes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT models and API
- Hugging Face for model hosting
- Docker for containerization
- The open-source community for amazing tools

## 📞 Support

- **Documentation**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/ai-ecosystem/future-app/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ai-ecosystem/future-app/discussions)
- **Email**: support@ai-ecosystem.com

---

**AI Emulators Ecosystem** - Empowering AI-driven automation through unified service orchestration.