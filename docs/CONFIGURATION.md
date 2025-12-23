# AI Emulators Ecosystem - Configuration Management

## Table of Contents

1. [Environment Variables](#environment-variables)
2. [Configuration Templates](#configuration-templates)
3. [Security Configuration](#security-configuration)
4. [Performance Tuning](#performance-tuning)
5. [Service-Specific Configuration](#service-specific-configuration)
6. [Configuration Validation](#configuration-validation)

## Environment Variables

### Core Infrastructure Variables

#### Database Configuration
```bash
# PostgreSQL Database Settings
POSTGRES_DB=ai_ecosystem
POSTGRES_USER=admin
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Connection Pool Settings
DB_POOL_SIZE=10
DB_MAX_CONNECTIONS=100
DB_CONNECTION_TIMEOUT=30

# SSL Configuration (Production)
DB_SSL_MODE=require
DB_SSL_CERT=/path/to/client.crt
DB_SSL_KEY=/path/to/client.key
DB_SSL_CA=/path/to/ca.crt
```

#### Redis Cache Configuration
```bash
# Redis Connection
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=
REDIS_DB=0

# Redis Cluster (for HA setup)
REDIS_CLUSTER_ENABLED=false
REDIS_CLUSTER_NODES=redis-1:6379,redis-2:6379,redis-3:6379

# Redis Sentinel (for HA with failover)
REDIS_SENTINEL_ENABLED=false
REDIS_SENTINEL_MASTERS=mymaster
REDIS_SENTINEL_HOSTS=sentinel-1:26379,sentinel-2:26379,sentinel-3:26379
```

#### Authentication & Security
```bash
# JWT Configuration
JWT_SECRET=your-256-bit-secret-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
JWT_REFRESH_EXPIRATION_DAYS=7

# API Key Authentication
API_KEY_HEADER=X-API-Key
API_KEY_REQUIRED=true

# OAuth2 (optional)
OAUTH2_ENABLED=false
OAUTH2_CLIENT_ID=your-client-id
OAUTH2_CLIENT_SECRET=your-client-secret
OAUTH2_REDIRECT_URI=http://localhost:8000/auth/callback

# Session Management
SESSION_SECRET=your-session-secret-here
SESSION_TIMEOUT_MINUTES=60
SESSION_SECURE_COOKIES=true
```

### AI/ML Service Variables

#### OpenAI Configuration
```bash
# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_ORGANIZATION=org-your-org-id
OPENAI_API_BASE=https://api.openai.com/v1
OPENAI_DEFAULT_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=4096
OPENAI_TEMPERATURE=0.7

# Rate Limiting
OPENAI_RATE_LIMIT_REQUESTS_PER_MINUTE=60
OPENAI_RATE_LIMIT_TOKENS_PER_MINUTE=40000

# Fallback Models
OPENAI_FALLBACK_MODELS=gpt-3.5-turbo,gpt-4
```

#### Hugging Face Configuration
```bash
# Hugging Face Hub
HUGGINGFACE_TOKEN=hf_your-huggingface-token-here
HUGGINGFACE_CACHE_DIR=/app/models/cache
HUGGINGFACE_OFFLINE=false

# Model Configuration
HUGGINGFACE_DEFAULT_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
HUGGINGFACE_DEFAULT_GENERATION_MODEL=microsoft/DialoGPT-medium

# Local Model Serving
HUGGINGFACE_LOCAL_MODELS_DIR=/app/models/local
HUGGINGFACE_AUTO_DOWNLOAD=true
```

#### GPU Configuration
```bash
# CUDA Settings
CUDA_VISIBLE_DEVICES=all
CUDA_DEVICE_ORDER=PCI_BUS_ID
CUDA_LAUNCH_BLOCKING=0

# PyTorch Configuration
TORCH_CUDA_ARCH_LIST=7.0;7.5;8.0;8.6;8.9;9.0
TORCH_USE_CUDA_DSA=1
PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512

# TensorFlow Configuration (if used)
TF_CPP_MIN_LOG_LEVEL=2
TF_ENABLE_ONEDNN_OPTS=1
```

### Service-Specific Variables

#### AIOS (AI Operating System)
```bash
# AIOS Core Settings
AIOS_NODE_ENV=production
AIOS_LOG_LEVEL=INFO
AIOS_PORT=8000
AIOS_HOST=0.0.0.0

# Memory Management
AIOS_MEMORY_LIMIT=8GB
AIOS_MEMORY_WARNING_THRESHOLD=0.8
AIOS_MEMORY_CRITICAL_THRESHOLD=0.9

# Tool Configuration
AIOS_MAX_TOOLS_PER_REQUEST=10
AIOS_TOOL_TIMEOUT_SECONDS=300
AIOS_TOOL_CONCURRENT_LIMIT=5

# MCP Integration
AIOS_MCP_ENABLED=true
AIOS_MCP_PORT=8001
AIOS_MCP_REGISTRY_URL=http://mcp-registry:8002
```

#### Computer Control Services
```bash
# VNC Configuration
VNC_PASSWORD=your-vnc-password
VNC_GEOMETRY=1920x1080
VNC_DEPTH=24
VNC_DISPLAY=:1

# Selenium/WebDriver
SELENIUM_HUB_URL=http://selenium-hub:4444/wd/hub
SELENIUM_BROWSER=chrome
SELENIUM_HEADLESS=true
SELENIUM_WINDOW_SIZE=1920,1080

# Desktop Automation
DESKTOP_AUTO_TIMEOUT=30
DESKTOP_AUTO_RETRY_ATTEMPTS=3
DESKTOP_AUTO_RETRY_DELAY=5
```

#### Social Media Services
```bash
# Twitter API
TWITTER_API_KEY=your-twitter-api-key
TWITTER_API_SECRET=your-twitter-api-secret
TWITTER_ACCESS_TOKEN=your-twitter-access-token
TWITTER_ACCESS_TOKEN_SECRET=your-twitter-access-token-secret

# Instagram API
INSTAGRAM_ACCESS_TOKEN=your-instagram-access-token
INSTAGRAM_CLIENT_ID=your-instagram-client-id
INSTAGRAM_CLIENT_SECRET=your-instagram-client-secret

# General Social API
SOCIAL_API_TIMEOUT=30
SOCIAL_API_RATE_LIMIT_BUFFER=0.1
SOCIAL_API_MAX_RETRIES=3
```

### Monitoring & Observability

#### Prometheus Configuration
```bash
# Prometheus Settings
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090
PROMETHEUS_RETENTION_TIME=200h
PROMETHEUS_RETENTION_SIZE=10GB

# Metrics Collection
METRICS_ENABLED=true
METRICS_PREFIX=ai_ecosystem
METRICS_INTERVAL=15s
```

#### Logging Configuration
```bash
# Log Settings
LOG_LEVEL=INFO
LOG_FORMAT=json
LOG_FILE=/app/logs/application.log
LOG_MAX_SIZE=100MB
LOG_MAX_FILES=5

# Structured Logging
LOG_STRUCTURED=true
LOG_INCLUDE_TIMESTAMP=true
LOG_INCLUDE_LEVEL=true
LOG_INCLUDE_SERVICE=true
LOG_INCLUDE_REQUEST_ID=true

# External Logging
LOG_EXTERNAL_ENABLED=false
LOG_EXTERNAL_URL=http://logstash:5044
LOG_EXTERNAL_INDEX=ai-ecosystem
```

#### Health Check Configuration
```bash
# Health Check Settings
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_PORT=8080
HEALTH_CHECK_PATH=/health
HEALTH_CHECK_TIMEOUT=30s
HEALTH_CHECK_INTERVAL=30s

# Dependency Health Checks
HEALTH_CHECK_DATABASE=true
HEALTH_CHECK_REDIS=true
HEALTH_CHECK_EXTERNAL_APIS=true
```

## Configuration Templates

### Docker Compose Environment Template

```yaml
# .env.template
# Copy this file to .env and fill in your values

# ==========================================
# INFRASTRUCTURE CONFIGURATION
# ==========================================

# Database
POSTGRES_PASSWORD=CHANGE_THIS_STRONG_PASSWORD
POSTGRES_DB=ai_ecosystem
POSTGRES_USER=admin

# Redis
REDIS_URL=redis://redis:6379

# Authentication
JWT_SECRET=CHANGE_THIS_TO_A_RANDOM_256_BIT_SECRET
JWT_EXPIRATION_HOURS=24

# ==========================================
# AI/ML SERVICE CONFIGURATION
# ==========================================

# OpenAI (Required for most AI features)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Hugging Face (Optional, for local models)
HUGGINGFACE_TOKEN=hf_your-huggingface-token-here

# GPU Configuration (if available)
CUDA_VISIBLE_DEVICES=all

# ==========================================
# SERVICE-SPECIFIC CONFIGURATION
# ==========================================

# AIOS
AIOS_LOG_LEVEL=INFO
AIOS_MEMORY_LIMIT=8GB

# Computer Control
VNC_PASSWORD=CHANGE_THIS_VNC_PASSWORD

# Social Media (Optional)
# TWITTER_API_KEY=your-twitter-api-key
# INSTAGRAM_ACCESS_TOKEN=your-instagram-token

# ==========================================
# MONITORING CONFIGURATION
# ==========================================

# Grafana
GRAFANA_PASSWORD=CHANGE_THIS_GRAFANA_PASSWORD

# Prometheus
PROMETHEUS_RETENTION_TIME=200h

# ==========================================
# DEVELOPMENT/DEBUG CONFIGURATION
# ==========================================

# Development Mode
NODE_ENV=production
LOG_LEVEL=INFO

# Debug Settings (set to true for development)
DEBUG_MODE=false
ENABLE_SWAGGER_DOCS=false
```

### Service Configuration Template

```yaml
# config/service-config.yaml.template
# Service-specific configuration template

service:
  name: "aios"
  version: "1.0.0"
  environment: "production"

server:
  host: "0.0.0.0"
  port: 8000
  workers: 4
  timeout: 300

database:
  url: "${DATABASE_URL}"
  pool_size: 10
  max_connections: 100
  connection_timeout: 30

cache:
  redis_url: "${REDIS_URL}"
  ttl: 3600
  max_memory: "512mb"

ai:
  openai:
    api_key: "${OPENAI_API_KEY}"
    default_model: "gpt-4-turbo-preview"
    max_tokens: 4096
    temperature: 0.7
  huggingface:
    token: "${HUGGINGFACE_TOKEN}"
    cache_dir: "/app/models/cache"

mcp:
  enabled: true
  port: 8001
  registry_url: "http://mcp-registry:8002"
  tools:
    - name: "kali_desktop"
      enabled: true
    - name: "computer_control"
      enabled: true

monitoring:
  enabled: true
  prometheus_port: 9090
  metrics_prefix: "ai_ecosystem"
  health_check:
    enabled: true
    path: "/health"
    timeout: "30s"

logging:
  level: "INFO"
  format: "json"
  file: "/app/logs/application.log"
  max_size: "100MB"
  max_files: 5

security:
  jwt_secret: "${JWT_SECRET}"
  jwt_algorithm: "HS256"
  jwt_expiration_hours: 24
  cors_origins:
    - "http://localhost:3000"
    - "https://your-domain.com"
```

### Nginx Configuration Template

```nginx
# nginx/nginx.conf.template

upstream aios_backends {
    {{range .Services}}
    server {{.Host}}:{{.Port}};
    {{end}}
}

server {
    listen 80;
    server_name {{.Domain}};

    # Redirect to HTTPS in production
    {{if .SSL}}
    return 301 https://$server_name$request_uri;
    {{end}}
}

{{if .SSL}}
server {
    listen 443 ssl http2;
    server_name {{.Domain}};

    ssl_certificate {{.SSLCertPath}};
    ssl_certificate_key {{.SSLKeyPath}};

    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # API Routing
    location /api/ {
        proxy_pass http://aios_backends;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Static Files
    location /static/ {
        alias /app/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health Check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Monitoring (Protected)
    location /monitoring/ {
        auth_basic "Monitoring";
        auth_basic_user_file {{.HtpasswdPath}};
        proxy_pass http://grafana:3000/;
    }
}
{{end}}
```

## Security Configuration

### TLS/SSL Configuration

#### Certificate Management
```bash
# Generate self-signed certificate for development
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Production SSL with Let's Encrypt
sudo certbot certonly --webroot -w /var/www/html -d your-domain.com

# SSL Configuration in Nginx
ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
ssl_trusted_certificate /etc/letsencrypt/live/your-domain.com/chain.pem;
```

#### TLS Security Settings
```nginx
# Strong SSL Configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;

# HSTS
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

# Security Headers
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
```

### Authentication & Authorization

#### JWT Configuration
```javascript
// JWT Security Settings
const jwtConfig = {
  secret: process.env.JWT_SECRET,
  algorithm: 'HS256',
  expiresIn: '24h',
  issuer: 'ai-ecosystem',
  audience: 'api-clients'
};

// Password Hashing
const bcryptConfig = {
  saltRounds: 12,
  algorithm: 'bcrypt'
};
```

#### API Key Security
```javascript
// API Key Configuration
const apiKeyConfig = {
  headerName: 'X-API-Key',
  keyLength: 32,
  hashAlgorithm: 'sha256',
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }
};
```

#### OAuth2 Configuration
```javascript
// OAuth2 Provider Configuration
const oauth2Config = {
  providers: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: `${process.env.BASE_URL}/auth/google/callback`,
      scope: ['openid', 'profile', 'email']
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      redirectUri: `${process.env.BASE_URL}/auth/github/callback`,
      scope: ['user:email', 'read:user']
    }
  }
};
```

### Network Security

#### Firewall Configuration
```bash
# UFW Firewall Rules
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow ssh

# Allow HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow Docker networks (internal)
sudo ufw allow from 172.17.0.0/16
sudo ufw allow from 172.20.0.0/16 to any port 5432 proto tcp  # PostgreSQL
sudo ufw allow from 172.24.0.0/16 to any port 6379 proto tcp  # Redis

# Enable firewall
sudo ufw enable
```

#### Docker Security
```yaml
# Docker Compose Security
services:
  secure-service:
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    read_only: true
    tmpfs:
      - /tmp
      - /var/run
    volumes:
      - ./data:/app/data:ro
```

### Data Protection

#### Database Encryption
```sql
-- PostgreSQL Encryption Setup
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt sensitive columns
CREATE OR REPLACE FUNCTION encrypt_data(data text, key text)
RETURNS text AS $$
BEGIN
  RETURN encode(encrypt(data::bytea, key::bytea, 'aes'), 'hex');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrypt_data(data text, key text)
RETURNS text AS $$
BEGIN
  RETURN convert_from(decrypt(decode(data, 'hex'), key::bytea, 'aes'), 'utf8');
END;
$$ LANGUAGE plpgsql;
```

#### Secret Management
```bash
# HashiCorp Vault Configuration
export VAULT_ADDR='https://vault.your-domain.com'
export VAULT_TOKEN='your-vault-token'

# Docker Secrets
echo "your-secret-password" | docker secret create postgres_password -

# Environment File Encryption
# Use tools like git-crypt or ansible-vault for .env files
```

## Performance Tuning

### Database Performance

#### PostgreSQL Optimization
```sql
-- PostgreSQL Configuration
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Connection Pooling with PgBouncer
[databases]
ai_ecosystem = host=postgres port=5432 dbname=ai_ecosystem

[pgbouncer]
listen_port = 6432
listen_addr = *
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
reserve_pool_size = 5
```

#### Redis Optimization
```redis.conf
# Redis Performance Configuration
maxmemory 512mb
maxmemory-policy allkeys-lru
tcp-keepalive 300
timeout 300
databases 16

# Persistence
save 900 1
save 300 10
save 60 10000

# Replication (for HA)
replicaof master-host 6379
```

### Application Performance

#### Node.js Performance Tuning
```javascript
// Cluster Configuration for Multi-core Utilization
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  // Worker process
  const app = express();
  // ... application setup
}
```

#### Python Performance Settings
```python
# Gunicorn Configuration for Python Services
bind = "0.0.0.0:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 30
keepalive = 2
```

#### Memory Management
```yaml
# Docker Memory Limits
services:
  aios:
    deploy:
      resources:
        limits:
          memory: 8G
          cpus: '4.0'
        reservations:
          memory: 4G
          cpus: '2.0'
```

### Caching Strategies

#### Multi-Level Caching
```javascript
// Redis + In-Memory Caching Strategy
const cacheManager = {
  async get(key) {
    // Check L1 cache (memory)
    let data = memoryCache.get(key);
    if (data) return data;

    // Check L2 cache (Redis)
    data = await redis.get(key);
    if (data) {
      memoryCache.set(key, data, 300); // Cache in memory for 5 minutes
      return data;
    }

    return null;
  },

  async set(key, value, ttl = 3600) {
    // Set in both caches
    memoryCache.set(key, value, 300);
    await redis.setex(key, ttl, JSON.stringify(value));
  }
};
```

#### Cache Invalidation Strategies
```javascript
// Cache Invalidation Patterns
const cacheInvalidation = {
  // Time-based expiration
  timeBased: (key, ttl) => redis.expire(key, ttl),

  // Event-based invalidation
  eventBased: (event, keys) => {
    keys.forEach(key => redis.del(key));
  },

  // Write-through caching
  writeThrough: async (key, data) => {
    await database.save(data);
    await cache.set(key, data);
  }
};
```

### Network Optimization

#### Connection Pooling
```javascript
// HTTP Client Connection Pooling
const axiosConfig = {
  baseURL: process.env.API_BASE_URL,
  timeout: 10000,
  maxContentLength: 50 * 1024 * 1024, // 50MB
  headers: {
    'Connection': 'keep-alive'
  },
  httpAgent: new http.Agent({
    keepAlive: true,
    maxSockets: 100,
    maxFreeSockets: 10,
    timeout: 60000
  })
};
```

#### Load Balancing
```nginx
# Nginx Load Balancing
upstream api_backends {
    least_conn;
    server aios-1:8000 weight=1 max_fails=3 fail_timeout=30s;
    server aios-2:8000 weight=1 max_fails=3 fail_timeout=30s;
    server aios-3:8000 weight=1 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    location /api/ {
        proxy_pass http://api_backends;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
    }
}
```

## Service-Specific Configuration

### AIOS Configuration
```yaml
# aios/config.yaml
llm:
  routing:
    strategy: "load_balance"
    providers:
      - name: "openai"
        priority: 1
        weight: 0.7
      - name: "huggingface"
        priority: 2
        weight: 0.3

  models:
    default_embedding: "text-embedding-ada-002"
    default_generation: "gpt-4-turbo-preview"

memory:
  type: "redis"
  ttl: 3600
  max_size: "1GB"

scheduler:
  type: "fifo"
  max_concurrent: 10
  timeout: 300
```

### MCP Server Configuration
```yaml
# mcp-registry/config.yaml
registry:
  port: 8002
  discovery:
    interval: 30
    timeout: 10

services:
  - name: "kali-desktop"
    endpoint: "http://kali-desktop:3001"
    tools:
      - "kali_screenshot"
      - "kali_click"
      - "kali_type"

  - name: "computer-control"
    endpoint: "http://bytebot:4001"
    tools:
      - "computer_screenshot"
      - "computer_click"
      - "computer_type"
```

## Configuration Validation

### Environment Validation Script
```bash
#!/bin/bash
# config-validation.sh

# Required environment variables
required_vars=(
    "POSTGRES_PASSWORD"
    "JWT_SECRET"
    "OPENAI_API_KEY"
)

# Optional but recommended variables
recommended_vars=(
    "HUGGINGFACE_TOKEN"
    "CUDA_VISIBLE_DEVICES"
)

echo "Validating configuration..."

# Check required variables
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "ERROR: Required environment variable $var is not set"
        exit 1
    fi
done

# Check recommended variables
for var in "${recommended_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "WARNING: Recommended environment variable $var is not set"
    fi
done

# Validate JWT secret length
if [ ${#JWT_SECRET} -lt 32 ]; then
    echo "ERROR: JWT_SECRET must be at least 32 characters long"
    exit 1
fi

# Validate database connectivity
echo "Testing database connection..."
if ! pg_isready -h postgres -U admin -d ai_ecosystem >/dev/null 2>&1; then
    echo "ERROR: Cannot connect to PostgreSQL database"
    exit 1
fi

echo "Configuration validation passed!"
```

### Configuration Schema Validation
```javascript
// config-schema.js
const Joi = require('joi');

const configSchema = Joi.object({
  service: Joi.object({
    name: Joi.string().required(),
    version: Joi.string().pattern(/^\d+\.\d+\.\d+$/).required(),
    environment: Joi.string().valid('development', 'staging', 'production').required()
  }).required(),

  server: Joi.object({
    host: Joi.string().hostname().required(),
    port: Joi.number().integer().min(1).max(65535).required(),
    workers: Joi.number().integer().min(1).required(),
    timeout: Joi.number().integer().min(1).required()
  }).required(),

  database: Joi.object({
    url: Joi.string().uri().required(),
    pool_size: Joi.number().integer().min(1).max(100).required(),
    max_connections: Joi.number().integer().min(1).max(1000).required(),
    connection_timeout: Joi.number().integer().min(1).max(300).required()
  }).required(),

  ai: Joi.object({
    openai: Joi.object({
      api_key: Joi.string().pattern(/^sk-/).required(),
      default_model: Joi.string().required(),
      max_tokens: Joi.number().integer().min(1).max(32768).required(),
      temperature: Joi.number().min(0).max(2).required()
    }).required()
  }).required()
});

function validateConfig(config) {
  const { error, value } = configSchema.validate(config, { abortEarly: false });
  if (error) {
    throw new Error(`Configuration validation failed: ${error.details.map(d => d.message).join(', ')}`);
  }
  return value;
}

module.exports = { validateConfig };
```

---

For deployment guides, see [DEPLOYMENT.md](./DEPLOYMENT.md)
For security best practices, see [SECURITY.md](./SECURITY.md)
For performance monitoring, see [MONITORING.md](./MONITORING.md)