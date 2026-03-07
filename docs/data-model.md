# Data Model

> 数据库 schema 详细说明。使用 Drizzle ORM 定义，PostgreSQL 存储。

## Tables

### world_templates
世界模板定义。包含完整的 YAML 配置（JSON 格式存储）。

### world_instances
世界实例。从模板实例化，拥有独立状态。

### world_events
世界事件记录。每个回合的对话、旁白、事件等。

### novels (v2)
生成的小说内容。

## Schema Definition

See `packages/db/src/schema.ts` for Drizzle ORM schema.

SQL reference in `docs/product-spec.md#9.2`.
