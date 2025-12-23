# AI Emulators Ecosystem - Monitoring & Troubleshooting

## Table of Contents

1. [Health Check Procedures](#health-check-procedures)
2. [Log Aggregation and Analysis](#log-aggregation-and-analysis)
3. [Performance Monitoring](#performance-monitoring)
4. [Common Issues and Solutions](#common-issues-and-solutions)
5. [Alert Management](#alert-management)
6. [Debugging Tools](#debugging-tools)
7. [Incident Response](#incident-response)

## Health Check Procedures

### Service Health Endpoints

Each service in the ecosystem exposes health check endpoints for monitoring:

#### Core Infrastructure Health Checks

```bash
# PostgreSQL Health Check
curl -f http://localhost:5432/health || echo "PostgreSQL unhealthy"

# Redis Health Check
redis-cli ping || echo "Redis unhealthy"

# MCP Registry Health Check
curl -f http://localhost:8002/health || echo "MCP Registry unhealthy"
```

#### Service-Specific Health Checks

```bash
# AIOS Health Check
curl -f http://localhost:8000/health || echo "AIOS unhealthy"

# gbox Health Check
curl -f http://localhost:3000/health || echo "gbox unhealthy"

# Computer Control Services
curl -f http://localhost:4000/health || echo "bytebot unhealthy"
curl -f http://localhost:5000/health || echo "open-interface unhealthy"
curl -f http://localhost:6000/health || echo "macOS-use unhealthy"
curl -f http://localhost:7000/health || echo "factif-ai unhealthy"

# Social/Content Services
curl -f http://localhost:9000/health || echo "postiz-app unhealthy"
curl -f http://localhost:10000/health || echo "onlysnarf unhealthy"
curl -f http://localhost:11000/health || echo "reels-clips-automator unhealthy"
curl -f http://localhost:12000/health || echo "wan2gp unhealthy"
```

### Comprehensive Health Check Script

```bash
#!/bin/bash
# comprehensive-health-check.sh

echo "=== AI Emulators Ecosystem Health Check ==="
echo "Timestamp: $(date)"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check service health
check_service() {
    local name=$1
    local url=$2
    local timeout=${3:-10}

    echo -n "Checking $name... "

    if timeout $timeout curl -s --max-time $timeout -f "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ HEALTHY${NC}"
        return 0
    else
        echo -e "${RED}✗ UNHEALTHY${NC}"
        return 1
    fi
}

# Infrastructure checks
echo "=== Infrastructure Services ==="
check_service "PostgreSQL" "http://localhost:5432/health"
check_service "Redis" "http://localhost:6379/health"
check_service "MCP Registry" "http://localhost:8002/health"
echo

# Core AI services
echo "=== AI/LLM Services ==="
check_service "AIOS" "http://localhost:8000/health"
check_service "gbox" "http://localhost:3000/health"
echo

# Computer control services
echo "=== Computer Control Services ==="
check_service "bytebot" "http://localhost:4000/health"
check_service "Open-Interface" "http://localhost:5000/health"
check_service "macOS-use" "http://localhost:6000/health"
check_service "factif-ai" "http://localhost:7000/health"
echo

# Social and content services
echo "=== Social & Content Services ==="
check_service "postiz-app" "http://localhost:9000/health"
check_service "onlysnarf" "http://localhost:10000/health"
check_service "reels-clips-automator" "http://localhost:11000/health"
check_service "Wan2GP" "http://localhost:12000/health"
echo

# Docker services status
echo "=== Docker Services Status ==="
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
echo

# Resource usage
echo "=== Resource Usage ==="
echo "CPU and Memory usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemPerc}}\t{{.NetIO}}"
echo

# Network connectivity
echo "=== Network Connectivity ==="
echo "Testing internal network connectivity..."
docker run --rm --network ai-ecosystem_ai_network \
  curlimages/curl --connect-timeout 5 http://aios:8000/health > /dev/null 2>&1 && \
  echo -e "AI Network: ${GREEN}✓ Connected${NC}" || \
  echo -e "AI Network: ${RED}✗ Disconnected${NC}"

docker run --rm --network ai-ecosystem_mcp_network \
  curlimages/curl --connect-timeout 5 http://mcp-registry:8002/health > /dev/null 2>&1 && \
  echo -e "MCP Network: ${GREEN}✓ Connected${NC}" || \
  echo -e "MCP Network: ${RED}✗ Disconnected${NC}"
echo

echo "Health check completed at $(date)"
```

### Automated Health Monitoring

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  health-checker:
    image: curlimages/curl
    command: >
      sh -c "
        while true; do
          echo 'Running health checks...' &&
          curl -f http://aios:8000/health &&
          curl -f http://gbox:3000/health &&
          curl -f http://mcp-registry:8002/health &&
          echo 'All services healthy' &&
          sleep 60
        done
      "
    networks:
      - ai_network
      - mcp_network
    depends_on:
      - aios
      - gbox
      - mcp-registry
    restart: unless-stopped

  prometheus-blackbox-exporter:
    image: prom/blackbox-exporter
    volumes:
      - ./monitoring/blackbox.yml:/etc/blackbox_exporter/config.yml
    command:
      - '--config.file=/etc/blackbox_exporter/config.yml'
    ports:
      - "9115:9115"
    networks:
      - monitoring_network
```

## Log Aggregation and Analysis

### Centralized Logging Setup

```yaml
# docker-compose.logging.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
      - "9300:9300"
    networks:
      - logging_network

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    volumes:
      - ./logging/logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5044:5044"
      - "9600:9600"
    depends_on:
      - elasticsearch
    networks:
      - logging_network

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
    networks:
      - logging_network
```

### Logstash Configuration

```conf
# logging/logstash.conf
input {
  tcp {
    port => 5044
    codec => json_lines
  }

  http {
    port => 8080
    additional_codecs => {
      "application/json" => "json"
    }
  }
}

filter {
  # Add service identification
  mutate {
    add_field => {
      "service" => "%{[kubernetes][labels][app]}" if [kubernetes][labels][app]
      "service" => "%{[@metadata][docker][container][labels][com.docker.compose.service]}" if [@metadata][docker][container][labels][com.docker.compose.service]
    }
  }

  # Parse timestamps
  date {
    match => ["timestamp", "ISO8601", "yyyy-MM-dd HH:mm:ss,SSS"]
    target => "@timestamp"
  }

  # Add log level parsing
  grok {
    match => { "message" => "%{LOGLEVEL:level} %{DATA:logger} - %{DATA:message}" }
  }

  # Error detection
  if [level] == "ERROR" or [level] == "FATAL" {
    mutate {
      add_tag => ["error"]
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "ai-ecosystem-%{+YYYY.MM.dd}"
  }

  stdout {
    codec => rubydebug
  }
}
```

### Service Logging Configuration

```javascript
// logging/logger.js - Centralized logging configuration
const winston = require('winston');
const ElasticsearchTransport = require('winston-elasticsearch');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'unknown',
    version: process.env.SERVICE_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console logging for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),

    // File logging
    new winston.transports.File({
      filename: '/app/logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: '/app/logs/combined.log'
    }),

    // Elasticsearch for production
    ...(process.env.ELASTICSEARCH_HOST ? [new ElasticsearchTransport({
      level: 'info',
      clientOpts: {
        node: process.env.ELASTICSEARCH_HOST,
        auth: {
          username: process.env.ELASTICSEARCH_USER,
          password: process.env.ELASTICSEARCH_PASSWORD
        }
      },
      indexPrefix: 'ai-ecosystem-logs'
    })] : [])
  ]
});

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });

  next();
};

// Error logging middleware
const errorLogger = (error, req, res, next) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    body: req.body,
    params: req.params,
    query: req.query
  });

  next(error);
};

