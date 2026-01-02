# Network Architecture & Service Communication

## Docker Network Topology

The future-app system uses **8 isolated Docker networks** to ensure security, performance, and proper service segmentation.

---

## Network Overview

### 1. Frontend Network
- **Name**: `frontend-network`
- **Type**: Bridge
- **Purpose**: Isolates frontend services
- **Connected Services**:
  - Frontend (Next.js) - Port 3000
  - Nginx Reverse Proxy

### 2. Backend Network
- **Name**: `backend-network`
- **Type**: Bridge
- **Purpose**: Core API and business logic
- **Connected Services**:
  - Backend API (Express) - Port 5000
  - Nginx Reverse Proxy

### 3. Database Network
- **Name**: `database-network`
- **Type**: Bridge
- **Purpose**: Database isolation and security
- **Connected Services**:
  - PostgreSQL - Port 5432
  - MongoDB - Port 27017
  - Backend API (read/write access)
  - Python Services (read access)

### 4. Cache Network
- **Name**: `cache-network`
- **Type**: Bridge
- **Purpose**: High-speed caching layer
- **Connected Services**:
  - Redis - Port 6379
  - Backend API
  - Frontend (session management)

### 5. AI Network
- **Name**: `ai-network`
- **Type**: Bridge
- **Purpose**: AI/ML service isolation
- **Connected Services**:
  - Ollama - Port 11434
  - Langflow - Port 7860
  - Python Services - Port 8000

### 6. Automation Network
- **Name**: `automation-network`
- **Type**: Bridge
- **Purpose**: Workflow automation
- **Connected Services**:
  - n8n - Port 5678
  - Backend API (webhook triggers)
  - All AI services (via bridge)

### 7. Queue Network
- **Name**: `queue-network`
- **Type**: Bridge
- **Purpose**: Asynchronous message processing
- **Connected Services**:
  - RabbitMQ - Port 5672, 15672
  - Backend API
  - Python Services
  - Rust Services

### 8. Monitoring Network
- **Name**: `monitoring-network`
- **Type**: Bridge
- **Purpose**: System observability
- **Connected Services**:
  - Prometheus - Port 9090
  - Grafana - Port 3001
  - All services (metrics exporters)

---

## Service Communication Patterns

### Synchronous Communication (HTTP/REST)

| Source Service | Target Service | Protocol | Port | Purpose |
|----------------|----------------|----------|------|----------|
| Frontend | Backend API | HTTP | 5000 | Data fetching |
| Backend API | PostgreSQL | TCP | 5432 | Database queries |
| Backend API | MongoDB | TCP | 27017 | Document storage |
| Backend API | Redis | TCP | 6379 | Cache operations |
| Backend API | Python Services | HTTP | 8000 | AI processing |
| Backend API | Rust Services | HTTP | 8080 | Performance tasks |
| n8n | Ollama | HTTP | 11434 | LLM inference |
| n8n | Langflow | HTTP | 7860 | Agent execution |
| Langflow | Ollama | HTTP | 11434 | Local AI |
| Python Services | Ollama | HTTP | 11434 | ML inference |

### Asynchronous Communication (Message Queue)

| Publisher | Queue | Consumer | Message Type |
|-----------|-------|----------|---------------|
| Backend API | task.processing | Python Services | Data analysis jobs |
| Backend API | task.heavy | Rust Services | CPU-intensive tasks |
| Frontend | events.user | Backend API | User actions |
| n8n | automation.trigger | Backend API | Workflow events |
| Python Services | ai.results | Backend API | ML predictions |

### WebSocket Communication (Real-time)

| Service | Port | Purpose | Clients |
|---------|------|---------|----------|
| Backend API | 5000 | Real-time updates | Frontend |
| n8n | 5678 | Workflow status | Frontend dashboard |
| Langflow | 7860 | Agent streaming | n8n, Frontend |

---

## Network Security Rules

### Firewall Configuration

```yaml
# Allowed External Access
Ports:
  - 80 (HTTP) -> Nginx
  - 443 (HTTPS) -> Nginx
  - 5678 (n8n UI) -> localhost only
  - 7860 (Langflow UI) -> localhost only

# Blocked External Access
Ports:
  - 5432 (PostgreSQL) -> internal only
  - 27017 (MongoDB) -> internal only
  - 6379 (Redis) -> internal only
  - 11434 (Ollama) -> internal only
  - 5672 (RabbitMQ) -> internal only
```

### Network Isolation Rules

1. **Database Network**: Only Backend API and Python Services can access
2. **AI Network**: Isolated from direct frontend access
3. **Queue Network**: Only authorized services can publish/consume
4. **Monitoring Network**: Read-only access for most services

