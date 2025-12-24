# AI Coder Master Index and Usage Guide

## Complete Prompt Collection for AI Emulators Ecosystem Development

This comprehensive master index provides definitive guidance for using the complete AI coder prompt collection to achieve production-quality results across the microservices ecosystem.

---

## Table of Contents

1. [OVERVIEW](#overview)
2. [QUICK START GUIDE](#quick-start-guide)
3. [PROMPT SELECTION GUIDE](#prompt-selection-guide)
4. [USAGE BEST PRACTICES](#usage-best-practices)
5. [CUSTOMIZATION GUIDE](#customization-guide)
6. [INTEGRATION WORKFLOW](#integration-workflow)
7. [QUALITY ASSURANCE CHECKLIST](#quality-assurance-checklist)
8. [TROUBLESHOOTING COMMON ISSUES](#troubleshooting-common-issues)
9. [PRACTICAL EXAMPLES](#practical-examples)
10. [PROMPT SELECTION FLOWCHART](#prompt-selection-flowchart)

---

## OVERVIEW

### Complete Prompt Collection Inventory

#### **Agent Role Prompts** (`prompts/` directory)
Specialized AI agent personalities for different development roles:

- **`plan.txt`** - Strategic Architect Agent
  - **Purpose**: Technical analysis, project scoping, and roadmap development
  - **Specializes In**: Requirements gathering, impact assessment, execution planning, risk mitigation
  - **Best For**: Project planning, architectural decisions, technical feasibility studies

- **`data.txt`** - Data Analysis Specialist Agent
  - **Purpose**: Database orchestration, data analysis, and visualization
  - **Specializes In**: SQL/NoSQL management, ETL pipelines, statistical analysis, data visualization
  - **Best For**: Database operations, data migration, analytics, reporting

- **`automation.txt`** - Automation Orchestration Agent
  - **Purpose**: Cross-platform workflows and browser/mobile automation
  - **Specializes In**: Browser automation, mobile device control, API integration, testing automation
  - **Best For**: End-to-end testing, workflow automation, third-party integrations

- **`security.txt`** - Cybersecurity Specialist Agent
  - **Purpose**: Vulnerability analysis and infrastructure protection
  - **Specializes In**: Security scanning, threat modeling, IAM audit, secure configuration
  - **Best For**: Security audits, vulnerability assessments, compliance validation

- **`build.txt`** - Full-Stack Development Agent
  - **Purpose**: Complete development capabilities with specialized subagent delegation
  - **Specializes In**: Full-stack development, subagent coordination, MCP server integration
  - **Best For**: Complex multi-system tasks, development coordination, comprehensive solutions

#### **Service Development Prompts** (`NEW_SERVICE_SETUP_PROMPTS.md`)
Comprehensive prompts for creating new microservices:

1. **Service Architecture Planning and Design**
2. **Project Structure and Scaffolding**
3. **Database Design and Implementation**
4. **API Design and Implementation**
5. **Authentication and Authorization Implementation**
6. **Testing Framework Implementation**
7. **Monitoring and Observability Setup**
8. **Deployment Configuration and Automation**
9. **Service Communication and Integration**
10. **Documentation and Knowledge Management**
11. **Security Implementation and Validation**
12. **Performance Optimization and Scalability**

#### **Deployment and CI/CD Prompts** (`DEPLOYMENT_PROMPTS.md`)
Specialized prompts for production deployment and infrastructure:

1. **CI/CD Pipeline Architecture Design**
2. **Production Deployment Strategy Implementation**
3. **Environment Management and Configuration**
4. **Container Orchestration and Service Mesh**
5. **Database Migration and Data Management**
6. **Monitoring and Observability for Deployments**
7. **Disaster Recovery and Business Continuity**
8. **Release Management and Version Control**
9. **Infrastructure Automation and Provisioning**
10. **Deployment Security and Compliance**
11. **Performance Testing and Validation**
12. **Deployment Cost Optimization**

#### **Performance Optimization Prompts** (`PERFORMANCE_OPTIMIZATION_PROMPTS.md`)
Comprehensive performance optimization strategies:

1. **Database Query Performance Audit**
2. **Microservices Memory Management Optimization**
3. **Caching Strategy Implementation**
4. **API Response Time Optimization**
5. **Horizontal Scaling Strategy Implementation**
6. **Database Connection Pool Optimization**
7. **Background Job Processing Optimization**
8. **Frontend Performance Optimization**
9. **Message Queue Performance Optimization**
10. **Network and I/O Performance Optimization**
11. **Resource Utilization Monitoring and Optimization**
12. **Performance Testing Framework Implementation**

#### **Security Implementation Prompts** (`SECURITY_PROMPTS.md`)
Complete security framework for microservices:

1. **Comprehensive Security Audit and Vulnerability Assessment**
2. **Authentication System Implementation**
3. **Authorization and Access Control Implementation**
4. **API Security Implementation**
5. **Data Protection and Encryption Implementation**
6. **Infrastructure Security Hardening**
7. **Container and Orchestration Security**
8. **Security Monitoring and Incident Response**
9. **Secrets Management and Configuration Security**
10. **Compliance and Security Standards Implementation**
11. **Third-Party Integration Security**
12. **Security Testing and Validation Framework**

---

## QUICK START GUIDE

### Step 1: Understanding Prompt Categories

**Agent Role Prompts**: Use these to invoke specialized AI personalities for specific tasks
**Service Development Prompts**: Use these for creating new microservices from scratch
**Deployment Prompts**: Use these for CI/CD, infrastructure, and production deployment
**Performance Prompts**: Use these for optimizing existing services and systems
**Security Prompts**: Use these for security audits, implementation, and compliance

### Step 2: Basic Prompt Usage

1. **Select the appropriate prompt category** based on your task
2. **Copy the entire prompt text** including context, objectives, and instructions
3. **Provide specific context** about your current system and requirements
4. **Set clear expectations** for deliverables and quality criteria
5. **Follow the step-by-step instructions** provided in each prompt

### Step 3: Agent Delegation Pattern

For complex tasks, use the `build.txt` agent with proper delegation:

```markdown
You are the Build agent. I need to implement a new microservice with the following requirements:
[Your specific requirements here]

Please delegate appropriately to specialized subagents for:
- Database operations: Use @database-pro for complex queries, @database-analyst for simple analysis
- GitHub integration: Use @github-devops for CI/CD pipelines, @github-manager for repository management
- Security analysis: Use @security-auditor for vulnerability assessments
- Automation: Use @automation-orchestrator for complex workflows

Coordinate the results and provide a unified solution.
```

### Step 4: Quality Validation

Always validate outputs against the quality criteria provided in each prompt:
- Check deliverables match expected outputs
- Verify integration with ecosystem patterns
- Ensure compliance with established standards
- Test functionality before implementation

---

## PROMPT SELECTION GUIDE

### Decision Tree for Prompt Selection

```
What type of task are you working on?
│
├── NEW PROJECT/SERVICE CREATION
│   ├── Greenfield Development → NEW_SERVICE_SETUP_PROMPTS.md
│   ├── Service Architecture → Service Architecture Planning prompt
│   ├── Database Design → Database Design and Implementation prompt
│   └── API Development → API Design and Implementation prompt
│
├── EXISTING SYSTEM IMPROVEMENT
│   ├── Performance Issues → PERFORMANCE_OPTIMIZATION_PROMPTS.md
│   ├── Security Concerns → SECURITY_PROMPTS.md
│   ├── Testing Gaps → Testing Framework Implementation prompt
│   └── Monitoring Setup → Monitoring and Observability Setup prompt
│
├── DEPLOYMENT AND INFRASTRUCTURE
│   ├── CI/CD Pipeline → CI/CD Pipeline Architecture Design prompt
│   ├── Production Deployment → Production Deployment Strategy prompt
│   ├── Environment Management → Environment Management prompt
│   └── Disaster Recovery → Disaster Recovery prompt
│
├── SPECIALIZED ANALYSIS
│   ├── Strategic Planning → plan.txt agent
│   ├── Data Analysis → data.txt agent
│   ├── Automation Tasks → automation.txt agent
│   ├── Security Audits → security.txt agent
│   └── Complex Development → build.txt agent
│
└── EMERGENCY/CRITICAL ISSUES
    ├── Security Breach → Security Monitoring and Incident Response prompt
    ├── Performance Crisis → Performance Testing and Validation prompt
    ├── Deployment Failure → Disaster Recovery prompt
    └── Compliance Audit → Compliance and Security Standards prompt
```

### Quick Selection Matrix

| **Task Type** | **Primary Prompt** | **Secondary Prompts** |
|---------------|-------------------|----------------------|
| New Microservice | NEW_SERVICE_SETUP_PROMPTS.md | Security + Performance prompts |
| API Development | API Design and Implementation | Authentication + Testing prompts |
| Database Optimization | Database Query Performance Audit | Data Analysis agent |
| CI/CD Setup | CI/CD Pipeline Architecture | Deployment Security + Environment Management |
| Security Audit | Comprehensive Security Audit | All Security prompts |
| Performance Issues | Performance Optimization prompts | Testing Framework + Monitoring |
| Emergency Response | Incident Response prompts | Relevant specialized prompts |

---

## USAGE BEST PRACTICES

### 1. Context Provision

**Always provide comprehensive context:**

```markdown
CONTEXT: Working with AI Emulators Ecosystem including AIOS (Python), ByteBot (TypeScript), 
and Factif-AI (TypeScript) microservices. Current deployment uses Docker containers with 
Prometheus/Grafana monitoring.

CURRENT STATE: 6/7 services operational, API Gateway experiencing build errors

SPECIFIC REQUIREMENT: Need to fix ioredis options and implement unified event types
```

### 2. Clear Objective Setting

**Define specific, measurable objectives:**

- ✅ "Optimize database queries to achieve <100ms response time"
- ✅ "Implement JWT authentication with 15-minute token expiration"
- ❌ "Make the API more secure"
- ❌ "Improve database performance"

### 3. Step-by-Step Execution

**Follow the structured approach:**

1. Start with planning prompts for complex tasks
2. Use specialized agents for specific domains
3. Validate each step before proceeding
4. Document decisions and rationale

### 4. Quality Validation

**Implement validation at each step:**

```markdown
VALIDATION CHECKLIST:
□ Architecture follows ecosystem patterns
□ Implementation integrates with existing services
□ Security controls properly implemented
□ Performance meets defined criteria
□ Documentation complete and accurate
```

### 5. Iterative Improvement

**Use feedback loops:**

- Start with comprehensive prompts
- Refine based on results
- Update requirements as understanding evolves
- Maintain consistent standards across iterations

### 6. Documentation Standards

**Document everything:**

- Decision rationale and alternatives considered
- Configuration changes and their impacts
- Testing results and performance metrics
- Integration points and dependencies

---

## CUSTOMIZATION GUIDE

### 1. Adapting Prompts for Specific Technologies

#### Example: Adapting Database Prompts for PostgreSQL

**Original Prompt Element:**
```
"Design database schema following service requirements"
```

**Customized for PostgreSQL:**
```
"Design PostgreSQL database schema following service requirements with:
- Proper data types (JSONB for complex data, UUID for identifiers)
- Index optimization using CREATE INDEX CONCURRENTLY
- Row-level security (RLS) for multi-tenant data
- Connection pooling with pgBouncer"
```

#### Example: Adapting for Specific Framework

**Original Prompt Element:**
```
"Implement authentication with proper validation"
```

**Customized for NestJS:**
```
"Implement NestJS authentication with:
- Passport.js strategies (JWT, Local, OAuth2)
- Guards for route protection
- Custom decorators for role-based access
- Integration with TypeORM for user management"
```

### 2. Scaling Prompts for Team Size

#### Solo Developer
- Use complete prompts as-is
- Focus on comprehensive coverage
- Prioritize automation and efficiency

#### Small Team (2-5 developers)
- Add team coordination elements
- Include code review processes
- Emphasize documentation and knowledge sharing

#### Large Team (5+ developers)
- Add project management elements
- Include stakeholder communication
- Emphasize standards compliance and consistency

### 3. Industry-Specific Adaptations

#### Healthcare
```markdown
ADDITIONAL CONTEXT: Must comply with HIPAA regulations
- Implement audit logging for all data access
- Ensure encryption at rest and in transit
- Add consent management for data usage
- Include breach notification procedures
```

#### Financial Services
```markdown
ADDITIONAL CONTEXT: Must comply with PCI DSS and SOX
- Implement segregation of duties
- Add transaction audit trails
- Ensure data retention compliance
- Include regulatory reporting capabilities
```

#### E-commerce
```markdown
ADDITIONAL CONTEXT: Must handle high traffic and seasonal scaling
- Implement CDN strategies for global distribution
- Add payment gateway integration
- Include inventory management systems
- Ensure cart and checkout optimization
```

### 4. Integration with Existing Tools

#### CI/CD Integration
```markdown
INTEGRATION REQUIREMENTS:
- GitHub Actions workflow integration
- Docker container building and pushing
- Automated testing in CI pipeline
- Deployment to staging/production environments
```

#### Monitoring Integration
```markdown
MONITORING REQUIREMENTS:
- Prometheus metrics collection
- Grafana dashboard integration
- Alert manager configuration
- Log aggregation with ELK stack
```

---

## INTEGRATION WORKFLOW

### Complex Development Task Workflow

#### Phase 1: Planning and Architecture
```markdown
1. START WITH: plan.txt agent
   INPUT: Project requirements, technical constraints
   OUTPUT: Comprehensive project plan and architecture

2. FOLLOW WITH: Service Architecture Planning prompt
   INPUT: Project plan, technical requirements
   OUTPUT: Detailed service architecture design

3. COORDINATE WITH: Security and Performance planning
   INPUT: Service architecture
   OUTPUT: Security and performance requirements
```

#### Phase 2: Implementation
```markdown
1. START WITH: build.txt agent for coordination
   INPUT: Architecture plan, requirements
   DELEGATE TO: Specialized agents and prompts

2. DATABASE IMPLEMENTATION:
   - data.txt agent for database design
   - Database Design prompt for schema creation

3. API DEVELOPMENT:
   - API Design prompt for interface specification
   - Authentication prompt for security implementation

4. FRONTEND DEVELOPMENT:
   - build.txt agent with frontend specialization
   - Performance optimization for UI/UX
```

#### Phase 3: Security and Testing
```markdown
1. SECURITY IMPLEMENTATION:
   - Comprehensive Security Audit prompt
   - Specific security prompts based on findings

2. TESTING FRAMEWORK:
   - Testing Framework Implementation prompt
   - Integration with CI/CD pipeline

3. PERFORMANCE VALIDATION:
   - Performance Testing prompt
   - Load testing and optimization
```

#### Phase 4: Deployment and Operations
```markdown
1. CI/CD PIPELINE:
   - CI/CD Pipeline Architecture prompt
   - Deployment Security prompt

2. PRODUCTION DEPLOYMENT:
   - Production Deployment Strategy prompt
   - Monitoring and Observability prompt

3. OPERATIONS:
   - Disaster Recovery prompt
   - Maintenance and optimization procedures
```

### Workflow Coordination Example

```markdown
COMPLEX TASK: Build new notification microservice

WORKFLOW EXECUTION:
1. plan.txt agent → Comprehensive project plan
2. Service Architecture Planning → Service design
3. Database Design → Notification data model
4. API Design → RESTful notification endpoints
5. Authentication prompt → Secure API access
6. Testing Framework → Comprehensive test suite
7. Security prompt → Vulnerability assessment
8. Performance prompt → Scalability optimization
9. CI/CD prompt → Automated deployment pipeline
10. Monitoring prompt → Observability setup

COORDINATION: Use build.txt agent to coordinate all phases
```

---

## QUALITY ASSURANCE CHECKLIST

### Pre-Implementation Validation

#### Architecture Quality
- [ ] **Ecosystem Integration**: Design aligns with existing AI Emulators patterns
- [ ] **Scalability**: Architecture supports expected growth and load
- [ ] **Maintainability**: Design enables easy updates and modifications
- [ ] **Security by Design**: Security considerations integrated from start
- [ ] **Performance Baseline**: Performance requirements clearly defined

#### Technical Standards
- [ ] **Code Quality**: Follows established coding standards (from AGENTS.md)
- [ ] **Documentation**: Comprehensive documentation at all levels
- [ ] **Testing Strategy**: Test coverage and strategy defined
- [ ] **Monitoring**: Monitoring and observability requirements specified
- [ ] **Deployment**: Deployment strategy and requirements defined

### Implementation Quality

#### Code Quality Standards
- [ ] **Type Safety**: Proper type definitions and validation
- [ ] **Error Handling**: Comprehensive error handling and recovery
- [ ] **Security Controls**: Authentication, authorization, input validation
- [ ] **Performance**: Optimized for defined performance criteria
- [ ] **Testing**: Unit, integration, and end-to-end tests implemented

#### Integration Quality
- [ ] **Service Communication**: Proper inter-service communication
- [ ] **Data Consistency**: Data integrity maintained across services
- [ ] **Configuration**: Environment-specific configuration management
- [ ] **Monitoring**: Comprehensive monitoring and alerting
- [ ] **Documentation**: API documentation and operational guides

### Post-Implementation Validation

#### Functional Testing
- [ ] **Feature Completeness**: All requirements implemented and tested
- [ ] **Integration Testing**: All service integrations validated
- [ ] **Performance Testing**: Performance criteria met under load
- [ ] **Security Testing**: Security controls validated and effective
- [ ] **User Acceptance**: End-user acceptance criteria met

#### Operational Readiness
- [ ] **Deployment Automation**: CI/CD pipeline tested and validated
- [ ] **Monitoring Setup**: Monitoring and alerting configured and tested
- [ ] **Documentation**: Complete documentation available and accurate
- [ ] **Training**: Team training and knowledge transfer completed
- [ ] **Support Procedures**: Incident response and support procedures defined

### Quality Metrics

#### Performance Metrics
- **API Response Time**: <100ms simple, <500ms complex operations
- **Database Query Time**: <50ms simple, <200ms complex queries
- **Page Load Time**: <2s initial load, <1s subsequent loads
- **Memory Usage**: Stable under load, no memory leaks
- **CPU Utilization**: <70% normal load, <90% peak load

#### Security Metrics
- **Vulnerability Count**: Zero high-severity vulnerabilities
- **Authentication Coverage**: 100% of endpoints properly secured
- **Authorization Enforcement**: All access controls properly validated
- **Data Protection**: All sensitive data encrypted at rest and in transit
- **Monitoring Coverage**: 100% of security events monitored and alerted

#### Operational Metrics
- **Uptime**: >99.9% availability for critical services
- **Deployment Success**: >95% successful deployments
- **Mean Time to Recovery**: <15 minutes for critical issues
- **Test Coverage**: >80% code coverage for critical paths
- **Documentation Completeness**: 100% of public APIs documented

---

## TROUBLESHOOTING COMMON ISSUES

### Issue 1: Incomplete or Generic Outputs

**Symptoms:**
- Vague, non-specific recommendations
- Missing implementation details
- Lack of ecosystem integration

**Causes:**
- Insufficient context provided
- Objectives not clearly defined
- Missing current state information

**Solutions:**
1. **Enhance Context Provision:**
   ```markdown
   IMPROVED INPUT:
   Current System: AIOS (Python/FastAPI) on port 8000, ByteBot (Next.js) on port 3000
   Database: PostgreSQL with existing user_service table
   Authentication: JWT tokens with 15-minute expiration
   Current Issue: API Gateway build failing with ioredis options error
   
   SPECIFIC REQUIREMENT: Fix ioredis retryDelayOnFailover option and implement unified event types
   ```

2. **Clarify Objectives:**
   - Define specific, measurable outcomes
   - Include constraints and dependencies
   - Specify acceptable solutions vs. unacceptable ones

3. **Add Quality Validation:**
   - Request specific validation criteria
   - Ask for implementation examples
   - Require integration testing steps

### Issue 2: Inconsistent with Ecosystem Patterns

**Symptoms:**
- Solutions that don't integrate with existing services
- Different technology choices than ecosystem standards
- Missing monitoring and logging integration

**Causes:**
- Lack of ecosystem context
- Missing reference to existing patterns
- Insufficient understanding of system architecture

**Solutions:**
1. **Reference Ecosystem Standards:**
   ```markdown
   CONTEXT: Must follow patterns from AGENTS.md:
   - Python services use FastAPI, SQLAlchemy, pytest
   - TypeScript services use NestJS, TypeORM, Jest
   - All services integrate with Prometheus/Grafana monitoring
   - Authentication follows JWT patterns with role-based access
   ```

2. **Specify Integration Requirements:**
   - Define required service integrations
   - Specify monitoring and logging requirements
   - Include deployment and scaling constraints

3. **Validate Against Patterns:**
   - Request pattern compliance validation
   - Ask for integration testing procedures
   - Require documentation of deviations and rationale

### Issue 3: Performance Problems

**Symptoms:**
- Unoptimized database queries
- Inefficient API implementations
- Missing caching strategies

**Causes:**
- Performance requirements not specified
- Missing performance testing
- Lack of optimization focus

**Solutions:**
1. **Define Performance Requirements:**
   ```markdown
   PERFORMANCE REQUIREMENTS:
   - API endpoints: <100ms response time for simple operations
   - Database queries: <50ms for standard queries, <200ms for complex
   - Memory usage: Stable under 10x normal load
   - Concurrent users: Support 1000+ simultaneous users
   ```

2. **Include Performance Testing:**
   - Add performance testing requirements
   - Specify load testing scenarios
   - Include benchmarking criteria

3. **Request Optimization Strategies:**
   - Ask for caching implementation
   - Request database optimization
   - Include scalability planning

### Issue 4: Security Gaps

**Symptoms:**
- Missing authentication/authorization
- Input validation gaps
- Insecure configuration

**Causes:**
- Security requirements not specified
- Missing security validation
- Insufficient security expertise

**Solutions:**
1. **Define Security Requirements:**
   ```markdown
   SECURITY REQUIREMENTS:
   - All endpoints require JWT authentication
   - Role-based access control (admin, user, guest)
   - Input validation and sanitization for all user inputs
   - HTTPS-only communication
   - Audit logging for all security events
   ```

2. **Include Security Testing:**
   - Request security vulnerability scanning
   - Add penetration testing requirements
   - Include compliance validation

3. **Validate Security Implementation:**
   - Require security control testing
   - Ask for security audit trails
   - Include incident response procedures

### Issue 5: Integration Problems

**Symptoms:**
- Services can't communicate
- Data inconsistency between services
- Configuration conflicts

**Causes:**
- Missing integration specifications
- Inadequate API design
- Configuration management issues

**Solutions:**
1. **Define Integration Specifications:**
   ```markdown
   INTEGRATION REQUIREMENTS:
   - Service discovery via Consul/Etcd
   - Inter-service communication via REST APIs
   - Event streaming via Apache Kafka
   - Shared database schema for user data
   ```

2. **Include Integration Testing:**
   - Request end-to-end integration tests
   - Add service communication validation
   - Include data consistency testing

3. **Validate Integration:**
   - Test all integration points
   - Validate data flow and consistency
   - Include failure scenario testing

---

## PRACTICAL EXAMPLES

### Example 1: Creating a New User Management Service

**Task**: Build a new user management microservice for the AI Emulators Ecosystem

**Step-by-Step Execution**:

```markdown
1. START WITH: plan.txt agent
PROMPT: Analyze requirements for new user management microservice in AI Emulators Ecosystem.
Current services: AIOS (Python/FastAPI), ByteBot (TypeScript/NextJS), Factif-AI (TypeScript).
Need: User authentication, profile management, role-based access control.

2. FOLLOW WITH: Service Architecture Planning prompt
REQUIREMENTS: RESTful API, JWT authentication, PostgreSQL database, Docker containerization,
Prometheus monitoring, integration with existing services.

3. EXECUTE WITH: build.txt agent
DELEGATE TO:
- @database-pro for PostgreSQL schema design
- @security-auditor for authentication implementation
- @automation-orchestrator for integration testing
```

**Expected Deliverables**:
- Service architecture document
- PostgreSQL database schema
- FastAPI implementation with JWT authentication
- Docker container configuration
- Prometheus metrics integration
- Integration test suite

### Example 2: Optimizing Database Performance

**Task**: Optimize slow database queries in the orchestrator service

**Step-by-Step Execution**:

```markdown
1. START WITH: Database Query Performance Audit prompt
ANALYSIS: Current queries taking 2-5 seconds, N+1 query patterns identified

2. OPTIMIZE WITH: data.txt agent
SPECIFIC QUERIES:
- User profile queries: Currently 1.8s average
- Role permission queries: Currently 2.3s average
- Session management queries: Currently 1.5s average

3. VALIDATE WITH: Performance Testing prompt
METRICS: Target <100ms for user queries, <200ms for complex queries
```

**Expected Deliverables**:
- Query optimization report
- New indexes implementation
- Performance improvement metrics
- Regression test suite

### Example 3: Implementing Security Audit

**Task**: Conduct comprehensive security audit of ByteBot service

**Step-by-Step Execution**:

```markdown
1. START WITH: security.txt agent
SCOPE: Full security assessment of ByteBot Next.js application

2. EXECUTE WITH: Comprehensive Security Audit prompt
AREAS: Authentication, authorization, input validation, API security,
data protection, infrastructure security

3. REMEDIATE WITH: Specific security prompts based on findings
PRIORITY: High-severity vulnerabilities first, then medium/low
```

**Expected Deliverables**:
- Security audit report with vulnerability ratings
- Remediation plan with timelines
- Security control implementation
- Validation testing results

### Example 4: Setting Up CI/CD Pipeline

**Task**: Create automated deployment pipeline for Factif-AI service

**Step-by-Step Execution**:

```markdown
1. START WITH: CI/CD Pipeline Architecture prompt
SERVICES: Factif-AI backend (TypeScript/NestJS), Frontend (React/TypeScript)

2. IMPLEMENT WITH: Deployment prompts
INTEGRATION: GitHub Actions, Docker, staging/production environments

3. SECURE WITH: Deployment Security prompt
REQUIREMENTS: Security scanning, secret management, access controls
```

**Expected Deliverables**:
- GitHub Actions workflow files
- Docker container configurations
- Staging and production deployment scripts
- Security scanning integration
- Monitoring and alerting setup

---

## PROMPT SELECTION FLOWCHART

```
┌─────────────────────────────────────────────────────────────┐
│                    START HERE                               │
│                  What task do you need?                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Is this a NEW SERVICE/SYSTEM?                  │
│                                                             │
│  ┌─────────────┐                ┌─────────────────────────┐ │
│  │    YES      │                │          NO             │ │
│  │             │                │                         │ │
│  └─────┬───────┘                └─────┬───────────────────┘ │
│        │                              │                     │
│        ▼                              ▼                     │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │ NEW_SERVICE_SETUP_  │    │ Is this IMPROVING existing │ │
│  │ PROMPTS.md          │    │ system performance?        │ │
│  │                     │    │                            │ │
│  │ - Architecture      │    │ ┌─────────┐   ┌──────────┐ │ │
│  │ - Database          │    │ │   YES   │   │    NO    │ │ │
│  │ - API Design        │    │ │         │   │          │ │ │
│  │ - Authentication    │    │ └────┬────┘   └─────┬────┘ │ │
│  │ - Testing           │    │      │              │      │ │
│  │ - Monitoring        │    │      ▼              ▼      │ │
│  │ - Security          │    │ ┌──────────┐  ┌──────────┐ │ │
│  │ - Deployment        │    │ │PERFORMANCE│  │Is this   │ │ │
│  │                     │    │ │PROMPTS.md │  │SECURITY  │ │ │
│  │ Use with:           │    │ │           │  │related?  │ │ │
│  │ • build.txt agent   │    │ │ - Database│  │          │ │ │
│  │ • data.txt agent    │    │ │ - Memory  │  │ ┌────┐  │ │ │
│  │ • security.txt      │    │ │ - Caching │  │ │YES │  │ │ │
│  │                     │    │ │ - API     │  │ │    │  │ │ │
│  └─────────────────────┘    │ │ - Scaling │  │ └─┬──┘  │ │ │
│                              │ │ - Testing │  │   │    │ │ │
│                              │ └──────────┘  │   ▼    │ │ │
│                              │               │┌────────┐│ │ │
│                              │               ││SECURITY││ │ │
│                              │               ││PROMPTS ││ │ │
│                              │               ││.md     ││ │ │
│                              │               ││        ││ │ │
│                              │               ││ - Auth ││ │ │
│                              │               ││ - API  ││ │ │
│                              │               ││ - Data ││ │ │
│                              │               ││ - Audit││ │ │
│                              │               │└────────┘│ │ │
│                              │               └──────────┘ │ │
│                              └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Special Cases and Emergency Flows

```
┌─────────────────────────────────────────────────────────────┐
│                  SPECIAL SCENARIOS                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  EMERGENCY/CRITICAL ISSUES                                  │
│  ┌─────────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │Security Breach  │ │Performance   │ │Deployment        │ │
│  │                 │ │Crisis        │ │Failure           │ │
│  │ Security Monitor│ │ Performance  │ │ Disaster         │ │
│  │ Incident Resp   │ │ Testing      │ │ Recovery         │ │
│  │ Compliance      │ │ Optimization │ │ Rollback         │ │
│  └─────────────────┘ └──────────────┘ └──────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  COMPLEX COORDINATION TASKS                                 │
│  ┌─────────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │Multi-service    │ │Full Stack    │ │Cross-platform    │ │
│  │Integration      │ │Development   │ │Automation        │ │
│  │                 │ │              │ │                  │ │
│  │ Use build.txt   │ │ Use build.txt│ │ Use automation   │ │
│  │ with delegation │ │ + subagents  │ │ .txt agent       │ │
│  │                 │ │              │ │                  │ │
│  │ Coordinate:     │ │ Delegate to: │ │ Coordinate:      │ │
│  │ • plan.txt      │ │ • data.txt   │ │ • Browser        │ │
│  │ • data.txt      │ │ • security   │ │ • Mobile         │ │
│  │ • security      │ │ • automation │ │ • API            │ │
│  └─────────────────┘ └──────────────┘ └──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Quick Reference Guide

| **Scenario** | **Primary Prompt** | **Supporting Agents** |
|--------------|-------------------|----------------------|
| New User Service | Service Architecture | plan.txt, data.txt, security.txt |
| API Performance | API Response Time Optimization | data.txt, testing |
| Security Audit | Comprehensive Security Audit | security.txt |
| CI/CD Setup | CI/CD Pipeline Architecture | build.txt, automation.txt |
| Database Optimization | Database Query Performance | data.txt |
| Emergency Response | Incident Response | security.txt, build.txt |

---

## Conclusion

This master index provides comprehensive guidance for leveraging the complete AI coder prompt collection effectively. By following the structured approaches, best practices, and troubleshooting guidelines outlined here, developers can achieve production-quality results across the entire AI Emulators Ecosystem.

### Key Success Factors

1. **Choose the Right Prompt**: Use the selection guide to identify the most appropriate prompts for your specific needs
2. **Provide Comprehensive Context**: Always include system state, requirements, and constraints
3. **Follow Structured Approaches**: Use the step-by-step instructions and quality validation criteria
4. **Coordinate Complex Tasks**: Leverage agent delegation and workflow coordination for multi-faceted projects
5. **Validate Results**: Use the quality assurance checklist to ensure outputs meet standards
6. **Iterate and Improve**: Use feedback loops and continuous improvement practices

### Getting Started

1. **Identify your task type** using the decision tree
2. **Select appropriate prompts** from the inventory
3. **Follow the quick start guide** for basic usage
4. **Apply best practices** for context and quality
5. **Use the troubleshooting guide** if issues arise
6. **Reference practical examples** for complex scenarios

This comprehensive guide ensures that the AI coder prompt collection serves as a powerful tool for achieving consistent, high-quality development outcomes across all aspects of the microservices ecosystem.

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-23  
**Total Prompts Covered**: 49 specialized prompts across 5 collections  
**Applicable Ecosystem**: AI Emulators Ecosystem (AIOS, ByteBot, Factif-AI)
