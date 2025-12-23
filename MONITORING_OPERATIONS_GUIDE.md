# AI Emulators Ecosystem - Monitoring and Operations Guide

## Overview

This document provides comprehensive guidance for monitoring, maintaining, and operating the AI Emulators Ecosystem. The ecosystem consists of 10+ microservices orchestrated via Docker Compose with full observability stack.

## Architecture Overview

### Services
- **AI/ML Services**: AIOS, gbox, Wan2GP (GPU-intensive)
- **Automation Services**: bytebot, open-interface, macOS-use, factif-ai
- **Social Services**: postiz-app, onlysnarf
- **Content Services**: reels-clips-automator
- **Infrastructure**: PostgreSQL, Redis, MCP Registry
- **Monitoring**: Prometheus, Grafana, Alertmanager, Loki, Jaeger

### Networks
- `ai_network`: GPU workloads (isolated)
- `automation_network`: Computer control services
- `social_network`: Social media platforms
- `content_network`: Content creation
- `database_network`: Data storage (internal only)
- `mcp_network`: Service discovery
- `monitoring_network`: Observability stack
- `web_network`: External access

## Quick Start

### Starting the Ecosystem
```bash
# Start all services
docker-compose -f docker-compose.ecosystem.yml up -d

# Start monitoring stack only
docker-compose -f docker-compose.ecosystem.yml --profile monitoring up -d

# Start production services
docker-compose -f docker-compose.ecosystem.yml --profile production up -d
```

### Access URLs
- **Grafana**: http://localhost:3020 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Alertmanager**: http://localhost:9093
- **Jaeger UI**: http://localhost:16686
- **Loki**: http://localhost:3100

## Monitoring Stack

### Prometheus
- **Configuration**: `monitoring/prometheus.yml`
- **Alert Rules**: `monitoring/alert_rules.yml`
- **Recording Rules**: `monitoring/recording_rules.yml`
- **Retention**: 200 hours
- **Scrape Interval**: 15s (30s for infrastructure)

### Grafana
- **Dashboards**:
  - System Overview
  - Database Performance
  - Application Performance
  - GPU Monitoring
- **Data Sources**: Prometheus, Alertmanager
- **Plugins**: Pie Chart, World Map panels

### Alertmanager
- **Configuration**: `monitoring/alertmanager.yml`
- **Routes**: Critical → Email, Database → DB Team, GPU → AI Team
- **Inhibition**: Critical alerts suppress warnings

### Loki + Promtail
- **Log Aggregation**: All container logs
- **Retention**: Configurable via Loki config
- **Query Language**: LogQL

### Jaeger
- **Distributed Tracing**: Application performance tracing
- **Protocols**: OTLP, Jaeger, Zipkin
- **UI**: http://localhost:16686

## Health Checks and Alerts

### Service Health
- **UP/DOWN**: Services monitored every 30s
- **Flapping Detection**: Restarts > 6 in 10min trigger alerts
- **Auto-recovery**: Services restart automatically on failure

### Resource Alerts
- **Memory**: >85% usage triggers warning
- **CPU**: >90% usage triggers warning
- **Disk**: >90% usage triggers critical alert

### Application Alerts
- **Error Rate**: >5% 5xx errors trigger critical
- **Response Time**: >5s P95 triggers warning
- **Database**: Connection limits, slow queries

### GPU Alerts
- **Utilization**: >95% triggers warning
- **Memory**: >95% usage triggers critical
- **Temperature**: Monitored via DCGM

## Backup and Recovery

### Automated Backups
```bash
# Full backup
./scripts/backup-ecosystem.sh backup

# List backups
./scripts/backup-ecosystem.sh list

# Restore specific backup
./scripts/backup-ecosystem.sh restore 20241221_020000
```

### Backup Contents
- **PostgreSQL**: All databases (compressed SQL dumps)
- **Redis**: RDB snapshots
- **Configurations**: docker-compose, monitoring configs
- **Volumes**: Docker volume snapshots

### Recovery Procedures
1. Stop affected services
2. Restore from backup
3. Verify data integrity
4. Restart services
5. Monitor for issues

## Log Management

