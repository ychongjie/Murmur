# @murmur/server — HTTP + WebSocket 运行时（Layer 4）

## 本包职责
Fastify HTTP 服务和 WebSocket 连接管理。是系统的运行时入口。

## 依赖规则
- 可以依赖：@murmur/types, @murmur/config, @murmur/db, @murmur/service
- 不可依赖：@murmur/web

## 规范
- 路由文件以 .routes.ts 结尾
- 所有路由入口用 zod 校验 request body/params/query
- 错误处理：在 error-handler 中间件统一转 HTTP 响应
- WebSocket 消息必须是 @murmur/types 中定义的类型
- 使用 pino 结构化日志（Fastify 内置）
