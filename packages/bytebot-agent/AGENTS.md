# bytebot-agent - NestJS API Server

## OVERVIEW

NestJS backend on port 9991. Handles task orchestration, AI model routing, and real-time WebSocket events.

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Task CRUD | `src/tasks/` |
| AI/Model routing | `src/ai/` or `src/llm/` |
| WebSocket gateway | `src/gateway/` |
| Prisma schema | `prisma/schema.prisma` |
| DTOs | `src/tasks/dto/` |

## CONVENTIONS

- **DTOs**: Use `class-validator` decorators (`@IsString()`, `@IsOptional()`)
- **Services**: Dependency injection via constructor
- **Controllers**: `@Controller()` with route prefixes
- **WebSocket**: `@WebSocketGateway()` with Socket.IO

## ANTI-PATTERNS

- ❌ NO bare `console.log` - use `this.logger`
- ❌ NO `any` types - define interfaces
- ❌ NO sync DB queries in controllers
