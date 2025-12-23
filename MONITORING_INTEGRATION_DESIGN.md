# AI Ecosystem Monitoring Integration Design

This document outlines the integration of MCP Registry, Prometheus/Grafana monitoring stack, and Docker orchestration into project monitoring tabs.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Projects UI   │    │ Monitoring API  │    │   Monitoring    │
│   (React)       │◄──►│   (Node.js)     │◄──►│   Stack         │
│                 │    │                 │    │                 │
│ • Service Tabs  │    │ • REST API      │    │ • Prometheus    │
│ • Control UI    │    │ • WebSocket     │    │ • Grafana       │
│ • Dashboards    │    │ • Docker API    │    │ • Loki          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────┐
                    │ Docker Compose  │
                    │ Orchestration   │
                    └─────────────────┘
```

## Components Integration

### 1. MCP Registry Integration

**Purpose**: Service discovery and management for MCP servers across projects.

**Integration Points**:
- **API Endpoint**: `/api/mcp/servers`
- **Project Filtering**: `/api/mcp/servers/project/{project}`
- **Status Monitoring**: Real-time MCP server health checks
- **UI Display**: MCP server cards in project monitoring tabs

**Benefits**:
- Centralized discovery of MCP capabilities per project
- Health monitoring of MCP endpoints
- Service registration and metadata management

### 2. Monitoring Stack Integration

**Components**:
- **Prometheus**: Metrics collection from all services
- **Grafana**: Dashboard visualization
- **Loki + Promtail**: Centralized logging
- **Alertmanager**: Alert routing and notifications

**Project-Specific Dashboards**:
- Service health overview
- Resource usage (CPU, memory, disk)
- Application metrics (response times, error rates)
- Business metrics (if available)

**Integration API**:
- `/api/monitoring/metrics/{service}` - Service metrics
- `/api/monitoring/dashboard/{project}` - Dashboard URL
- `/api/monitoring/alerts` - Active alerts

### 3. Docker Orchestration Controls

**Service Management**:
- **Start/Stop/Restart**: Individual service controls
- **Health Monitoring**: Docker health checks integration
- **Resource Limits**: CPU and memory constraints
- **Logs Access**: Real-time log streaming

**API Endpoints**:
- `GET /api/docker/services` - List all services
- `POST /api/docker/services/{name}/start` - Start service
- `POST /api/docker/services/{name}/stop` - Stop service
- `POST /api/docker/services/{name}/restart` - Restart service
- `GET /api/docker/services/{name}/logs` - Get service logs

## Project Monitoring Tabs UI

### Tab Structure

Each project tab contains:

1. **Service Status Panel**
   - Grid of service cards with health indicators
   - Quick action buttons (start/stop/restart)
   - Resource usage meters

2. **Observability Dashboard**
   - Embedded Grafana panels
   - Real-time metrics visualization
   - Custom project-specific views

3. **Logs Viewer**
   - Real-time log streaming
   - Filterable by service and log level
   - Search functionality

4. **MCP Server Registry**
   - Available MCP servers for the project
   - Connection status and endpoints
   - Quick-connect capabilities

### Real-Time Updates

- **WebSocket Integration**: Live service status updates
- **Auto-refresh**: Metrics and logs update every 30 seconds
- **Event-driven**: Immediate updates on service state changes

## API Design

### Monitoring API Service

**Base URL**: `http://localhost:8080`

**Endpoints**:

#### Projects
- `GET /api/projects/{project}/overview` - Project monitoring overview
- `GET /api/projects/{project}/services/{service}` - Service details
- `POST /api/projects/{project}/services/{service}/{action}` - Control service
- `GET /api/projects/{project}/logs` - Project logs

#### Docker
- `GET /api/docker/services` - All services
- `GET /api/docker/services/{name}` - Service status
- `GET /api/docker/services/{name}/logs` - Service logs
- `GET /api/docker/services/{name}/metrics` - Service metrics

#### Monitoring
- `GET /api/monitoring/metrics/{service}` - Service metrics
- `GET /api/monitoring/dashboard/{project}` - Dashboard URL
- `GET /api/monitoring/alerts` - Active alerts
- `GET /api/monitoring/overview` - System overview

#### MCP
- `GET /api/mcp/servers` - All MCP servers
- `GET /api/mcp/servers/project/{project}` - Project MCP servers
- `POST /api/mcp/servers` - Register MCP server
- `GET /api/mcp/servers/{id}/status` - MCP server status

## Security Considerations

### Access Control
- API authentication via JWT tokens
- Project-based authorization
- Docker socket access restrictions

### Network Security
- Internal network isolation
- Secure WebSocket connections
- HTTPS for external access

### Data Protection
- Secure secrets management
- Log data encryption at rest
- Metrics data retention policies

## Deployment

### Docker Compose Integration

Add to `docker-compose.ecosystem.yml`:

```yaml
monitoring-api:
  build: ./monitoring-api
  ports:
    - "8080:8080"
  environment:
    - DOCKER_HOST=unix:///var/run/docker.sock
    - PROMETHEUS_URL=http://prometheus:9090
    - GRAFANA_URL=http://grafana:3000
    - LOKI_URL=http://loki:3100
    - MCP_REGISTRY_URL=http://mcp-registry:8002
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock:ro
  depends_on:
    - prometheus
    - grafana
    - loki
    - mcp-registry
  networks:
    - monitoring_network
    - mcp_network
```

### Configuration

**Environment Variables**:
- `DOCKER_SOCKET` - Docker daemon socket path
- `PROMETHEUS_URL` - Prometheus API endpoint
- `GRAFANA_URL` - Grafana dashboard URL
- `LOKI_URL` - Loki logging API endpoint
- `MCP_REGISTRY_URL` - MCP registry API endpoint

## Benefits

1. **Unified Monitoring**: Single pane of glass for all project services
2. **Real-time Control**: Immediate service management capabilities
3. **Comprehensive Observability**: Metrics, logs, and traces in one place
4. **MCP Integration**: Seamless access to MCP capabilities
5. **Scalable Architecture**: Horizontal scaling of monitoring components
6. **Developer Experience**: Easy-to-use UI for development and operations

## Future Enhancements

1. **Advanced Alerting**: Custom alert rules per project
2. **Performance Analytics**: Historical trend analysis
3. **Automated Remediation**: Self-healing capabilities
4. **Multi-cluster Support**: Kubernetes integration
5. **Custom Dashboards**: User-configurable monitoring views