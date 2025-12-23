# AI Emulators Ecosystem - Architecture Overview

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Service Relationships](#service-relationships)
3. [Network Topology](#network-topology)
4. [Data Flow Patterns](#data-flow-patterns)
5. [Component Details](#component-details)
6. [Security Architecture](#security-architecture)

## System Architecture

The AI Emulators Ecosystem is a comprehensive orchestration platform that integrates 10 specialized AI services with Model Context Protocol (MCP) support, providing unified access to diverse AI capabilities through a microservices architecture.

### Core Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                      AI Emulators Ecosystem                         │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    User Interface Layer                        │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │ │
│  │  │   Web UI    │  │   API       │  │   CLI       │             │ │
│  │  │ (Grafana)   │  │ Gateway     │  │ Tools       │             │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘             │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                 Orchestration & Control Layer                  │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │ │
│  │  │   AIOS      │  │ MCP Registry│  │   Agent     │             │ │
│  │  │ (Agent OS)  │  │   Service   │  │   System    │             │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘             │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                   Specialized Services Layer                    │ │
│  │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐         │ │
│  │  │GBox │  │Byte│  │Open │  │macOS│  │Factif│  │Postiz│        │ │
│  │  │Env  │  │bot │  │Intf │  │-use │  │-AI  │  │-app │         │ │
│  │  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘         │ │
│  │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐         │ │
│  │  │Only │  │Reels│  │Wan2 │  │Kali │  │     │  │     │         │ │
│  │  │Snarf│  │Auto │  │GP   │  │Desk │  │     │  │     │         │ │
│  │  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘         │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                 Infrastructure & Data Layer                     │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │ │
│  │  │ PostgreSQL  │  │    Redis    │  │ Prometheus  │             │ │
│  │  │   Database  │  │    Cache    │  │ Monitoring  │             │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘             │ │
│  │  ┌─────────────┐  ┌─────────────┐                              │ │
│  │  │   Grafana   │  │   Nginx     │                              │ │
│  │  │ Dashboards  │  │  Reverse    │                              │ │
│  │  │             │  │   Proxy     │                              │ │
│  │  └─────────────┘  └─────────────┘                              │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Service Relationships

### Service Categories

#### AI/LLM Operating Systems & Agent Platforms
- **AIOS**: Complete AI Agent Operating System with LLM routing, memory management, and tool integration
- **gbox**: Environment provider for AI agents with sandboxing and resource management

#### Computer Control & Automation Tools
- **bytebot**: AI desktop agent with virtual environment and VNC integration
- **Open-Interface**: Cross-platform computer control with API-first design
- **macOS-use**: macOS automation with Apple ecosystem integration
- **factif-ai**: AI-powered test automation with visual testing capabilities

#### Specialized Applications
- **postiz-app**: Social media scheduling and content management platform
- **onlysnarf**: OnlyFans automation and content distribution platform
- **reels-clips-automator**: Instagram Reels and video clip automation
- **Wan2GP**: Video generation platform with AI-powered content creation

#### Supporting Infrastructure
- **MCP Registry**: Service discovery and tool registration for MCP clients
- **PostgreSQL**: Primary database for application data persistence
- **Redis**: Caching, session management, and message queuing
- **Prometheus/Grafana**: Monitoring and observability stack
- **Nginx**: Reverse proxy and load balancing

### Service Dependencies

```
AIOS (Agent OS)
├── PostgreSQL (data persistence)
├── Redis (caching, message queue)
├── HuggingFace API (model access)
├── OpenAI API (LLM services)
└── MCP Registry (tool discovery)

gbox (Environment Provider)
├── PostgreSQL
└── MCP Registry

Computer Control Services (bytebot, Open-Interface, macOS-use, factif-ai)
├── PostgreSQL
├── Redis
├── VNC/X11 (desktop access)
└── MCP Registry

Social/Content Services (postiz-app, onlysnarf, reels-clips-automator)
├── PostgreSQL
├── Redis
├── Social Media APIs
└── MCP Registry

Wan2GP (Video Generation)
├── PostgreSQL
├── Redis
├── CUDA/GPU resources
├── Video processing libraries
└── MCP Registry

Infrastructure Services
├── PostgreSQL (all services)
├── Redis (caching, sessions, queues)
├── Prometheus (metrics collection)
├── Grafana (visualization)
└── Nginx (load balancing)
```

## Network Topology

### Network Segmentation

The ecosystem uses Docker networks for service isolation and security:

```
┌─────────────────────────────────────────────────────────────┐
│                    External Network                         │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    Web Network                          │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │ │
│  │  │   Nginx     │  │  Grafana    │  │ Prometheus  │     │ │
│  │  │ (Ports 80,  │  │ (Port 3000) │  │ (Port 9090) │     │ │
│  │  │     443)    │  │             │  │             │     │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                 AI Network (172.20.0.0/16)             │ │
│  │  ┌─────────────┐  ┌─────────────┐                      │ │
│  │  │   AIOS      │  │   GBox     │                      │ │
│  │  │ (Port 8000) │  │ (Port 3000)│                      │ │
│  │  └─────────────┘  └─────────────┘                      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │            Automation Network (172.21.0.0/16)          │ │
│  │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐         │ │
│  │  │Byte│  │Open│  │macOS│  │Factif│  │Kali │         │ │
│  │  │bot │  │Intf│  │-use │  │-AI  │  │Desk │         │ │
│  │  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Social Network (172.22.0.0/16)            │ │
│  │  ┌─────────────┐  ┌─────────────┐                      │ │
│  │  │ postiz-app  │  │  onlysnarf  │                      │ │
│  │  └─────────────┘  └─────────────┘                      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │            Content Network (172.23.0.0/16)             │ │
│  │  ┌─────────────┐  ┌─────────────┐                      │ │
│  │  │ reels-auto  │  │   Wan2GP    │                      │ │
│  │  └─────────────┘  └─────────────┘                      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           Database Network (172.24.0.0/16)             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │ │
│  │  │ PostgreSQL  │  │    Redis    │  │ MCP Registry│     │ │
│  │  │ (Port 5432) │  │ (Port 6379) │  │ (Port 8002) │     │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           MCP Network (172.25.0.0/16)                  │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │             All Services with MCP Ports             │ │ │
│  │  │  AIOS:8001, GBox:3001, Bytebot:4001, etc.           │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Network Security Features

- **Network Segmentation**: Services are isolated in separate Docker networks
- **Internal Communication**: Services communicate through defined network interfaces
- **External Access**: Only Nginx and monitoring services are exposed externally
- **MCP Isolation**: Dedicated network for MCP tool communication
- **Database Security**: Database network restricts direct external access

## Data Flow Patterns

### MCP Tool Communication Flow

```
User Request → MCP Client → MCP Registry → Tool Discovery
                                      ↓
                         Tool Registration & Authentication
                                      ↓
User Request → MCP Client → Target Service → Tool Execution
                                      ↓
                         Response Processing → User
```

### Service-to-Service Communication

```
API Request → Nginx (Load Balancer) → Target Service
                                      ↓
                         Authentication & Authorization
                                      ↓
                         Business Logic Processing
                                      ↓
                         Database/Redis Operations
                                      ↓
                         Response Generation
```

### Monitoring Data Flow

```
Service Metrics → Prometheus → Grafana Dashboards
Service Logs → Log Aggregation → Centralized Logging
Health Checks → Monitoring System → Alert Management
```

### AI/ML Pipeline Flow

```
Input Data → AIOS (Routing) → Appropriate LLM/Model
                                      ↓
                         Context Processing & Memory
                                      ↓
                         Tool Chain Execution
                                      ↓
                         Result Synthesis & Response
```

## Component Details

### AIOS (AI Operating System)
- **Purpose**: Complete AI agent operating system
- **Key Features**:
  - LLM routing and load balancing
  - Memory management and context retention
  - Tool integration and orchestration
  - Multi-modal input processing
- **Technology Stack**: Python, Rust (aiOS-rs), Docker
- **Resource Requirements**: GPU support, 8GB RAM, 4 CPU cores

### gbox (Environment Provider)
- **Purpose**: Sandboxed environment for AI agents
- **Key Features**:
  - Resource isolation and management
  - Environment provisioning
  - Security sandboxing
- **Technology Stack**: Node.js, Docker
- **Resource Requirements**: 4GB RAM, 2 CPU cores

### Computer Control Services
- **bytebot**: Virtual desktop environment with VNC
- **Open-Interface**: Cross-platform automation API
- **macOS-use**: macOS-specific automation
- **factif-ai**: Visual testing and automation
- **Common Features**: GUI automation, screenshot capture, input simulation

### Content & Social Services
- **postiz-app**: Social media scheduling
- **onlysnarf**: Content distribution automation
- **reels-clips-automator**: Video content automation
- **Wan2GP**: AI-powered video generation
- **Common Features**: API integration, content processing, scheduling

## Security Architecture

### Authentication & Authorization
- **JWT Tokens**: Service-to-service authentication
- **API Keys**: External service integration
- **Role-Based Access**: User permission management
- **MCP Authentication**: Tool access control

### Data Protection
- **Encryption**: TLS for all external communications
- **Database Encryption**: Sensitive data encryption at rest
- **Network Security**: Internal network segmentation
- **Secret Management**: Environment variable-based secrets

### Monitoring & Auditing
- **Access Logging**: All API access is logged
- **Security Events**: Suspicious activity monitoring
- **Compliance**: GDPR and security best practices
- **Incident Response**: Automated alerting and response procedures

---

For deployment guides, see [DEPLOYMENT.md](./DEPLOYMENT.md)
For API documentation, see [API.md](./API.md)
For troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)