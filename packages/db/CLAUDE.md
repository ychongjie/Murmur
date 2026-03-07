# @murmur/db — 数据访问层（Layer 2）

## 本包职责
数据库 schema 定义、迁移管理、仓储模式（Repository Pattern）。

## 依赖规则
- 可以依赖：@murmur/types, @murmur/config
- 不可依赖：@murmur/service, @murmur/server, @murmur/web

## 规范
- 使用 Drizzle ORM 定义 schema
- 数据库字段使用 snake_case
- TypeScript 属性使用 camelCase
- 仓储文件以 .repo.ts 结尾
- 迁移文件放在 src/migrations/ 目录
