# AI Coder Prompts - AI Emulators Ecosystem

## 1. GENERAL SYSTEM PROMPTS

### Project Overview and Understanding
**Prompt: "Analyze the AI Emulators Ecosystem and provide a comprehensive overview for new developers"**

**Instructions:**
- Examine the monorepo structure with 13+ services (AIOS, bytebot, factif-ai, etc.)
- Map service relationships and dependencies using SERVICE_RELATIONSHIP_MAP.md
- Understand the MCP (Model Context Protocol) integration across services
- Review the unified orchestration in UNIFIED_ORCHESTRATION_ARCHITECTURE.md

**Expected Outcomes:**
- Clear service architecture diagram
- Technology stack breakdown (Python, TypeScript, Rust, Go)
- Integration patterns and communication flows
- Development workflow and contribution guidelines

**Quality Checks:**
- All 13 services identified and categorized by function
- Service ports and network architecture documented
- MCP integration points explained
- Security boundaries and access patterns identified

### Architecture Comprehension
**Prompt: "Explain the microservices architecture and orchestration patterns used in this ecosystem"**

**Instructions:**
- Analyze the API Gateway pattern in orchestrator/ directory
- Review service discovery mechanisms in mcp-registry/
- Examine cross-service communication in communication/ directory
- Understand the unified UI framework in unified-app/

**Expected Outcomes:**
- Service orchestration flow with API Gateway routing
- Cross-service authentication and authorization patterns
- Real-time communication architecture (WebSocket/EventHub)
- Database integration patterns (PostgreSQL/Redis)

**Quality Checks:**
- Service interaction patterns fully documented
- Security implications identified and addressed
- Scalability considerations included
- Monitoring integration explained

### Technology Stack Awareness
**Prompt: "Document the complete technology stack and development patterns used across services"**

**Instructions:**
- Catalog all programming languages (Python, TypeScript, Rust, Go)
- Document frameworks (NestJS, Express, FastAPI, React/Next.js)
- Identify databases (PostgreSQL 15, Redis 7, Prisma ORM)
- Review containerization (Docker, Docker Compose, networks)

**Expected Outcomes:**
- Technology matrix mapping services to technologies
- Development toolchains (pnpm, uv, pip, Jest, pytest)
- Build and deployment patterns
- Package management strategies

**Quality Checks:**
- All technologies versioned and justified
- Development workflows documented
- Tooling consistency verified
- Migration paths identified

## 2. BACKEND DEVELOPMENT PROMPTS

### NestJS/Express.js Development
**Prompt: "Create a new NestJS service following the established patterns in bytebot-agent"**

**Instructions:**
- Use bytebot-agent structure as template (packages/bytebotd/)
- Implement proper module organization with controllers, services, DTOs
- Include validation pipes and comprehensive error handling
- Add structured logging with correlation IDs

**Expected Outcomes:**
- Properly structured NestJS module with dependency injection
- Input validation and business logic separation
- Error handling with custom exception filters
- Logging integration with ecosystem logger

**Quality Checks:**
- Follows established directory structure
- Includes proper TypeScript types and interfaces
- Has comprehensive error handling
- Passes TypeScript compilation and linting

### Database Integration (PostgreSQL, Redis)
**Prompt: "Implement database integration for a new service using Prisma ORM patterns"**

**Instructions:**
- Use existing Prisma schema patterns from services
- Implement proper connection pooling and transaction management
- Include database migrations and health checks
- Add Redis caching for performance optimization

**Expected Outcomes:**
- Prisma schema with proper relationships and constraints
- Database service with connection management
- Migration scripts and seeding capabilities
- Redis integration for caching and sessions

**Quality Checks:**
- Follows existing Prisma patterns
- Includes proper error handling and retries
- Has migration scripts and rollback capabilities
- Implements caching strategies appropriately

### API Development and RESTful Design
**Prompt: "Design and implement a RESTful API following ecosystem patterns"**

