# @murmur/types — 纯类型定义（Layer 0）

## 本包职责
纯 TypeScript 类型定义，零运行时依赖。所有包共享的接口和类型。

## 依赖规则
- 不可依赖任何 @murmur/* 包
- 不可有运行时依赖（dependencies 应为空）
- 只能导出类型（type/interface）和纯值常量

## 规范
- 所有类型必须从 index.ts 统一导出
- 数据库相关字段用 camelCase（TypeScript 侧），映射到 snake_case 由 db 层处理
- 使用 Result<T, E> 模式表达可失败操作的返回值
