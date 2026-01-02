# Bytebot/Kronos Dependency Matrix

## Overview
This matrix documents all services, their ports, environment variables, and interdependencies for the Bytebot/Kronos system.

---

## 1. Core Bytebot Services

### bytebotd (Port 9990)
| Environment Variable | Required | Default | Description | Source |
|---------------------|----------|---------|-------------|--------|
| `PORT` | Yes | 9990 | Service port | `bytebotd/.env.example:20` |
| `NODE_ENV` | No | development | Environment mode | `bytebotd/.env.example:21` |
| `DATABASE_URL` | Yes | - | PostgreSQL connection | `bytebotd/.env.example:4` |
| `CORS_ORIGINS` | No | localhost:3000,9992 | Allowed CORS origins | `bytebotd/.env.example:24` |
| `NUT_HOST` | No | localhost | NUT service host | `bytebotd/.env.example:27` |
| `NUT_PORT` | No | 9999 | NUT service port | `bytebotd/.env.example:28` |
| `LOG_LEVEL` | No | debug | Logging level | `bytebotd/.env.example:31` |
| `BYTEBOT_AUTH_ENABLED` | No | false | Enable authentication | `bytebotd/.env.example:34` |
| `BYTEBOT_AUTH_SECRET` | No | - | Auth JWT secret | `bytebotd/.env.example:35` |
| `AIOS_BASE_URL` | No | localhost:8000 | AIOS service URL | `bytebotd/.env.example:45` |
| `FACTIF_AI_BASE_URL` | No | localhost:3001 | Factif-AI service URL | `bytebotd/.env.example:46` |
| `BROWSEROS_APP_COMMAND` | No | browseros | Launch command | `bytebotd/.env.example:7` |
| `BROWSEROS_APP_WMCLASS` | No | browseros.BrowserOS | Window class | `bytebotd/.env.example:8` |
| `TURIX_APP_COMMAND` | No | open -a "Turix" | TuriX launch command | `bytebotd/.env.example:10` |
| `TURIX_APP_WMCLASS` | No | Turix | TuriX window class | `bytebotd/.env.example:11` |
| `AIOS_APP_COMMAND` | No | - | AIOS launch command | `bytebotd/.env.example:13` |
| `AIOS_APP_WMCLASS` | No | aios.AIOS | AIOS window class | `bytebotd/.env.example:14` |
| `OPEN_INTERFACE_APP_COMMAND` | No | - | Open-Interface launch | `bytebotd/.env.example:16` |
| `OPEN_INTERFACE_APP_WMCLASS` | No | Open-Interface | Window class | `bytebotd/.env.example:17` |

**Dependencies:**
- PostgreSQL (5432)
- Display (:0) for desktop automation
- noVNC (6080) for web VNC access

---

### bytebot-agent (Port 9991)
| Environment Variable | Required | Default | Description | Source |
|---------------------|----------|---------|-------------|--------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection | `bytebot-agent/.env.example:1` |
| `ANTHROPIC_API_KEY` | Conditional | - | Required for Anthropic models | `bytebot-agent/.env.example:2` |
| `OPENAI_API_KEY` | Conditional | - | Required for OpenAI models | `bytebot-agent/.env.example:3` |
| `GEMINI_API_KEY` | Conditional | - | Required for Google models | `bytebot-agent/.env.example:4` |
| `ROUTEWAY_API_KEY` | Conditional | - | Required for Routeway models | `bytebot-agent/.env.example:5` |
| `ROUTEWAY_BASE_URL` | No | https://api.routeway.ai/v1 | Routeway API | `bytebot-agent/.env.example:6` |
| `BYTEBOT_DESKTOP_BASE_URL` | Yes | localhost:9990 | bytebotd URL | `bytebot-agent/.env.example:7` |
| `BYTEBOT_LLM_PROXY_URL` | No | - | LiteLLM proxy URL | `bytebot-agent/.env.example:8` |
| `BYTEBOT_ANALYTICS_ENDPOINT` | No | - | Analytics collector | `bytebot-agent/.env.example:9` |
| `CORS_ORIGINS` | No | localhost:3000,9992 | CORS allowed origins | `bytebot-agent/.env.example:12` |

**Dependencies:**
- PostgreSQL (5432)
- bytebotd (9990) for desktop automation
- LLM provider APIs (Anthropic, OpenAI, Google, Groq, Routeway)
- Optional: bytebot-llm-proxy (4000)

**Exposes:**
- HTTP API (9991)
- MCP server (9998) - per docker-compose

---