module.exports = { logger, requestLogger, errorLogger };
```

### Log Analysis Queries

```bash
# Common log analysis commands

# View recent errors across all services
docker-compose logs --tail=100 | grep -i error

# Search for specific error patterns
docker-compose logs | grep -E "ERROR|FATAL" | head -20

# Analyze log volume by service
docker-compose logs | grep -o "service=[^ ]*" | sort | uniq -c | sort -nr

# Find slow requests (>5 seconds)
docker-compose logs | grep -E "duration=[0-9]+" | awk '$0 ~ /duration=[5-9][0-9]*/ || $0 ~ /duration=[0-9]{3,}/'

# Monitor error rate over time
docker-compose logs | grep ERROR | awk '{print substr($1,1,10)}' | sort | uniq -c

# Check for authentication failures
docker-compose logs | grep -i "unauthorized\|forbidden\|authentication"

# Analyze MCP tool usage
docker-compose logs | grep -E "tool.*executed|tool.*failed" | awk '{print $1, $2, $8}' | sort | uniq -c | sort -nr
```

## Performance Monitoring

### Prometheus Metrics Configuration

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  # AIOS Service
  - job_name: 'aios'
    static_configs:
      - targets: ['aios:8000']
    metrics_path: '/metrics'
    scrape_interval: 5s

  # gbox Service
  - job_name: 'gbox'
    static_configs:
      - targets: ['gbox:3000']
    metrics_path: '/metrics'

  # Computer Control Services
  - job_name: 'bytebot'
    static_configs:
      - targets: ['bytebot:4000']
    metrics_path: '/metrics'

  - job_name: 'open-interface'
    static_configs:
      - targets: ['open-interface:5000']
    metrics_path: '/metrics'

  # Database monitoring
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:9187']

  # Redis monitoring
  - job_name: 'redis'
    static_configs:
      - targets: ['redis:9121']

  # Docker monitoring
  - job_name: 'docker'
    static_configs:
      - targets: ['docker-exporter:9323']
    scrape_interval: 30s

  # Node Exporter (system metrics)
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']

  # MCP Registry
  - job_name: 'mcp-registry'
    static_configs:
      - targets: ['mcp-registry:8002']
    metrics_path: '/metrics'
```

