# AI Coder Agent System & Specialized Prompts

## Overview

The future-app project includes **48+ specialized AI coder prompts** organized into 5 categories, designed to accelerate development across the entire stack.

---

## Prompt Categories

### 1. Agent Prompts (12 prompts)
### 2. Backend Prompts (10 prompts)
### 3. Frontend Prompts (8 prompts)
### 4. Infrastructure Prompts (10 prompts)
### 5. Testing & Quality Prompts (8 prompts)

---

## 1. Agent Prompts Collection

**Location**: `/ai-coder-prompts/agents/`

### Agent A: Frontend Specialist
**File**: `agent-a-frontend.md`

**Capabilities**:
- Next.js 14 development
- React component architecture
- TypeScript type safety
- Tailwind CSS styling
- Shadcn/ui integration
- Client-side state management
- API integration
- Performance optimization

**Key Responsibilities**:
```typescript
// Component creation
- Build reusable React components
- Implement responsive layouts
- Handle form validation
- Manage client state (Zustand/Redux)
- Optimize bundle size
- Implement lazy loading
```

**Usage Example**:
```
@agent-a Create a dashboard component with:
- Real-time data updates
- Chart visualizations
- Responsive grid layout
- Dark mode support
```

---

### Agent B: Backend Specialist
**File**: `agent-b-backend.md`

**Capabilities**:
- Node.js + Express API development
- RESTful API design
- Database schema design
- Authentication & authorization
- Middleware implementation
- Error handling
- API documentation
- Performance optimization

**Key Responsibilities**:
```javascript
// API endpoint creation
- Design RESTful routes
- Implement CRUD operations
- Add authentication middleware
- Validate request data
- Handle errors gracefully
- Write API documentation
```

**Usage Example**:
```
@agent-b Create an API endpoint for:
- User authentication (JWT)
- Role-based access control
- Rate limiting
- Input validation
```

---

### Agent C: Python/AI Specialist
**File**: `agent-c-python-ai.md`

**Capabilities**:
- FastAPI development
- Machine learning integration
- Data processing pipelines
- Ollama/LLM integration
- Vector database operations
- Async processing
- Scientific computing
- AI agent development

**Key Responsibilities**:
```python
# AI service creation
- Build FastAPI endpoints
- Integrate Ollama models
- Implement RAG pipelines
- Process large datasets
- Create ML inference services
- Optimize AI performance
```

**Usage Example**:
```
@agent-c Create an AI service that:
- Accepts text input
- Uses Ollama for processing
- Returns structured JSON
- Handles streaming responses
```

---

### Agent D: Rust Performance Specialist
**File**: `agent-d-rust.md`

**Capabilities**:
- Actix-web development
- High-performance computing
- Memory-safe operations
- Concurrent processing
- System-level programming
- WebAssembly compilation
- Low-latency services

**Key Responsibilities**:
```rust
// Performance-critical services
- Build ultra-fast APIs
- Implement concurrent algorithms
- Optimize memory usage
- Handle system operations
- Compile to WebAssembly
```

**Usage Example**:
```
@agent-d Create a Rust service for:
- Image processing (resize, compress)
- Sub-millisecond response time
- Concurrent request handling
- Memory-efficient operations
```

---

### Agent E: Database Architect
**File**: `agent-e-database.md`

**Capabilities**:
- PostgreSQL schema design
- MongoDB collection design
- Query optimization
- Index management
- Migration scripts
- Data modeling
- Performance tuning

**Key Responsibilities**:
```sql
-- Database operations
- Design normalized schemas
- Create efficient indexes
- Write optimized queries
- Implement migrations
- Set up replication
```

**Usage Example**:
```
@agent-e Design a database schema for:
- User management system
- Role-based permissions
- Audit logging
- Optimized for read-heavy workloads
```

---

### Agent F: DevOps Engineer
**File**: `agent-f-devops.md`

**Capabilities**:
- Docker containerization
- Docker Compose orchestration
- CI/CD pipeline setup
- Monitoring configuration
- Nginx configuration
- Environment management
- Deployment automation

**Key Responsibilities**:
```yaml
# Infrastructure as code
- Create Dockerfiles
- Configure docker-compose.yml
- Set up CI/CD pipelines
- Configure monitoring
- Manage secrets
```

