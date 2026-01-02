# AGENTS.md - Bytebot Development Guidelines

## Build/Lint/Test Commands

### Bytebot Electron (Main Desktop App)
- **Setup**: `npm install` (root), then `cd bytebot && npm install`
- **Dev**: `npm run dev` (starts all services with Electron)
- **Build**: `npm run build` (builds backend/frontend + packages Electron app)
- **Distribute**: `npm run dist` (creates dmg/nsis/AppImage)

### Bytebot Core Packages

#### @bytebot/shared (MUST build first!)
- **Build**: `cd bytebot/packages/shared && npm run build`
- **Format**: `prettier --write "src/**/*.ts"`
- **Lint**: `eslint "src/**/*.ts" --fix`

#### bytebot-agent (NestJS, Port 9991)
- **Setup**: `cd bytebot/packages/bytebot-agent && npm install`
- **Database**: `npm run prisma:dev` (migrations + client)
- **Build**: `npm run build` (builds shared first, then Prisma, then NestJS)
- **Start Dev**: `npm run start:dev` (watch mode with hot reload)
- **Start Prod**: `npm run start:prod`
- **Test**: `npm run test` (Jest, coverage in `../coverage/`)
- **Test Single**: `npm run test -- --testPathPattern="**/tasks.service.spec.ts"`
- **Test Watch**: `npm run test:watch`
- **Test Coverage**: `npm run test:cov`
- **Lint**: `eslint "{src,apps,libs,test}/**/*.ts" --fix`
- **Format**: `prettier --write "src/**/*.ts" "test/**/*.ts"`

#### bytebot-ui (Next.js, Port 9992)
- **Setup**: `cd bytebot/packages/bytebot-ui && npm install`
- **Dev**: `npm run dev` (requires shared built first)
- **Build**: `npm run build` (Next.js production build)
- **Export**: `npm run export` (static export)
- **Lint**: `next lint`
- **Test E2E**: `playwright test`

#### bytebotd (Desktop Service, Port 9990)
- **Setup**: `cd bytebot/packages/bytebotd && npm install`
- **Build**: `npm run build` (builds shared first)
- **Start Dev**: `npm run start:dev`
- **Test**: `npm run test` (coverage in `../coverage/`)

### Other Projects
- **Postiz-App**: `cd postiz-app && pnpm install && pnpm run dev`
- **Factif-AI**: `cd factif-ai && npm run install:all && npm start`

## Code Style Guidelines

### TypeScript Conventions (All Packages)
- **Imports**: Group (external, internal, relative), use `@bytebot/shared` for shared
- **Naming**: camelCase (vars/functions), PascalCase (classes/components), UPPER_SNAKE_CASE (constants)
- **Types**: Strict mode enabled, explicit return types on exported functions
- **Comments**: TSDoc for APIs, inline for complex logic
- **Formatting**: Prettier single quotes, printWidth: 100, tabWidth: 2, semi: true
- **Error Handling**: try-catch with async/await, HttpException for NestJS, class-validator DTOs
- **Components**: React functional components with hooks, "use client" for interactivity
- **NestJS**: @Controller/@Service decorators, DTOs with class-validator, @WebSocketGateway for sockets

### ESLint Configuration
- **bytebot-agent/bytebotd**: Uses `typescript-eslint` with recommended rules
- **bytebot-ui**: Extends `next/core-web-vitals`, `next/typescript`
- **Key Rules**: `@typescript-eslint/no-explicit-any: off`, `@typescript-eslint/no-floating-promises: warn`

### Prettier Configuration
- **bytebot-agent/bytebotd**: `.prettierrc` with standard settings
- **bytebot-ui**: `.prettierrc.json` with `prettier-plugin-tailwindcss`

### Testing Patterns
- **Test Files**: `*.spec.ts` pattern (Jest)
- **Test Location**: `src/` directory alongside source files
- **Coverage**: `../coverage/` directory
- **E2E**: `test/jest-e2e.json` for bytebot-agent

## Project Architecture

