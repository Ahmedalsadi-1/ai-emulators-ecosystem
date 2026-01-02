# Quick Reference Prompts for AI Coder Agent

## Common Development Tasks - Ready-to-Use Prompts

### 1. Service Integration Setup

**Prompt:**
```
Context: I'm integrating [SERVICE_NAME] with [EXISTING_SERVICE] in our unified ecosystem.
Task: Create the service integration layer following our established patterns.
Requirements:
- Use our standard service interface pattern
- Implement proper error handling and retry logic
- Add comprehensive logging with our logger utility
- Follow the authentication patterns used in [EXISTING_SERVICE]
- Include health check endpoints
- Add integration tests following our test patterns
Expected Deliverable: Complete service integration module with tests, documentation, and deployment configuration.
Quality Checks: Code follows TypeScript/Python standards, includes error boundaries, has test coverage >80%.
```

### 2. Docker Configuration Creation

**Prompt:**
```
Context: I need to containerize [APPLICATION_NAME] for our microservices ecosystem.
Task: Create production-ready Docker configuration.
Requirements:
- Multi-stage build for optimization
- Non-root user execution
- Health check implementation
- Environment variable handling
- Proper logging configuration
- Resource limits and security settings
- Integration with our docker-compose.ecosystem.yml
Expected Deliverable: Dockerfile, docker-compose service definition, and deployment scripts.
Quality Checks: Follows security best practices, optimized image size, proper health checks.
```

### 3. API Endpoint Implementation

**Prompt:**
```
Context: Adding REST API endpoint [ENDPOINT_PATH] to [SERVICE_NAME].
Task: Implement the API endpoint following our unified API patterns.
Requirements:
- Use our standard request/response DTOs
- Implement proper HTTP status codes
- Add input validation and sanitization
- Include rate limiting where appropriate
- Follow our error handling middleware patterns
- Add OpenAPI/Swagger documentation
- Include unit and integration tests
Expected Deliverable: Complete endpoint implementation with tests and documentation.
Quality Checks: Follows REST conventions, includes validation, has comprehensive test coverage.
```

### 4. Database Migration Script

**Prompt:**
```
Context: Creating database schema changes for [FEATURE_NAME] in [SERVICE_NAME].
Task: Generate safe database migration scripts.
Requirements:
- Create both up and down migration scripts
- Include data integrity checks
- Add rollback capabilities
- Follow our naming conventions
- Include proper indexing for performance
- Add foreign key constraints where needed
- Include seed data if required
Expected Deliverable: Migration scripts, rollback procedures, and database documentation.
Quality Checks: Safe for production use, includes data validation, has rollback strategy.
```

### 5. Cross-Service Communication Setup

**Prompt:**
```
Context: Setting up communication between [SERVICE_A] and [SERVICE_B].
Task: Implement reliable cross-service communication.
Requirements:
- Use our standard message format
- Implement circuit breaker pattern
- Add request/response correlation IDs
- Include proper timeout handling
- Add message queuing for reliability
- Implement health checks between services
- Include monitoring and alerting
Expected Deliverable: Communication module, configuration, and monitoring setup.
Quality Checks: Fault-tolerant, properly monitored, follows our communication patterns.
```

### 6. React Component Development

**Prompt:**
```
Context: Creating React component [COMPONENT_NAME] for [FEATURE_AREA].
Task: Build production-ready React component.
Requirements:
- Use TypeScript and follow our component patterns
- Implement proper prop validation
- Add accessibility features (ARIA labels, keyboard navigation)
- Include loading and error states
- Follow our styling patterns (Tailwind CSS)
- Add unit tests with Jest/React Testing Library
- Include Storybook documentation
Expected Deliverable: Complete component with tests, documentation, and usage examples.
Quality Checks: Accessible, well-tested, follows design system, performs well.
```

### 7. Testing Framework Setup

**Prompt:**
```
Context: Setting up comprehensive testing for [SERVICE_OR_FEATURE].
Task: Create complete testing strategy and implementation.
Requirements:
- Unit tests with >80% coverage
- Integration tests for API endpoints
- End-to-end tests for critical user flows
- Performance testing for high-traffic endpoints
- Security testing for authentication/authorization
- Test data management and cleanup
- CI/CD integration for automated testing
Expected Deliverable: Complete test suite with configuration and documentation.
Quality Checks: Comprehensive coverage, reliable tests, fast execution, CI integration.
```

### 8. Configuration Management

**Prompt:**
```
Context: Managing configuration for [ENVIRONMENT] deployment of [SERVICE].
Task: Create robust configuration management system.
Requirements:
- Environment-specific configuration files
- Secure secret management
- Configuration validation at startup
- Hot-reload capability for development
- Documentation for all configuration options
- Default values and fallbacks
- Configuration change monitoring
Expected Deliverable: Configuration system with documentation and examples.
Quality Checks: Secure, well-documented, supports all environments, validated.
```

### 9. Monitoring and Logging Setup

**Prompt:**
```
Context: Adding monitoring and logging for [SERVICE_OR_FEATURE].
Task: Implement comprehensive observability.
Requirements:
- Structured logging with correlation IDs
- Metrics collection (performance, business, system)
- Health check endpoints
- Alerting rules and thresholds
- Dashboard creation for Grafana
- Error tracking and reporting
- Log aggregation and search
Expected Deliverable: Complete monitoring setup with dashboards and alerting.
Quality Checks: Actionable alerts, comprehensive metrics, good visualization.
```

### 10. Authentication/Authorization Implementation

**Prompt:**
```
Context: Adding auth to [SERVICE_OR_ENDPOINT] with [AUTH_METHOD].
Task: Implement secure authentication and authorization.
Requirements:
- Secure token handling (JWT/OAuth)
- Role-based access control (RBAC)
- Rate limiting for auth endpoints
- Session management
- Security headers implementation
- Input sanitization and validation
- Audit logging for security events
Expected Deliverable: Complete auth system with tests and security documentation.
Quality Checks: Follows security best practices, comprehensive testing, audit trail.