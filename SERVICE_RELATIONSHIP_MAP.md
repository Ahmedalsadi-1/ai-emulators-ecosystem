# 🗺️ Service Relationship Map
## AI Emulators Ecosystem

**Visual Guide to Service Dependencies, Communication Patterns, and Data Flow**

---

## 🔄 Service Dependency Graph

```
                    ┌─────────────────────────────────────┐
                    │      EXTERNAL DEPENDENCIES          │
                    │  • OpenAI API                       │
                    │  • Anthropic API                    │
                    │  • Google Gemini API                │
                    │  • HuggingFace Hub                  │
                    │  • Social Media APIs                │
                    │  • Payment APIs (Stripe)            │
                    └─────────────────────────────────────┘
                                    ↕
    ┌──────────────────────────────────────────────────────────────┐
    │                   NGINX REVERSE PROXY                        │
    │                     (Port 80/443)                            │
    │  Routes: /api/*, /ui/*, /metrics, /health                   │
    └──────────────────────────────────────────────────────────────┘
                                    ↕
    ┌──────────────────────────────────────────────────────────────┐
    │            ORCHESTRATION & DISCOVERY LAYER                   │
    │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
    │  │ MCP Registry   │  │  AIOS (Kernel) │  │  API Gateway   │ │
    │  │  Port: 8002    │  │  Port: 8000    │  │  Port: 8080    │ │
    │  │                │  │                │  │   (ByteBot)    │ │
    │  └────────────────┘  └────────────────┘  └────────────────┘ │
    └──────────────────────────────────────────────────────────────┘
           ↕                    ↕                      ↕
    ┌──────────────────────────────────────────────────────────────┐
    │                 SPECIALIZED SERVICES                         │
    │                                                              │
    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
    │  │  ByteBot    │  │ Open-Intf   │  │  macOS-use  │        │
    │  │  Port: 9991 │  │ Port: 5000  │  │  Port: 6000 │        │
    │  └─────────────┘  └─────────────┘  └─────────────┘        │
    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
    │  │  Factif-AI  │  │    gbox     │  │   Postiz    │        │
    │  │  Port: 3001 │  │ Port: 3000  │  │  Port: 9000 │        │
    │  └─────────────┘  └─────────────┘  └─────────────┘        │
    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
    │  │ OnlySnarf   │  │ Reels-Auto  │  │   Wan2GP    │        │
    │  │ Port: 10000 │  │ Port: 11000 │  │ Port: 12000 │        │
    │  └─────────────┘  └─────────────┘  └─────────────┘        │
    └──────────────────────────────────────────────────────────────┘
           ↕                    ↕                      ↕
    ┌──────────────────────────────────────────────────────────────┐
    │              INFRASTRUCTURE LAYER                            │
    │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
    │  │  PostgreSQL    │  │     Redis      │  │   Prometheus   │ │
    │  │  Port: 5432    │  │   Port: 6379   │  │   Port: 9090   │ │
    │  └────────────────┘  └────────────────┘  └────────────────┘ │
    └──────────────────────────────────────────────────────────────┘
```

---

## 📊 Service Communication Matrix

| From ↓ / To → | AIOS | ByteBot | Factif-AI | Postiz | gbox | PostgreSQL | Redis |
|---------------|------|---------|-----------|--------|------|------------|-------|
| **User Request** | REST | REST | REST | REST | REST | - | - |
| **AIOS** | - | MCP | MCP | MCP | MCP | JDBC | TCP |
| **ByteBot** | MCP | - | HTTP | HTTP | HTTP | Prisma | BullMQ |
| **Factif-AI** | HTTP | HTTP | - | HTTP | HTTP | Direct | Pub/Sub |
| **Postiz** | MCP | HTTP | HTTP | - | HTTP | Prisma | BullMQ |
| **gbox** | MCP | HTTP | HTTP | HTTP | - | Direct | TCP |
| **API Gateway** | HTTP | HTTP | HTTP | HTTP | HTTP | - | Cache |

