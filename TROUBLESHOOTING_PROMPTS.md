# Troubleshooting Prompts for AI Coder Agent

## Debugging and Problem-Solving Scenarios - Ready-to-Use Prompts

### 1. Service Communication Debugging

**Prompt:**
```
Context: Service [SERVICE_A] cannot communicate with [SERVICE_B]. Getting [ERROR_TYPE] errors.
Symptom: [SPECIFIC_ERROR_MESSAGE] occurring at [FREQUENCY] frequency.
Task: Debug and resolve the inter-service communication issue.
Investigation Steps:
- Check service health endpoints and status
- Verify network connectivity and firewall rules
- Analyze authentication tokens and permissions
- Review recent deployment changes
- Check load balancer and reverse proxy configurations
- Examine logs for both services during error periods
- Validate API contract compatibility
Expected Resolution: Root cause analysis, fix implementation, and prevention measures.
Quality Checks: Issue reproduced in test environment, comprehensive fix applied, monitoring added.
```

### 2. Performance Degradation Analysis

**Prompt:**
```
Context: [SERVICE_NAME] performance degraded. Response times increased from [BASELINE] to [CURRENT].
Symptom: [SPECIFIC_PERFORMANCE_ISSUE] affecting [AFFECTED_USER_COUNT] users.
Task: Identify performance bottlenecks and implement optimizations.
Investigation Steps:
- Analyze application performance monitoring (APM) data
- Check database query performance and slow query logs
- Review memory usage and garbage collection patterns
- Examine CPU utilization and thread dump analysis
- Check network latency and bandwidth usage
- Review recent code changes and deployment history
- Analyze caching hit rates and configuration
Expected Resolution: Performance optimization plan with before/after metrics.
Quality Checks: Measurable improvement achieved, no regression in functionality, monitoring in place.
```

### 3. Memory Leak Investigation

**Prompt:**
```
Context: [SERVICE_NAME] experiencing memory issues. Memory usage grows from [START_SIZE] to [MAX_SIZE] over [TIME_PERIOD].
Symptom: [SPECIFIC_MEMORY_ISSUE] causing [CONSEQUENCE].
Task: Identify and fix memory leaks in the application.
Investigation Steps:
- Generate heap dumps and analyze memory usage patterns
- Review object lifecycle and garbage collection logs
- Check for unclosed resources (connections, files, streams)
- Analyze cache implementations for memory growth
- Review event listener and callback management
- Check for memory retention in closures and global variables
- Monitor memory usage after garbage collection cycles
Expected Resolution: Memory leak fix with heap analysis and prevention measures.
Quality Checks: Memory usage stabilized, no memory-related crashes, monitoring alerts configured.
```

### 4. Database Connection Pool Issues

**Prompt:**
```
Context: [SERVICE_NAME] database connections failing. Getting "connection pool exhausted" errors.
Symptom: [FREQUENCY] failures during [TIME_PERIOD], affecting [OPERATIONS_AFFECTED] operations.
Task: Diagnose and resolve database connection pool problems.
Investigation Steps:
- Check current connection pool configuration and limits
- Analyze connection usage patterns and peak load times
- Review long-running queries and transaction timeouts
- Check for connection leaks in application code
- Verify database server connection limits and resources
- Review connection retry logic and error handling
- Monitor connection pool metrics and health
Expected Resolution: Connection pool optimization with monitoring and alerting.
Quality Checks: No connection pool exhaustion, proper error handling, optimal pool configuration.
```

### 5. Cross-Service Integration Failures

**Prompt:**
```
Context: Integration between [SERVICE_A] and [SERVICE_B] failing intermittently.
Symptom: [ERROR_PATTERN] occurring [FREQUENCY] with error code [ERROR_CODE].
Task: Debug and stabilize the cross-service integration.
Investigation Steps:
- Trace request flow through both services using correlation IDs
- Check service dependency and version compatibility
- Verify message format and contract adherence
- Analyze timeout and retry configurations
- Review circuit breaker and fallback mechanisms
- Check service discovery and load balancing
- Examine authentication and authorization flows
Expected Resolution: Stable integration with proper error handling and monitoring.
Quality Checks: Integration reliability >99%, proper error recovery, comprehensive monitoring.
```

