# PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-06 14:48
**Branch:** feature/kronos-os-complete-branding
**Focus:** KRONOS-OS - AI-Powered Desktop Automation Platform

## OVERVIEW

Bytebot is the primary monorepo for KRONOS-OS, an AI-powered desktop automation platform with:
- **Multi-desktop virtualization** (4 isolated desktops)
- **AI agent orchestration** with tool-use capabilities
- **Real-time WebSocket communication** (Socket.IO)
- **Docker-native deployment** (all services containerized)

## STRUCTURE

```
bytebot/
├── packages/
│   ├── shared/          # Common types & utilities (MUST BUILD FIRST)
│   ├── bytebot-agent/   # NestJS backend (Port 9991)
│   ├── bytebot-agent-cc/ # Claude Code variant
│   ├── bytebot-ui/      # Next.js frontend (Port 9992)
│   ├── bytebotd/        # Desktop service (Port 9990)
│   └── bytebot-llm-proxy/ # Python LiteLLM proxy
├── docker/               # Docker Compose configurations
├── docs/                 # API & deployment docs
└── helm/                 # Kubernetes Helm charts
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| **UI Development** | `packages/bytebot-ui/src/` | Next.js, Port 9992 |
| **Backend API** | `packages/bytebot-agent/src/` | NestJS, Port 9991 |
| **Desktop Service** | `packages/bytebotd/src/` | TypeScript, Port 9990 |
| **Shared Types** | `packages/shared/src/` | Build before others |
| **Docker Configs** | `docker/` | docker-compose files |
| **Prisma Schema** | `packages/bytebot-agent/prisma/` | Database schema |

## CODE MAP

| Symbol | Type | Location | Refs | Role |
|--------|------|----------|------|------|
| `TasksController` | NestJS | src/tasks/ | 47 | Task REST API |
| `TasksGateway` | Socket.IO | src/tasks/ | 32 | Real-time updates |
| `DesktopPage` | React | packages/bytebot-ui/src/app/desktop/ | 28 | Desktop UI |
| `VncViewer` | React | packages/bytebot-ui/src/components/vnc/ | 19 | VNC integration |
| `ComputerController` | Service | packages/bytebotd/src/ | 15 | Desktop control |

## CONVENTIONS

### Build Order (CRITICAL!)
```
@bytebot/shared → bytebot-agent, bytebot-agent-cc, bytebot-ui, bytebotd
```
**Always build shared first:** `npm run build --prefix ../shared`

### TypeScript Conventions
- **Imports**: Group (external, internal, relative), use `@bytebot/shared`
- **Naming**: camelCase (vars), PascalCase (classes/components)
- **Types**: Strict mode, explicit return types on exported functions
- **Comments**: TSDoc for APIs, inline for complex logic
- **Formatting**: Prettier single quotes, printWidth: 100

### NestJS Patterns
- `@Controller/@Service` decorators
- DTOs with `class-validator`
- `@WebSocketGateway` for Socket.IO
- Prisma for database access

### React/Next.js Patterns
- Functional components with hooks
- `"use client"` for interactive components
- Extend `next/core-web-vitals` ESLint config

## ANTI-PATTERNS (THIS PROJECT)

1. **NEVER** commit `.env` files (use `.env.example`)
2. **NEVER** skip building `@bytebot/shared` before other packages
3. **NEVER** use `console.log` in production (use Logger)
4. **NEVER** ignore TypeScript errors (strict mode)
5. **NEVER** make tool calls without `session_id` parameter

## COMMANDS

```bash
# === Setup ===
npm install                          # Root setup
cd packages/bytebot-agent && npm install

# === Development ===
npm run start:dev                    # Watch mode with hot reload

# === Build ===
npm run build                        # Builds shared first, then Prisma, then NestJS

# === Testing ===
npm run test                         # Jest, coverage in ../coverage/
npm run test:cov                     # Coverage report

# === Linting/Formatting ===
eslint "{src,apps,libs,test}/**/*.ts" --fix
prettier --write "src/**/*.ts" "test/**/*.ts"
```

## PORT ASSIGNMENTS

| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| `bytebotd` | 9990 | HTTP/WS | Desktop automation |
| `bytebot-agent` | 9991 | HTTP/WS | AI agent API |
| `bytebot-ui` | 9992 | HTTP | Next.js UI |
| `PostgreSQL` | 5432 | TCP | Database |
| `Redis` | 6379 | TCP | Caching |

## SECURITY

- **CORS**: Configure via `CORS_ORIGINS` env var
- **Auth**: `BYTEBOT_AUTH_ENABLED` (false in dev, true in prod)
- **Rate Limiting**: `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`
- **Tool Calls**: MUST include `session_id` parameter

## NOTES

- **Submodules**: bytebot is a git submodule in some parent repos
- **Docker**: All services defined in `docker-compose.ecosystem.yml`
- **Models**: 37+ configured models (Routeway, Groq, OpenAI, Google, LM Studio, Ollama)
- **Desktops**: 4 isolated workspaces (Primary:9990, Kali:9993, Debian:9995, BrowserOS:9994)
