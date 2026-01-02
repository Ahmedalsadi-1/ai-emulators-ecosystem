# Integration Testing Prompts for AI Coder Agent

## Cross-Service Interaction Testing - Ready-to-Use Prompts

### 1. Microservice Communication Testing

**Prompt:**
```
Context: Testing communication between [SERVICE_A] and [SERVICE_B] for [FEATURE/FUNCTIONALITY].
Task: Create comprehensive integration tests for microservices communication.
Test Scenarios:
- Happy path: Successful request/response flow
- Error handling: Service unavailable scenarios
- Timeout handling: Slow response scenarios
- Authentication: Token validation and authorization
- Data validation: Request/response payload validation
- Retry logic: Automatic retry behavior testing
- Circuit breaker: Failure threshold and recovery
- Load testing: Concurrent request handling
Expected Deliverable: Complete integration test suite with test data, mocks, and documentation.
Quality Checks: Tests cover all critical paths, reliable execution, proper test isolation, CI integration.
```

### 2. Database Integration Testing

**Prompt:**
```
Context: Testing [SERVICE] integration with [DATABASE_TYPE] for [FEATURE].
Task: Create database integration tests ensuring data integrity and consistency.
Test Scenarios:
- CRUD operations: Create, Read, Update, Delete operations
- Transaction handling: Commit and rollback scenarios
- Concurrent access: Multi-user data modification
- Data constraints: Foreign key and validation rules
- Migration testing: Schema changes and backward compatibility
- Connection pooling: Connection management under load
- Error scenarios: Database connection failures
- Performance: Query execution time validation
Expected Deliverable: Database integration tests with test database setup and data seeding.
Quality Checks: Tests isolated from production, transaction integrity, performance benchmarks.
```

### 3. API Gateway Integration Testing

**Prompt:**
```
Context: Testing [SERVICE] integration with API Gateway for [ENDPOINT/API].
Task: Create API Gateway integration tests for routing and middleware functionality.
Test Scenarios:
- Request routing: Correct service routing and load balancing
- Authentication: JWT token validation and user context
- Rate limiting: Request throttling and quota enforcement
- Request transformation: Header modification and payload transformation
- Response handling: Status code mapping and response formatting
- Error handling: 404, 500, and custom error responses
- Security headers: CORS, CSP, and security middleware
- Monitoring: Request logging and metrics collection
Expected Deliverable: API Gateway integration tests with mock services and test scenarios.
Quality Checks: Proper routing, security compliance, error handling, monitoring verification.
```

### 4. Event-Driven Architecture Testing

**Prompt:**
```
Context: Testing event-driven integration between [SERVICE_A] and [SERVICE_B] using [MESSAGE_BROKER].
Task: Create integration tests for event-driven communication patterns.
Test Scenarios:
- Event publishing: Successful event emission and delivery
- Event consumption: Event processing and acknowledgment
- Dead letter queue: Failed event handling and retry mechanisms
- Event ordering: Message sequence and idempotency
- Event schema: Contract validation and compatibility
- Event routing: Topic/queue routing and filtering
- Consumer groups: Load balancing and parallel processing
- Event replay: Historical event processing
Expected Deliverable: Event-driven integration tests with test events and message validation.
Quality Checks: Reliable event delivery, proper error handling, schema compliance, performance.
```

### 5. Authentication Flow Integration Testing

**Prompt:**
```
Context: Testing authentication flow across [SERVICE] and [AUTH_PROVIDER] for [USER_TYPE].
Task: Create comprehensive authentication integration tests.
Test Scenarios:
- Login flow: Credential validation and token generation
- Token validation: JWT verification and expiration handling
- Session management: Session creation and termination
- Authorization: Role-based access control testing
- Password reset: Recovery flow and security validation
- Multi-factor authentication: MFA flow and backup codes
- Single sign-on: Cross-service authentication
- Token refresh: Automatic token renewal and invalidation
Expected Deliverable: Authentication integration tests with test users and security scenarios.
Quality Checks: Security compliance, proper token handling, session security, audit trail.
```

