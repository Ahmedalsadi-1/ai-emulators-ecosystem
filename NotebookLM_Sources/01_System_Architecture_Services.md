# Future-App System Architecture & Services

## Executive Summary

**Project Status**: Active Development (Phase C Complete, Phase D In Progress)

**Total Services**: 13+ microservices

**Total Code**: 150,000+ lines across multiple languages

**Infrastructure**: Docker-based with 8 isolated networks

**AI Integration**: Local Ollama + Cloud APIs (OpenAI, Anthropic, Google)

---

## Complete Service Matrix

### Core Services

#### 1. Frontend (Next.js)
- **Port**: 3000
- **Status**: ✅ Active
- **Technology**: Next.js 14, React, TypeScript, Tailwind CSS
- **Purpose**: Main user interface and dashboard
- **Network**: frontend-network
- **Key Features**:
  - Server-side rendering
  - API route handlers
  - Real-time updates
  - Responsive design

#### 2. Backend API (Node.js/Express)
- **Port**: 5000
- **Status**: ✅ Active
- **Technology**: Node.js, Express, TypeScript
- **Purpose**: Central API gateway and business logic
- **Network**: backend-network
- **Key Features**:
  - RESTful API endpoints
  - Authentication middleware
  - Request validation
  - Error handling

#### 3. Python Services
- **Port**: 8000
- **Status**: ✅ Active
- **Technology**: FastAPI, Python 3.11+
- **Purpose**: AI/ML processing and data analysis
- **Network**: python-network
- **Key Features**:
  - Async processing
  - ML model inference
  - Data transformation
  - Scientific computing

#### 4. Rust Services
- **Port**: 8080
- **Status**: ✅ Active
- **Technology**: Actix-web, Rust
- **Purpose**: High-performance computing and system operations
- **Network**: rust-network
- **Key Features**:
  - Ultra-low latency
  - Memory safety
  - Concurrent processing
  - System-level operations

### Database Services

#### 5. PostgreSQL
- **Port**: 5432
- **Status**: ✅ Active
- **Technology**: PostgreSQL 15+
- **Purpose**: Primary relational database
- **Network**: database-network
- **Key Features**:
  - ACID compliance
  - Complex queries
  - Transactions
  - Data integrity

#### 6. MongoDB
- **Port**: 27017
- **Status**: ✅ Active
- **Technology**: MongoDB 6+
- **Purpose**: Document storage and flexible schemas
- **Network**: database-network
- **Key Features**:
  - Schema flexibility
  - Horizontal scaling
  - JSON-like documents
  - Aggregation pipeline

#### 7. Redis
- **Port**: 6379
- **Status**: ✅ Active
- **Technology**: Redis 7+
- **Purpose**: Caching and session management
- **Network**: cache-network
- **Key Features**:
  - In-memory storage
  - Sub-millisecond latency
  - Pub/sub messaging
  - Data structures

### AI & Automation Services

#### 8. Ollama (Local LLM)
- **Port**: 11434
- **Status**: ✅ Active
- **Technology**: Ollama
- **Purpose**: Local AI inference (privacy-first)
- **Network**: ai-network
- **Models Available**:
  - Llama 3.2 (3B, 1B)
  - Mistral
  - Gemma 2 (2B)
  - Qwen 2.5
- **Key Features**:
  - Zero API costs
  - Data privacy
  - Offline capability
  - Fast inference

#### 9. n8n Automation
- **Port**: 5678
- **Status**: ✅ Active
- **Technology**: n8n (self-hosted)
- **Purpose**: Workflow automation and orchestration
- **Network**: automation-network
- **Key Features**:
  - Visual workflow builder
  - 400+ integrations
  - Webhook support
  - Scheduled executions

#### 10. Langflow
- **Port**: 7860
- **Status**: ✅ Active
- **Technology**: Langflow
- **Purpose**: AI agent design and RAG pipelines
- **Network**: ai-network
- **Key Features**:
  - Visual flow builder
  - LangChain integration
  - Vector database support
  - Custom components

### Supporting Services

