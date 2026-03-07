# Murmur 项目初始框架设计

> 本文档结合 [Murmur 产品规划](./product-spec.md) 与 [OpenAI Harness Engineering](https://openai.com/index/harness-engineering/) 实践，定义项目的目录结构、依赖分层、质量护栏、文档体系和 CI 流水线。
>
> 核心理念：**人类设计架构和护栏，AI Agent 在护栏内高速产出代码。**

---

## 1. Harness Engineering 核心原则在 Murmur 中的映射

| Harness Engineering 原则 | Murmur 中的落地 |
|---|---|
| **依赖分层（Dependency Layering）** | Types → Config → DB/Repo → Service → Runtime → UI 严格单向依赖 |
| **结构化测试 & 品味不变量（Structural Tests & Taste Invariants）** | 自定义 lint 规则 + 架构合规测试，错误信息内嵌修复指引 |
| **强制不变量而非实现（Enforce Invariants, Not Implementations）** | 规定"边界处解析数据"等原则，不规定具体写法 |
| **CLAUDE.md 即目录（Context File as Table of Contents）** | 根目录 CLAUDE.md 约 100 行指向 docs/，各 package 下放子目录 CLAUDE.md 按需加载 |
| **黄金原则 & 垃圾回收（Golden Principles & Garbage Collection）** | 编码规范机械化执行 + 定期清理 Agent 自动修复代码异味 |
| **可观测运行时（Observable Runtime）** | 结构化日志 + WebSocket 事件追踪 + Agent 调用链路追踪 |

---

## 2. 仓库目录结构

```
murmur/
├── CLAUDE.md                      # Claude Code 上下文入口（~100 行，目录式）
├── CLAUDE.local.md                # 本地个人偏好（自动 gitignore）
├── package.json                   # monorepo root
├── pnpm-workspace.yaml
├── turbo.json                     # Turborepo 构建编排
├── tsconfig.base.json             # 共享 TypeScript 配置
├── .claude/
│   ├── settings.json              # 项目级 Claude Code 配置（权限、hooks）
│   ├── settings.local.json        # 本地配置覆盖（gitignore）
│   └── rules/                     # 路径匹配规则（按需加载）
│       ├── backend.md             # 后端代码规则（匹配 packages/server/**）
│       ├── frontend.md            # 前端代码规则（匹配 packages/web/**）
│       └── agent-system.md        # Agent 系统规则（匹配 packages/service/src/agent/**）
├── .github/
│   └── workflows/
│       ├── ci.yml                 # PR 级 CI：lint + typecheck + test + structural
│       └── deploy.yml             # main 合并后自动部署到 Render
│
├── docs/                          # 知识库（Agent 和人类共用的 source of truth）
│   ├── product-spec.md            # 产品需求文档
│   ├── project-framework.md       # 本文档
│   ├── architecture.md            # 架构决策记录（ADR 风格）
│   ├── api-spec.md                # REST + WebSocket API 定义
│   ├── data-model.md              # 数据库 schema 详细说明
│   ├── agent-system.md            # 导演/角色 Agent 的 prompt 工程指南
│   ├── world-template-schema.md   # 世界模板 YAML schema 定义
│   └── style-guide.md             # 前端视觉规范（颜色、字体、组件）
│
├── packages/
│   ├── types/                     # Layer 0: 纯类型定义，零运行时依赖
│   │   ├── CLAUDE.md              # 子目录上下文：类型定义规范（按需加载）
│   │   ├── src/
│   │   │   ├── world.ts           # WorldTemplate, WorldInstance, WorldEvent
│   │   │   ├── agent.ts           # DirectorDecision, CharacterMessage
│   │   │   ├── observer.ts        # ObserverSession, SpeedSetting
│   │   │   ├── novel.ts           # NovelStyle, NovelOutput
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── config/                    # Layer 1: 配置 & 常量，仅依赖 types
│   │   ├── src/
│   │   │   ├── env.ts             # 环境变量解析（zod schema 校验）
│   │   │   ├── constants.ts       # 回合间隔、心跳超时等常量
│   │   │   ├── templates/         # 预置世界模板（YAML → 运行时加载）
│   │   │   │   └── midnight-tavern.yaml
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── db/                        # Layer 2: 数据访问层，依赖 types + config
│   │   ├── CLAUDE.md              # 子目录上下文：数据库规范（按需加载）
│   │   ├── src/
│   │   │   ├── client.ts          # PostgreSQL 连接（pg / drizzle-orm）
│   │   │   ├── schema.ts          # 数据库 schema 定义
│   │   │   ├── migrations/        # SQL 迁移文件
│   │   │   ├── repos/
│   │   │   │   ├── template.repo.ts
│   │   │   │   ├── instance.repo.ts
│   │   │   │   └── event.repo.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── service/                   # Layer 3: 业务逻辑，依赖 types + config + db
│   │   ├── CLAUDE.md              # 子目录上下文：业务层 & Agent 编排规范（按需加载）
│   │   ├── src/
│   │   │   ├── agent/
│   │   │   │   ├── director.ts    # 导演 Agent 逻辑
│   │   │   │   ├── character.ts   # 角色 Agent 逻辑
│   │   │   │   ├── prompt-builder.ts  # prompt 模板构建
│   │   │   │   └── llm-client.ts  # DeepSeek API 封装
│   │   │   ├── world/
│   │   │   │   ├── world-clock.ts    # 世界时钟调度器
│   │   │   │   ├── turn-runner.ts    # 回合推进引擎
│   │   │   │   ├── instance-manager.ts  # 实例生命周期管理
│   │   │   │   └── observer-tracker.ts  # 观察者计数 & 触发/冻结
│   │   │   ├── novel/
│   │   │   │   └── novel-generator.ts   # 小说生成（v2）
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── server/                    # Layer 4: 运行时入口，依赖 types + config + db + service
│   │   ├── CLAUDE.md              # 子目录上下文：路由 & WebSocket 规范（按需加载）
│   │   ├── src/
│   │   │   ├── app.ts             # Fastify 应用初始化
│   │   │   ├── routes/
│   │   │   │   ├── template.routes.ts
│   │   │   │   ├── instance.routes.ts
│   │   │   │   └── novel.routes.ts
│   │   │   ├── ws/
│   │   │   │   ├── handler.ts     # WebSocket 连接管理
│   │   │   │   └── heartbeat.ts   # 心跳检测
│   │   │   ├── middleware/
│   │   │   │   └── error-handler.ts
│   │   │   └── index.ts           # 启动入口
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                       # Layer 5: 前端 UI，依赖 types
│       ├── CLAUDE.md              # 子目录上下文：前端组件 & 样式规范（按需加载）
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx            # 首页（世界列表）
│       │   │   └── world/
│       │   │       └── [id]/
│       │   │           └── page.tsx     # 世界观看页
│       │   ├── components/
│       │   │   ├── WorldCard.tsx
│       │   │   ├── ChatStream.tsx       # 对话流（打字机效果）
│       │   │   ├── CharacterPanel.tsx   # 角色信息面板
│       │   │   ├── SpeedControl.tsx     # 速度控制条
│       │   │   └── Terminal.tsx         # 复古终端容器
│       │   ├── hooks/
│       │   │   ├── useWorldSocket.ts    # WebSocket 连接管理
│       │   │   └── useTypewriter.ts     # 打字机动画
│       │   ├── styles/
│       │   │   └── terminal.css         # 复古终端主题样式
│       │   └── lib/
│       │       └── api.ts               # REST API 客户端
│       ├── public/
│       ├── next.config.js               # Next.js 配置
│       ├── tailwind.config.js
│       ├── package.json
│       └── tsconfig.json
│
├── tools/                         # 自定义护栏工具
│   ├── lint-rules/
│   │   ├── no-cross-layer-import.ts     # 禁止跨层反向依赖
│   │   ├── enforce-structured-log.ts    # 强制结构化日志
│   │   ├── enforce-boundary-parsing.ts  # 边界处 zod 校验
│   │   └── enforce-file-size-limit.ts   # 单文件不超过 300 行
│   └── structural-tests/
│       ├── dependency-direction.test.ts # 依赖方向合规校验
│       ├── naming-conventions.test.ts   # 命名规范检查
│       └── layer-isolation.test.ts      # 层间隔离验证
│
└── scripts/
    ├── seed-templates.ts          # 初始化预置世界模板
    ├── dev.sh                     # 本地开发启动脚本
    └── cleanup.ts                 # 代码清理（Golden Principles 检查）
```

---

## 3. 依赖分层规则

Murmur 采用严格的单向依赖分层，与 harness engineering 的 Dependency Layering 对齐：

```
Layer 0       Layer 1       Layer 2       Layer 3        Layer 4        Layer 5
 types    →    config    →     db     →   service    →    server    →     web
  │              │             │            │               │              │
  │  纯类型      │  环境变量    │  数据访问   │  业务逻辑     │  HTTP/WS     │  UI
  │  零依赖      │  常量       │  schema    │  Agent 编排   │  路由        │  组件
  │              │  模板定义    │  迁移      │  世界时钟     │  中间件      │  hooks
```

### 依赖规则（机械化强制执行）

1. **单向流动** — 每一层只能依赖其左侧的层，禁止反向或跳层依赖
2. **types 是公共语言** — 所有层都可以导入 `@murmur/types`
3. **web 只依赖 types** — 前端通过 HTTP/WebSocket 与后端通信，不直接依赖后端代码
4. **跨切面关注点通过 Providers 注入** — 日志、配置、数据库连接等通过依赖注入传递，不通过直接导入

### 自定义 Lint 规则示例

```typescript
// tools/lint-rules/no-cross-layer-import.ts
//
// 当 Agent 违反依赖方向时，错误信息直接告诉它怎么修：
//
// ERROR: @murmur/service 不能导入 @murmur/server
//
// 修复方法：
//   service 层是业务逻辑层（Layer 3），不能依赖 server 层（Layer 4）。
//   如果你需要 HTTP 相关的类型，请在 @murmur/types 中定义。
//   如果你需要请求上下文，请通过函数参数传入而非直接导入。
//
// 参考文档：docs/project-framework.md#3-依赖分层规则

const LAYER_ORDER = [
  '@murmur/types',    // Layer 0
  '@murmur/config',   // Layer 1
  '@murmur/db',       // Layer 2
  '@murmur/service',  // Layer 3
  '@murmur/server',   // Layer 4
  '@murmur/web',      // Layer 5
];
```

---

## 4. 结构化测试 & 品味不变量

### 4.1 结构化测试（Structural Tests）

这些测试不验证业务逻辑，而是验证**架构本身**的完整性：

```typescript
// tools/structural-tests/dependency-direction.test.ts

describe('依赖方向合规', () => {
  it('service 层不应依赖 server 层', () => {
    const serviceImports = getAllImports('packages/service/');
    expect(serviceImports).not.toContainPackage('@murmur/server');
    expect(serviceImports).not.toContainPackage('@murmur/web');
  });

  it('types 层不应有任何内部包依赖', () => {
    const typeImports = getAllImports('packages/types/');
    const internalDeps = typeImports.filter(i => i.startsWith('@murmur/'));
    expect(internalDeps).toEqual([]);
  });

  it('web 层只能依赖 types', () => {
    const webImports = getAllImports('packages/web/');
    const internalDeps = webImports.filter(i => i.startsWith('@murmur/'));
    expect(internalDeps.every(d => d === '@murmur/types')).toBe(true);
  });
});
```

```typescript
// tools/structural-tests/naming-conventions.test.ts

describe('命名规范', () => {
  it('repo 文件以 .repo.ts 结尾', () => {
    const repoFiles = glob('packages/db/src/repos/*.ts');
    repoFiles.filter(f => f !== 'index.ts')
      .forEach(f => expect(f).toMatch(/\.repo\.ts$/));
  });

  it('路由文件以 .routes.ts 结尾', () => {
    const routeFiles = glob('packages/server/src/routes/*.ts');
    routeFiles.filter(f => f !== 'index.ts')
      .forEach(f => expect(f).toMatch(/\.routes\.ts$/));
  });

  it('组件文件使用 PascalCase', () => {
    const componentFiles = glob('packages/web/src/components/*.tsx');
    componentFiles.forEach(f => expect(basename(f)).toMatch(/^[A-Z]/));
  });
});
```

### 4.2 品味不变量（Taste Invariants）

| 不变量 | 规则 | 强制方式 |
|--------|------|---------|
| 结构化日志 | 禁止 `console.log`，必须使用 `logger.info({ event, ... })` | ESLint 自定义规则 |
| 边界解析 | API 路由入口必须用 zod 校验请求体 | ESLint 自定义规则 |
| 文件大小 | 单个 `.ts/.tsx` 文件不超过 300 行 | CI 脚本检查 |
| 类型导出 | `@murmur/types` 中的类型必须从 `index.ts` 统一导出 | 结构化测试 |
| 错误处理 | service 层函数返回 `Result<T, E>` 模式，不直接 throw | ESLint 自定义规则 |
| 世界模板 | YAML 模板必须通过 JSON Schema 校验 | CI 脚本 + 预提交钩子 |
| 命名一致性 | 数据库字段 snake_case，TypeScript 属性 camelCase | ESLint + 结构化测试 |

---

## 5. CLAUDE.md 体系设计

遵循 harness engineering 的核心实践，适配 Claude Code 的多层级上下文机制：**根目录 CLAUDE.md 是目录，子目录 CLAUDE.md 按需加载，`.claude/rules/` 做路径匹配规则。**

### 5.1 上下文加载机制

Claude Code 的上下文文件按以下优先级和时机加载：

```
会话启动时立即加载：
  1. ~/.claude/CLAUDE.md              — 用户全局偏好
  2. /CLAUDE.md（根目录）              — 项目级指引（~100 行）
  3. .claude/rules/*.md（无 paths）    — 全局规则（无条件加载）

按需懒加载（Claude 访问对应目录时）：
  4. packages/*/CLAUDE.md              — 子目录上下文（Claude 读取该目录文件时触发）
  5. .claude/rules/*.md（有 paths）    — 路径匹配规则（Claude 操作匹配路径时触发）

不提交到 Git：
  6. CLAUDE.local.md                   — 个人本地偏好
  7. .claude/settings.local.json       — 本地配置覆盖
```

### 5.2 根目录 CLAUDE.md（~100 行）

```markdown
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
```

> **注意 `@` 语法：** Claude Code 支持 `@path/to/file` 导入，Claude 在需要时会自动读取引用的文件，最大 5 层递归。这实现了渐进式披露——根目录 CLAUDE.md 只做目录，详细内容按需加载。

### 5.3 子目录 CLAUDE.md 示例

每个 package 下的 CLAUDE.md 在 Claude 访问该目录时**懒加载**，提供包级别的上下文：

```markdown
# packages/service/CLAUDE.md

## 本包职责
业务逻辑层（Layer 3），包含 Agent 编排引擎、世界时钟、回合推进。

## 依赖规则
- 可以依赖：@murmur/types, @murmur/config, @murmur/db
- 不可依赖：@murmur/server, @murmur/web

## Agent 编排约定
- 导演 Agent 和角色 Agent 的 prompt 模板在 agent/prompt-builder.ts 中集中管理
- 所有 LLM 调用必须通过 agent/llm-client.ts，不直接调用 DeepSeek API
- LLM 响应必须用 zod 解析，解析失败返回 Result.err() 而非 throw
- 每次 LLM 调用自动记录 token 消耗和延迟

## 错误处理
- 所有公开函数返回 Result<T, Error> 类型
- 禁止使用 try/catch + throw 模式
- 错误类型定义在 @murmur/types 中
```

### 5.4 `.claude/rules/` 路径匹配规则

路径匹配规则仅在 Claude 操作匹配路径的文件时加载，避免上下文膨胀：

```markdown
# .claude/rules/backend.md
---
paths:
  - "packages/server/**/*.ts"
  - "packages/service/**/*.ts"
  - "packages/db/**/*.ts"
---
# 后端代码规则
- 使用 pino 结构化日志，禁止 console.log
- 数据库字段使用 snake_case
- TypeScript 属性使用 camelCase
- API 路由入口必须用 zod 校验 request body/params/query
- 错误处理：service 层返回 Result<T, E>，server 层的 error-handler 统一转 HTTP 响应
```

```markdown
# .claude/rules/frontend.md
---
paths:
  - "packages/web/**/*.{ts,tsx,css}"
---
# 前端代码规则
- 组件文件使用 PascalCase，每个文件只导出一个组件
- 样式通过 Tailwind 类名，不使用 inline style 对象
- 复古终端主题变量定义在 terminal.css，通过 CSS 变量引用
- 状态管理优先 useState/useReducer，跨组件共享用 Context
- 禁止引入额外状态管理库（v1 阶段）
```

```markdown
# .claude/rules/agent-system.md
---
paths:
  - "packages/service/src/agent/**/*.ts"
  - "packages/config/src/templates/**/*.yaml"
---
# Agent 系统规则
- 导演 prompt 和角色 prompt 的构建逻辑分离在不同函数中
- 世界模板 YAML 必须通过 docs/world-template-schema.md 中定义的 JSON Schema 校验
- temperature 参数：导演 0.9，角色 0.95
- 导演输出必须是 JSON 格式，用 zod 解析为 DirectorDecision 类型
- 角色对话限制 1-3 句，在 prompt 中明确约束
```

---

## 6. CI/CD 流水线

### 6.1 PR 级 CI（每次提交触发）

```yaml
# .github/workflows/ci.yml
name: CI
on: [pull_request]

jobs:
  quality-gates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      # Gate 1: 类型安全
      - name: Typecheck
        run: pnpm typecheck

      # Gate 2: 代码风格 & 自定义 lint 规则
      - name: Lint
        run: pnpm lint

      # Gate 3: 架构合规（结构化测试）
      - name: Structural Tests
        run: pnpm test:structural

      # Gate 4: 单元测试
      - name: Unit Tests
        run: pnpm test

      # Gate 5: 世界模板 schema 校验
      - name: Validate Templates
        run: pnpm validate:templates

      # Gate 6: 文件大小检查
      - name: File Size Check
        run: |
          find packages -name '*.ts' -o -name '*.tsx' | while read f; do
            lines=$(wc -l < "$f")
            if [ "$lines" -gt 300 ]; then
              echo "ERROR: $f has $lines lines (limit: 300)"
              echo "修复方法：将文件拆分为更小的模块。参考 docs/project-framework.md#4"
              exit 1
            fi
          done
```

### 6.2 CI 设计原则（对齐 Harness Engineering）

| 原则 | 实践 |
|------|------|
| **最小阻塞合并门** | 仅 typecheck + lint + structural + unit test 阻塞合并 |
| **短生命周期 PR** | 鼓励小而频繁的 PR，纠正成本低于等待成本 |
| **错误信息即修复指引** | 所有自定义 lint 和 structural test 的错误消息包含修复方法和文档链接 |
| **测试抖动不阻塞** | flaky test 标记后允许重跑，不阻塞流水线 |

---

## 7. Claude Code Hooks（质量护栏自动化）

Claude Code 的 hooks 机制在工具调用的生命周期中注入自动检查，实现 harness engineering 的"系统自动纠偏"理念。

### 7.1 项目级 hooks 配置

```jsonc
// .claude/settings.json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "type": "command",
        "command": "node tools/hooks/check-layer-violation.js"
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "type": "command",
        "command": "node tools/hooks/post-write-check.js"
      }
    ],
    "Stop": [
      {
        "type": "command",
        "command": "node tools/hooks/on-stop-validate.js"
      }
    ]
  }
}
```

### 7.2 Hook 用途设计

| Hook 事件 | 用途 | 实现 |
|-----------|------|------|
| **PreToolUse (Write\|Edit)** | 阻止跨层依赖的文件写入 | 解析目标文件路径和 import，检查是否违反依赖分层规则。违反时 exit 2 + 错误信息反馈给 Claude |
| **PostToolUse (Write\|Edit)** | 写入后自动校验 | 对修改的文件运行 ESLint 单文件检查 + 文件行数检查，发现问题立即反馈 |
| **PostToolUse (Bash)** | 捕获测试失败 | 当 Bash 执行测试命令后，解析输出中的失败信息，结构化反馈给 Claude |
| **Stop** | 完成前最终检查 | Claude 准备结束时，运行 typecheck + lint 确认无遗留问题。若有问题 exit 2 强制 Claude 继续修复 |

### 7.3 PreToolUse Hook 示例（依赖分层守卫）

```javascript
// tools/hooks/check-layer-violation.js
// 从 stdin 读取 Claude Code 传入的 JSON（包含工具名、参数等）
// 检查写入目标文件的 import 是否违反依赖方向
// exit 0 = 允许写入，exit 2 = 阻止并反馈错误

const input = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));
const filePath = input.tool_input?.file_path;

if (!filePath) process.exit(0);

const LAYERS = {
  'packages/types/':   0,
  'packages/config/':  1,
  'packages/db/':      2,
  'packages/service/': 3,
  'packages/server/':  4,
  'packages/web/':     5,
};

// 解析文件所在层级
const fileLayer = Object.entries(LAYERS)
  .find(([prefix]) => filePath.includes(prefix));

if (!fileLayer) process.exit(0);  // 非 packages 文件，放行

// 检查新内容中的 @murmur/ import
const content = input.tool_input?.new_string || input.tool_input?.content || '';
const imports = content.match(/@murmur\/\w+/g) || [];

for (const imp of imports) {
  const pkg = imp.replace('@murmur/', '');
  const importLayer = LAYERS[`packages/${pkg}/`];
  if (importLayer !== undefined && importLayer >= fileLayer[1] && pkg !== 'types') {
    process.stderr.write(
      `依赖方向违规：${fileLayer[0]} (Layer ${fileLayer[1]}) 不能导入 ${imp} (Layer ${importLayer})。\n` +
      `修复：将需要的类型移到 @murmur/types，或通过函数参数注入。\n` +
      `参考：docs/project-framework.md#3-依赖分层规则\n`
    );
    process.exit(2);
  }
}

