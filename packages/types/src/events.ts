// World event types (turn records)

export type WorldEventType =
  | 'narration'
  | 'dialogue'
  | 'event'
  | 'ending';

export interface WorldEvent {
  id: number;
  instanceId: string;
  turn: number;
  eventType: WorldEventType;
  characterId: string | null;
  content: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

// WebSocket message types

export type WsMessageType =
  | 'world_event'
  | 'world_status'
  | 'observer_count'
  | 'error';

export type WsMessage =
  | { type: 'world_event'; payload: WorldEvent }
  | { type: 'world_status'; payload: WorldStatusPayload }
  | { type: 'observer_count'; payload: ObserverCountPayload }
  | { type: 'error'; payload: ErrorPayload };

export interface WorldStatusPayload {
  instanceId: string;
  status: 'frozen' | 'running' | 'ended';
}

export interface ObserverCountPayload {
  instanceId: string;
  count: number;
}

export interface ErrorPayload {
  code: string;
  message: string;
}

// Client → Server WebSocket messages

export type WsClientMessageType =
  | 'heartbeat'
  | 'set_speed';

export interface WsClientMessage {
  type: WsClientMessageType;
  payload?: Record<string, unknown>;
}
