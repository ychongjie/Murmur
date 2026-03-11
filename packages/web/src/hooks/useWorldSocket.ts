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
const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY = 1_000;

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
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const unmountedRef = useRef(false);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const setSpeed = useCallback((speed: SpeedSetting) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'set_speed', payload: { speed } }));
    }
  }, []);

  useEffect(() => {
    if (!instanceId) return;
    unmountedRef.current = false;

    function connect() {
      if (unmountedRef.current) return;

      const url = `${WS_BASE}/ws/${instanceId}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setError(null);
        reconnectAttemptRef.current = 0;
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
        clearHeartbeat();
        if (unmountedRef.current) return;

        const attempt = reconnectAttemptRef.current;
        if (attempt < MAX_RECONNECT_ATTEMPTS) {
          const delay = BASE_RECONNECT_DELAY * Math.pow(2, attempt);
          reconnectAttemptRef.current = attempt + 1;
          setError(`Disconnected. Reconnecting in ${delay / 1000}s...`);
          reconnectRef.current = setTimeout(connect, delay);
        } else {
          setError('Connection lost. Please refresh the page.');
        }
      };

      ws.onerror = () => {
        setError('WebSocket connection error');
      };
    }

    connect();

    return () => {
      unmountedRef.current = true;
      clearHeartbeat();
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
      wsRef.current?.close();
    };
  }, [instanceId, clearHeartbeat]);

  return { connected, events, observerCount, worldStatus, error, setSpeed };
}

function safeJsonParse(data: unknown): unknown {
  try {
    return JSON.parse(String(data));
  } catch {
    return null;
  }
}