process.exit(0);
```

### 7.4 Hooks vs CI 的分工

```
开发时（实时反馈）：
  Claude Code Hooks → PreToolUse / PostToolUse
  ↳ 在 Claude 写代码的瞬间拦截违规，零延迟反馈
  ↳ 覆盖：依赖分层、文件大小、基础 lint

提交时（全面校验）：
  CI Pipeline → GitHub Actions
  ↳ 完整的 typecheck + lint + structural tests + unit tests
  ↳ 覆盖：跨包类型一致性、集成测试、模板 schema 校验
```

---

## 8. 黄金原则（Golden Principles）

以下原则被机械化执行，确保 Agent 产出的代码始终一致：

### 8.1 后端原则

```
GP-01: 数据在边界处解析
  → 所有 API 路由入口用 zod 校验 request body / params / query
  → 所有 LLM 响应用 zod 解析后再传递给业务层
  → 强制方式：ESLint 规则 enforce-boundary-parsing

GP-02: 错误用类型表达，不用异常
  → service 层函数返回 Result<T, Error> 而非 throw
  → 只有 server 层的 error-handler 中间件可以 catch 并转 HTTP 响应
  → 强制方式：ESLint 规则 no-throw-in-service

GP-03: 结构化日志
  → 使用 pino logger，每条日志必须包含 { event, instanceId?, ... }
  → 禁止 console.log / console.error
  → 强制方式：ESLint no-console + 自定义规则

