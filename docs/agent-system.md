# Agent System — Prompt Engineering Guide

> 导演 Agent 和角色 Agent 的 prompt 工程指南。

## Director Agent

导演不是角色，是世界的"上帝视角"控制器。

### Responsibilities
1. 决定下一步谁说话
2. 生成旁白描写
3. 注入突发事件
4. 追踪秘密暴露进度
5. 判断结局条件

### Output Format
JSON — parsed as `DirectorDecision` type via zod.

## Character Agent

每个角色是独立的 AI Agent，拥有独立人格和记忆。

### Prompt Structure
See `docs/product-spec.md#4.1` for full prompt template.

### Constraints
- 1-3 sentences per response
- No breaking the fourth wall
- Can lie, evade, deflect based on personality
- Only knows information visible to the character

## LLM Configuration

| Parameter | Director | Character |
|-----------|----------|-----------|
| Model | deepseek-chat | deepseek-chat |
| Temperature | 0.9 | 0.95 |
| Max tokens | 1024 | 512 |
