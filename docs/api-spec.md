# REST + WebSocket API Specification

> Murmur 后端 API 定义。详细实现在 Phase 3。

## REST API

### Templates

```
GET    /api/templates          — 获取所有世界模板列表
GET    /api/templates/:id      — 获取单个模板详情
```

### Instances

```
POST   /api/instances          — 创建新世界实例（body: { templateId }）
GET    /api/instances/:id      — 获取实例状态
GET    /api/instances/:id/events — 获取实例事件历史（支持分页）
```

### Novels (v2)

```
POST   /api/novels             — 从实例生成小说（body: { instanceId, style }）
GET    /api/novels/:id         — 获取小说内容
```

## WebSocket API

### Connection

```
ws://host/ws/:instanceId       — 连接到世界实例
```

### Server → Client Messages

See `@murmur/types` — `WsMessage` type.

### Client → Server Messages

See `@murmur/types` — `WsClientMessage` type.
