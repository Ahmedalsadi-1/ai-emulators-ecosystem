# AGENTS.md - Unified AI Ecosystem Development Guidelines

## Build/Lint/Test Commands

### Bytebot Electron (Main Desktop App - Primary Focus)
- **Setup**: `npm install` (installs Electron and dependencies)
- **Dev**: `npm run dev` (starts Electron in development mode with all services)
- **Build**: `npm run build` (builds backend/frontend and packages app)
- **Start**: `npm start` (runs packaged Electron app)
- **Distribute**: `npm run dist` (creates platform-specific installers: dmg/nsis/AppImage)
- **Distribute Platform**: `npm run dist:mac`, `npm run dist:win`, `npm run dist:linux`

### Bytebot Core (TypeScript NestJS + Next.js Monorepo)
- **Setup**: `cd bytebot && npm install`
- **Shared Lib**: `cd bytebot/packages/shared && npm run build` (build shared before other packages)
- **Backend (Agent)**: `cd bytebot/packages/bytebot-agent && npm run start:dev` (NestJS, port 9991)
- **Frontend (UI)**: `cd bytebot/packages/bytebot-ui && npm run dev` (Next.js, port 9992)
- **Desktop Service**: `cd bytebot/packages/bytebotd && npm run start:dev` (port 9990)
- **Database**: `cd bytebot/packages/bytebot-agent && npm run prisma:dev` (migrations + client)
- **LLM Proxy**: `cd bytebot/packages/bytebot-llm-proxy && python main.py` (port varies)
- **Test All**: `cd bytebot/packages/bytebot-agent && npm run test` (Jest, coverage to `../coverage/`)
- **Test Single File**: `cd bytebot/packages/bytebot-agent && npm run test -- --testPathPattern="**/specific-file.spec.ts"`
- **Test Watch**: `cd bytebot/packages/bytebot-agent && npm run test:watch`
- **Test Coverage**: `cd bytebot/packages/bytebot-agent && npm run test:cov`
- **Test Debug**: `cd bytebot/packages/bytebot-agent && npm run test:debug`
- **Test E2E**: `cd bytebot/packages/bytebot-agent && npm run test:e2e`
- **Lint**: `cd bytebot/packages/bytebot-agent && npm run lint` (ESLint with auto-fix)
- **Format**: `cd bytebot/packages/bytebot-agent && npm run format` (Prettier)
- **Build**: `cd bytebot/packages/bytebot-agent && npm run build` (compiles to `dist/`)

### Other Projects
- **Postiz-App**: `cd postiz-app && pnpm install && pnpm run dev`
- **Factif-AI**: `cd factif-ai && npm run install:all && npm start`
- **Agent-Manager**: `cd agent-manager && npm install && npm run dev`
- **Agent-Skills-System**: `cd agent-skills-system && npm install && npm run dev`

### General Commands
- **Python**: `uv sync && uv run pytest`, `uv run ruff check`
- **TypeScript**: `pnpm install && pnpm run lint && pnpm run test`
- **Go**: `go build ./... && golangci-lint run && go test -race ./...`
- **Docker**: `docker build .`, `docker-compose up`, `docker run --rm image:tag`

### Running Single Tests
- **Bytebot Agent (Jest)**: `cd bytebot/packages/bytebot-agent && npm run test -- --testPathPattern="**/tasks.service.spec.ts"`
- **Bytebot UI (Playwright)**: `cd bytebot/packages/bytebot-ui && npm run test:e2e`
- **Agent-Manager (Jest)**: `cd agent-manager && npm test -- src/__tests__/properties/terminal-workflow.property.test.ts`
- **Agent-Skills-System (Jest)**: `cd agent-skills-system && npm test -- src/__tests__/property-based.test.ts`
- **Postiz-App (Jest)**: `cd postiz-app && pnpm test -- --testPathPattern=path/to/test.spec.ts`

## Code Style Guidelines