**Instructions:**
- Use orchestrator API patterns as reference
- Implement proper HTTP status codes and consistent response format
- Include comprehensive API documentation (OpenAPI/Swagger)
- Add rate limiting, authentication, and request validation

**Expected Outcomes:**
- RESTful endpoint design with proper resource naming
- Comprehensive error handling and validation
- API documentation with examples
- Security middleware integration

**Quality Checks:**
- Follows REST principles and ecosystem conventions
- Includes proper error responses and status codes
- Has comprehensive API documentation
- Implements security best practices

### Authentication and Security
**Prompt: "Implement authentication and authorization for a new service"**

**Instructions:**
- Use JWT patterns from orchestrator authentication
- Implement role-based access control (RBAC)
- Include secure password handling and credential storage
- Add service-to-service authentication for API calls

**Expected Outcomes:**
- JWT-based authentication system with refresh tokens
- Role-based authorization with permissions
- Secure credential storage and rotation
- Service-to-service auth integration

**Quality Checks:**
- Implements secure authentication mechanisms
- Has proper authorization controls
- Includes credential rotation capabilities
- Follows security best practices

### Real-time Communication (Socket.IO)
**Prompt: "Implement real-time features using WebSocket patterns from the ecosystem"**

**Instructions:**
- Use communication/ directory WebSocket patterns
- Implement proper room management and event handling
- Include connection state management and reconnection logic
- Add real-time data synchronization across services

**Expected Outcomes:**
- WebSocket gateway with proper event handling
- Room-based communication for multi-user features
- Connection management with heartbeat monitoring
- Real-time data sync with conflict resolution

**Quality Checks:**
- Proper WebSocket integration and event handling
- Connection lifecycle management implemented
- Error handling for disconnections
- Performance optimized for real-time operations

### Docker Containerization
**Prompt: "Create Docker configuration for a new service following ecosystem patterns"**

**Instructions:**
- Use existing Dockerfile patterns from services
- Implement multi-stage builds for optimization
- Include proper security practices and non-root users
- Add health checks and resource limits

**Expected Outcomes:**
- Optimized multi-stage Dockerfile
- Docker Compose service definition with networking
- Health check endpoints and monitoring
- Security hardening and resource constraints

**Quality Checks:**
- Follows established containerization patterns
- Includes security best practices
- Has proper health checks and monitoring
- Optimized for production deployment

## 3. FRONTEND DEVELOPMENT PROMPTS

### React/Next.js Development
**Prompt: "Create a new React component following the unified-app patterns"**

**Instructions:**
- Use unified-app component structure as reference
- Implement proper TypeScript interfaces and props
- Include responsive design with TailwindCSS
- Add proper error boundaries and loading states

**Expected Outcomes:**
- TypeScript React component with proper typing
- Responsive design implementation
- Error handling and loading state management
- Accessibility compliance

**Quality Checks:**
- Follows component architecture patterns
- Includes proper TypeScript types
- Responsive design implemented
- Accessibility features included

### TypeScript and TailwindCSS
**Prompt: "Implement a complex UI component with TypeScript and TailwindCSS"**

**Instructions:**
- Use unified-app TypeScript patterns and component composition
- Implement responsive grid layouts and interactive elements
- Include proper component composition and reusability
- Add dark mode support following ecosystem themes

**Expected Outcomes:**
- Complex TypeScript component with proper interfaces
- Responsive TailwindCSS styling with design system
- Component composition patterns implemented
- Theme-aware styling with dark mode

**Quality Checks:**
- TypeScript strict compliance maintained
- Responsive design patterns followed
- Component reusability achieved
- Theme consistency verified

### Real-time UI Updates
**Prompt: "Implement real-time UI updates for service status monitoring"**

**Instructions:**
- Use WebSocket patterns from communication layer
- Implement optimistic updates and error recovery
- Add connection status indicators and reconnection handling
- Include real-time data visualization

**Expected Outcomes:**
- Real-time data synchronization with WebSocket integration
- Connection status management and user feedback
- Error recovery mechanisms and retry logic
- Optimistic UI updates for better UX

