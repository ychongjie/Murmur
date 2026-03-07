# @murmur/service — 业务逻辑层（Layer 3）

## 本包职责
业务逻辑层，包含 Agent 编排引擎、世界时钟、回合推进。

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