### bytebot-ui (Port 9992)
| Environment Variable | Required | Default | Description | Source |
|---------------------|----------|---------|-------------|--------|
| `BYTEBOT_AGENT_BASE_URL` | Yes | localhost:9991 | bytebot-agent API | `bytebot-ui/.env.example:1` |
| `BYTEBOT_DESKTOP_VNC_URL` | Yes | ws://localhost:6080/websockify | VNC websocket | `bytebot-ui/.env.example:2` |
| `BYTEBOT_DESKTOP_KALI_VNC_URL` | Yes | ws://localhost:6084/websockify | Kali VNC websocket | `bytebot-ui/.env.example:3` |
| `BYTEBOT_DESKTOP_BASE_URL` | Yes | localhost:9990 | bytebotd URL | `bytebot-ui/.env.example:4` |
| `NEXT_PUBLIC_API_URL` | No | localhost:9991 | Public API URL | `bytebot-ui/.env.example:5` |
| `NEXT_PUBLIC_TURIX_API_URL` | No | localhost:3000 | TuriX orchestrator | `bytebot-ui/.env.example:6` |
| `NEXT_PUBLIC_BROWSEROS_WEB_URL` | No | - | BrowserOS web URL | `bytebot-ui/.env.example:10` |
| `TURIX_APP_COMMAND` | No | open -a "Turix" | TuriX launch command | `bytebot-ui/.env.example:13` |
| `TURIX_APP_WMCLASS` | No | Turix | TuriX window class | `bytebot-ui/.env.example:14` |

**Dependencies:**
- bytebot-agent (9991)
- bytebotd (9990) for desktop automation
- VNC servers (6080, 6084)

**Proxies:**
- `/api` → bytebot-agent:9991
- `/api/proxy/websockify` → VNC servers

---

## 2. Controller Services

### TuriX (Port 3000 via orchestrator)
| Environment Variable | Required | Default | Description | Source |
|---------------------|----------|---------|-------------|--------|
| `BYTEBOT_URL` | Yes | - | bytebot-agent URL | `docker-compose.ecosystem.yml:1130` |
| `AIOS_URL` | Yes | - | AIOS service URL | `docker-compose.ecosystem.yml:1128` |
| `OPEN_INTERFACE_URL` | Yes | - | Open-Interface URL | `docker-compose.ecosystem.yml:1131` |
| `FACTIF_AI_URL` | Yes | - | Factif-AI URL | `docker-compose.ecosystem.yml:1133` |
| `JWT_SECRET` | Yes | - | JWT authentication | `docker-compose.ecysystem.yml:1125` |
| `REDIS_URL` | Yes | redis://redis:6379 | Redis cache | `docker-compose.ecosystem.yml:1126` |

---

### AIOS (Port 8010)
| Environment Variable | Required | Default | Description | Source |
|---------------------|----------|---------|-------------|--------|
| `NODE_ENV` | Yes | production | Environment mode | `docker-compose.ecosystem.yml:38` |
| `LOG_LEVEL` | Yes | INFO | Logging level | `docker-compose.ecosystem.yml:39` |
| `DATABASE_URL` | Yes | - | PostgreSQL connection | `docker-compose.ecosystem.yml:40` |
| `REDIS_URL` | Yes | redis://redis:6379 | Redis connection | `docker-compose.ecosystem.yml:41` |
| `HUGGINGFACE_TOKEN` | Conditional | - | Required for HF models | `docker-compose.ecosystem.yml:42` |
| `OPENAI_API_KEY` | Conditional | - | Required for OpenAI | `docker-compose.ecosystem.yml:43` |
| `CUDA_VISIBLE_DEVICES` | No | all | GPU allocation | `docker-compose.ecosystem.yml:44` |

**Exposes:**
- HTTP API (8010)
- MCP server (8011)

---

### Open-Interface (Port 5000)
| Environment Variable | Required | Default | Description | Source |
|---------------------|----------|---------|-------------|--------|
| `FLASK_ENV` | Yes | production | Environment mode | `docker-compose.ecosystem.yml:282` |
| `LOG_LEVEL` | Yes | INFO | Logging level | `docker-compose.ecosystem.yml:283` |
| `OPENAI_API_KEY` | Conditional | - | Required for AI features | `docker-compose.ecosystem.yml:284` |
| `GOOGLE_API_KEY` | Conditional | - | Required for Gemini | `docker-compose.ecosystem.yml:285` |
| `DISPLAY` | Yes | :99 | X display | `docker-compose.ecosystem.yml:286` |
| `QT_QPA_PLATFORM` | Yes | offscreen | Qt platform | `docker-compose.ecosystem.yml:287` |

**Exposes:**
- HTTP API (5000)
- MCP server (5001)
- VNC (6081)

---

### Factif-AI (Port 3001)
| Environment Variable | Required | Default | Description | Source |
|---------------------|----------|---------|-------------|--------|
| `NODE_ENV` | Yes | production | Environment mode | `docker-compose.ecosystem.yml:348` |
| `LOG_LEVEL` | Yes | INFO | Logging level | `docker-compose.ecosystem.yml:349` |
| `DATABASE_URL` | Yes | - | PostgreSQL connection | `docker-compose.ecosystem.yml:350` |
| `REDIS_URL` | Yes | redis://redis:6379 | Redis connection | `docker-compose.ecosystem.yml:351` |