GP-04: Agent 调用必须可追踪
  → 每次 LLM 调用记录 { model, prompt_tokens, completion_tokens, latency_ms, turn }
  → 用于成本监控和调试
  → 强制方式：llm-client.ts 内置追踪，code review 检查

GP-05: WebSocket 消息类型安全
  → 所有 WS 消息必须是 @murmur/types 中定义的联合类型
  → 收发两端共用同一套类型定义
  → 强制方式：TypeScript 编译 + 结构化测试
```

### 8.2 前端原则

```
GP-06: 组件单一职责
  → 每个组件文件只导出一个组件
  → 组件超过 150 行必须拆分
  → 强制方式：ESLint 规则 + 文件大小检查

GP-07: 样式通过 Tailwind 类名
  → 不使用 inline style 对象
  → 复古终端主题变量定义在 terminal.css 中，通过 CSS 变量引用
  → 强制方式：ESLint 规则

GP-08: 状态管理最小化
  → 优先使用 React 内置状态（useState, useReducer）
  → 只有跨组件共享的状态才提升到 Context
  → 禁止引入额外状态管理库（v1 阶段）
  → 强制方式：依赖审查
```

### 8.3 垃圾回收流程

```
定期执行 scripts/cleanup.ts：
  1. 扫描所有文件，检查 Golden Principles 合规性
  2. 检测未使用的导出（dead exports）
  3. 检测重复的类型定义
  4. 检测超大文件
  5. 输出违规报告 → 生成修复 PR