**Quality Checks:**
- Proper WebSocket integration implemented
- Error handling and recovery working
- User feedback provided for connection states
- Performance optimized for real-time updates

### Component Architecture
**Prompt: "Design a scalable component architecture for a new feature area"**

**Instructions:**
- Use unified-app component organization and atomic design
- Implement proper separation of concerns and component hierarchy
- Include reusable component library with proper documentation
- Add comprehensive TypeScript interfaces

**Expected Outcomes:**
- Scalable component hierarchy (atoms/molecules/organisms)
- Reusable component library with consistent API
- Proper documentation and usage examples
- TypeScript interface definitions for all components

**Quality Checks:**
- Follows established component architecture
- Proper separation of concerns achieved
- Comprehensive documentation provided
- Type safety maintained throughout

### State Management
**Prompt: "Implement state management for a complex feature using established patterns"**

**Instructions:**
- Use unified-app state management patterns (Zustand/Context)
- Implement proper state synchronization and persistence
- Include error handling and state recovery
- Add state debugging and development tools

**Expected Outcomes:**
- Comprehensive state management solution
- State synchronization across components
- Error handling and recovery mechanisms
- Development tools for state debugging

**Quality Checks:**
- Follows established state management patterns
- Includes error handling and recovery
- Performance optimized for complex state
- Development experience enhanced

## 4. AI/ML INTEGRATION PROMPTS

### Multi-LLM Provider Integration
**Prompt: "Integrate a new LLM provider following the ecosystem's multi-provider patterns"**

**Instructions:**
- Use factif-ai LLM provider patterns as reference
- Implement provider abstraction layer with consistent interface
- Include token usage tracking and cost management
- Add fallback mechanisms and error handling

**Expected Outcomes:**
- New LLM provider integration with unified interface
- Token usage tracking and cost calculation
- Fallback mechanisms for provider failures
- Comprehensive error handling and logging

**Quality Checks:**
- Follows established provider patterns
- Includes cost tracking and optimization
- Error handling comprehensive
- Performance monitoring implemented

### OpenAI, Anthropic, Gemini API Integration
**Prompt: "Implement integration with OpenAI/Anthropic/Gemini APIs following ecosystem patterns"**

**Instructions:**
- Use existing provider implementations as templates
- Implement proper API key management and rotation
- Include rate limiting, retry logic, and exponential backoff
- Add comprehensive error handling and response parsing

**Expected Outcomes:**
- API integration with secure authentication
- Rate limiting and request management
- Error handling with specific error types
- Token usage tracking and cost monitoring

**Quality Checks:**
- Secure API key handling implemented
- Rate limiting and retry logic working
- Comprehensive error handling
- Cost monitoring and optimization

### Model Context Protocol (MCP) Integration
**Prompt: "Implement MCP server integration for a new AI capability"**

**Instructions:**
- Use bytebot MCP patterns as reference
- Implement proper tool registration and discovery
- Include error handling and validation
- Add comprehensive logging and monitoring

**Expected Outcomes:**
- MCP server implementation with tool definitions
- Tool registration and discovery mechanisms
- Error handling and input validation
- Monitoring and logging integration

**Quality Checks:**
- Follows MCP specifications correctly
- Proper tool registration implemented
- Error handling comprehensive
- Monitoring integration complete

### Token Usage Tracking and Cost Management
**Prompt: "Implement token usage tracking and cost optimization across LLM providers"**

**Instructions:**
- Use existing token tracking patterns from services
- Implement cost calculation and budgeting features
- Add usage analytics and reporting dashboards
- Include cost optimization strategies and alerts

**Expected Outcomes:**
- Token usage tracking system with database storage
- Cost calculation and budgeting capabilities
- Usage analytics and reporting features
- Cost optimization recommendations

**Quality Checks:**
- Accurate token tracking implemented
- Cost calculations correct and comprehensive
- Analytics provide actionable insights
- Optimization strategies effective

### Error Handling and Fallback Mechanisms
**Prompt: "Implement comprehensive error handling and fallback mechanisms for AI services"**

