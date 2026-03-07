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