**Legend**:
- **REST**: RESTful HTTP API
- **MCP**: Model Context Protocol
- **HTTP**: Direct HTTP requests
- **Prisma**: Prisma ORM
- **BullMQ**: Job queue via Redis
- **Pub/Sub**: Redis publish/subscribe
- **JDBC**: Direct database connection
- **TCP**: Raw TCP connection

---

## 🔀 Data Flow Patterns

### Pattern 1: User Request → AI Inference

```
1. User sends request to Unified Dashboard (localhost:3003)
          ↓
2. Dashboard calls API Gateway (ByteBot Agent :8080)
          ↓
3. API Gateway routes to AIOS (:8000)
          ↓
4. AIOS selects appropriate LLM provider
          ↓
5. AIOS calls external API (OpenAI/Anthropic/etc)
          ↓
6. Response cached in Redis
          ↓
7. Response returned through API Gateway
          ↓
8. Dashboard displays result to user

Timeline: ~500ms - 5s depending on LLM
```

### Pattern 2: Browser Automation Task

```
1. User creates automation task in Factif-AI UI (:3001)
          ↓
2. Task stored in PostgreSQL (factif_ai database)
          ↓
3. Task queued in Redis (BullMQ)
          ↓
4. Worker picks up task
          ↓
5. Playwright launches browser
          ↓
6. Browser executes automation steps
          ↓
7. Screenshots/results stored in PostgreSQL
          ↓
8. Completion notification via WebSocket
          ↓
9. UI updates in real-time

Timeline: ~10s - 5min depending on task complexity
```

### Pattern 3: Social Media Post Scheduling

```
1. User composes post in Postiz dashboard (:9000)
          ↓
2. Post saved to PostgreSQL (postiz database)
          ↓
3. Scheduled job created in Redis (BullMQ)
          ↓
4. Cron worker checks schedule every minute
          ↓
5. At scheduled time, worker picks up job
          ↓
6. Worker calls social media API (Twitter/Instagram/etc)
          ↓
7. Post status updated in PostgreSQL
          ↓
8. Analytics recorded
          ↓
9. WebSocket notification sent to UI

Timeline: Instant (for scheduling) + scheduled time
```

### Pattern 4: MCP Tool Discovery & Execution

```
1. AI Agent queries MCP Registry (:8002)
          ↓
2. Registry returns available tools from all services
          ↓
3. Agent selects tool (e.g., "screenshot" from ByteBot)
          ↓
4. Agent sends MCP request to ByteBot MCP server (:4001)
          ↓
5. ByteBot authenticates request (JWT)
          ↓
6. ByteBot executes tool (takes screenshot)
          ↓
7. Result returned via MCP protocol
          ↓
8. Agent processes result
          ↓
9. Agent may chain to next tool

Timeline: ~100ms - 2s per tool execution
```

### Pattern 5: Cross-Service Workflow (Factif-AI Orchestration)

```
1. User initiates complex workflow in Factif-AI
          ↓
2. Factif-AI creates workflow definition
          ↓
3. Step 1: Call AIOS for content generation
          ↓
4. AIOS generates content → returns to Factif-AI
          ↓
5. Step 2: Call Wan2GP for video creation
          ↓
6. Wan2GP generates video → stores in S3/local
          ↓
7. Step 3: Call Postiz for scheduling
          ↓
8. Postiz schedules social media posts
          ↓
9. Factif-AI aggregates all results
          ↓
10. Workflow completion notification

Timeline: ~1min - 30min depending on workflow
```

---

## 🗄️ Database Architecture

### PostgreSQL Databases

```
PostgreSQL Instance (:5432)
│
├── aios
│   ├── agents              # Agent configurations
│   ├── conversations       # Chat history
│   ├── tools               # Tool registry
│   └── memory              # Context storage
│
├── bytebot
│   ├── users               # User accounts
│   ├── tasks               # Task definitions
│   ├── executions          # Execution logs
│   └── files               # Uploaded files
│
├── factif_ai
│   ├── automations         # Automation scripts
│   ├── test_runs           # Test execution history
│   ├── screenshots         # Visual testing data
│   └── workflows           # Workflow definitions
│
├── postiz
│   ├── posts               # Social media posts
│   ├── schedules           # Post schedules
│   ├── analytics           # Engagement metrics
│   ├── integrations        # Connected accounts
│   └── media               # Media assets
│
├── gbox
│   ├── environments        # Sandbox environments
│   ├── resources           # Resource allocations
│   └── sessions            # Active sessions
│
├── onlysnarf
│   ├── content             # Content library
│   ├── distributions       # Distribution logs
│   └── analytics           # Performance metrics
│
└── unified_framework
    ├── services            # Service registry
    ├── mcp_tools           # MCP tool definitions
    └── monitoring          # Health check data
```