**Instructions:**
- Use established error handling patterns across services
- Implement graceful degradation and circuit breaker patterns
- Include automatic retry mechanisms with backoff
- Add fallback provider switching and monitoring

**Expected Outcomes:**
- Comprehensive error handling with specific error types
- Graceful degradation for service failures
- Automatic retry and fallback mechanisms
- Monitoring and alerting for failures

**Quality Checks:**
- Error handling covers all failure scenarios
- Degradation graceful and user-friendly
- Retry logic effective and configurable
- Monitoring provides actionable alerts

## 5. INFRASTRUCTURE & DEVOPS PROMPTS

### Docker and Docker Compose Deployment
**Prompt: "Create Docker configuration for deploying a new service to the ecosystem"**

**Instructions:**
- Use existing Docker patterns from docker-compose.ecosystem.yml
- Implement proper networking and service discovery
- Include health checks, resource limits, and security
- Add environment-specific configurations

**Expected Outcomes:**
- Complete Docker setup with multi-stage builds
- Service networking and discovery configured
- Health checks and resource management
- Environment configurations for dev/staging/prod

**Quality Checks:**
- Follows ecosystem containerization patterns
- Networking properly configured
- Security measures implemented
- Environment handling correct

### Service Orchestration
**Prompt: "Implement service orchestration for a new microservice"**

**Instructions:**
- Use orchestrator patterns as reference
- Implement service registration and health monitoring
- Include load balancing and failover mechanisms
- Add comprehensive monitoring and alerting

**Expected Outcomes:**
- Service orchestration with registration system
- Load balancing and failover capabilities
- Health monitoring and automated recovery
- Comprehensive monitoring dashboard

**Quality Checks:**
- Orchestration working correctly
- Load balancing effective
- Monitoring comprehensive
- Recovery mechanisms functional

### Network Architecture and Service Discovery
**Prompt: "Design network architecture and service discovery for new services"**

**Instructions:**
- Use existing network patterns from Docker Compose
- Implement proper service isolation and security
- Include DNS resolution and service mesh capabilities
- Add network monitoring and troubleshooting

**Expected Outcomes:**
- Network architecture with proper segmentation
- Service discovery mechanisms implemented
- DNS resolution and load balancing
- Network monitoring and security

**Quality Checks:**
- Network design scalable and secure
- Service discovery working reliably
- DNS resolution correct
- Monitoring provides visibility

### Monitoring and Logging
**Prompt: "Implement comprehensive monitoring and logging for a new service"**

**Instructions:**
- Use monitoring/ directory patterns (Prometheus/Grafana)
- Implement structured logging with correlation IDs
- Include metrics collection and alerting
- Add log aggregation and analysis

**Expected Outcomes:**
- Comprehensive monitoring with dashboards
- Structured logging with correlation
- Metrics collection and alerting rules
- Log aggregation and analysis tools

**Quality Checks:**
- Monitoring covers all service aspects
- Logging structured and searchable
- Alerting effective and actionable
- Dashboards provide clear insights

### Health Checks and Monitoring
**Prompt: "Implement health checks and monitoring integration for a service"**

**Instructions:**
- Use existing health check patterns from services
- Implement readiness and liveness probes
- Include dependency health monitoring
- Add automated recovery and alerting

**Expected Outcomes:**
- Health check endpoints for all service components
- Readiness/liveness probe implementations
- Dependency monitoring and cascading failures
- Automated recovery and alerting system

**Quality Checks:**
- Health checks accurate and comprehensive
- Probes working correctly for orchestration
- Dependencies monitored effectively
- Recovery mechanisms reliable

## 6. TESTING & QUALITY ASSURANCE PROMPTS

### Jest/Pytest Testing Strategies
**Prompt: "Create comprehensive test suite using Jest/Pytest following ecosystem patterns"**

**Instructions:**
- Use testing/ directory patterns for test organization
- Implement unit, integration, and end-to-end tests
- Include proper test coverage and reporting
- Add test automation and CI/CD integration

