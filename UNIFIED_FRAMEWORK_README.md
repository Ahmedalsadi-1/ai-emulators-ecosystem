# Unified Application Framework

A comprehensive, production-ready framework that integrates AIOS, ByteBot, and Factif-AI into a cohesive ecosystem for AI-powered automation and device management.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **Python** 3.8+
- **Docker** & **Docker Compose** (for containerized deployment)
- **npm** or **yarn**

### Option 1: Local Development

```bash
# Clone and setup
git clone <repository-url>
cd unified-application-framework

# Start all services
./scripts/activate-unified-system.sh

# Or with cleanup
./scripts/activate-unified-system.sh --clean
```

### Option 2: Docker Deployment

```bash
# Start with Docker Compose
./scripts/activate-unified-system.sh --docker

# Or manually
docker-compose -f docker-compose.ecosystem.yml up --build
```

### Option 3: Individual Service Testing

```bash
# Check service status
./scripts/activate-unified-system.sh --status

# Run integration tests
./scripts/test-integration.sh
```

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ByteBot UI    │    │  API Gateway    │    │      AIOS       │
│   (Next.js)     │◄──►│   (NestJS)      │◄──►│   (Python)      │
│   Port: 3000    │    │   Port: 8080    │    │   Port: 8000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └─────────────►│   Factif-AI     │◄─────────────┘
                        │   (Express)     │
                        │   Port: 3001    │
                        └─────────────────┘
                                 │
                    ┌─────────────────────────────┐
                    │     Infrastructure          │
                    │  ┌─────────┐ ┌─────────┐   │
                    │  │PostgreSQL│ │  Redis  │   │
                    │  │Port: 5432│ │Port:6379│   │
                    │  └─────────┘ └─────────┘   │
                    └─────────────────────────────┘
```

## 🔧 Services

### 1. **AIOS** (AI Operating System)
- **Port**: 8000
- **Purpose**: Core AI inference and agent management
- **Features**: LLM inference, agent orchestration, reasoning capabilities

### 2. **ByteBot Agent** (API Gateway & Orchestration)
- **Port**: 9991 (Agent), 8080 (API Gateway)
- **Purpose**: Central orchestration and API gateway
- **Features**: Service routing, authentication, real-time events, device management

### 3. **Factif-AI** (Browser Automation)
- **Port**: 3001
- **Purpose**: Web automation and browser control
- **Features**: Web scraping, browser automation, GUI interaction

### 4. **ByteBot UI** (Unified Dashboard)
- **Port**: 3000
- **Purpose**: Web interface for the entire ecosystem
- **Features**: Unified dashboard, workflow management, real-time monitoring

## 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Unified Dashboard** | http://localhost:3000/unified | Main interface |
| **API Gateway** | http://localhost:8080 | Central API endpoint |
| **API Documentation** | http://localhost:8080/api/docs | Swagger/OpenAPI docs |
| **AIOS Direct** | http://localhost:8000 | AI service direct access |
| **Factif-AI Direct** | http://localhost:3001 | Automation service direct access |

## 📊 Monitoring & Observability

### Included Monitoring Stack

- **Prometheus** (Port: 9090) - Metrics collection
- **Grafana** (Port: 3001) - Dashboards and visualization
- **Elasticsearch** (Port: 9200) - Log aggregation
- **Kibana** (Port: 5601) - Log analysis
- **Nginx** (Port: 80/443) - Reverse proxy with load balancing

### Health Checks

```bash
# Check all services
curl http://localhost:8080/health

# Individual service health
curl http://localhost:8000/health  # AIOS
curl http://localhost:3001/health  # Factif-AI
curl http://localhost:3000         # ByteBot UI
```

## 🔄 Workflows & Integration

### Example: Automated Web Research Workflow

```javascript
// Via API Gateway
POST http://localhost:8080/api/workflows
{
  "name": "Web Research Pipeline",
  "steps": [
    {
      "service": "factif-ai",
      "action": "scrape",
      "params": {
        "url": "https://example.com",
        "selectors": [".article-title", ".content"]
      }
    },
    {
      "service": "aios",
      "action": "analyze",
      "params": {
        "data": "${previous.result}",
        "task": "summarize"
      }
    }
  ]
}
```

### Real-time Events

```javascript
// WebSocket connection
const ws = new WebSocket('ws://localhost:8080/events');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Real-time update:', data);
};
```

## 🛠️ Configuration

### Environment Variables

```bash
# Core Configuration
NODE_ENV=development
UNIFIED_CONFIG_PATH=./config/unified.development.yaml
LOG_LEVEL=info

