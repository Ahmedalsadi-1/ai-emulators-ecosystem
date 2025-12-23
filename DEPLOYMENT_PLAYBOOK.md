# Deployment Playbook - AI Emulators Ecosystem Monitoring

## Prerequisites

### System Requirements
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Memory**: 16GB+ RAM (32GB recommended for GPU workloads)
- **CPU**: 8+ cores (16+ recommended)
- **Storage**: 100GB+ free space
- **Network**: Stable internet connection

### Environment Setup
```bash
# Clone repository
git clone <repository-url>
cd future-app

# Create secrets directory
mkdir -p secrets

# Set proper permissions
chmod 700 secrets
chmod +x scripts/*.sh

# Initialize environment
cp .env.example .env
# Edit .env with your configuration
```

## Deployment Steps

### Phase 1: Infrastructure Setup

#### 1.1 Database Setup
```bash
# Start databases first
docker-compose -f docker-compose.ecosystem.yml up -d postgres redis

# Wait for databases to be ready
sleep 30

# Verify database health
docker-compose exec postgres pg_isready -U admin -d ai_ecosystem
docker-compose exec redis redis-cli ping
```

#### 1.2 Monitoring Infrastructure
```bash
# Start monitoring stack
docker-compose -f docker-compose.ecosystem.yml --profile monitoring up -d

# Wait for services to start
sleep 60

# Verify monitoring services
curl -f http://localhost:9090/-/healthy
curl -f http://localhost:3020/api/health
curl -f http://localhost:3100/ready
```

### Phase 2: Service Deployment

#### 2.1 Core Services
```bash
# Start infrastructure services
docker-compose -f docker-compose.ecosystem.yml up -d mcp-registry nginx

# Start AI services (non-GPU first)
docker-compose -f docker-compose.ecosystem.yml up -d gbox

# Start automation services
docker-compose -f docker-compose.ecosystem.yml up -d bytebot open-interface macos-use factif-ai
```

#### 2.2 GPU Services (Optional)
```bash
# Verify GPU availability
nvidia-smi

# Start GPU-intensive services
docker-compose -f docker-compose.ecosystem.yml --profile gpu up -d aios wan2gp
```

#### 2.3 Application Services
```bash
# Start social media services
docker-compose -f docker-compose.ecosystem.yml --profile social up -d postiz-app onlysnarf

# Start content services
docker-compose -f docker-compose.ecosystem.yml --profile content up -d reels-clips-automator
```

### Phase 3: Configuration and Verification

#### 3.1 Grafana Setup
```bash
# Access Grafana
open http://localhost:3020

# Login with admin/admin
# Change default password

# Verify data sources are connected
# Check dashboards are loaded
```

#### 3.2 Prometheus Configuration
```bash
# Check targets are healthy
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | select(.health != "up")'

# Verify alerting rules
curl http://localhost:9090/api/v1/rules | jq '.data.groups[].rules[] | select(.state == "firing")'
```

#### 3.3 Backup Setup
```bash
# Configure automated backups
crontab -e
# Add lines from monitoring/cron-jobs.txt

# Test backup system
./scripts/backup-ecosystem.sh backup

# Verify backup integrity
./scripts/backup-ecosystem.sh verify
```

### Phase 4: Production Readiness

#### 4.1 Security Hardening
```bash
# Update secrets with production values
# Ensure all passwords are strong and unique

# Review network policies
docker network ls

# Check container security
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
```

#### 4.2 Performance Tuning
```bash
# Monitor initial resource usage
docker stats

# Adjust resource limits if needed
# Edit docker-compose.ecosystem.yml

# Restart services with new limits
docker-compose up -d
```

#### 4.3 Monitoring Validation
```bash
# Run comprehensive health check
./scripts/check-status.sh

# Verify all dashboards show data
# Check alert rules are working

# Test log aggregation
curl "http://localhost:3100/loki/api/v1/query_range?query={job=\"docker\"}&start=0&end=$(date +%s)&limit=10"
```

## Rollback Procedures

### Emergency Rollback
```bash
# Stop all services
docker-compose down

# Restore from backup
./scripts/backup-ecosystem.sh restore <backup_id>

# Restart with previous configuration
docker-compose up -d
```