### Application Metrics Implementation

```javascript
// metrics/metrics.js - Application metrics collection
const promClient = require('prom-client');
const register = new promClient.Registry();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

const toolExecutionCount = new promClient.Counter({
  name: 'tool_executions_total',
  help: 'Total number of tool executions',
  labelNames: ['tool_name', 'status']
});

const queueSize = new promClient.Gauge({
  name: 'queue_size',
  help: 'Current queue size',
  labelNames: ['queue_name']
});

// MCP-specific metrics
const mcpConnections = new promClient.Gauge({
  name: 'mcp_active_connections',
  help: 'Number of active MCP connections'
});

const mcpToolCalls = new promClient.Counter({
  name: 'mcp_tool_calls_total',
  help: 'Total MCP tool calls',
  labelNames: ['tool_name', 'client', 'status']
});

// Database metrics
const dbConnectionPoolSize = new promClient.Gauge({
  name: 'db_connection_pool_size',
  help: 'Database connection pool size',
  labelNames: ['pool_name']
});

const dbQueryDuration = new promClient.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration',
  labelNames: ['query_type', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5]
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(activeConnections);
register.registerMetric(toolExecutionCount);
register.registerMetric(queueSize);
register.registerMetric(mcpConnections);
register.registerMetric(mcpToolCalls);
register.registerMetric(dbConnectionPoolSize);
register.registerMetric(dbQueryDuration);

// Metrics middleware
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });

  next();
};

// Metrics endpoint
const metricsEndpoint = async (req, res) => {
  try {
    const metrics = await register.metrics();
    res.set('Content-Type', register.contentType);
    res.send(metrics);
  } catch (error) {
    res.status(500).send('Error generating metrics');
  }
};

module.exports = {
  register,
  metricsMiddleware,
  metricsEndpoint,
  // Individual metrics for use in application code
  activeConnections,
  toolExecutionCount,
  queueSize,
  mcpConnections,
  mcpToolCalls,
  dbConnectionPoolSize,
  dbQueryDuration
};
```

