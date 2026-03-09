# @murmur/config — 配置与常量（Layer 1）

## 本包职责
环境变量解析、全局常量定义、预置世界模板管理。

## 依赖规则
- 可以依赖：@murmur/types
- 不可依赖：@murmur/db, @murmur/service, @murmur/server, @murmur/web

## 规范
- 环境变量必须通过 zod schema 校验（env.ts）
- 常量统一在 constants.ts 中定义，不散落在业务代码中
- 世界模板 YAML 文件放在 src/templates/ 目录
- 模板 YAML 必须通过 JSON Schema 校验（参考 docs/world-template-schema.md）