### 6. Build/Deployment Pipeline Failures

**Prompt:**
```
Context: CI/CD pipeline failing at [STAGE_NAME] for [SERVICE_NAME].
Symptom: [BUILD_ERROR] preventing deployment to [ENVIRONMENT].
Task: Fix build/deployment pipeline issues and ensure reliable deployments.
Investigation Steps:
- Analyze build logs for specific failure points
- Check dependency versions and compatibility
- Review environment configuration differences
- Verify Docker image build and push processes
- Check secret management and environment variables
- Review deployment scripts and configuration
- Test build process locally and in clean environment
Expected Resolution: Working pipeline with deployment verification and rollback capability.
Quality Checks: Successful builds in all environments, automated testing, deployment verification.
```

### 7. Authentication/Authorization Debugging

**Prompt:**
```
Context: Users experiencing [AUTH_ISSUE] with [SERVICE_NAME].
Symptom: [FREQUENCY] authentication failures affecting [USER_COUNT] users.
Task: Debug and resolve authentication/authorization issues.
Investigation Steps:
- Check authentication token validity and expiration
- Verify user permissions and role assignments
- Review session management and cookie settings
- Analyze authentication flow and redirect logic
- Check JWT token signature and claims validation
- Review rate limiting and security configurations
- Examine authentication provider status and configuration
Expected Resolution: Working authentication system with proper error messages and monitoring.
Quality Checks: Successful authentication for valid users, proper rejection for invalid users, audit trail.
```

### 8. Frontend Performance Issues

**Prompt:**
```
Context: [FRONTEND_APPLICATION] experiencing performance issues in [BROWSER/DEVICE].
Symptom: [PERFORMANCE_METRIC] degraded from [BASELINE] to [CURRENT].
Task: Debug and optimize frontend performance issues.
Investigation Steps:
- Analyze bundle size and code splitting effectiveness
- Check network requests and API response times
- Review JavaScript execution and rendering performance
- Examine memory usage and potential memory leaks
- Check CSS rendering and layout calculation performance
- Analyze third-party library usage and impact
- Review caching strategies and resource optimization
Expected Resolution: Performance optimization with measurable improvements and monitoring.
Quality Checks: Performance metrics improved, no functionality regression, user experience enhanced.
```

### 9. Data Consistency Issues

**Prompt:**
```
Context: Data inconsistency detected between [SERVICE_A] and [SERVICE_B].
Symptom: [DATA_DISCREPANCY] affecting [DATA_RECORDS] records.
Task: Investigate and resolve data consistency problems.
Investigation Steps:
- Analyze data synchronization patterns and timing
- Check transaction isolation and locking mechanisms
- Review eventual consistency assumptions and timeouts
- Verify data transformation and mapping logic
- Check for race conditions and concurrent write issues
- Examine backup and recovery data integrity
- Review event sourcing and change data capture
Expected Resolution: Data consistency fix with reconciliation process and monitoring.
Quality Checks: Data consistency restored, prevention measures implemented, reconciliation verified.
```

### 10. Monitoring and Alerting Debugging

**Prompt:**
```
Context: [ALERT_NAME] alerts firing unexpectedly or missing critical issues.
Symptom: [ALERT_BEHAVIOR] causing [OPERATIONAL_IMPACT].
Task: Debug and fix monitoring and alerting system issues.
Investigation Steps:
- Verify alert rule logic and threshold configurations
- Check data source availability and data quality
- Review alert routing and notification channels
- Analyze historical alert data and false positive patterns
- Check metric collection and aggregation logic
- Review alert suppression and maintenance windows
- Test alert delivery and escalation procedures
Expected Resolution: Reliable monitoring system with accurate alerting and proper escalation.
Quality Checks: Alerts fire for real issues, minimal false positives, proper escalation paths.