# Service Ports
AIOS_PORT=8000
BYTEBOT_AGENT_PORT=9991
API_GATEWAY_PORT=8080
FACTIF_AI_PORT=3001
BYTEBOT_UI_PORT=3000

# Database & Cache
DATABASE_URL=postgresql://user:pass@localhost:5432/unified_framework
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-jwt-secret-key
```

### Configuration Files

- `config/unified.development.yaml` - Development settings
- `config/unified.staging.yaml` - Staging environment
- `config/unified.production.yaml` - Production settings
- `.env` - Environment variables (created from `.env.example`)

## 🧪 Testing

### Integration Testing

```bash
# Run comprehensive integration tests
./scripts/test-integration.sh

# Test specific components
curl -X POST http://localhost:8080/api/aios/llm/inference \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4", "messages": [{"role": "user", "content": "Hello"}]}'
```

### Unit Testing

```bash
# ByteBot Agent tests
cd bytebot/packages/bytebot-agent
npm test

# ByteBot UI tests
cd bytebot/packages/bytebot-ui
npm test
```

## 🔒 Security Features

- **JWT Authentication** - Secure API access
- **Rate Limiting** - API protection
- **CORS Configuration** - Cross-origin security
- **Input Validation** - Request sanitization
- **Security Headers** - XSS, CSRF protection
- **Service Isolation** - Containerized deployment

## 📈 Performance & Scaling

### Load Balancing

The API Gateway includes built-in load balancing for:
- Multiple AIOS instances
- Factif-AI service scaling
- Database connection pooling

### Caching Strategy

- **Redis** for session and API response caching
- **In-memory** caching for frequently accessed data
- **CDN-ready** static asset serving

### Monitoring Metrics

- Request/response times
- Error rates and status codes
- Resource utilization (CPU, memory)
- Database query performance
- WebSocket connection health

## 🚀 Deployment

### Production Deployment

```bash
# Build production images
docker-compose -f docker-compose.ecosystem.yml build

# Deploy with production config
NODE_ENV=production docker-compose -f docker-compose.ecosystem.yml up -d

# Scale services
docker-compose -f docker-compose.ecosystem.yml up -d --scale factif-ai=3
```

### Environment-Specific Configs

```bash
# Staging
UNIFIED_CONFIG_PATH=./config/unified.staging.yaml ./scripts/activate-unified-system.sh

# Production
UNIFIED_CONFIG_PATH=./config/unified.production.yaml ./scripts/activate-unified-system.sh --docker
```

## 🔧 Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check what's using a port
   lsof -i :8080
   
   # Kill process on port
   lsof -ti:8080 | xargs kill -9
   ```

2. **Service Not Starting**
   ```bash
   # Check logs
   tail -f logs/bytebot-agent.log
   tail -f logs/aios.log
   
   # Check service status
   ./scripts/activate-unified-system.sh --status
   ```

3. **Database Connection Issues**
   ```bash
   # Check PostgreSQL
   docker-compose -f docker-compose.ecosystem.yml logs postgres
   
   # Test connection
   psql -h localhost -p 5432 -U unified_user -d unified_framework
   ```

### Log Files

- `logs/aios.log` - AIOS service logs
- `logs/bytebot-agent.log` - ByteBot Agent logs
- `logs/factif-ai.log` - Factif-AI service logs
- `logs/bytebot-ui.log` - UI service logs
- `test-results/` - Integration test results

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Workflow

```bash
# Setup development environment
npm install
./scripts/activate-unified-system.sh --clean

# Run tests before committing
./scripts/test-integration.sh
npm test

# Check code quality
npm run lint
npm run type-check
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` directory for detailed guides
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join community discussions
- **Email**: Contact the development team

---

**Built with ❤️ by the Unified Framework Team**