### Redis Data Structures

```
Redis Instance (:6379)
│
├── Caches (Key-Value)
│   ├── api:response:*      # API response cache (TTL: 5min)
│   ├── session:*           # User sessions (TTL: 24h)
│   ├── llm:completion:*    # LLM completions (TTL: 1h)
│   └── mcp:tools:*         # Tool registry cache (TTL: 10min)
│
├── Queues (BullMQ)
│   ├── bytebot:tasks       # ByteBot task queue
│   ├── factif:automation   # Factif-AI automation queue
│   ├── postiz:posts        # Postiz posting queue
│   ├── wan2gp:video        # Video generation queue
│   └── email:notifications # Email notification queue
│
├── Pub/Sub Channels
│   ├── events:workflow     # Workflow events
│   ├── events:task         # Task updates
│   ├── events:health       # Health check events
│   └── events:mcp          # MCP service events
│
└── Counters (Rate Limiting)
    ├── ratelimit:api:*     # API rate limits
    ├── ratelimit:llm:*     # LLM usage limits
    └── ratelimit:user:*    # Per-user limits
```

---

## 🔐 Authentication & Authorization Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   AUTHENTICATION FLOW                       │
└─────────────────────────────────────────────────────────────┘

1. User Login Request
   │
   ├─→ POST /api/auth/login
   │   { email, password }
   │
   ↓
2. API Gateway (ByteBot :8080)
   │
   ├─→ Validate credentials against PostgreSQL
   │   (bytebot.users table)
   │
   ↓
3. Generate JWT Token
   │
   ├─→ Payload: { userId, role, permissions }
   ├─→ Sign with JWT_SECRET
   ├─→ Expiry: 24h
   │
   ↓
4. Store Session in Redis
   │
   ├─→ Key: session:{userId}
   ├─→ Value: { token, refreshToken, expiresAt }
   ├─→ TTL: 24h
   │
   ↓
5. Return Token to Client
   │
   ├─→ { accessToken, refreshToken }
   │
   ↓
6. Client Stores Token
   │
   ├─→ LocalStorage or SessionStorage
   │
   ↓
7. Subsequent Requests
   │
   ├─→ Header: Authorization: Bearer {token}
   │
   ↓
8. Token Validation (Middleware)
   │
   ├─→ Verify JWT signature
   ├─→ Check expiration
   ├─→ Validate permissions for endpoint
   │
   ↓
9. Service Access Granted
```

---

## 📡 MCP Tool Registration & Discovery

```
┌─────────────────────────────────────────────────────────────┐
│           MCP SERVICE REGISTRATION PROCESS                  │
└─────────────────────────────────────────────────────────────┘

Service Startup:
    │
    ├─→ Service initializes MCP server on dedicated port
    │
    ↓
    Service registers with MCP Registry
    │
    ├─→ POST http://mcp-registry:8002/register
    │   {
    │     "serviceName": "bytebot",
    │     "port": 4001,
    │     "tools": [
    │       {
    │         "name": "screenshot",
    │         "description": "Capture desktop screenshot",
    │         "parameters": {...}
    │       },
    │       ...
    │     ],
    │     "health": "http://bytebot:4001/health"
    │   }
    │
    ↓
    Registry validates and stores registration
    │
    ├─→ Store in Redis: mcp:services:{serviceName}
    ├─→ Store in PostgreSQL: unified_framework.services
    │
    ↓
    Service sends heartbeat every 30s
    │
    ├─→ POST http://mcp-registry:8002/heartbeat
    │   { "serviceName": "bytebot", "status": "healthy" }
    │
    ↓
    Registry monitors health
    │
    ├─→ If no heartbeat for 2min → mark as unhealthy
    ├─→ If unhealthy for 5min → remove from registry