**Usage Example**:
```
@agent-f Set up:
- Docker container for new service
- Health check endpoints
- Prometheus metrics
- Auto-restart policies
```

---

### Agent G: n8n Automation Specialist
**File**: `agent-g-n8n.md`

**Capabilities**:
- n8n workflow design
- Webhook configuration
- API integration
- Error handling
- Scheduled executions
- Data transformation
- Multi-step automation

**Key Responsibilities**:
```json
// Workflow creation
- Design automation flows
- Connect multiple services
- Handle errors gracefully
- Transform data between steps
- Set up triggers
```

**Usage Example**:
```
@agent-g Create an n8n workflow that:
- Monitors new database entries
- Processes data with AI
- Posts results to social media
- Logs all actions
```

---

### Agent H: Langflow Agent Builder
**File**: `agent-h-langflow.md`

**Capabilities**:
- Langflow graph design
- RAG pipeline creation
- Vector database integration
- Custom component development
- Agent memory management
- Prompt engineering
- LLM chain orchestration

**Key Responsibilities**:
```python
# Agent flow creation
- Design conversation flows
- Implement RAG patterns
- Connect vector databases
- Create custom nodes
- Optimize prompts
```

**Usage Example**:
```
@agent-h Build a Langflow agent that:
- Answers questions from docs
- Uses ChromaDB for context
- Streams responses
- Remembers conversation history
```

---

### Agent I: Testing Specialist
**File**: `agent-i-testing.md`

**Capabilities**:
- Unit test creation
- Integration testing
- E2E test automation
- Test coverage analysis
- Mock data generation
- Performance testing
- Security testing

**Key Responsibilities**:
```javascript
// Test suite creation
- Write unit tests (Jest/Vitest)
- Create integration tests
- Set up E2E tests (Playwright)
- Generate test data
- Measure coverage
```

**Usage Example**:
```
@agent-i Create tests for:
- User authentication flow
- API endpoint validation
- Database operations
- 90%+ code coverage
```

---

### Agent J: Security Auditor
**File**: `agent-j-security.md`

**Capabilities**:
- Security vulnerability scanning
- Authentication review
- Authorization checks
- Input validation
- SQL injection prevention
- XSS protection
- CSRF protection

**Key Responsibilities**:
```javascript
// Security implementation
- Audit authentication flows
- Review authorization logic
- Validate all inputs
- Prevent common attacks
- Implement rate limiting
```

**Usage Example**:
```
@agent-j Audit security for:
- User login system
- API endpoints
- Database queries
- File upload handling
```

---

### Agent K: Documentation Writer
**File**: `agent-k-docs.md`

**Capabilities**:
- API documentation
- Code comments
- README creation
- Architecture diagrams
- User guides
- Changelog maintenance

**Key Responsibilities**:
```markdown
# Documentation tasks
- Write clear API docs
- Create setup guides
- Document architecture
- Maintain changelogs
- Generate diagrams
```

**Usage Example**:
```
@agent-k Document:
- New API endpoints
- Setup instructions
- Architecture decisions
- Usage examples
```

---

### Agent L: Performance Optimizer
**File**: `agent-l-performance.md`

**Capabilities**:
- Code profiling
- Query optimization
- Caching strategies
- Bundle size reduction
- Memory leak detection
- Load testing

**Key Responsibilities**:
```javascript
// Performance optimization
- Profile slow code
- Optimize database queries
- Implement caching
- Reduce bundle size
- Fix memory leaks
```

**Usage Example**:
```
@agent-l Optimize:
- Slow API endpoints
- Large bundle sizes
- Database query performance
- Memory usage
```

---

## 2. Backend Prompts Collection

**Location**: `/ai-coder-prompts/backend/`

### Available Prompts:

1. **api-endpoint-creator.md** - RESTful API endpoint generation
2. **authentication-system.md** - JWT/OAuth implementation
3. **database-query-optimizer.md** - SQL/NoSQL optimization
4. **error-handler.md** - Centralized error handling
5. **middleware-builder.md** - Express middleware creation
6. **validation-schema.md** - Input validation (Zod/Joi)
7. **websocket-handler.md** - Real-time communication
8. **rate-limiter.md** - API rate limiting
9. **caching-strategy.md** - Redis caching patterns
10. **api-documentation.md** - OpenAPI/Swagger docs