### Service-specific Rollback
```bash
# Rollback individual service
docker-compose up -d --scale <service>=0
docker-compose up -d <previous_version>

# Verify service health
./scripts/check-status.sh
```

## Troubleshooting Deployment

### Common Issues

#### Services Not Starting
```bash
# Check dependencies
docker-compose ps

# Review logs
docker-compose logs <service_name>

# Check resource availability
docker system df
```

#### Database Connection Issues
```bash
# Check database logs
docker-compose logs postgres

# Verify network connectivity
docker exec postgres ping redis

# Check database configuration
docker exec postgres psql -U admin -d ai_ecosystem -c "SELECT version();"
```

#### Monitoring Not Collecting Data
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Verify service metrics endpoints
curl http://localhost:8000/metrics

# Check Grafana data sources
curl http://localhost:3020/api/datasources
```

#### GPU Services Failing
```bash
# Verify GPU drivers
nvidia-smi

# Check GPU memory
nvidia-smi --query-gpu=memory.used,memory.total --format=csv

# Review GPU service logs
docker-compose logs wan2gp
```

### Performance Issues

#### High Resource Usage
```bash
# Monitor container resources
docker stats

# Check system resources
htop

# Review service configurations
docker-compose config
```

#### Slow Response Times
```bash
# Check application performance
curl -w "@curl-format.txt" http://localhost:8000/health

# Monitor database queries
docker exec postgres psql -U admin -d ai_ecosystem -c "SELECT * FROM pg_stat_activity;"

# Review network latency
ping postgres
```

## Maintenance Procedures

### Daily Checks
- Monitor Grafana dashboards
- Review alert status
- Check backup completion
- Verify service health

### Weekly Maintenance
```bash
# Update Docker images
docker-compose pull

# Rotate logs
./scripts/manage-logs.sh rotate

# Clean up old backups
./scripts/backup-ecosystem.sh cleanup

# Restart monitoring services
docker-compose --profile monitoring restart
```

### Monthly Maintenance
```bash
# Full backup test
./scripts/backup-ecosystem.sh backup
./scripts/backup-ecosystem.sh verify

# Security updates
docker system prune -f

# Performance review
# Review Grafana trends
# Adjust resource limits if needed
```

## Scaling Procedures

### Horizontal Scaling
```bash
# Scale service instances
docker-compose up -d --scale <service>=3

# Update load balancer configuration
# Nginx configuration in nginx/nginx.conf
```

### Vertical Scaling
```bash
# Increase resource limits
# Edit docker-compose.ecosystem.yml
# Restart services
docker-compose up -d
```

### GPU Scaling
```bash
# Add GPU nodes to cluster
# Update service affinity
# Restart GPU services
```

## Backup and Recovery

### Backup Strategy
- **Daily**: Full system backup at 2 AM
- **Hourly**: Configuration backup during business hours
- **Real-time**: Database WAL archiving

### Recovery Testing
```bash
# Monthly recovery test
./scripts/backup-ecosystem.sh restore <test_backup>

# Verify data integrity
# Test application functionality
# Restore production backup
```

### Disaster Recovery
1. **Assess damage** and impact
2. **Isolate affected systems**
3. **Restore from backup**
4. **Verify system integrity**
5. **Gradually restore services**
6. **Monitor for issues**

## Security Considerations

### Network Security
- Internal networks for sensitive services
- External access through reverse proxy
- Network segmentation by service type

### Access Control
- Strong passwords for all services
- Limited user access
- Regular password rotation

### Monitoring Security
- Encrypted communications
- Access logging
- Alert on suspicious activity

## Support and Contacts

### Deployment Support
- **Documentation**: MONITORING_OPERATIONS_GUIDE.md
- **Runbook**: ALERT_RESPONSE_RUNBOOK.md
- **Scripts**: scripts/ directory

### Emergency Contacts
- **System Admin**: admin@ai-ecosystem.local
- **On-call**: +1-555-0123
- **Escalation**: +1-555-0124

### Resources
- **GitHub**: Repository issues and documentation
- **Wiki**: Detailed procedures and troubleshooting
- **Slack**: #monitoring channel for alerts