```

---

## 9. 可观测性设计

### 9.1 结构化日志（对齐 GP-03）

```typescript
// 日志格式示例
logger.info({
  event: 'turn_completed',
  instanceId: 'uuid-xxx',
  turn: 47,
  decisionType: 'character_turn',
  speaker: 'laozhang',
  promptTokens: 1200,
  completionTokens: 85,
  latencyMs: 1340,
  observerCount: 12
});
```

### 9.2 关键指标追踪

| 指标 | 来源 | 用途 |
|------|------|------|
| 回合延迟（p50/p95） | server 日志 | 体验监控 |
| LLM token 消耗/回合 | llm-client 日志 | 成本控制 |
| 活跃世界实例数 | observer-tracker | 容量规划 |
| WebSocket 连接数 | ws handler | 负载监控 |
| 导演决策类型分布 | turn-runner 日志 | 叙事质量评估 |
| 角色"出戏"率 | 输出后处理检测 | prompt 质量迭代 |

---

## 10. 技术栈确认（v1 MVP）

| 组件 | 选型 | 版本 |
|------|------|------|
| 运行时 | Node.js | 20 LTS |
| 包管理 | pnpm | 9.x |
| Monorepo | Turborepo | latest |
| 语言 | TypeScript | 5.x（strict mode） |
| 后端框架 | Fastify | 5.x |
| WebSocket | @fastify/websocket (ws) | latest |
| 数据库 | PostgreSQL | 16 |
| ORM | Drizzle ORM | latest |
| 校验 | Zod | 3.x |
| 日志 | Pino | 9.x |
| 前端框架 | Next.js (React) | 15.x |
| 样式 | Tailwind CSS | 4.x |
| 测试 | Vitest | latest |
| Lint | ESLint | 9.x（flat config） |
| AI 模型 | DeepSeek V3 API | — |
| 部署 | Render | 免费版 |

---

## 11. 开发工作流

### 11.1 Agent-First 开发循环

```
1. 人类工程师定义任务（GitHub Issue / 自然语言描述）
       ↓
