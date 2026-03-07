# Murmur — AI 自演化文字世界

## 项目概述
AI 多角色自动叙事平台，用户旁观 AI 角色自主对话和行动。
详见 @docs/product-spec.md

## 架构分层（严格执行）
Types → Config → DB → Service → Server → Web
每层只能依赖左侧的层。违反会被 CI 和自定义 lint 拦截。
详见 @docs/project-framework.md

## 关键约束
- 单文件 ≤ 300 行
- 禁止 console.log，使用 pino 结构化日志
- API 边界必须 zod 校验请求和响应
- service 层用 Result<T, E> 模式，不 throw
- 世界模板 YAML 必须通过 JSON Schema 校验
- 所有 LLM 响应必须用 zod 解析后再传递

## 目录结构
- packages/types/    — 纯类型定义，零运行时依赖（Layer 0）
- packages/config/   — 环境变量、常量、世界模板（Layer 1）
- packages/db/       — 数据库 schema、迁移、仓储（Layer 2）
- packages/service/  — 业务逻辑、Agent 编排引擎（Layer 3）
- packages/server/   — Fastify HTTP + WebSocket 运行时（Layer 4）
- packages/web/      — Next.js 前端，复古终端风格（Layer 5）

## 文档索引
- @docs/product-spec.md         — 产品需求
- @docs/project-framework.md    — 项目框架 & 护栏设计
- @docs/architecture.md         — 架构决策记录
- @docs/api-spec.md             — REST + WebSocket API 定义
- @docs/data-model.md           — 数据库 schema
- @docs/agent-system.md         — 导演/角色 Agent prompt 工程
- @docs/world-template-schema.md — 世界模板 YAML schema
- @docs/style-guide.md          — 前端视觉规范

## 常用命令
- pnpm install                 — 安装依赖
- pnpm dev                     — 启动本地开发（server + web 并行）
- pnpm lint                    — ESLint + 自定义规则
- pnpm typecheck               — TypeScript strict 类型检查
- pnpm test                    — 单元测试
- pnpm test:structural         — 架构合规测试
- pnpm db:migrate              — 数据库迁移
- pnpm db:seed                 — 导入预置世界模板
