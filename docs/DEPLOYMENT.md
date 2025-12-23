# AI Emulators Ecosystem - Deployment Guide

## Table of Contents

1. [Quick Start Guide](#quick-start-guide)
2. [Prerequisites](#prerequisites)
3. [Development Deployment](#development-deployment)
4. [Production Deployment](#production-deployment)
5. [Scaling and High Availability](#scaling-and-high-availability)
6. [Backup and Disaster Recovery](#backup-and-disaster-recovery)
7. [Environment-specific Configurations](#environment-specific-configurations)

## Quick Start Guide

### One-Command Ecosystem Launch

For a complete development environment with all services:

```bash
# Clone the repository
git clone <repository-url>
cd future-app

# Copy environment template
cp .env.example .env

# Edit environment variables (API keys, passwords)
nano .env

# Launch the full ecosystem
docker-compose -f docker-compose.ecosystem.yml up -d

# Check service status
docker-compose -f docker-compose.ecosystem.yml ps

# Access services
# Grafana UI: http://localhost:3000 (admin/admin)
# AIOS API: http://localhost:8000
# gbox API: http://localhost:3000
# Kali Desktop: http://localhost:6080
```

### Service-Specific Quick Starts

#### AIOS (AI Operating System)
```bash
cd AIOS
cp .env.example .env
# Edit .env with your API keys
docker-compose up -d
# Access at http://localhost:8000
```

#### Kali Desktop MCP Server
```bash
# Start Kali desktop environment
docker run -d --name kali-desktop \
  -p 5901:5901 -p 6080:6080 \
  --privileged \
  kalilinux/kali-rolling bash -c "
    apt-get update &&
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
      kali-desktop-xfce tightvncserver novnc websockify \
      firefox-esr nmap sqlmap wireshark metasploit-framework \
      python3-opencv python3-pip &&
    pip3 install --break-system-packages vncdotool pynput &&
    mkdir -p /root/.vnc &&
    echo 'kali' | vncpasswd -f > /root/.vnc/passwd &&
    chmod 600 /root/.vnc/passwd &&
    vncserver :1 -geometry 1920x1080 -depth 24 &&
    /usr/share/novnc/utils/launch.sh --vnc localhost:5901 --listen 6080 &
    tail -f /dev/null"

# Copy control script
docker cp vnc_control.py kali-desktop:/usr/local/bin/vnc_control.py
docker exec kali-desktop chmod +x /usr/local/bin/vnc_control.py

# Access desktop at http://localhost:6080 (password: kali)
```

## Prerequisites

### System Requirements

#### Minimum Requirements
- **CPU**: 4-core processor (8+ cores recommended)
- **RAM**: 16GB (32GB+ recommended)
- **Storage**: 100GB SSD (500GB+ recommended)
- **GPU**: NVIDIA GPU with CUDA support (optional, for AI/ML services)
- **OS**: Linux/macOS/Windows with Docker support

#### Recommended Production Setup
- **CPU**: 16+ cores
- **RAM**: 64GB+
- **Storage**: 1TB+ NVMe SSD
- **GPU**: NVIDIA RTX 30-series or A-series (48GB+ VRAM)
- **Network**: 1Gbps+ bandwidth

### Software Dependencies

```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install development tools
sudo apt-get update
sudo apt-get install -y git curl wget nano htop

# For GPU support (NVIDIA)
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt-get update && sudo apt-get install -y nvidia-docker2
sudo systemctl restart docker
```

### Required API Keys and Credentials

Create a `.env` file with the following variables:

```bash
# Database
POSTGRES_PASSWORD=your_secure_postgres_password
GRAFANA_PASSWORD=your_grafana_admin_password
JWT_SECRET=your_jwt_secret_key

# AI/ML Services
OPENAI_API_KEY=your_openai_api_key
HUGGINGFACE_TOKEN=your_huggingface_token
GOOGLE_API_KEY=your_google_api_key

# Social Media (for social services)
TWITTER_API_KEY=your_twitter_api_key
INSTAGRAM_ACCESS_TOKEN=your_instagram_token
TIKTOK_API_KEY=your_tiktok_api_key

# VNC/Desktop Services
VNC_PASSWORD=your_vnc_password

# GPU Configuration
CUDA_VISIBLE_DEVICES=all
TORCH_CUDA_ARCH_LIST=8.0;8.6;8.9;9.0
```

## Development Deployment

### Local Development Setup

1. **Clone and Setup**:
```bash
git clone <repository-url>
cd future-app
cp .env.example .env
# Edit .env with development keys
```

2. **Start Core Infrastructure**:
```bash
# Start databases and monitoring
docker-compose -f docker-compose.ecosystem.yml up -d postgres redis prometheus grafana

# Wait for services to be healthy
docker-compose -f docker-compose.ecosystem.yml ps
```

3. **Start Individual Services**:
```bash
# Start AIOS
docker-compose -f docker-compose.ecosystem.yml up -d aios

# Start computer control services
docker-compose -f docker-compose.ecosystem.yml up -d bytebot open-interface factif-ai

# Start social/content services
docker-compose -f docker-compose.ecosystem.yml up -d postiz-app reels-clips-automator
```

4. **Verify Deployment**:
```bash
# Check all services
docker-compose -f docker-compose.ecosystem.yml ps

# Check logs
docker-compose -f docker-compose.ecosystem.yml logs -f [service-name]

# Test API endpoints
curl http://localhost:8000/health  # AIOS
curl http://localhost:3000/health  # gbox
```

### Development Profiles

Use Docker Compose profiles for different development scenarios:

```bash
# AI/ML focused development
docker-compose -f docker-compose.ecosystem.yml --profile gpu up -d

# Computer automation development
docker-compose -f docker-compose.ecosystem.yml --profile automation up -d

# Social media development
docker-compose -f docker-compose.ecosystem.yml --profile social up -d

# Full ecosystem
docker-compose -f docker-compose.ecosystem.yml --profile production up -d
```

## Production Deployment

### Production Infrastructure Setup

1. **Server Provisioning**:
```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install required packages
sudo apt-get install -y docker.io docker-compose-plugin nginx certbot

# Configure Docker for production
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF

sudo systemctl restart docker
```

2. **SSL Certificate Setup**:
```bash
# Get SSL certificate
sudo certbot certonly --standalone -d your-domain.com

# Configure SSL directory
sudo mkdir -p /etc/nginx/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /etc/nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem /etc/nginx/ssl/
```

3. **Environment Configuration**:
```bash
# Create production environment file
sudo mkdir -p /opt/ai-ecosystem
cd /opt/ai-ecosystem

# Clone repository
git clone <repository-url> .
cp .env.example .env

# Edit production environment variables
sudo nano .env
# Set strong passwords, API keys, production URLs
```

### Production Docker Compose Configuration

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  # Core services with production optimizations
  aios:
    deploy:
      resources:
        limits:
          memory: 12G
          cpus: '6.0'
        reservations:
          memory: 8G
          cpus: '4.0'
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
        window: 120s

  # GPU services with proper resource allocation
  wan2gp:
    deploy:
      resources:
        limits:
          memory: 24G
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  # Database with persistent volumes and backups
  postgres:
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - /opt/ai-ecosystem/backups:/backups
    environment:
      - POSTGRES_PASSWORD_FILE=/run/secrets/postgres_password
    secrets:
      - postgres_password

secrets:
  postgres_password:
    file: /opt/ai-ecosystem/secrets/postgres_password.txt
```

### Production Deployment Commands

```bash
# Deploy to production
cd /opt/ai-ecosystem
docker-compose -f docker-compose.prod.yml up -d

# Scale services based on load
docker-compose -f docker-compose.prod.yml up -d --scale aios=3
docker-compose -f docker-compose.prod.yml up -d --scale wan2gp=2

# Update services with zero downtime
docker-compose -f docker-compose.prod.yml up -d --no-deps [service-name]

# Check deployment status
docker-compose -f docker-compose.prod.yml ps
docker stats
```

### Nginx Reverse Proxy Configuration

Create `/etc/nginx/sites-available/ai-ecosystem`:

```nginx
upstream aios_backend {
    server localhost:8000;
    server localhost:8001;
    server localhost:8002;
}

upstream automation_backends {
    server localhost:4000;
    server localhost:5000;
    server localhost:6000;
    server localhost:7000;
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # API endpoints
    location /api/aios/ {
        proxy_pass http://aios_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/automation/ {
        proxy_pass http://automation_backends;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Monitoring (protected)
    location /monitoring/ {
        auth_basic "Monitoring";
        auth_basic_user_file /etc/nginx/.htpasswd;
        proxy_pass http://localhost:3000/;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

## Scaling and High Availability

### Horizontal Scaling

1. **Load Balancer Configuration**:
```bash
# Scale AIOS service
docker-compose -f docker-compose.prod.yml up -d --scale aios=3

# Scale automation services
docker-compose -f docker-compose.prod.yml up -d --scale bytebot=2
docker-compose -f docker-compose.prod.yml up -d --scale open-interface=2

# Check scaling status
docker-compose -f docker-compose.prod.yml ps
```

2. **Database Clustering**:
```yaml
# PostgreSQL with replication
services:
  postgres-master:
    image: postgres:15-alpine
    environment:
      - POSTGRES_PASSWORD=master_password
      - POSTGRES_REPLICATION_MODE=master
    volumes:
      - pg_master_data:/var/lib/postgresql/data

  postgres-replica:
    image: postgres:15-alpine
    environment:
      - POSTGRES_PASSWORD=replica_password
      - POSTGRES_REPLICATION_MODE=replica
      - POSTGRES_MASTER_HOST=postgres-master
    volumes:
      - pg_replica_data:/var/lib/postgresql/data
    depends_on:
      - postgres-master
```

3. **Redis Clustering**:
```yaml
services:
  redis-cluster:
    image: redis:7-alpine
    command: redis-server /etc/redis/redis.conf
    volumes:
      - ./redis/cluster.conf:/etc/redis/redis.conf
      - redis_cluster_data:/data
    ports:
      - "7000-7005:7000-7005"
```

### High Availability Setup

1. **Service Redundancy**:
```yaml
services:
  aios:
    deploy:
      mode: replicated
      replicas: 3
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      update_config:
        parallelism: 1
        delay: 10s
        order: start-first
```

2. **Health Checks and Auto-healing**:
```yaml
services:
  aios:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    deploy:
      restart_policy:
        condition: on-failure
```

### Monitoring for Scaling

```bash
# Monitor resource usage
docker stats

# Check service health
docker-compose -f docker-compose.prod.yml ps

# View logs for scaling issues
docker-compose -f docker-compose.prod.yml logs -f --tail=100 [service-name]

# Prometheus metrics for auto-scaling decisions
curl http://localhost:9090/api/v1/query?query=container_cpu_usage_seconds_total
```

## Backup and Disaster Recovery

### Automated Backup Strategy

1. **Database Backups**:
```bash
# PostgreSQL backup script
#!/bin/bash
BACKUP_DIR="/opt/ai-ecosystem/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup all databases
docker exec postgres pg_dumpall -U admin > $BACKUP_DIR/full_backup_$TIMESTAMP.sql

# Compress backup
gzip $BACKUP_DIR/full_backup_$TIMESTAMP.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "full_backup_*.sql.gz" -mtime +7 -delete

# Upload to remote storage (optional)
# aws s3 cp $BACKUP_DIR/full_backup_$TIMESTAMP.sql.gz s3://your-backup-bucket/
```

2. **Configuration Backups**:
```bash
# Backup environment and configuration
tar -czf /opt/ai-ecosystem/backups/config_$TIMESTAMP.tar.gz \
    /opt/ai-ecosystem/.env \
    /opt/ai-ecosystem/docker-compose*.yml \
    /etc/nginx/sites-available/ai-ecosystem
```

3. **Volume Backups**:
```bash
# Backup Docker volumes
docker run --rm -v postgres_data:/data -v $(pwd):/backup \
    alpine tar czf /backup/postgres_backup_$TIMESTAMP.tar.gz -C /data .
```

### Disaster Recovery Procedures

1. **Service Recovery**:
```bash
# Quick service restart
docker-compose -f docker-compose.prod.yml restart [service-name]

# Full service recreation
docker-compose -f docker-compose.prod.yml up -d --force-recreate [service-name]

# Emergency service stop
docker-compose -f docker-compose.prod.yml stop [service-name]
```

2. **Database Recovery**:
```bash
# Stop all services using database
docker-compose -f docker-compose.prod.yml stop

# Restore from backup
docker exec -i postgres psql -U admin < /opt/ai-ecosystem/backups/full_backup_latest.sql

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

3. **Full System Recovery**:
```bash
# Emergency recovery script
#!/bin/bash

echo "Starting emergency recovery..."

# Stop all services
docker-compose -f docker-compose.prod.yml down

# Restore configurations
tar -xzf /opt/ai-ecosystem/backups/config_latest.tar.gz -C /

# Restore database
docker-compose -f docker-compose.prod.yml up -d postgres
sleep 30
docker exec -i postgres psql -U admin < /opt/ai-ecosystem/backups/full_backup_latest.sql

# Restore volumes (if needed)
# docker run --rm -v postgres_data:/data -v $(pwd):/backup \
#     alpine sh -c "cd /data && tar xzf /backup/postgres_backup_latest.tar.gz"

# Start all services
docker-compose -f docker-compose.prod.yml up -d

echo "Recovery completed. Check service status."
```

### Backup Automation

```bash
# Add to crontab for automated backups
# Daily database backup at 2 AM
0 2 * * * /opt/ai-ecosystem/scripts/backup.sh

# Weekly full system backup on Sunday at 3 AM
0 3 * * 0 /opt/ai-ecosystem/scripts/full-backup.sh

# Configuration backup every 6 hours
0 */6 * * * /opt/ai-ecosystem/scripts/config-backup.sh
```

## Environment-specific Configurations

### Development Environment
```yaml
# docker-compose.dev.yml
services:
  postgres:
    environment:
      - POSTGRES_PASSWORD=dev_password
  aios:
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=DEBUG
    ports:
      - "8000:8000"
      - "9229:9229"  # Debug port
```

### Staging Environment
```yaml
# docker-compose.staging.yml
services:
  aios:
    environment:
      - NODE_ENV=staging
      - LOG_LEVEL=INFO
    deploy:
      replicas: 2
  nginx:
    volumes:
      - ./nginx/staging.conf:/etc/nginx/nginx.conf
```

### Production Environment
```yaml
# docker-compose.prod.yml
services:
  aios:
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=WARN
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 8G
          cpus: '4.0'
  nginx:
    volumes:
      - ./nginx/production.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/nginx/ssl:ro
```

### GPU Environment
```yaml
# docker-compose.gpu.yml
services:
  aios:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    environment:
      - CUDA_VISIBLE_DEVICES=all
  wan2gp:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 2
              capabilities: [gpu]
```

---

For configuration management, see [CONFIGURATION.md](./CONFIGURATION.md)
For monitoring setup, see [MONITORING.md](./MONITORING.md)
For troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)