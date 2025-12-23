# AGENTS.md - Unified AI Ecosystem Development Guidelines

## Build/Lint/Test Commands

### AIOS (Python + Rust)
- **Install**: `uv pip install -r requirements.txt` (CPU) or `uv pip install -r requirements-cuda.txt` (GPU)
- **Test**: `python -m unittest discover tests/` or `python -m unittest tests.modules.llm.ollama.test_single`
- **Lint**: `ruff check . && ruff format .`
- **Run**: `python -m uvicorn runtime.launch:app --host 0.0.0.0 --port 8000`
- **Docker**: `docker build --target production .` or `docker build --target production-gpu .`

### bytebot (TypeScript Monorepo)
- **Install**: `pnpm install`
- **Test**: `pnpm run test` (Jest), `pnpm run test:e2e` (E2E)
- **Lint**: `pnpm run lint` (ESLint)
- **Build**: `pnpm run build` (NestJS + Next.js)
- **Dev**: `pnpm run start:dev` (NestJS), `pnpm run dev` (Next.js)
- **DB**: `pnpm run prisma:dev` (dev), `pnpm run prisma:prod` (prod)

### factif-ai (TypeScript Monorepo)
- **Install**: `npm run install:all`
- **Test**: `cd backend && npm run test` (Jest with coverage)
- **Lint**: `cd backend && npm run lint`, `cd frontend && npm run lint`
- **Build**: `npm run build` (Vite + TypeScript)
- **Dev**: `npm start` (concurrent frontend/backend)
- **Single Test**: `cd backend && npm run test -- path/to/test.spec.ts`

### agent-skills-system (TypeScript CLI)
- **Install**: `npm install`
- **Test**: `npm run test` (Jest), `npm run test:coverage`
- **Lint**: `npm run lint` (ESLint)
- **Build**: `npm run build` (TypeScript)
- **CLI**: `npm run cli` or `ts-node src/cli/index.ts`

### postiz-app (Complex Monorepo)
- **Install**: `pnpm install`
- **Test**: `pnpm run test` (Jest with coverage)
- **Lint**: ESLint configured per app
- **Build**: `pnpm run build` (multi-app)
- **Dev**: `pnpm run dev` (parallel apps)
- **DB**: `pnpm run prisma-generate`, `pnpm run prisma-db-push`

### macOS-use (Python)
- **Install**: `pip install -e .` or `uv pip install -e .`
- **Test**: `pytest` or `pytest tests/ -v -m "not slow"`
- **Lint**: `ruff check . && ruff format .`
- **Build**: `python -m build`

### General Commands
- **Python**: `uv sync && uv run pytest`, `uv run ruff check`, `uv run pytest path/to/test.py::TestClass::test_method`
- **JavaScript/TypeScript**: `pnpm install`, `pnpm run lint`, `pnpm run test`, `pnpm vitest run path/to/test.ts`
- **Go**: `go build ./...`, `golangci-lint run`, `go test -race ./...`, `go test -run TestName ./pkg/path`
- **Docker**: `docker build .`, `docker-compose up`, `docker run --rm image:tag`

## Code Style Guidelines

### Python
- Type hints required, Google docstrings, snake_case, `uv` for deps, no breaking API changes, ruff formatting (130 char lines, single quotes, tab indent)

### TypeScript
- TSDoc comments, camelCase, strict mode, local component styles only, use `pnpm` not `npm`

### Go
- gofmt/goimports, explicit error handling, table-driven tests, capitalize exported functions

### General
- Descriptive names, <20 line functions, follow existing patterns, security-first (no eval/pickle)

## Project Rules
- **Cursor Rules**: Use logger.info/error instead of console.log, TSDoc comments, avoid global styles, use pnpm/bun
- **MCP Servers**: Export functions if used as library, update toolsnaps for schema changes, run generate-docs
- **Environment Setup**: Use virtualenvs for Python, check .env.example files, Docker for complex services
- **Dependencies**: `uv` for Python, `pnpm` for Node.js monorepos, check packageManager fields
- **Testing**: Jest for TypeScript (80% coverage), pytest for Python, unittest for AIOS
- **Commits**: Atomic commits, conventional commit messages, comprehensive testing before commit
- **Security**: No hardcoded secrets, validate inputs, use environment variables</content>
<parameter name="filePath">/Users/albsheralsadi/future-app/AGENTS.md