**Exposes:**
- HTTP API (7000) - per docker-compose
- MCP server (7001)
- VNC (6082)

---

## 3. VNC Infrastructure

### bytebot-desktop (Port 6080)
| Environment Variable | Required | Default | Description | Source |
|---------------------|----------|---------|-------------|--------|
| `DISPLAY` | Yes | :1 | X display number | `bytebot-desktop-container/docker-compose.yml:14` |
| `VNC_PORT` | Yes | 5900 | Direct VNC port | `bytebot-desktop-container/docker-compose.yml:15` |
| `NOVNC_PORT` | Yes | 6080 | noVNC web port | `bytebot-desktop-container/docker-compose.yml:16` |
| `BYTEBOT_DESKTOP_PORT` | Yes | 9990 | API port | `bytebot-desktop-container/docker-compose.yml:17` |
| `NODE_ENV` | Yes | production | Environment mode | `bytebot-desktop-container/docker-compose.yml:18` |

**Exposes:**
- bytebotd API (9990)
- Direct VNC (5900)
- noVNC web (6080)

---

### Kali Desktop (Port 6084)
| Environment Variable | Required | Default | Description | Source |
|---------------------|----------|---------|-------------|--------|
| `VNC_PASSWORD` | Yes | password | VNC authentication | `docker-compose.bytebot-kali.yml:36` |
| `USER` | Yes | root | Container user | `docker-compose.bytebot-kali.yml:37` |

**Exposes:**
- noVNC web (6084)
- Direct VNC (5901)

---

## 4. Database & Infrastructure

### PostgreSQL (Port 5432)
| Environment Variable | Required | Default | Description | Source |
|---------------------|----------|---------|-------------|--------|
| `POSTGRES_DB` | Yes | ai_ecosystem | Default database | `docker-compose.ecosystem.yml:551` |
| `POSTGRES_USER` | Yes | admin | Admin username | `docker-compose.ecosystem.yml:552` |
| `POSTGRES_PASSWORD` | Yes | - | Admin password (secret) | `docker-compose.ecosystem.yml:561` |
| `POSTGRES_MAX_CONNECTIONS` | No | 200 | Connection pool | `docker-compose.ecosystem.yml:553` |
| `POSTGRES_SHARED_BUFFERS` | No | 256MB | Shared memory | `docker-compose.ecosystem.yml:554` |

---

### Redis (Port 6379)
| Environment Variable | Required | Default | Description | Source |
|---------------------|----------|---------|-------------|--------|
| `REDIS_PASSWORD` | No | - | Optional password | `docker-compose.ecosystem.yml:800` |

---

## 5. Service Port Summary

| Service | HTTP Port | MCP Port | VNC Port | Protocol |
|---------|-----------|----------|----------|----------|
| bytebotd | 9990 | - | 6080 | HTTP/WS |
| bytebot-agent | 9991 | 9998 | - | HTTP/WS |
| bytebot-ui | 9992 | - | - | HTTP |
| TuriX (orchestrator) | 3000 | - | - | HTTP |
| AIOS | 8010 | 8011 | - | HTTP |
| Open-Interface | 5000 | 5001 | 6081 | HTTP |
| Factif-AI | 7000 | 7001 | 6082 | HTTP |
| Kali Desktop | - | - | 6084 | VNC/WS |
| PostgreSQL | 5432 | - | - | TCP |
| Redis | 6379 | - | - | TCP |

---

## 6. Inter-Service Dependencies

```
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │     (5432)      │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  bytebot-agent │   │     AIOS      │   │   Factif-AI   │
│    (9991)      │   │    (8010)     │   │    (7000)     │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                    │
        │    ┌──────────────┼──────────────┐     │
        │    │              │              │     │
        ▼    ▼              ▼              ▼     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   bytebotd    │   │     TuriX     │   │     Redis     │
│    (9990)     │   │    (3000)     │   │    (6379)     │
│   ┌─────┐     │   └───────────────┘   └───────────────┘
│   │VNC  │     │
│   │6080 │     │
│   └─────┘     │
└───────────────┘
        │
        ▼
┌───────────────┐
│  bytebot-ui   │
│    (9992)     │
└───────────────┘
```

---

## 7. Build Order Dependencies

```
@bytebot/shared (must build first)
    │
    ├──► bytebotd
    │       └──► PostgreSQL, Display, VNC
    │
    ├──► bytebot-agent
    │       ├──► @bytebot/shared
    │       ├──► PostgreSQL
    │       └──► bytebotd (for desktop automation)
    │
    └──► bytebot-ui
            ├──► @bytebot/shared
            ├──► bytebot-agent
            └──► bytebotd
```
