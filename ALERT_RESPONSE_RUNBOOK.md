# Alert Response Runbook

## Overview
This runbook provides step-by-step procedures for responding to common alerts in the AI Emulators Ecosystem.

## Alert Categories

### 🔴 Critical Alerts
**Immediate action required - Service impacting**

#### ServiceDown
**Description**: A critical service is not responding
**Impact**: Service unavailable to users
**Response Time**: Within 5 minutes

**Procedure**:
1. **Acknowledge** alert in Alertmanager UI
2. **Check service status**:
   ```bash
   docker-compose ps <service_name>
   docker-compose logs <service_name> --tail 50
   ```
3. **Check dependencies**:
   ```bash
   docker-compose ps postgres redis
   ```
4. **Restart service**:
   ```bash
   docker-compose restart <service_name>
   ```
5. **Verify recovery**:
   ```bash
   curl -f http://localhost:<port>/health
   ```
6. **Escalate** if service doesn't recover within 10 minutes

#### DatabaseDown
**Description**: PostgreSQL is not responding
**Impact**: All services lose data access
**Response Time**: Within 2 minutes

**Procedure**:
1. **Check database logs**:
   ```bash
   docker-compose logs postgres --tail 100
   ```
2. **Check disk space**:
   ```bash
   df -h /var/lib/docker/volumes
   ```
3. **Restart database**:
   ```bash
   docker-compose restart postgres
   ```
4. **Verify connections**:
   ```bash
   docker exec postgres pg_isready -U admin -d ai_ecosystem
   ```
5. **Check data integrity** if restart fails

#### GPUOutOfMemory
**Description**: GPU memory usage >95%
**Impact**: AI/ML services may fail
**Response Time**: Within 15 minutes

**Procedure**:
1. **Check GPU status**:
   ```bash
   nvidia-smi
   ```
2. **Identify problematic service**:
   ```bash
   docker stats --no-stream
   ```
3. **Restart GPU-intensive service**:
   ```bash
   docker-compose restart wan2gp
   ```
4. **Monitor GPU memory recovery**

### 🟡 Warning Alerts
**Action required - Potential issues**

#### HighMemoryUsage
**Description**: System memory usage >85%
**Impact**: Potential performance degradation
**Response Time**: Within 30 minutes

**Procedure**:
1. **Identify memory consumers**:
   ```bash
   docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
   ```
2. **Check for memory leaks** in application logs
3. **Restart high-memory services** if needed
4. **Consider scaling resources**

#### HighCPUUsage
**Description**: System CPU usage >90%
**Impact**: Slow response times
**Response Time**: Within 30 minutes

**Procedure**:
1. **Check CPU usage by service**:
   ```bash
   docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}"
   ```
2. **Review recent deployments**
3. **Check for infinite loops** in logs
4. **Scale CPU resources** if needed

#### SlowResponseTime
**Description**: P95 response time >5 seconds
**Impact**: Poor user experience
**Response Time**: Within 1 hour

**Procedure**:
1. **Check application logs** for errors
2. **Review database query performance**:
   ```bash
   docker exec postgres psql -U admin -d ai_ecosystem -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"
   ```
3. **Check resource utilization**
4. **Optimize slow queries** or scale services

#### HighErrorRate
**Description**: HTTP 5xx error rate >5%
**Impact**: Service reliability issues
**Response Time**: Within 30 minutes

**Procedure**:
1. **Check error logs**:
   ```bash
   docker-compose logs <service_name> | grep -i error
   ```
2. **Review recent changes**
3. **Check database connectivity**
4. **Restart service** if needed

### 🔵 Info Alerts
**Monitor - No immediate action**

#### ServiceFlapping
**Description**: Service restarting frequently
**Impact**: Potential instability
**Response Time**: Within 4 hours

**Procedure**:
1. **Review service logs** for crash reasons
2. **Check resource limits**
3. **Investigate configuration issues**
4. **Update service configuration**

#### DiskSpaceLow
**Description**: Disk usage >90%
**Impact**: Potential data loss
**Response Time**: Within 2 hours

**Procedure**:
1. **Check disk usage**:
   ```bash
   df -h
   du -sh /var/lib/docker/volumes/*
   ```
2. **Clean up old logs**:
   ```bash
   ./scripts/manage-logs.sh cleanup
   ```
3. **Remove unused Docker images**:
   ```bash
   docker system prune -f
   ```
4. **Extend disk space** if needed

## Escalation Procedures

### When to Escalate
- **Critical alerts** not resolved within 30 minutes
- **Multiple services** affected simultaneously
- **Data loss** or corruption suspected
- **Security incidents** detected

### Escalation Contacts
- **Primary**: System Administrator (admin@ai-ecosystem.local)
- **Database**: Database Team (database-team@ai-ecosystem.local)
- **AI/ML**: AI Team (ai-team@ai-ecosystem.local)
- **Security**: Security Team (security@ai-ecosystem.local)

### Emergency Contacts
- **24/7 On-call**: +1-555-0123
- **Backup**: +1-555-0124

## Post-Incident Procedures

### Documentation
1. **Record incident** in incident tracking system
2. **Document root cause**
3. **Update runbook** with lessons learned
4. **Communicate** with stakeholders

### Prevention
1. **Implement fixes** for root cause
2. **Update monitoring** if needed
3. **Review alert thresholds**
4. **Schedule follow-up** review

## Alert Sources

### Prometheus Alerts
- **URL**: http://localhost:9090/alerts
- **Rules**: `monitoring/alert_rules.yml`
- **Silence**: Use Alertmanager UI

### Grafana Alerts
- **URL**: http://localhost:3020/alerting/list
- **Configuration**: Dashboard alert rules

### System Alerts
- **Logs**: `/var/log/ai-ecosystem/`
- **Monitoring**: Grafana dashboards

## Tools and Commands

### Health Checks
```bash
# Quick status check
./scripts/check-status.sh

# Detailed service status
docker-compose ps

# Resource usage
docker stats
```

### Log Analysis
```bash
# Service logs
docker-compose logs <service> --tail 100

# System logs
journalctl -u docker -f

# Application logs
tail -f /var/log/ai-ecosystem/*.log
```

### Database Diagnostics
```bash
# Connection check
docker exec postgres pg_isready -U admin -d ai_ecosystem

# Active queries
docker exec postgres psql -U admin -d ai_ecosystem -c "SELECT * FROM pg_stat_activity;"

# Database size
docker exec postgres psql -U admin -d ai_ecosystem -c "SELECT pg_size_pretty(pg_database_size(current_database()));"
```

### Network Diagnostics
```bash
# Container networks
docker network ls

# Network inspection
docker network inspect ai_ecosystem_monitoring_network

# Connectivity test
docker exec <container> ping <target>
```