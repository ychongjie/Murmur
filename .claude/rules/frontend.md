---
paths:
  - "packages/web/**/*.ts"
  - "packages/web/**/*.tsx"
  - "packages/web/**/*.css"
---
# 前端代码规则
- 组件文件使用 PascalCase，每个文件只导出一个组件
- 样式通过 Tailwind 类名，不使用 inline style 对象
- 复古终端主题变量定义在 terminal.css，通过 CSS 变量引用
- 状态管理优先 useState/useReducer，跨组件共享用 Context
- 禁止引入额外状态管理库（v1 阶段）
