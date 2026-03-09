# Architecture Decision Records

> 架构决策记录，记录关键技术选型和设计决策的原因。

## ADR-001: Monorepo with pnpm + Turborepo

**Status:** Accepted

**Context:** Need a way to manage multiple packages (types, config, db, service, server, web) with shared dependencies and build orchestration.

**Decision:** Use pnpm workspaces + Turborepo for monorepo management.

**Rationale:**
- pnpm: Fast, disk-efficient, strict dependency resolution
- Turborepo: Build caching, parallel execution, dependency-aware task ordering
- Alternative considered: Nx (heavier, more features than needed for MVP)

## ADR-002: Strict dependency layering

**Status:** Accepted

**Context:** Need to prevent circular dependencies and maintain clean architecture boundaries, especially important for AI-assisted development.

**Decision:** Types(0) → Config(1) → DB(2) → Service(3) → Server(4) → Web(5), enforced by structural tests and Claude Code hooks.

**Rationale:** See docs/project-framework.md#3

## ADR-003: Fastify over Express

**Status:** Accepted

**Context:** Need a Node.js HTTP framework with good WebSocket support and TypeScript types.

**Decision:** Fastify 5.x with @fastify/websocket plugin.

**Rationale:**
- Better performance than Express
- First-class TypeScript support
- Plugin-based architecture aligns with our modular design
- Built-in schema validation (can integrate with zod)
