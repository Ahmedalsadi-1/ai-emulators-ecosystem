# Code Review Prompts for AI Coder Agent

## Code Quality Checks and Reviews - Ready-to-Use Prompts

### 1. Comprehensive Code Quality Review

**Prompt:**
```
Context: Review code changes in [FILE_PATH/COMPONENT_NAME] for [SERVICE_NAME].
Task: Conduct comprehensive code quality review following our standards.
Review Areas:
- Code structure and architecture compliance
- TypeScript/Python type safety and best practices
- Security vulnerabilities and input validation
- Performance implications and optimization opportunities
- Error handling and edge case coverage
- Test coverage and test quality
- Documentation completeness and accuracy
- Code maintainability and readability
- Dependency management and security
- Accessibility compliance (for frontend code)
Expected Deliverable: Detailed code review report with specific recommendations and approval/blocking comments.
Quality Checks: All review criteria addressed, actionable feedback provided, standards compliance verified.
```

### 2. Security-Focused Code Review

**Prompt:**
```
Context: Review [COMPONENT/CHANGES] for security vulnerabilities and compliance.
Task: Conduct security-focused code review with OWASP guidelines.
Security Review Areas:
- Input validation and sanitization
- Authentication and authorization implementation
- SQL injection and XSS prevention
- Cryptographic implementation and key management
- Session management and token handling
- File upload and download security
- API rate limiting and DoS protection
- Security headers and CSP implementation
- Dependency vulnerability scanning
- Secrets and configuration management
Expected Deliverable: Security assessment report with vulnerability findings and remediation steps.
Quality Checks: No critical security issues, OWASP compliance verified, security testing included.
```

### 3. Performance and Scalability Review

**Prompt:**
```
Context: Review [COMPONENT/SERVICE] for performance and scalability concerns.
Task: Conduct performance-focused code review.
Performance Review Areas:
- Algorithm efficiency and complexity analysis
- Database query optimization opportunities
- Memory usage patterns and potential leaks
- Asynchronous processing and concurrency
- Caching strategies and implementation
- API response time and throughput
- Resource utilization and scaling bottlenecks
- Frontend rendering performance (React/TypeScript)
- Network optimization and payload size
- Long-running operations and timeouts
Expected Deliverable: Performance review report with optimization recommendations and benchmarks.
Quality Checks: Performance impact assessed, optimization opportunities identified, monitoring recommended.
```

### 4. Test Coverage and Quality Review

**Prompt:**
```
Context: Review test implementation for [COMPONENT/SERVICE] to ensure quality and coverage.
Task: Conduct comprehensive test review following our testing standards.
Test Review Areas:
- Unit test coverage (target: >80%)
- Integration test completeness
- End-to-end test scenarios
- Test data management and isolation
- Mock/stub usage and appropriateness
- Test readability and maintainability
- Performance and reliability of tests
- Security testing for sensitive components
- Error handling test coverage
- API contract testing compliance
Expected Deliverable: Test assessment report with coverage analysis and improvement recommendations.
Quality Checks: Adequate test coverage, reliable test suite, appropriate test patterns used.
```

### 5. Architecture and Design Pattern Review

**Prompt:**
```
Context: Review [COMPONENT/SERVICE] architecture and design patterns.
Task: Conduct architecture review for design compliance and best practices.
Architecture Review Areas:
- SOLID principles adherence
- Design pattern implementation
- Dependency injection and inversion
- Service layer separation and boundaries
- Database schema design and relationships
- API design and RESTful compliance
- Microservice communication patterns
- Error handling and logging architecture
- Configuration management approach
- Scalability and maintainability considerations
Expected Deliverable: Architecture review report with design recommendations and compliance assessment.
Quality Checks: Architecture follows established patterns, separation of concerns maintained, scalability considered.
```

### 6. Frontend Code Review (React/TypeScript)

**Prompt:**
```
Context: Review frontend changes in [COMPONENT_NAME] for [FRONTEND_APPLICATION].
Task: Conduct frontend-specific code review with React/TypeScript best practices.
Frontend Review Areas:
- React component design and reusability
- TypeScript type safety and prop validation
- State management and props drilling
- Hook usage and custom hook implementation
- Accessibility (ARIA labels, keyboard navigation)
- Performance optimization (memo, useMemo, useCallback)
- CSS/Tailwind implementation and responsiveness
- Error boundary implementation
- Loading states and user experience
- Bundle size and code splitting opportunities
Expected Deliverable: Frontend review report with UX and performance recommendations.
Quality Checks: Accessibility compliant, performant, well-typed, follows design system.
```

### 7. Backend API Review

**Prompt:**
```
Context: Review [API_ENDPOINT/SERVICE] for backend best practices and compliance.
Task: Conduct backend API review with focus on reliability and standards.
Backend Review Areas:
- RESTful API design and HTTP status codes
- Request/response validation and serialization
- Authentication and authorization middleware
- Rate limiting and throttling implementation
- Database transaction handling and ACID compliance
- Error handling and logging patterns
- Async processing and background jobs
- Caching strategies (Redis/memory)
- API versioning and backward compatibility
- Monitoring and health check implementation
Expected Deliverable: Backend review report with API quality and reliability recommendations.
Quality Checks: RESTful compliance, proper error handling, adequate monitoring, security measures.
```

### 8. Database and Data Layer Review

**Prompt:**
```
Context: Review database changes and data layer implementation for [FEATURE/SERVICE].
Task: Conduct database and data layer review for optimization and integrity.
Database Review Areas:
- Schema design and normalization
- Index strategy and query optimization
- Foreign key constraints and referential integrity
- Data migration safety and rollback plans
- Connection pool management
- Transaction isolation and locking
- Backup and recovery procedures
- Data validation and constraint enforcement
- Performance monitoring and slow query analysis
- Security (encryption, access controls)
Expected Deliverable: Database review report with optimization recommendations and security assessment.
Quality Checks: Optimized queries, proper constraints, secure access, reliable migrations.
```

### 9. DevOps and Deployment Review

**Prompt:**
**
Context: Review [DEPLOYMENT_CONFIGURATION/CI_CD_CHANGES] for reliability and best practices.
Task: Conduct DevOps and deployment review for production readiness.
DevOps Review Areas:
- Docker configuration and optimization
- CI/CD pipeline reliability and security
- Environment configuration management
- Secret management and security
- Rollback and disaster recovery procedures
- Monitoring and alerting setup
- Resource allocation and scaling policies
- Security scanning and vulnerability management
- Deployment verification and health checks
- Documentation and runbook completeness
Expected Deliverable: DevOps review report with deployment reliability and security recommendations.
Quality Checks: Production-ready, secure, monitored, documented, rollback capable.
```

### 10. Cross-Service Integration Review

**Prompt:**
```
Context: Review [INTEGRATION_CODE/SERVICE_COMMUNICATION] for cross-service reliability.
Task: Conduct integration review for service-to-service communication patterns.
Integration Review Areas:
- Service contract and API compatibility
- Error handling and retry mechanisms
- Circuit breaker and fallback patterns
- Message queuing and event-driven architecture
- Authentication between services
- Load balancing and service discovery
- Monitoring and distributed tracing
- Data consistency and eventual consistency
- Performance and timeout handling
- Security and authorization between services
Expected Deliverable: Integration review report with reliability and monitoring recommendations.
Quality Checks: Fault-tolerant, well-monitored, secure communication, proper error handling.