### Bytebot Monorepo Structure
```
bytebot/
├── packages/
│   ├── shared/          (Common types & utilities - MUST BUILD FIRST)
│   ├── bytebot-agent/   (NestJS backend, Port 9991)
│   ├── bytebot-agent-cc/(Claude Code variant)
│   ├── bytebot-ui/      (Next.js frontend, Port 9992)
│   ├── bytebotd/        (Desktop service, Port 9990)
│   └── bytebot-llm-proxy/(Python LiteLLM proxy)
├── docker/              (Docker Compose configurations)
├── docs/                (API & deployment docs)
└── helm/                (Kubernetes Helm charts)
```

### Port Assignments
- **bytebotd**: 9990 (HTTP/WebSocket, desktop automation)
- **bytebot-agent**: 9991 (HTTP/WebSocket, AI agent API)
- **bytebot-ui**: 9992 (HTTP, Next.js UI)
- **PostgreSQL**: 5432

### Dependencies (Build Order Critical!)
```
@bytebot/shared → bytebot-agent, bytebot-agent-cc, bytebot-ui, bytebotd
```
⚠️ **Always build shared package first**: `npm run build --prefix ../shared`

### Database
- **Provider**: PostgreSQL with Prisma ORM
- **Migrations**: `npm run prisma:dev` (development), `prisma:prod` (production)
- **Schema**: `packages/bytebot-agent/prisma/schema.prisma`

## Security & Best Practices

### ⚠️ Critical Security Notes
- **CORS**: Configure via `CORS_ORIGINS` environment variable; restrict in production
- **Authentication**: 
  - `BYTEBOT_AUTH_ENABLED` (default: false) - enable authentication in production
  - `BYTEBOT_AUTH_SECRET` - set a strong secret in production
  - `BYTEBOT_AUTH_BYPASS` (default: false) - **NEVER enable in production**
  - `BYTEBOT_AUTH_TTL_SECONDS` (default: 3600) - session timeout
  - bytebotd has AuthGuard, bytebot-agent has NO authentication by default
- **Rate Limiting**: Configure via `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS`
- **Security Headers**: No Helmet.js middleware currently

### Environment Variables for Security

#### Authentication
```bash
BYTEBOT_AUTH_ENABLED=false      # Enable authentication (false=dev, true=prod)
BYTEBOT_AUTH_SECRET=            # Strong secret key (REQUIRED in production)
BYTEBOT_AUTH_BYPASS=false       # Skip auth checks (DEV ONLY - NEVER prod)
BYTEBOT_AUTH_TTL_SECONDS=3600   # Session timeout in seconds
```

#### Rate Limiting (bytebot-agent)
```bash
RATE_LIMIT_WINDOW_MS=60000      # Time window in milliseconds (default: 1 minute)
RATE_LIMIT_MAX_REQUESTS=100     # Max requests per window (default: 100)
```

#### CORS Configuration
```bash
CORS_ORIGINS=http://localhost:3000,http://localhost:9992
# Comma-separated list of allowed origins
```

### Development Best Practices
- **Logger**: Use NestJS Logger, avoid console.log (58 found in code)
- **Type Safety**: Enable `strict: true` in tsconfig (currently partial)
- **Secrets**: Use `.env` files, never hardcode
- **Commits**: Conventional commits (`feat:`, `fix:`, `chore:`)

### Recent Changes (Last 10 Commits)
- `13f7016` - feat: Complete Bytebot dockerization with multi-desktop support
- `5cf2020` - feat: refresh ui and add terminal/web support  
- `58b5057` - feat: spectacular logo redesign with BBH_Bartle font
- `209cdca` - fix: update task status filtering to use uppercase enum values
- `745d7ed` - fix: models endpoint returning default models when proxy fails

## AI Agent Guidelines

### Focus Areas
1. **Bytebot Primary**: Electron + NestJS + Next.js architecture
2. **Build Order**: Always build shared before other packages
3. **UI Design**: Use floating pill interface patterns
4. **AI Integration**: Leverage Anthropic, OpenAI, Google, Groq, Ollama, Routeway providers
5. **Real-time**: Follow Socket.IO patterns for task updates

### Code Quality
- Keep functions under 20 lines
- Descriptive names over abbreviations
- Consistency over creativity
- Test before commit
- Maintain 80%+ test coverage

### Common Patterns
- `@bytebot/shared` for shared types
- NestJS dependency injection
- Socket.IO for WebSocket
- class-validator DTOs
- Prisma for database