┌─────────────────────────────────────────────────────────────┐
│             MCP TOOL DISCOVERY PROCESS                      │
└─────────────────────────────────────────────────────────────┘

AI Agent needs a tool:
    │
    ├─→ GET http://mcp-registry:8002/tools?capability=screenshot
    │
    ↓
    Registry searches registered tools
    │
    ├─→ Query Redis cache (mcp:tools:*)
    ├─→ If cache miss, query PostgreSQL
    │
    ↓
    Registry returns matching tools
    │
    ├─→ {
    │     "tools": [
    │       {
    │         "name": "screenshot",
    │         "service": "bytebot",
    │         "endpoint": "http://bytebot:4001/mcp/screenshot",
    │         "auth": "jwt"
    │       },
    │       ...
    │     ]
    │   }
    │
    ↓
    Agent selects tool and executes
    │
    ├─→ POST http://bytebot:4001/mcp/screenshot
    │   Header: Authorization: Bearer {token}
    │   { "parameters": {...} }
    │
    ↓
    Service executes tool and returns result
```

---

## 🔄 Service Health Check Flow

```
┌─────────────────────────────────────────────────────────────┐
│              HEALTH CHECK ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────┘

Every service implements:
    │
    ├─→ GET /health
    │   Returns: {
    │     "status": "healthy" | "degraded" | "unhealthy",
    │     "timestamp": "2025-12-20T...",
    │     "checks": {
    │       "database": "healthy",
    │       "redis": "healthy",
    │       "external_apis": "healthy"
    │     },
    │     "metrics": {
    │       "uptime": 86400,
    │       "requests_per_second": 150,
    │       "error_rate": 0.01
    │     }
    │   }

Prometheus scrapes all /health endpoints:
    │
    ├─→ Scrape interval: 15s
    ├─→ Store metrics in time-series database
    │
    ↓
Grafana visualizes health:
    │
    ├─→ Dashboard: "Service Health Overview"
    ├─→ Panels: Uptime, Error Rate, Response Time
    ├─→ Alerts: If error_rate > 5% for 5min
    │
    ↓
Alert Manager sends notifications:
    │
    ├─→ Slack webhook
    ├─→ Email notification
    ├─→ PagerDuty (production only)

Automated recovery (future):
    │
    ├─→ If service unhealthy for 2min
    ├─→ Trigger automatic restart
    ├─→ If restart fails → scale up new instance
```

---

## 📈 Monitoring & Observability Stack

```
┌─────────────────────────────────────────────────────────────┐
│                 MONITORING ARCHITECTURE                     │
└─────────────────────────────────────────────────────────────┘

Metrics Collection (Prometheus):
    │
    ├─→ Scrape /metrics endpoints from all services
    ├─→ Store in time-series database
    ├─→ Retention: 30 days
    │
    ↓
Metrics Exposed:
    │
    ├─→ HTTP request duration (histogram)
    ├─→ HTTP request count (counter)
    ├─→ Database query duration (histogram)
    ├─→ Redis operation duration (histogram)
    ├─→ LLM API latency (histogram)
    ├─→ Memory usage (gauge)
    ├─→ CPU usage (gauge)
    ├─→ Active connections (gauge)
    │
    ↓
Visualization (Grafana):
    │
    ├─→ Dashboard: "Service Overview"
    │   • All services health status
    │   • Request rates across services
    │   • Error rates
    │
    ├─→ Dashboard: "Infrastructure"
    │   • PostgreSQL metrics
    │   • Redis metrics
    │   • Network traffic
    │
    ├─→ Dashboard: "AI Services"
    │   • AIOS LLM usage
    │   • Token consumption
    │   • Model performance
    │
    ↓
Alerting (Prometheus Alertmanager):
    │
    ├─→ Rule: High Error Rate
    │   • Trigger: error_rate > 5% for 5min
    │   • Action: Slack + Email
    │
    ├─→ Rule: High Latency
    │   • Trigger: p95_latency > 1s for 10min
    │   • Action: Email
    │
    ├─→ Rule: Service Down
    │   • Trigger: up == 0 for 2min
    │   • Action: PagerDuty + Slack + Email