### TypeScript (Primary - Bytebot & Agents)
- **Imports**: Group and sort (external, internal, relative), use absolute paths for shared packages: `@bytebot/shared`
- **Naming**: camelCase for variables/functions, PascalCase for classes/components, UPPER_SNAKE_CASE for constants
- **Types**: Strict mode enabled, explicit return types on exported functions, use interfaces for object shapes
- **Comments**: TSDoc style for exported APIs, inline comments for complex logic
- **Formatting**: Prettier with singleQuote, printWidth: 100, tabWidth: 2, semi: true
- **Error Handling**: try-catch with async/await, custom errors with context, class-validator/zod validation
- **Components**: React functional components with hooks, local CSS modules only, "use client" for interactivity
- **NestJS**: Decorators (@Controller, @Service), dependency injection, DTOs for validation, WebSocket gateways
- **File Organization**: Related files together, barrel files (index.ts) for clean exports
- **Testing**: Jest with ts-jest transformer, test files match `*.spec.ts`, coverage in `../coverage/` directory
- **Database**: Prisma ORM with PostgreSQL, migrations with `prisma:dev`, generated client types
- **AI Integration**: Support for Anthropic Claude, OpenAI GPT, Google Gemini, with unified proxy tools
- **WebSocket**: Socket.IO for real-time communication between services

### Next.js/React (Bytebot UI & Postiz-App)
- **Framework**: Next.js 15+ with App Router, TypeScript strict mode
- **Package Manager**: pnpm with workspaces for monorepo management
- **Styling**: Tailwind CSS v4, custom component variants with class-variance-authority, motion for animations
- **State Management**: Zustand for client state, server components where possible
- **API**: Direct API routes, comprehensive error handling, proxy middleware for backend communication
- **Testing**: Jest with coverage, Playwright for E2E tests
- **Database**: Prisma ORM with generated types and connection pooling
- **Electron**: Custom title bar, IPC communication, compact UI design (400x300 initial → expandable)
- **UI Components**: HugeIcons for icons, Radix UI primitives, custom hooks for state management

### Python (AIOS & macOS-use)
- **Formatting**: ruff with 130 char lines, single quotes, `ruff format .` before commits
- **Type Hints**: Required for all functions, use from `typing` module
- **Imports**: Group stdlib, third-party, local imports, sorted alphabetically, use `uv`
- **Docstrings**: Google style for public functions/modules
- **Error Handling**: Explicit try-except with specific exceptions, log errors with context
- **Naming**: snake_case for functions/variables, PascalCase for classes, UPPER_SNAKE_CASE for constants
- **Testing**: unittest framework with test discovery
- **Dependencies**: uv for package management, requirements.txt for CPU/GPU variants

### Electron (Desktop Applications)
- **Main Process**: Node.js with IPC communication, window management, service orchestration
- **Renderer Process**: Next.js static export, custom title bar, preload scripts for security
- **Build**: electron-builder with platform-specific distributables (dmg/nsis/AppImage)
- **Security**: Context isolation, no node integration in renderer, webSecurity enabled
- **UI**: Compact design (400x300 initial) expanding to full functionality, floating pill interface
- **Services**: Orchestrates multiple child processes (bytebotd, bytebot-agent, bytebot-ui) with port monitoring

## Project Rules

### Bytebot Electron (Main Desktop App)
- **Build Order**: Always build shared lib first, then backend, then frontend, then package with Electron
- **Database**: Use Prisma, run migrations with `npm run prisma:dev` (generates client), check `prisma/schema.prisma` for models
- **Monorepo**: Core packages in `bytebot/` directory: shared, bytebot-agent, bytebot-ui, bytebotd, bytebot-llm-proxy
- **Services**: bytebotd (desktop service, port 9990), bytebot-agent (NestJS backend, port 9991), bytebot-ui (Next.js frontend, port 9992)
- **Testing**: Jest with ts-jest transformer, test files match `*.spec.ts`, coverage in `../coverage/` directory
- **Architecture**: NestJS backend with modular structure, Next.js UI with Electron integration, floating pill interface
- **AI Providers**: Anthropic Claude, OpenAI GPT, Google Gemini, Groq, Ollama, Routeway, OpenCode integration
- **WebSocket**: Socket.IO for real-time task updates and computer use coordination

### Postiz-App Specific
- **Framework**: Next.js 14+ with App Router, pnpm workspaces monorepo
- **Services**: Multiple apps (frontend, backend, workers, cron, extension, sdk)
- **Database**: Prisma ORM with connection pooling
- **Testing**: Jest with coverage and JUnit reporting
- **Monorepo**: Managed by NX, with apps in `apps/` and shared code in `libraries/`

### General
- **Dependencies**: `uv` for Python, `pnpm` for Node.js monorepos, check packageManager field in package.json
- **Testing**: Jest for TypeScript (70-80% coverage target), unittest for Python, property-based testing encouraged
- **Commits**: Atomic commits, conventional commit messages (`feat:`, `fix:`, `docs:`), test before commit
- **Security**: No hardcoded secrets (use .env files), validate all inputs, use environment variables
- **Console**: Use logger.info/error/warn instead of console.log in production code

