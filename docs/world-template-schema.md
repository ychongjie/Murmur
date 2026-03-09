# World Template Schema

> 世界模板 YAML 格式定义。

## Schema

```yaml
id: string                    # 模板唯一标识（kebab-case）
name: string                  # 模板名称
genre: string                 # 类型标签
description: string           # 一句话描述
cover_emoji: string           # 封面 emoji

setting:
  background: string          # 背景设定（多行文本）
  tone: string                # 基调
  era: string                 # 时代背景

characters:                   # 角色列表（2-6 个）
  - id: string                # 角色 ID（kebab-case）
    name: string              # 角色名
    role: string              # 身份/职业
    personality: string       # 性格描述
    secret: string            # 秘密
    relationships:            # 与其他角色的关系
      [character_id]: string
    speech_style: string      # 说话风格

director:
  pacing: string              # 节奏指南（多行文本）
  event_triggers:             # 事件触发器
    - condition: string
      action: string
  ending_conditions:          # 结局条件列表
    - string

max_turns: number             # 最大回合数
```

## Validation

Templates are validated at:
1. Build time — CI pipeline (`pnpm validate:templates`)
2. Runtime — when loading templates from YAML
3. Claude Code — PreToolUse hook when editing template files