### Log Rotation
```bash
# Rotate logs
./scripts/manage-logs.sh rotate

# Cleanup old logs
./scripts/manage-logs.sh cleanup

# Monitor log sizes
./scripts/manage-logs.sh monitor
```

### Log Locations
- **Application Logs**: `/var/log/ai-ecosystem/`
- **Docker Logs**: JSON files with size limits
- **Backup Logs**: Compressed and archived

## Security

### Network Security
- **Internal Networks**: Database, monitoring (no external access)
- **Service Isolation**: Each service type on separate network
- **Secrets Management**: Docker secrets for sensitive data

### Container Security
- **Read-only**: Database containers run read-only
- **No New Privileges**: Security restrictions on containers
- **Resource Limits**: Memory and CPU limits enforced

### Access Control
- **Grafana**: Admin authentication required
- **API Keys**: Stored in Docker secrets
- **Database**: Strong passwords, connection limits

## Performance Optimization

### Resource Allocation
- **GPU Services**: 12-24GB RAM, 6-12 CPU cores
- **AI Services**: 4-8GB RAM, 2-6 CPU cores
- **Infrastructure**: 1-4GB RAM, 1-2 CPU cores

### Database Tuning
- **Connections**: Max 200 concurrent
- **Memory**: 256MB shared buffers, 1GB effective cache
- **Monitoring**: pg_stat_statements enabled

### Monitoring Overhead
- **Prometheus**: ~50MB RAM, low CPU
- **Grafana**: ~256MB RAM, low CPU
- **Loki**: ~128MB RAM for small deployments

## Troubleshooting

### Common Issues

#### Service Not Starting
```bash
# Check logs
docker-compose logs <service_name>

# Check dependencies
docker-compose ps

# Restart service
docker-compose restart <service_name>
```

#### High Resource Usage
```bash
# Check container stats
docker stats

# Check Grafana dashboards
# System Overview → Resource Usage

# Scale resources if needed
docker-compose up -d --scale <service>=<count>
```

#### Database Connection Issues
```bash
# Check database health
docker exec postgres pg_isready -U admin -d ai_ecosystem

# Check connection count
docker exec postgres psql -U admin -d ai_ecosystem -c "SELECT count(*) FROM pg_stat_activity;"

# Restart database
docker-compose restart postgres
```

#### Monitoring Not Working
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check Grafana logs
docker-compose logs grafana

# Restart monitoring stack
docker-compose --profile monitoring restart
```

### Alert Response Procedures

#### Critical Alerts
1. **Acknowledge** alert in Alertmanager
2. **Assess** impact on users
3. **Investigate** root cause
4. **Resolve** issue
5. **Document** incident

#### Service Down
1. Check service logs
2. Verify dependencies are running
3. Restart service
4. Monitor for recurrence

#### Resource Exhaustion
1. Identify resource bottleneck
2. Scale resources or optimize usage
3. Implement rate limiting if needed
4. Monitor for improvement

## Maintenance Procedures

### Weekly Tasks
- Review Grafana dashboards
- Check backup integrity
- Update Docker images
- Review alert history

### Monthly Tasks
- Full system backup test
- Log retention review
- Performance trend analysis
- Security updates

### Emergency Procedures
- **System Down**: Follow disaster recovery plan
- **Data Loss**: Restore from backup
- **Security Breach**: Isolate affected systems, investigate

## Contact Information

- **System Administration**: admin@ai-ecosystem.local
- **Database Team**: database-team@ai-ecosystem.local
- **AI/ML Team**: ai-team@ai-ecosystem.local
- **Monitoring Alerts**: alerts@ai-ecosystem.local

## Appendices

### Configuration Files
- `docker-compose.ecosystem.yml`: Main orchestration
- `monitoring/prometheus.yml`: Metrics collection
- `monitoring/alertmanager.yml`: Alert routing
- `monitoring/loki-config.yml`: Log aggregation

### Scripts
- `scripts/backup-ecosystem.sh`: Backup management
- `scripts/manage-logs.sh`: Log management
- `scripts/check-status.sh`: Health monitoring

### Dashboards
- System Overview: General health metrics
- Database Performance: PostgreSQL metrics
- Application Performance: Service metrics
- GPU Monitoring: GPU utilization and health