2. Claude Code 启动 → 自动加载根目录 CLAUDE.md → 理解架构分层和约束
       ↓
3. Claude 访问具体 package → 懒加载子目录 CLAUDE.md + .claude/rules/ 匹配规则
       ↓
4. Claude 在正确的 package 和 layer 中编写代码
       ↓
5. PreToolUse hooks 实时拦截违规 → PostToolUse hooks 写入后校验
       ↓
6. Stop hook 最终检查 → 确认无遗留 lint / typecheck 问题
       ↓
7. 提交 PR → CI 运行全部质量门
       ↓
8. 人类工程师 review → 关注架构合理性而非代码细节
       ↓
9. 合并 → 自动部署
```

### 11.2 本地开发命令

```bash
# 首次设置
pnpm install
pnpm db:migrate

# 日常开发
pnpm dev              # 同时启动 server + web（turbo 并行）

# Claude Code 开发（推荐）
claude                # 启动 Claude Code，自动加载 CLAUDE.md 和 hooks
                      # PreToolUse hooks 实时拦截违规
                      # Stop hook 完成前自动校验

# 质量检查（手动 / CI）
pnpm lint             # ESLint + 自定义规则
pnpm typecheck        # TypeScript 严格模式
pnpm test             # 单元测试
pnpm test:structural  # 架构合规测试