**Expected Outcomes:**
- Comprehensive test suite with all test types
- Proper test organization and naming conventions
- Coverage reporting and thresholds
- CI/CD integration with automated testing

**Quality Checks:**
- Tests comprehensive and well-organized
- Coverage meets established thresholds
- CI/CD integration working
- Test automation reliable

### Integration Testing
**Prompt: "Implement integration tests for cross-service communication"**

**Instructions:**
- Use testing/shared/ patterns for cross-service testing
- Implement service mocking and contract testing
- Include database integration and API testing
- Add performance and load testing capabilities

**Expected Outcomes:**
- Integration test suite for service interactions
- Service mocking and contract verification
- Database integration testing
- Performance benchmarking included

**Quality Checks:**
- Integration tests working across services
- Mocking effective and maintainable
- Database testing comprehensive
- Performance benchmarks useful

### Property-based Testing
**Prompt: "Implement property-based tests using fast-check patterns from agent-skills-system"**

**Instructions:**
- Use agent-skills-system property testing patterns
- Implement generative testing for complex algorithms
- Include edge case discovery and minimization
- Add test case generation and shrinking

**Expected Outcomes:**
- Property-based test suite with fast-check
- Edge cases automatically discovered
- Test case minimization working
- Comprehensive coverage of edge cases

**Quality Checks:**
- Property tests effective at finding issues
- Edge cases properly covered
- Test minimization working correctly
- Performance acceptable for CI/CD

### E2E Testing
**Prompt: "Create end-to-end tests for user workflows across multiple services"**

**Instructions:**
- Use testing/shared/typescript/ patterns for E2E testing
- Implement user journey testing with realistic scenarios
- Include cross-service workflow validation
- Add visual regression and accessibility testing

**Expected Outcomes:**
- E2E test suite covering user workflows
- Cross-service scenario testing
- Visual regression testing implemented
- Accessibility testing included

**Quality Checks:**
- E2E tests cover critical user journeys
- Cross-service workflows working
- Visual regression accurate
- Accessibility standards met

### Code Quality and Linting
**Prompt: "Implement code quality checks and linting following ecosystem standards"**

**Instructions:**
- Use .pre-commit-config.yaml patterns for tooling
- Implement ESLint, ruff, Prettier configurations
- Include automated code quality gates
- Add pre-commit hooks and CI/CD integration

**Expected Outcomes:**
- Code quality tooling fully configured
- Linting rules comprehensive and enforced
- Automated quality gates in CI/CD
- Pre-commit hooks preventing issues

**Quality Checks:**
- Tooling properly configured for all languages
- Rules comprehensive and consistent
- Automation working in CI/CD
- Pre-commit hooks effective

## 7. SPECIFIC SERVICE PROMPTS

### AIOS (AI Operating System) Development
**Prompt: "Develop a new AIOS module following Python/FastAPI patterns"**

**Instructions:**
- Use AIOS/ directory structure with async patterns
- Implement proper async/await and concurrent processing
- Include comprehensive error handling and logging
- Add GPU resource management and monitoring

**Expected Outcomes:**
- AIOS module with proper async architecture
- Concurrent processing and resource management
- Error handling and logging comprehensive
- GPU monitoring and optimization

**Quality Checks:**
- Follows AIOS async patterns correctly
- Concurrent processing working efficiently
- Error handling covers all scenarios
- GPU resource management effective

### bytebot (Desktop Automation) Development
**Prompt: "Implement a new desktop automation capability in bytebot"**

**Instructions:**
- Use bytebot/ directory patterns with computer vision
- Implement proper automation workflows and error recovery
- Include comprehensive logging and monitoring
- Add security measures for desktop access

**Expected Outcomes:**
- Desktop automation feature with vision integration
- Workflow automation with error recovery
- Comprehensive logging and monitoring
- Security measures for safe operation

**Quality Checks:**
- Automation working reliably
- Vision integration accurate
- Error recovery effective
- Security measures adequate

### factif-ai (Test Automation) Development
**Prompt: "Add a new testing capability to factif-ai"**

