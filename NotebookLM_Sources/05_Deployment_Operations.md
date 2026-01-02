# Deployment & Operations Guide

## Quick Start

### Prerequisites
```bash
# Required software
- Docker Desktop (or Docker Engine + Docker Compose)
- Node.js 18+ (for local development)
- Python 3.11+ (for AI services)
- Rust 1.70+ (for performance services)
- Git

# Optional but recommended
- VS Code or Cursor AI
- Postman or Insomnia
- pgAdmin (PostgreSQL GUI)
- MongoDB Compass (MongoDB GUI)
```

### Initial Setup
```bash
# 1. Clone repository
git clone <repository-url>
cd future-app

# 2. Copy environment files
cp .env.example .env
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env

# 3. Configure environment variables
# Edit .env files with your settings

# 4. Start all services
docker-compose up -d

# 5. Verify services are running
docker-compose ps

# 6. Check logs
docker-compose logs -f
```

### Service URLs
```
Frontend:        http://localhost:3000
Backend API:     http://localhost:5000
Python Services: http://localhost:8000
Rust Services:   http://localhost:8080
n8n:             http://localhost:5678
Langflow:        http://localhost:7860
Ollama:          http://localhost:11434
Grafana:         http://localhost:3001
Prometheus:      http://localhost:9090
RabbitMQ UI:     http://localhost:15672
```

---

## Environment Configuration

### Root .env
```bash
# Project
PROJECT_NAME=future-app
ENVIRONMENT=development

# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=futureapp
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=your_secure_password
MONGO_HOST=mongodb
MONGO_PORT=27017

REDIS_PASSWORD=your_secure_password
REDIS_HOST=redis
REDIS_PORT=6379

# RabbitMQ
RABBITMQ_DEFAULT_USER=admin
RABBITMQ_DEFAULT_PASS=your_secure_password

# AI Services
OLLAMA_HOST=http://ollama:11434
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...

# n8n
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your_secure_password

# Monitoring
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=your_secure_password
```

### Frontend .env
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000
NEXT_PUBLIC_APP_NAME=Future App
```

### Backend .env
```bash
PORT=5000
NODE_ENV=development

DATABASE_URL=postgresql://postgres:password@postgres:5432/futureapp
MONGO_URL=mongodb://admin:password@mongodb:27017/futureapp?authSource=admin
REDIS_URL=redis://:password@redis:6379

JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3000
```

### Python Services .env
```bash
PORT=8000
ENVIRONMENT=development

OLLAMA_BASE_URL=http://ollama:11434
OPENAI_API_KEY=sk-...

DATABASE_URL=postgresql://postgres:password@postgres:5432/futureapp
```

---

## Docker Compose Configuration

### Full docker-compose.yml Structure
```yaml
version: '3.8'