```

---

## 🌐 Network Traffic Flow

```
┌─────────────────────────────────────────────────────────────┐
│               NETWORK SEGMENTATION DIAGRAM                  │
└─────────────────────────────────────────────────────────────┘

Internet
    ↓
[ Nginx Reverse Proxy ] (172.27.0.0/16)
    │
    ├─→ /                    → Unified Dashboard (:3003)
    ├─→ /api/*               → API Gateway (:8080)
    ├─→ /grafana/*           → Grafana (:3003)
    ├─→ /prometheus/*        → Prometheus (:9090)
    │
    ↓
[ API Gateway - ByteBot Agent ] (172.21.0.0/16)
    │
    ├─→ /api/ai/*            → AIOS (172.20.0.2:8000)
    ├─→ /api/computer/*      → ByteBot (172.21.0.3:9991)
    ├─→ /api/automation/*    → Factif-AI (172.21.0.4:3001)
    ├─→ /api/social/*        → Postiz (172.22.0.2:9000)
    ├─→ /api/video/*         → Wan2GP (172.23.0.3:12000)
    │
    ↓
[ Services ] (Segmented Networks)
    │
    ├─→ AI Network (172.20.0.0/16)
    │   ├─→ AIOS (.2)
    │   └─→ gbox (.3)
    │
    ├─→ Automation Network (172.21.0.0/16)
    │   ├─→ ByteBot (.3)
    │   ├─→ Open-Interface (.4)
    │   ├─→ macOS-use (.5)
    │   └─→ Factif-AI (.6)
    │
    ├─→ Social Network (172.22.0.0/16)
    │   ├─→ Postiz (.2)
    │   └─→ OnlySnarf (.3)
    │
    ├─→ Content Network (172.23.0.0/16)
    │   ├─→ Reels-Automator (.2)
    │   └─→ Wan2GP (.3)
    │
    ↓
[ Database Network ] (172.24.0.0/16)
    │
    ├─→ PostgreSQL (.2:5432)
    ├─→ Redis (.3:6379)
    └─→ MCP Registry (.4:8002)

Network Rules:
    • All services can access Database Network
    • Only API Gateway can route external requests
    • MCP Network (172.25.0.0/16) allows inter-service MCP calls
    • Monitoring Network (172.26.0.0/16) for Prometheus scraping
```

---

## 🎯 Key Integration Points

### 1. AIOS → External LLMs
- **Protocol**: HTTPS REST
- **Providers**: OpenAI, Anthropic, Google, HuggingFace
- **Rate Limiting**: Per-provider limits
- **Caching**: Redis (1h TTL)

### 2. ByteBot → VNC Server
- **Protocol**: VNC (RFB)
- **Port**: 6080 (WebSocket) / 5901 (native)
- **Authentication**: VNC password
- **Usage**: Remote desktop access

### 3. Factif-AI → Puppeteer/Playwright
- **Protocol**: Chrome DevTools Protocol
- **Browser**: Chromium (headless)
- **Usage**: Web automation

### 4. Postiz → Social Media APIs
- **APIs**: Twitter, Instagram, Facebook, LinkedIn, TikTok, Bluesky
- **Authentication**: OAuth 2.0
- **Rate Limiting**: Per-platform limits

### 5. Wan2GP → GPU
- **CUDA**: Required for video generation
- **Memory**: 16GB VRAM minimum
- **Models**: Stable Diffusion, ControlNet

### 6. All Services → PostgreSQL
- **Protocol**: PostgreSQL wire protocol
- **Port**: 5432
- **Connection Pooling**: 20 connections per service
- **ORM**: Prisma (TypeScript services)

### 7. All Services → Redis
- **Protocol**: Redis Protocol (RESP)
- **Port**: 6379
- **Usage**: Caching, queues, pub/sub
- **Libraries**: BullMQ (job queues), ioredis (client)

---

**Document Version**: 1.0  
**Last Updated**: December 20, 2025  
**Maintained By**: AI Development Team