---

## 3. Frontend Prompts Collection

**Location**: `/ai-coder-prompts/frontend/`

### Available Prompts:

1. **component-builder.md** - React component creation
2. **form-handler.md** - Form validation & submission
3. **state-management.md** - Zustand/Redux patterns
4. **api-integration.md** - Fetch/Axios integration
5. **responsive-layout.md** - Mobile-first design
6. **dark-mode.md** - Theme switching
7. **performance-optimization.md** - Bundle & render optimization
8. **accessibility.md** - WCAG compliance

---

## 4. Infrastructure Prompts Collection

**Location**: `/ai-coder-prompts/infrastructure/`

### Available Prompts:

1. **dockerfile-creator.md** - Container configuration
2. **docker-compose.md** - Multi-service orchestration
3. **nginx-config.md** - Reverse proxy setup
4. **monitoring-setup.md** - Prometheus/Grafana
5. **ci-cd-pipeline.md** - GitHub Actions/GitLab CI
6. **environment-config.md** - Env variable management
7. **backup-strategy.md** - Database backup automation
8. **ssl-setup.md** - HTTPS/TLS configuration
9. **load-balancer.md** - Traffic distribution
10. **disaster-recovery.md** - Failover planning

---

## 5. Testing & Quality Prompts Collection

**Location**: `/ai-coder-prompts/testing/`

### Available Prompts:

1. **unit-test-generator.md** - Jest/Vitest tests
2. **integration-test.md** - API integration tests
3. **e2e-test.md** - Playwright/Cypress tests
4. **mock-data-generator.md** - Test data creation
5. **coverage-analyzer.md** - Code coverage reports
6. **performance-test.md** - Load testing (k6/Artillery)
7. **security-test.md** - Vulnerability scanning
8. **code-review.md** - Automated code review

---

## How to Use AI Coder Prompts

### Method 1: Direct Prompt Usage
```bash
# Copy prompt content
cat ai-coder-prompts/agents/agent-a-frontend.md

# Paste into AI assistant (Claude, ChatGPT, etc.)
# Add your specific requirements
```

### Method 2: Cursor AI Integration
```bash
# In Cursor AI, reference prompts
@agent-a Create a login form component

# Cursor will use the agent-a prompt context
```

### Method 3: n8n Automation
```json
{
  "workflow": "AI Code Generator",
  "steps": [
    "Read prompt file",
    "Combine with user request",
    "Send to Ollama/OpenAI",
    "Save generated code",
    "Create pull request"
  ]
}
```

### Method 4: Langflow Integration
```python
# Langflow flow
Prompt Template -> LLM Chain -> Code Output

# Load agent prompt as system message
# User request as user message
# Generate code with context
```

---

## Best Practices

### 1. Prompt Chaining
Combine multiple agents for complex tasks:
```
@agent-b Create API endpoint
  ↓
@agent-e Design database schema
  ↓
@agent-i Write tests
  ↓
@agent-k Document API
```

### 2. Context Preservation
Include relevant context:
```
@agent-a Create component

Context:
- Project uses Next.js 14
- Tailwind CSS for styling
- TypeScript strict mode
- Shadcn/ui components
```

### 3. Iterative Refinement
```
Iteration 1: Generate basic code
Iteration 2: Add error handling
Iteration 3: Optimize performance
Iteration 4: Add tests
Iteration 5: Document code
```

### 4. Quality Checks
Always run through quality agents:
```
@agent-i Test the code
@agent-j Security audit
@agent-l Performance check
@agent-k Document changes
```

---

## Prompt Maintenance

### Update Schedule
- **Weekly**: Review and update based on learnings
- **Monthly**: Add new prompts for new patterns
- **Quarterly**: Major refactoring and reorganization

### Version Control
```bash
# All prompts are version controlled
git log ai-coder-prompts/

# Track changes and improvements
# Rollback if needed
```

### Community Contributions
```markdown
# To contribute a new prompt:
1. Create prompt file in appropriate category
2. Follow existing format
3. Include usage examples
4. Test with real scenarios
5. Submit pull request
```