# 数据库
pnpm db:migrate       # 执行迁移
pnpm db:seed          # 导入预置世界模板
```

---

## 12. v1 MVP 实施顺序

基于 harness engineering 的深度优先（depth-first）策略，先搭建基础构建块，再组合出完整功能：

### Phase 0: 脚手架（Day 1-2）

```
- [ ] monorepo 初始化（pnpm + turbo + tsconfig）
- [ ] 6 个 package 骨架创建
- [ ] ESLint flat config + 自定义 lint 规则
- [ ] 结构化测试框架
- [ ] CI 流水线
- [ ] CLAUDE.md（根目录 + 各 package 子目录）
- [ ] .claude/settings.json（hooks 配置）+ .claude/rules/（路径匹配规则）
- [ ] docs/ 文档骨架
```

### Phase 1: 类型 & 数据层（Day 3-4）

```
- [ ] @murmur/types 完整类型定义
- [ ] @murmur/config 环境变量 + 常量 + 深夜酒馆模板
- [ ] @murmur/db schema + migration + repos
- [ ] 种子数据脚本
```

### Phase 2: Agent 引擎（Day 5-7）

```
- [ ] DeepSeek API 客户端（含追踪）
- [ ] 导演 Agent（prompt 构建 + 输出解析）
- [ ] 角色 Agent（prompt 构建 + 对话生成）
- [ ] 回合推进引擎（turn-runner）
- [ ] Agent 引擎单元测试
```

### Phase 3: 实时运行时（Day 8-10）

```
- [ ] Fastify 应用 + REST 路由
- [ ] WebSocket 连接管理 + 心跳
- [ ] 观察者计数 + 世界触发/冻结
- [ ] 世界时钟调度器
- [ ] 集成测试（创建实例 → 推进回合 → WebSocket 推送）
```

### Phase 4: 前端（Day 11-14）

```
- [ ] Next.js 项目 + 复古终端主题
- [ ] 首页（世界列表 + 创建新世界）
- [ ] 世界观看页（对话流 + 打字机效果）
- [ ] WebSocket 实时接收 + 历史回看
- [ ] 角色信息面板
- [ ] 速度控制（基础版）
- [ ] 部署到 Render
```

---

## 参考资料

- [OpenAI: Harness Engineering](https://openai.com/index/harness-engineering/) — 核心方法论来源
- [OpenAI: Unlocking the Codex Harness](https://openai.com/index/unlocking-the-codex-harness/) — App Server 实现细节
- [Martin Fowler: Harness Engineering](https://martinfowler.com/articles/exploring-gen-ai/harness-engineering.html) — 独立分析
- [Murmur 产品规划](./product-spec.md) — 产品需求文档
