# @murmur/web — 前端 UI（Layer 5）

## 本包职责
Next.js 前端应用，复古终端风格的观察者界面。

## 依赖规则
- 只能依赖：@murmur/types
- 通过 HTTP/WebSocket 与后端通信，不直接依赖后端代码

## 规范
- 组件文件使用 PascalCase，每个文件只导出一个组件
- 样式通过 Tailwind 类名，不使用 inline style 对象
- 复古终端主题变量定义在 terminal.css，通过 CSS 变量引用
- 状态管理优先 useState/useReducer，跨组件共享用 Context
- 禁止引入额外状态管理库（v1 阶段）