## Current Project Status & Recent Changes

### Recent Bytebot Updates (Last 20 Commits)
- **feat: refresh ui and add terminal/web support** - Latest UI improvements with terminal and web functionality
- **feat: spectacular logo redesign with BBH_Bartle font** - New branding and visual identity
- **fix: update task status filtering to use uppercase enum values** - Database enum consistency fixes
- **fix: models endpoint returning default models when proxy fails** - Improved error handling for AI models
- **fix: resolve ESLint warnings in React hooks** - Code quality improvements
- **fix: resolve TypeScript type errors in tasks page** - Type safety enhancements
- **feat: Add Electron desktop application with Floating Pill UI** - Major UI/UX overhaul
- **feat: Implement Floating Pill UI redesign** - Compact expandable interface
- **Add prisma dev dependency and update client to latest** - Database tooling updates

### Key Architecture Components
- **Electron Main Process**: Service orchestration, window management, IPC communication
- **Bytebotd (Port 9990)**: Desktop service with VNC, computer use tools, input tracking
- **Bytebot-Agent (Port 9991)**: NestJS backend with AI providers, task management, WebSocket gateway
- **Bytebot-UI (Port 9992)**: Next.js frontend with floating pill interface, expandable tabs
- **Shared Package**: Common TypeScript types and utilities across all services

## Copilot/Cursor Rules

### Bytebot Copilot Instructions

**Project Architecture:**
- Electron desktop app orchestrating multiple services: bytebotd (desktop service), bytebot-agent (NestJS backend), bytebot-ui (Next.js frontend)
- Monorepo with shared TypeScript packages: shared utilities and types
- Database: PostgreSQL with Prisma ORM
- AI Integration: Multiple providers (Anthropic Claude, OpenAI GPT, Google Gemini, Groq, Ollama, Routeway)
- Real-time communication: Socket.IO for WebSocket connections
- UI: Floating pill interface that expands to full functionality

**Developer Workflows:**
- Use Node.js 20+ and npm for main app, pnpm for individual packages
- Install dependencies: `npm install` (root), then `cd bytebot && npm install`
- Build shared first: `cd bytebot/packages/shared && npm run build`
- Run in development: `npm run dev` (starts all services)
- Test individual packages: `cd bytebot/packages/bytebot-agent && npm run test`
- Database: `cd bytebot/packages/bytebot-agent && npm run prisma:dev`
- Build for distribution: `npm run build && npm run dist`

**Conventions & Patterns:**
- Use conventional commits (`feat:`, `fix:`, `chore:`)
- TypeScript strict mode with explicit types
- React functional components with hooks
- NestJS with dependency injection and decorators
- Absolute imports for shared packages: `@bytebot/shared`
- Prettier formatting with single quotes, 100 char width
- ESLint with auto-fix enabled
- Test files: `*.spec.ts` pattern
- Environment variables in `.env` files, no hardcoded secrets

**AI Agent Guidelines:**
- Always check existing code before making changes
- Use the appropriate build/test commands for each project
- Follow TypeScript strict mode and explicit typing
- Prefer functional components with hooks in React
- Use proper error handling and logging patterns
- Check for existing utilities before implementing new ones

## Best Practices

### Code Quality
- Keep functions under 20 lines when possible, break down complex logic
- Use descriptive names that explain intent, avoid abbreviations
- Follow existing patterns in the codebase, consistency over creativity
- Security-first mindset: no eval/pickle, validate all inputs, sanitize user data

### Testing Guidelines
- Write tests before or alongside code (TDD encouraged)
- Test both success and failure scenarios
- Mock external dependencies appropriately
- Maintain test coverage above 80% for TypeScript projects
- Integration tests for critical user flows, unit tests for business logic

### AI Agent Guidelines
- Always check existing code before making changes
- Use the appropriate build/test commands for each project
- Follow TypeScript strict mode and explicit typing
- Prefer functional components with hooks in React
- Use proper error handling and logging patterns
- Check for existing utilities before implementing new ones
- Focus on Bytebot as the primary project with its Electron + NestJS + Next.js architecture
- When working on Bytebot, ensure shared package is built first before other packages
- Use the floating pill UI design patterns for new components
- Leverage the existing AI provider integrations (Anthropic, OpenAI, Google, etc.)
- Follow the established WebSocket patterns for real-time communication