#### 11. Message Queue (RabbitMQ)
- **Port**: 5672, 15672 (management)
- **Status**: ✅ Active
- **Technology**: RabbitMQ
- **Purpose**: Asynchronous message processing
- **Network**: queue-network
- **Key Features**:
  - Message persistence
  - Routing patterns
  - Dead letter queues
  - Management UI

#### 12. Monitoring Stack
- **Prometheus**: Port 9090
- **Grafana**: Port 3001
- **Status**: ✅ Active
- **Purpose**: System monitoring and alerting
- **Network**: monitoring-network
- **Key Features**:
  - Metrics collection
  - Custom dashboards
  - Alert rules
  - Historical data

#### 13. Nginx Reverse Proxy
- **Port**: 80, 443
- **Status**: ✅ Active
- **Technology**: Nginx
- **Purpose**: Load balancing and SSL termination
- **Network**: Bridge to all networks
- **Key Features**:
  - SSL/TLS termination
  - Load balancing
  - Request routing
  - Static file serving

---

## Service Dependencies

```
Frontend (3000)
  ├─> Backend API (5000)
  │     ├─> PostgreSQL (5432)
  │     ├─> MongoDB (27017)
  │     ├─> Redis (6379)
  │     ├─> Python Services (8000)
  │     ├─> Rust Services (8080)
  │     └─> RabbitMQ (5672)
  │
  ├─> n8n (5678)
  │     ├─> Ollama (11434)
  │     ├─> Langflow (7860)
  │     └─> External APIs
  │
  └─> Langflow (7860)
        └─> Ollama (11434)

All services monitored by:
  └─> Prometheus (9090) + Grafana (3001)
```

---

## Resource Requirements

### Minimum System Requirements
- **CPU**: 8 cores (16 threads recommended)
- **RAM**: 32GB (64GB recommended for AI workloads)
- **Storage**: 500GB SSD (1TB recommended)
- **Network**: 1Gbps connection

### Per-Service Resource Allocation

| Service | CPU Limit | Memory Limit | Storage |
|---------|-----------|--------------|----------|
| Frontend | 2 cores | 2GB | 1GB |
| Backend | 4 cores | 4GB | 2GB |
| Python | 4 cores | 8GB | 5GB |
| Rust | 2 cores | 2GB | 1GB |
| PostgreSQL | 2 cores | 4GB | 50GB |
| MongoDB | 2 cores | 4GB | 50GB |
| Redis | 1 core | 2GB | 10GB |
| Ollama | 8 cores | 16GB | 100GB |
| n8n | 2 cores | 2GB | 10GB |
| Langflow | 2 cores | 4GB | 20GB |
| RabbitMQ | 1 core | 2GB | 10GB |
| Monitoring | 2 cores | 4GB | 50GB |

---

## Technology Stack Summary

### Frontend
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Shadcn/ui components

### Backend
- Node.js + Express
- Python + FastAPI
- Rust + Actix-web
- TypeScript

### Databases
- PostgreSQL (relational)
- MongoDB (document)
- Redis (cache/session)

### AI/ML
- Ollama (local LLM)
- OpenAI API
- Anthropic Claude
- Google Gemini
- LangChain
- Langflow

### DevOps
- Docker + Docker Compose
- Nginx
- Prometheus + Grafana
- RabbitMQ
- n8n

### Development Tools
- Git
- VS Code
- Cursor AI
- Postman/Insomnia
- pgAdmin/MongoDB Compass

---

## Service Health Endpoints

| Service | Health Check URL |
|---------|------------------|
| Frontend | http://localhost:3000/api/health |
| Backend | http://localhost:5000/health |
| Python | http://localhost:8000/health |
| Rust | http://localhost:8080/health |
| n8n | http://localhost:5678/healthz |
| Ollama | http://localhost:11434/api/tags |
| Langflow | http://localhost:7860/health |
| PostgreSQL | pg_isready -h localhost -p 5432 |
| MongoDB | mongosh --eval "db.adminCommand('ping')" |
| Redis | redis-cli ping |
| RabbitMQ | http://localhost:15672/api/health/checks/alarms |
| Prometheus | http://localhost:9090/-/healthy |
| Grafana | http://localhost:3001/api/health |
