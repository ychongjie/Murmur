# Deployment Design

> Murmur 自动部署方案。基于 Render 平台 + GitHub Actions CI/CD。

## 1. 部署架构

```
                    GitHub (main branch)
                           │
                      push to main
                           │
                    ┌──────▼──────┐
                    │ GitHub Actions│
                    │ CI (质量门)   │
                    │ lint+type+test│
                    └──────┬──────┘
                           │ CI 通过后触发 Deploy Hooks
                ┌──────────┼──────────┐
                ▼          ▼          ▼
          ┌──────────┐ ┌────────┐ ┌──────────┐
          │  Render   │ │ Render │ │  Render   │
          │  Server   │ │  Web   │ │PostgreSQL │
          │ (Fastify) │ │(Next.js)│ │  (free)  │
          │  :3001    │ │ :3000  │ │          │
          └──────────┘ └────────┘ └──────────┘
```

## 2. Render 服务配置

### 2.1 服务清单

| 服务名 | 类型 | Plan | 用途 |
|--------|------|------|------|
| `murmur-server` | Web Service (Node) | Free | Fastify API + WebSocket |
| `murmur-web` | Web Service (Node) | Free | Next.js 前端 |
| `murmur-db` | PostgreSQL | Free | 数据持久化 |

### 2.2 构建与启动

**murmur-server:**
- Build: `pnpm install --frozen-lockfile && pnpm build`
- Pre-deploy: `pnpm db:migrate`（自动执行数据库迁移）
- Start: `node packages/server/dist/index.js`
- Health check: `GET /health`

**murmur-web:**
- Build: `pnpm install --frozen-lockfile && pnpm build`
- Start: `npx --prefix packages/web next start --port $PORT`
- Health check: `GET /`

### 2.3 环境变量

**murmur-server:**

| 变量 | 来源 | 说明 |
|------|------|------|
| `DATABASE_URL` | Render PostgreSQL (自动注入) | 数据库连接串 |
| `DEEPSEEK_API_KEY` | 手动配置 Secret | DeepSeek API 密钥 |
| `DEEPSEEK_BASE_URL` | 可选 | 默认 `https://api.deepseek.com` |
| `NODE_ENV` | `production` | 运行环境 |
| `PORT` | Render 自动注入 | 监听端口 |
| `LOG_LEVEL` | `info` | 日志级别 |

**murmur-web:**

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_API_URL` | 指向 murmur-server 的公网 URL |
| `NEXT_PUBLIC_WS_URL` | 指向 murmur-server 的 WebSocket URL |

## 3. CI/CD 流水线

### 3.1 流程

```
PR 提交 → CI (ci.yml)
  ├── typecheck
  ├── lint
  ├── structural tests
  ├── unit tests
  └── file size check
  → 全部通过 → 允许合并

合并到 main → Deploy (deploy.yml)
  ├── 安装依赖
  ├── 构建所有包
  ├── 触发 Render Deploy Hook (server)
  └── 触发 Render Deploy Hook (web)
  → Render 自动拉取最新代码 → 构建 → 部署
```

### 3.2 Deploy Hook 机制

Render 为每个服务提供 Deploy Hook URL，GitHub Actions 通过 `curl` 触发：

```bash
curl -X POST "$RENDER_DEPLOY_HOOK_SERVER"
curl -X POST "$RENDER_DEPLOY_HOOK_WEB"
```

Deploy Hook URL 存储为 GitHub Repository Secrets。

### 3.3 GitHub Secrets

| Secret 名 | 用途 |
|-----------|------|
| `RENDER_DEPLOY_HOOK_SERVER` | 触发 server 服务重新部署 |
| `RENDER_DEPLOY_HOOK_WEB` | 触发 web 服务重新部署 |

## 4. render.yaml (Infrastructure as Code)

使用 Render Blueprint (`render.yaml`) 声明式定义所有服务，支持一键创建整个基础设施。

详见仓库根目录 `render.yaml`。

## 5. 数据库迁移策略

- 迁移在 server 服务的 pre-deploy 命令中执行
- Drizzle ORM 的 `drizzle-kit push` 或自定义迁移脚本
- 迁移文件位于 `packages/db/src/migrations/`
- 回滚：手动编写逆向迁移 SQL

## 6. 健康检查

**Server (`/health`):**
```json
{ "status": "ok", "timestamp": "...", "uptime": 12345 }
```

Render 自动探测健康检查端点，不健康时自动重启。

## 7. 首次部署步骤

1. **创建 Render 账号** → 连接 GitHub 仓库
2. **方式 A（推荐）：Blueprint 一键部署**
   - 在 Render Dashboard 选择 "New Blueprint Instance"
   - 选择仓库，Render 读取 `render.yaml` 自动创建所有服务
3. **方式 B：手动创建**
   - 创建 PostgreSQL 数据库
   - 创建 Server Web Service（配置环境变量）
   - 创建 Web Web Service（配置环境变量）
4. **配置 Secrets**
   - Render Dashboard 获取 Deploy Hook URL
   - GitHub Settings → Secrets 添加 `RENDER_DEPLOY_HOOK_SERVER` / `RENDER_DEPLOY_HOOK_WEB`
   - Render Dashboard 配置 `DEEPSEEK_API_KEY`
5. **首次数据库初始化**
   - 部署后 server 自动执行 `pnpm db:migrate`
   - 手动或通过 Shell 执行 `pnpm db:seed` 导入预置模板

## 8. Render 免费版限制

| 限制 | 影响 | 应对 |
|------|------|------|
| 服务 15 分钟无请求后休眠 | 首次访问冷启动 ~30s | 可接受（MVP 阶段） |
| PostgreSQL 90 天后过期 | 需要手动续期或迁移 | 定期备份，到期前处理 |
| 750 小时/月免费时长 | 两个服务共用 | 足够 MVP 使用 |
| 无自定义域名（免费版） | 使用 .onrender.com 域名 | v2 升级付费版后配置自定义域名 |

## 9. 后续优化（v2+）

- [ ] 添加 Render 自定义域名
- [ ] 升级付费版消除冷启动
- [ ] 添加部署通知（Slack/Discord webhook）
- [ ] 添加回滚机制（Render 支持手动回滚到之前的部署）
- [ ] 添加 staging 环境
- [ ] 数据库自动备份