services:
  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: ../docker/Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:5000
    networks:
      - frontend-network
    depends_on:
      - backend
    restart: unless-stopped

  # Backend
  backend:
    build:
      context: ./backend
      dockerfile: ../docker/Dockerfile.backend
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    networks:
      - backend-network
      - database-network
      - cache-network
    depends_on:
      - postgres
      - mongodb
      - redis
    restart: unless-stopped

  # Python Services
  python-services:
    build:
      context: ./python-services
      dockerfile: ../docker/Dockerfile.python
    ports:
      - "8000:8000"
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
    networks:
      - python-network
      - ai-network
    depends_on:
      - ollama
    restart: unless-stopped

  # Rust Services
  rust-services:
    build:
      context: ./rust-services
      dockerfile: ../docker/Dockerfile.rust
    ports:
      - "8080:8080"
    networks:
      - rust-network
    restart: unless-stopped

  # PostgreSQL
  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - database-network
    restart: unless-stopped

  # MongoDB
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_INITDB_ROOT_USERNAME}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_INITDB_ROOT_PASSWORD}
    volumes:
      - mongodb-data:/data/db
    networks:
      - database-network
    restart: unless-stopped

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - cache-network
    restart: unless-stopped

  # Ollama
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama
    networks:
      - ai-network
    restart: unless-stopped

  # n8n
  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=${N8N_BASIC_AUTH_ACTIVE}
      - N8N_BASIC_AUTH_USER=${N8N_BASIC_AUTH_USER}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_BASIC_AUTH_PASSWORD}
    volumes:
      - n8n-data:/home/node/.n8n
    networks:
      - automation-network
      - ai-network
    depends_on:
      - ollama
    restart: unless-stopped

  # Langflow
  langflow:
    image: langflowai/langflow:latest
    ports:
      - "7860:7860"
    environment:
      - LANGFLOW_DATABASE_URL=sqlite:///langflow.db
    volumes:
      - langflow-data:/app/langflow
    networks:
      - ai-network
    depends_on:
      - ollama
    restart: unless-stopped

  # RabbitMQ
  rabbitmq:
    image: rabbitmq:3-management-alpine
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      - RABBITMQ_DEFAULT_USER=${RABBITMQ_DEFAULT_USER}
      - RABBITMQ_DEFAULT_PASS=${RABBITMQ_DEFAULT_PASS}
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq
    networks:
      - queue-network
    restart: unless-stopped

  # Prometheus
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - monitoring-network
    restart: unless-stopped

  # Grafana
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=${GRAFANA_ADMIN_USER}
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
    volumes:
      - grafana-data:/var/lib/grafana
    networks:
      - monitoring-network
    depends_on:
      - prometheus
    restart: unless-stopped

networks:
  frontend-network:
  backend-network:
  database-network:
  cache-network:
  python-network:
  rust-network:
  ai-network:
  automation-network:
  queue-network:
  monitoring-network:

volumes:
  postgres-data:
  mongodb-data:
  redis-data:
  ollama-data:
  n8n-data:
  langflow-data:
  rabbitmq-data:
  prometheus-data:
  grafana-data:
```

---

## Service Management

### Start/Stop Services
```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d frontend

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# Restart service
docker-compose restart backend

# View running services
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 frontend

# Since timestamp
docker-compose logs --since 2024-01-01T00:00:00
```

### Execute Commands in Containers
```bash
# Open shell in container
docker-compose exec backend sh

# Run command
docker-compose exec backend npm run migrate

# Run as different user
docker-compose exec -u root backend sh
```

---

## Database Management

### PostgreSQL
```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d futureapp

# Run migrations
docker-compose exec backend npm run migrate

# Seed database
docker-compose exec backend npm run seed

# Backup database
docker-compose exec postgres pg_dump -U postgres futureapp > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U postgres futureapp
```

### MongoDB
```bash
# Connect to database
docker-compose exec mongodb mongosh -u admin -p password

# Backup database
docker-compose exec mongodb mongodump --out /backup

# Restore database
docker-compose exec mongodb mongorestore /backup
```

### Redis
```bash
# Connect to Redis
docker-compose exec redis redis-cli -a password

# Clear cache
docker-compose exec redis redis-cli -a password FLUSHALL

# Monitor commands
docker-compose exec redis redis-cli -a password MONITOR
```

---

## Ollama Model Management

### Pull Models
```bash
# Pull Llama 3.2 (3B)
docker-compose exec ollama ollama pull llama3.2:3b

# Pull Mistral
docker-compose exec ollama ollama pull mistral

# Pull Gemma 2 (2B)
docker-compose exec ollama ollama pull gemma2:2b

# Pull Qwen 2.5
docker-compose exec ollama ollama pull qwen2.5
```

### List Models
```bash
docker-compose exec ollama ollama list
```

### Remove Models
```bash
docker-compose exec ollama ollama rm llama3.2:3b
```

### Test Model
```bash
docker-compose exec ollama ollama run llama3.2:3b "Hello, how are you?"
```

---

## Monitoring & Health Checks

### Service Health
```bash
# Check all services
./scripts/health-check.sh