### Grafana Dashboards

```json
// monitoring/dashboards/overview.json - Main dashboard
{
  "dashboard": {
    "title": "AI Emulators Ecosystem Overview",
    "tags": ["ai-ecosystem", "overview"],
    "timezone": "browser",
    "panels": [
      {
        "title": "Service Health Status",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=~\"aios|gbox|bytebot|open-interface|factif-ai\"}",
            "legendFormat": "{{job}}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "mappings": [
              {
                "options": {
                  "0": {
                    "text": "DOWN",
                    "color": "red"
                  },
                  "1": {
                    "text": "UP",
                    "color": "green"
                  }
                },
                "type": "value"
              }
            ]
          }
        }
      },
      {
        "title": "HTTP Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{status}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "MCP Tool Usage",
        "type": "barchart",
        "targets": [
          {
            "expr": "increase(mcp_tool_calls_total[1h])",
            "legendFormat": "{{tool_name}}"
          }
        ]
      },
      {
        "title": "Resource Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "100 - (avg by (instance) (irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "CPU Usage %"
          },
          {
            "expr": "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100",
            "legendFormat": "Memory Usage %"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m]) * 100",
            "legendFormat": "5xx Error Rate %"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
```

### Performance Alert Rules

```yaml
# monitoring/alert_rules.yml
groups:
  - name: ai-ecosystem-alerts
    rules:
      # Service down alerts
      - alert: ServiceDown
        expr: up == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.job }} is down"
          description: "Service {{ $labels.job }} has been down for more than 5 minutes."

      # High error rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"[5].."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate on {{ $labels.job }}"
          description: "Error rate is {{ $value | printf \"%.2f\" }}%"

      # High response time
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time on {{ $labels.job }}"
          description: "95th percentile response time is {{ $value | printf \"%.2f\" }}s"

      # Resource usage alerts
      - alert: HighCPUUsage
        expr: 100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 90
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
          description: "CPU usage is {{ $value | printf \"%.1f\" }}%"

      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 90
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
          description: "Memory usage is {{ $value | printf \"%.1f\" }}%"

      # Database connection issues
      - alert: DatabaseConnectionsHigh
        expr: pg_stat_activity_count > 100
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High database connections"
          description: "Database has {{ $value }} active connections"

      # MCP-specific alerts
      - alert: MCPToolFailures
        expr: rate(mcp_tool_calls_total{status="error"}[5m]) > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High MCP tool failure rate"
          description: "MCP tool failure rate is {{ $value | printf \"%.1f\" }}/s"
```

## Common Issues and Solutions

### Service Startup Issues

**Problem**: Service fails to start with "port already in use"

**Solution**:
```bash
# Find what's using the port
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or use a different port in docker-compose.yml
services:
  aios:
    ports:
      - "8001:8000"  # Change host port
```

**Problem**: Database connection refused

**Solution**:
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Reset database
docker-compose down postgres
docker volume rm ai-ecosystem_postgres_data
docker-compose up -d postgres
```

### Performance Issues

**Problem**: High memory usage

**Solutions**:
```bash
# Check memory usage
docker stats

# Add memory limits to docker-compose.yml
services:
  aios:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G

# Enable garbage collection tuning
environment:
  - NODE_OPTIONS=--max-old-space-size=2048
  - GOGC=50  # For Go services
```

**Problem**: Slow API responses

**Solutions**:
```javascript
// Add response caching
const cache = require('memory-cache');