### 6. File Upload/Download Integration Testing

**Prompt:**
```
Context: Testing file handling integration between [FRONTEND_SERVICE] and [STORAGE_SERVICE].
Task: Create file upload/download integration tests with various file types and sizes.
Test Scenarios:
- File upload: Successful upload with progress tracking
- File validation: Type, size, and malware scanning
- Storage integration: Cloud storage and local storage
- Download functionality: Secure file access and streaming
- Large file handling: Chunked upload and resume capability
- Error scenarios: Upload failures and storage errors
- Access control: File permissions and sharing
- File processing: Thumbnail generation and metadata extraction
Expected Deliverable: File handling integration tests with various file types and sizes.
Quality Checks: Secure file handling, proper access controls, error recovery, performance.
```

### 7. Real-time Communication Testing

**Prompt:**
```
Context: Testing real-time communication between [CLIENT] and [SERVER] using [WEBSOCKET/GRPC].
Task: Create real-time communication integration tests for live features.
Test Scenarios:
- Connection establishment: WebSocket/GRPC connection setup
- Message broadcasting: Real-time message delivery
- Connection management: Keep-alive and reconnection
- Message ordering: Sequence validation and deduplication
- Load handling: Multiple concurrent connections
- Error handling: Connection failures and recovery
- Authentication: Real-time session validation
- Performance: Latency and throughput testing
Expected Deliverable: Real-time communication tests with connection simulation and load testing.
Quality Checks: Reliable connections, proper message delivery, connection recovery, performance benchmarks.
```

### 8. External Service Integration Testing

**Prompt:**
```
Context: Testing [SERVICE] integration with [EXTERNAL_SERVICE/API] for [FUNCTIONALITY].
Task: Create external service integration tests with mock and sandbox environments.
Test Scenarios:
- API integration: Successful API calls and responses
- Error handling: External service failures and timeouts
- Rate limiting: API quota and throttling compliance
- Data mapping: Request/response transformation
- Authentication: API key and OAuth handling
- Retry logic: Automatic retry for transient failures
- Fallback handling: Service unavailable scenarios
- Contract testing: API contract validation
Expected Deliverable: External service integration tests with mock servers and contract validation.
Quality Checks: Proper error handling, contract compliance, retry logic, monitoring integration.
```

### 9. Payment Processing Integration Testing

**Prompt:**
```
Context: Testing payment integration between [APPLICATION] and [PAYMENT_PROCESSOR] for [TRANSACTION_TYPE].
Task: Create payment processing integration tests with security and compliance focus.
Test Scenarios:
- Payment processing: Successful transaction flow
- Payment validation: Amount, currency, and method validation
- Error handling: Declined payments and system failures
- Refund processing: Partial and full refund scenarios
- PCI compliance: Secure payment data handling
- Webhook handling: Payment confirmation and status updates
- Multi-currency: Currency conversion and localization
- Compliance: Audit trail and reporting requirements
Expected Deliverable: Payment integration tests with security validation and compliance checks.
Quality Checks: PCI compliance, secure data handling, proper audit trail, error recovery.
```

### 10. Monitoring and Observability Integration Testing

**Prompt:**
```
Context: Testing [SERVICE] integration with monitoring stack for [METRIC_TYPE/ALERT_TYPE].
Task: Create monitoring integration tests to verify observability and alerting.
Test Scenarios:
- Metrics collection: Custom and system metrics gathering
- Log aggregation: Structured logging and log shipping
- Distributed tracing: Request tracing across services
- Health checks: Service health and dependency monitoring
- Alerting: Threshold-based and anomaly detection
- Dashboard integration: Visualization and data correlation
- Performance monitoring: Response time and throughput tracking
- Error tracking: Exception handling and error reporting
Expected Deliverable: Monitoring integration tests with test data and alert validation.
Quality Checks: Accurate metrics, proper alerting, complete observability, dashboard functionality.