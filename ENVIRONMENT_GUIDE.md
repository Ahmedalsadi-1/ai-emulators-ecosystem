# AI Emulators Ecosystem - Environment Configuration Guide

This guide documents the required environment variables and API keys for all services in the ecosystem.

## Global Requirements

The following API keys are used across multiple services:

| Key | Description | Used By |
| --- | --- | --- |
| `OPENAI_API_KEY` | OpenAI API Access | AIOS, bytebot, Open-Interface, reels-clips-automator |
| `ANTHROPIC_API_KEY` | Anthropic Claude Access | AIOS, bytebot, Open-Interface |
| `GOOGLE_API_KEY` | Google Gemini Access | AIOS, Open-Interface |
| `HUGGINGFACE_TOKEN` | HuggingFace Model Access | AIOS |

## Service Specific Configuration

### 1. AIOS
- **Venv**: `AIOS/venv` (Python 3.11)
- **Config**: `AIOS/aios/config/config.yaml`
- **Port**: 8000 (API), 8001 (MCP)

### 2. ByteBot Agent (`bytebot-agent-cc`)
- **Port**: 8080
- **Database**: `postgresql://admin:password@localhost:5432/bytebotdb`
- **Required Keys**: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`

### 3. PostgreSQL
- **Host**: localhost:5432
- **User**: admin / postgres
- **Password**: password
- **Databases**: `ai_ecosystem`, `bytebotdb`, `unified_framework`

### 4. Redis
- **Host**: localhost:6379
- **Status**: Running

## Security Validation

All services should validate API keys on startup. Use the provided `scripts/validate-env.sh` to check your configuration.

## Missing .env.example Restoration

The following `.env.example` files have been restored/created:
- `Open-Interface/.env.example`
- `reels-clips-automator/.env.example`
- `Wan2GP/.env.example`
- `onlysnarf/.env.example`