app.use((req, res, next) => {
  const key = req.originalUrl;
  const cached = cache.get(key);

  if (cached) {
    return res.json(cached);
  }

  res.sendResponse = res.json;
  res.json = (body) => {
    cache.put(key, body, 300000); // Cache for 5 minutes
    res.sendResponse(body);
  };

  next();
});
```

### Networking Issues

**Problem**: Services can't communicate with each other

**Solution**:
```bash
# Check network connectivity
docker network ls
docker network inspect ai-ecosystem_ai_network

# Test service connectivity
docker exec aios curl -f http://gbox:3000/health

# Restart networks
docker-compose down
docker-compose up -d
```

**Problem**: External access not working

**Solution**:
```bash
# Check firewall rules
sudo ufw status

# Allow required ports
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 8000:12000/tcp

# Check nginx configuration
sudo nginx -t
sudo systemctl reload nginx
```

### MCP-Specific Issues

**Problem**: MCP tools not registering

**Solution**:
```bash
# Check MCP registry
curl http://localhost:8002/services

# Restart MCP registry
docker-compose restart mcp-registry

# Check tool registration logs
docker-compose logs mcp-registry

# Verify tool configuration
curl http://localhost:8002/tools/kali-desktop
```

**Problem**: Tool execution timeouts

**Solutions**:
```javascript
// Increase timeout in client
const client = new MCPClient('node', ['server.js']);
client.timeout = 60000; // 60 seconds