---

## API Gateway Routing (Nginx)

### Route Configuration

```nginx
# Frontend
location / {
    proxy_pass http://frontend:3000;
}

# Backend API
location /api/ {
    proxy_pass http://backend:5000/;
}

# n8n Webhooks
location /webhook/ {
    proxy_pass http://n8n:5678/webhook/;
}

# Langflow API
location /langflow/ {
    proxy_pass http://langflow:7860/;
}

# Monitoring
location /grafana/ {
    proxy_pass http://grafana:3001/;
}
```

---

## Load Balancing Strategy

### Backend API (Multiple Instances)
```yaml
upstream backend_cluster {
    least_conn;  # Connection-based load balancing
    server backend-1:5000 weight=3;
    server backend-2:5000 weight=2;
    server backend-3:5000 weight=1;
}
```

### Python Services (Multiple Workers)
```yaml
upstream python_cluster {
    ip_hash;  # Session affinity
    server python-1:8000;
    server python-2:8000;
    server python-3:8000;
}
```

---

## Service Discovery

### Docker DNS Resolution
- All services use Docker's internal DNS
- Service names resolve to container IPs automatically
- Example: `http://backend:5000` resolves to backend container

### Environment Variables
```bash
# Backend API
DATABASE_URL=postgresql://postgres:5432/futureapp
MONGO_URL=mongodb://mongodb:27017/futureapp
REDIS_URL=redis://redis:6379

# Python Services
OLLAMA_BASE_URL=http://ollama:11434
LANGFLOW_API_URL=http://langflow:7860/api

# n8n
N8N_WEBHOOK_URL=http://backend:5000/webhook
OLLAMA_HOST=http://ollama:11434
```

---

## Inter-Service Authentication

### JWT Token Flow
```
1. Frontend -> Backend: Login request
2. Backend -> Frontend: JWT token
3. Frontend -> Backend: API request + JWT
4. Backend -> Python/Rust: Internal API key
5. Python/Rust -> Backend: Response
6. Backend -> Frontend: Final response
```

### API Key Management
- **Internal Services**: Shared secret via environment variables
- **External APIs**: Stored in Backend API vault
- **n8n Credentials**: Encrypted in n8n database

---

## Data Flow Patterns

### Pattern 1: User Request Flow
```
User -> Nginx -> Frontend -> Backend API -> Database -> Backend API -> Frontend -> Nginx -> User
```

### Pattern 2: AI Processing Flow
```
User -> Frontend -> Backend API -> RabbitMQ -> Python Services -> Ollama -> Python Services -> RabbitMQ -> Backend API -> Frontend -> User
```

### Pattern 3: Automation Flow
```
Schedule -> n8n -> Langflow -> Ollama -> Langflow -> n8n -> Backend API -> Database
```

### Pattern 4: Real-time Update Flow
```
Event -> Backend API -> WebSocket -> Frontend (live update)
```

---

## Network Performance Optimization

### Connection Pooling
- **PostgreSQL**: Max 100 connections, pool size 20
- **MongoDB**: Max 200 connections, pool size 50
- **Redis**: Max 1000 connections, pool size 100

### Caching Strategy
```
Level 1: Browser cache (static assets)
Level 2: Redis cache (API responses)
Level 3: Database query cache
Level 4: CDN cache (future)
```

### Request Timeout Configuration
- **Frontend -> Backend**: 30 seconds
- **Backend -> Database**: 10 seconds
- **Backend -> AI Services**: 120 seconds (long-running)
- **n8n Workflows**: 300 seconds (configurable)

---

## Monitoring & Observability

### Metrics Collection
- **Prometheus**: Scrapes metrics every 15 seconds
- **Grafana**: Visualizes real-time dashboards
- **Exporters**: Node exporter, cAdvisor, custom exporters

### Key Network Metrics
- Request latency (p50, p95, p99)
- Error rates (4xx, 5xx)
- Throughput (requests/second)
- Connection pool utilization
- Network bandwidth usage

### Alerting Rules
- High error rate (>5% for 5 minutes)
- Slow response time (>2s for 5 minutes)
- Service down (health check fails 3 times)
- High memory usage (>90% for 10 minutes)

---

## Disaster Recovery

### Network Failover
1. Primary backend fails -> Nginx routes to backup
2. Database connection lost -> Retry with exponential backoff
3. Redis unavailable -> Fallback to direct database queries
4. RabbitMQ down -> Queue messages in local buffer

### Backup Communication Channels
- Primary: HTTP/REST
- Fallback 1: Message Queue
- Fallback 2: Direct database writes
- Emergency: File-based communication