**Instructions:**
- Use factif-ai/ patterns for test automation
- Implement multi-browser testing and screenshot comparison
- Include comprehensive reporting and analytics
- Add performance testing capabilities

**Expected Outcomes:**
- Test automation feature with multi-browser support
- Screenshot comparison and visual testing
- Comprehensive reporting and analytics
- Performance testing integration

**Quality Checks:**
- Automation working across browsers
- Visual comparison accurate
- Reporting comprehensive
- Performance testing effective

### agent-skills-system Development
**Prompt: "Implement a new agent skill following Markdown-based patterns"**

**Instructions:**
- Use agent-skills-system/ patterns with YAML frontmatter
- Implement skill validation and dependency resolution
- Include comprehensive testing and documentation
- Add skill compatibility checking

**Expected Outcomes:**
- Agent skill with proper Markdown structure
- Validation and dependency resolution
- Comprehensive testing and documentation
- Compatibility checking implemented

**Quality Checks:**
- Skill structure follows patterns
- Validation working correctly
- Dependencies resolved properly
- Testing comprehensive

### agent-manager Development
**Prompt: "Add a new agent management capability to agent-manager"**

**Instructions:**
- Use agent-manager/ patterns for agent lifecycle
- Implement configuration management and monitoring
- Include comprehensive logging and error handling
- Add agent performance analytics

**Expected Outcomes:**
- Agent management feature with lifecycle support
- Configuration management system
- Comprehensive monitoring and logging
- Performance analytics dashboard

**Quality Checks:**
- Management working correctly
- Configuration properly handled
- Monitoring comprehensive
- Analytics provide insights

## 8. DEBUGGING & TROUBLESHOOTING PROMPTS

### Cross-service Debugging
**Prompt: "Debug cross-service communication issues in the ecosystem"**

**Instructions:**
- Use communication/ directory patterns for debugging
- Implement distributed tracing with correlation IDs
- Include service mesh debugging and network analysis
- Add comprehensive logging correlation

**Expected Outcomes:**
- Cross-service debugging toolkit
- Distributed tracing implementation
- Service mesh debugging capabilities
- Log correlation and analysis tools

**Quality Checks:**
- Debugging effective across services
- Tracing working with correlation
- Network analysis accurate
- Log correlation useful

### Performance Optimization
**Prompt: "Optimize performance bottlenecks in the ecosystem"**

**Instructions:**
- Use monitoring/ directory for performance analysis
- Implement caching strategies and database optimization
- Include memory management and resource profiling
- Add performance monitoring and alerting

**Expected Outcomes:**
- Performance optimization implemented
- Caching strategies effective
- Database queries optimized
- Resource usage monitored

**Quality Checks:**
- Optimization effective and measurable
- Caching reducing load appropriately
- Database performance improved
- Monitoring provides clear metrics

### Error Diagnosis and Resolution
**Prompt: "Diagnose and resolve complex errors across multiple services"**

**Instructions:**
- Use logging patterns from throughout ecosystem
- Implement error correlation and root cause analysis
- Include automated error reporting and alerting
- Add error pattern recognition and prevention

**Expected Outcomes:**
- Error diagnosis system with correlation
- Root cause analysis capabilities
- Automated reporting and alerting
- Error prevention mechanisms

**Quality Checks:**
- Diagnosis accurate and comprehensive
- Root cause identification correct
- Reporting actionable
- Prevention effective

### Log Analysis
**Prompt: "Implement comprehensive log analysis and monitoring"**

**Instructions:**
- Use monitoring/ directory patterns for log aggregation
- Implement log parsing and anomaly detection
- Include log correlation and trend analysis
- Add automated alerting and dashboards

**Expected Outcomes:**
- Log analysis system with aggregation
- Anomaly detection and alerting
- Correlation and trend analysis
- Comprehensive dashboards

**Quality Checks:**
- Analysis comprehensive and accurate
- Anomaly detection effective
- Correlation working properly
- Dashboards provide insights