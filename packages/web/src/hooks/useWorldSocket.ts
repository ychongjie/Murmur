'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  WorldEvent,
  WsMessage,
  SpeedSetting,
  WorldStatus,
} from '@murmur/types';

const WS_BASE = process.env['NEXT_PUBLIC_WS_URL'] ?? 'ws://localhost:3001';
const HEARTBEAT_INTERVAL = 30_000;

export interface WorldSocketState {
  connected: boolean;
  events: WorldEvent[];
  observerCount: number;
  worldStatus: WorldStatus | null;
  error: string | null;
  setSpeed: (speed: SpeedSetting) => void;
}

export function useWorldSocket(instanceId: string): WorldSocketState {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<WorldEvent[]>([]);
  const [observerCount, setObserverCount] = useState(0);
  const [worldStatus, setWorldStatus] = useState<WorldStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setSpeed = useCallback((speed: SpeedSetting) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'set_speed', payload: { speed } }));
    }
  }, []);

  useEffect(() => {
    if (!instanceId) return;

    const url = `${WS_BASE}/ws/${instanceId}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setError(null);
      heartbeatRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'heartbeat' }));
        }
      }, HEARTBEAT_INTERVAL);
    };

    ws.onmessage = (e) => {
      const msg = safeJsonParse(e.data) as WsMessage | null;
      if (!msg) return;

      switch (msg.type) {
        case 'world_event':
          setEvents((prev) => [...prev, msg.payload]);
          break;
        case 'observer_count':
          setObserverCount(msg.payload.count);
          break;
        case 'world_status':
          setWorldStatus(msg.payload.status);
          break;
        case 'error':
          setError(msg.payload.message);
          break;
      }
    };

    ws.onclose = () => {
      setConnected(false);
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };

    ws.onerror = () => {
      setError('WebSocket connection error');
    };

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      ws.close();
    };
  }, [instanceId]);

  return { connected, events, observerCount, worldStatus, error, setSpeed };
}

function safeJsonParse(data: unknown): unknown {
  try {
    return JSON.parse(String(data));
  } catch {
    return null;
  }
}