// Add retry logic
async function executeWithRetry(toolName, args, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.callTool(toolName, args);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### Database Issues

**Problem**: Connection pool exhausted

**Solution**:
```javascript
// Increase pool size
const pool = new Pool({
  max: 20, // Increase from default
  min: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Monitor pool status
setInterval(() => {
  console.log('Pool stats:', {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount
  });
}, 5000);
```

**Problem**: Slow queries

**Solutions**:
```sql
-- Add database indexes
CREATE INDEX idx_ai_logs_timestamp ON ai_logs (timestamp);
CREATE INDEX idx_ai_logs_level ON ai_logs (level);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM ai_logs WHERE timestamp > '2024-01-01';

-- Add query timeout
SET statement_timeout = '30s';
```

### GPU/Compute Issues

**Problem**: CUDA out of memory

**Solutions**:
```python
# Clear GPU memory
torch.cuda.empty_cache()

# Limit GPU memory usage
torch.cuda.set_per_process_memory_fraction(0.8)

# Monitor GPU usage
nvidia-smi --query-gpu=memory.used,memory.total --format=csv
```

**Problem**: GPU not accessible

**Solution**:
```bash
# Check NVIDIA drivers
nvidia-smi

# Verify Docker GPU support
docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi

# Check GPU allocation in compose
services:
  wan2gp:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

## Alert Management

### Alertmanager Configuration

```yaml
# monitoring/alertmanager.yml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@ai-ecosystem.com'
  smtp_auth_username: 'alerts@ai-ecosystem.com'
  smtp_auth_password: 'your-smtp-password'

route:
  group_by: ['alertname', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'team'
  routes:
    - match:
        severity: critical
      receiver: 'team-critical'
    - match:
        service: database
      receiver: 'database-team'

receivers:
  - name: 'team'
    email_configs:
      - to: 'team@company.com'
        send_resolved: true
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
        channel: '#alerts'
        send_resolved: true

  - name: 'team-critical'
    email_configs:
      - to: 'oncall@company.com'
        send_resolved: true
    pagerduty_configs:
      - service_key: 'your-pagerduty-service-key'

  - name: 'database-team'
    email_configs:
      - to: 'database-team@company.com'
        send_resolved: true
```

### Alert Response Procedures

#### Critical Alerts (Immediate Response Required)

1. **Service Down Alert**
   ```bash
   # Immediate investigation
   docker-compose ps [service-name]
   docker-compose logs --tail=50 [service-name]

   # Attempt restart
   docker-compose restart [service-name]

   # If restart fails, check dependencies
   docker-compose ps postgres redis

   # Escalate if service remains down after 5 minutes
   ```

2. **Database Connection Issues**
   ```bash
   # Check database status
   docker-compose exec postgres pg_isready

   # Check connection count
   docker-compose exec postgres psql -U admin -d ai_ecosystem -c "SELECT count(*) FROM pg_stat_activity;"

   # Restart database if needed
   docker-compose restart postgres

   # Check disk space
   df -h
   ```

#### Warning Alerts (Response within 30 minutes)

1. **High Error Rate**
   ```bash
   # Check recent logs
   docker-compose logs --since 30m | grep -i error | tail -20

   # Check service metrics
   curl http://localhost:9090/api/v1/query?query=rate(http_requests_total{status=~"[5].."}[5m])

   # Investigate root cause
   # - Check resource usage
   # - Review recent deployments
   # - Check external dependencies
   ```

2. **High Response Time**
   ```bash
   # Check current load
   docker stats

   # Analyze slow requests
   docker-compose logs | grep -E "duration=[0-9]+" | awk '$0 ~ /duration=[5-9][0-9]*/' | tail -10

   # Check database performance
   docker-compose exec postgres psql -U admin -d ai_ecosystem -c "SELECT * FROM pg_stat_activity WHERE state != 'idle';"
   ```

## Debugging Tools

### Debug Container Setup

```yaml
# docker-compose.debug.yml
version: '3.8'

services:
  debugger:
    image: ubuntu:20.04
    command: sleep infinity
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./debug-tools:/debug-tools
    networks:
      - ai_network
      - automation_network
      - mcp_network
    cap_add:
      - SYS_PTRACE
    security_opt:
      - apparmor:unconfined

  network-debugger:
    image: nicolaka/netshoot
    command: sleep infinity
    networks:
      - ai_network
      - automation_network
      - mcp_network
      - database_network
```

### Debug Scripts

```bash
# debug/network-debug.sh
#!/bin/bash

echo "=== Network Debugging ==="

# Test connectivity between services
echo "Testing service connectivity..."

# AI Network
docker run --rm --network ai-ecosystem_ai_network curlimages/curl \
  --connect-timeout 5 http://aios:8000/health && echo "AIOS: OK" || echo "AIOS: FAIL"

docker run --rm --network ai-ecosystem_ai_network curlimages/curl \
  --connect-timeout 5 http://gbox:3000/health && echo "gbox: OK" || echo "gbox: FAIL"

# MCP Network
docker run --rm --network ai-ecosystem_mcp_network curlimages/curl \
  --connect-timeout 5 http://mcp-registry:8002/health && echo "MCP Registry: OK" || echo "MCP Registry: FAIL"

# Database Network
docker run --rm --network ai-ecosystem_database_network \
  postgres:15-alpine psql postgresql://admin:password@postgres:5432/ai_ecosystem -c "SELECT 1" && \
  echo "Database: OK" || echo "Database: FAIL"

echo "Network debugging completed."
```

```bash
# debug/performance-debug.sh
#!/bin/bash

echo "=== Performance Debugging ==="

# CPU and Memory usage
echo "Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"

echo -e "\nTop processes by CPU:"
docker exec aios ps aux --sort=-%cpu | head -10

echo -e "\nTop processes by memory:"
docker exec aios ps aux --sort=-%mem | head -10

# Network connections
echo -e "\nNetwork connections:"
docker exec aios netstat -tuln | grep LISTEN

# Disk usage
echo -e "\nDisk usage:"
docker exec aios df -h

# Database performance
echo -e "\nDatabase connections:"
docker exec postgres psql -U admin -d ai_ecosystem -c "SELECT count(*) as active_connections FROM pg_stat_activity WHERE state != 'idle';"

echo -e "\nSlow queries (last 5 minutes):"
docker exec postgres psql -U admin -d ai_ecosystem -c "
SELECT query, total_time, calls
FROM pg_stat_statements
WHERE total_time > 1000
ORDER BY total_time DESC
LIMIT 10;
"

echo "Performance debugging completed."
```

## Incident Response

### Incident Response Plan

#### Phase 1: Detection and Assessment (0-5 minutes)

1. **Alert Triage**
   ```bash
   # Check alert details
   curl http://localhost:9090/api/v1/alerts

   # Assess impact
   ./health-check.sh

   # Determine severity and scope
   ```

2. **Initial Assessment**
   - Check affected services
   - Assess user impact
   - Determine if it's a widespread outage

#### Phase 2: Containment (5-15 minutes)

1. **Isolate the Issue**
   ```bash
   # Stop failing service
   docker-compose stop [affected-service]

   # Check if other services are affected
   docker-compose ps
   ```

2. **Implement Temporary Fix**
   ```bash
   # Scale up healthy instances
   docker-compose up -d --scale aios=3

   # Route traffic away from failing service
   # Update nginx configuration if needed
   ```

#### Phase 3: Investigation (15-60 minutes)

1. **Gather Evidence**
   ```bash
   # Collect logs
   docker-compose logs --since 1h > incident_logs.txt

   # Check metrics
   curl "http://localhost:9090/api/v1/query_range?query=up&start=$(date -d '1 hour ago' +%s)&end=$(date +%s)&step=60"

   # Review recent changes
   git log --oneline -10
   ```

2. **Root Cause Analysis**
   - Analyze logs for error patterns
   - Check resource usage trends
   - Review configuration changes
   - Test hypotheses

#### Phase 4: Resolution and Recovery (1-4 hours)

1. **Implement Fix**
   ```bash
   # Apply configuration fix
   docker-compose up -d --force-recreate [service]

   # Roll back if needed
   git checkout [previous-commit]
   docker-compose up -d
   ```

2. **Verify Fix**
   ```bash
   # Run health checks
   ./health-check.sh

   # Monitor for 30 minutes
   watch -n 30 ./health-check.sh
   ```

#### Phase 5: Post-Incident Review (Next Business Day)

1. **Incident Documentation**
   ```markdown
   # Incident Report: [Date] - [Brief Description]

   ## Timeline
   - Detection: [time]
   - Response: [time]
   - Resolution: [time]

   ## Impact
   - Affected services: [list]
   - User impact: [description]
   - Duration: [time]

   ## Root Cause
   [Detailed analysis]

   ## Resolution
   [Steps taken to resolve]

   ## Prevention
   [Measures to prevent recurrence]
   ```

2. **Improvement Actions**
   - Update monitoring/alerting rules
   - Improve documentation
   - Implement additional safeguards
   - Schedule follow-up review

### Communication Templates

#### Internal Incident Notification
```markdown
🚨 **INCIDENT ALERT** 🚨

**Status**: [ACTIVE/RESOLVED]
**Severity**: [CRITICAL/HIGH/MEDIUM/LOW]
**Affected Service(s)**: [service names]
**Start Time**: [timestamp]
**Description**: [brief description]

**Current Status**: [what's happening]
**Impact**: [user/business impact]
**ETA**: [estimated resolution time]

**Response Team**: [team members involved]
**Communication Channel**: [Slack channel/teams call]

**Next Update**: [time]
```

#### Customer Communication Template
```markdown
Subject: [AI Emulators Ecosystem] Service Interruption - Update

Dear valued customer,

We are currently experiencing a [brief description] with our [service name].

**Current Status**: [ACTIVE/RESOLVED]
**Start Time**: [timestamp]
**Estimated Resolution**: [time]

**What this means for you**:
[Impact description]

**What we're doing**:
[Response actions]

We apologize for any inconvenience this may cause. Our team is working diligently to resolve this issue.

We'll provide updates every [frequency] or as the situation changes.

Best regards,
AI Emulators Ecosystem Team
```

---

For health check procedures, see the script above
For alerting configuration, see [monitoring/alertmanager.yml](./monitoring/alertmanager.yml)
For incident response plan, see [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)