# Or manually:
curl http://localhost:3000/api/health  # Frontend
curl http://localhost:5000/health      # Backend
curl http://localhost:8000/health      # Python
curl http://localhost:8080/health      # Rust
curl http://localhost:5678/healthz     # n8n
curl http://localhost:11434/api/tags   # Ollama
```

### Resource Usage
```bash
# Docker stats
docker stats

# Specific service
docker stats future-app-backend-1

# Disk usage
docker system df

# Clean up
docker system prune -a
```

### Grafana Dashboards
```
1. Open http://localhost:3001
2. Login (admin/password)
3. Navigate to Dashboards
4. View:
   - System Overview
   - Service Metrics
   - Database Performance
   - API Response Times
```

---

## Backup & Restore

### Automated Backup Script
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker-compose exec -T postgres pg_dump -U postgres futureapp > $BACKUP_DIR/postgres.sql

# Backup MongoDB
docker-compose exec mongodb mongodump --out /tmp/backup
docker cp $(docker-compose ps -q mongodb):/tmp/backup $BACKUP_DIR/mongodb

# Backup volumes
docker run --rm -v future-app_n8n-data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/n8n-data.tar.gz -C /data .
docker run --rm -v future-app_langflow-data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/langflow-data.tar.gz -C /data .

echo "Backup completed: $BACKUP_DIR"
```

### Restore Script
```bash
#!/bin/bash
# restore.sh

BACKUP_DIR=$1

if [ -z "$BACKUP_DIR" ]; then
  echo "Usage: ./restore.sh <backup_directory>"
  exit 1
fi

# Restore PostgreSQL
cat $BACKUP_DIR/postgres.sql | docker-compose exec -T postgres psql -U postgres futureapp

# Restore MongoDB
docker cp $BACKUP_DIR/mongodb $(docker-compose ps -q mongodb):/tmp/backup
docker-compose exec mongodb mongorestore /tmp/backup

echo "Restore completed from: $BACKUP_DIR"
```

---

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
```

#### Container Won't Start
```bash
# Check logs
docker-compose logs <service>

# Rebuild container
docker-compose up -d --build <service>

# Remove and recreate
docker-compose rm -f <service>
docker-compose up -d <service>
```

#### Database Connection Failed
```bash
# Check if database is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Verify connection string
echo $DATABASE_URL

# Test connection
docker-compose exec postgres pg_isready
```

#### Out of Memory
```bash
# Check memory usage
docker stats

# Increase Docker memory limit
# Docker Desktop -> Settings -> Resources -> Memory

# Or reduce service memory limits in docker-compose.yml
```

#### Slow Performance
```bash
# Check resource usage
docker stats

# Check disk space
df -h

# Clean up Docker
docker system prune -a

# Optimize database
docker-compose exec postgres vacuumdb -U postgres -d futureapp --analyze
```

---

## Production Deployment

### Pre-deployment Checklist
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] SSL certificates ready
- [ ] Domain DNS configured
- [ ] Firewall rules set

### Production Environment Variables
```bash
ENVIRONMENT=production
NODE_ENV=production

# Use strong passwords
POSTGRES_PASSWORD=<strong_random_password>
MONGO_INITDB_ROOT_PASSWORD=<strong_random_password>
REDIS_PASSWORD=<strong_random_password>
JWT_SECRET=<strong_random_secret>

# Use production URLs
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# Disable debug features
N8N_BASIC_AUTH_ACTIVE=true
DEBUG=false
```

### SSL Configuration (Nginx)
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Deployment Steps
```bash
# 1. Pull latest code
git pull origin main

# 2. Build images
docker-compose -f docker-compose.prod.yml build

# 3. Run migrations
docker-compose -f docker-compose.prod.yml run --rm backend npm run migrate

# 4. Start services
docker-compose -f docker-compose.prod.yml up -d

# 5. Verify health
./scripts/health-check.sh

# 6. Monitor logs
docker-compose -f docker-compose.prod.yml logs -f
```
