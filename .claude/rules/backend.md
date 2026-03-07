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
