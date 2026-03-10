// WebSocket connection handler — manages observer connections

import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import pino from 'pino';
import { z } from 'zod';
import type { WsMessage, SpeedSetting } from '@murmur/types';
import { OBSERVER_HISTORY_LOAD } from '@murmur/config';
import type { EventRepo, InstanceRepo } from '@murmur/db';
import type { ObserverTracker } from '@murmur/service';
import type { WorldClock } from '@murmur/service';

const logger = pino({ name: 'ws-handler' });

const clientMessageSchema = z.object({
  type: z.enum(['heartbeat', 'set_speed']),
  payload: z.record(z.unknown()).optional(),
});

const speedPayloadSchema = z.object({
  speed: z.enum(['slow', 'normal', 'fast']),
});

export interface WsHandlerDeps {
  observerTracker: ObserverTracker;
  worldClock: WorldClock;
  eventRepo: EventRepo;
  instanceRepo: InstanceRepo;
}

interface ActiveSocket {
  ws: WebSocket;
  connectionId: string;
  instanceId: string;
}

type WebSocket = import('ws').WebSocket;

const activeSockets = new Map<string, ActiveSocket>();

export function getActiveSockets(): Map<string, ActiveSocket> {
  return activeSockets;
}

export function broadcastToInstance(instanceId: string, message: WsMessage): void {
  const payload = JSON.stringify(message);
  for (const socket of activeSockets.values()) {
    if (socket.instanceId === instanceId && socket.ws.readyState === 1) {
      socket.ws.send(payload);
    }
  }
}

export function closeConnectionById(connectionId: string): void {
  const socket = activeSockets.get(connectionId);
  if (socket) {
    socket.ws.close(1000, 'Connection timeout');
  }
}

export function registerWsHandler(
  app: FastifyInstance,
  deps: WsHandlerDeps,
): void {
  app.get('/ws/:instanceId', { websocket: true }, async (socket, request) => {
    const instanceId = (request.params as { instanceId: string }).instanceId;
    const connectionId = randomUUID();

    const instance = await deps.instanceRepo.findById(instanceId);
    if (!instance) {
      socket.send(JSON.stringify({
        type: 'error',
        payload: { code: 'NOT_FOUND', message: 'Instance not found' },
      } satisfies WsMessage));
      socket.close(1008, 'Instance not found');
      return;
    }

    if (instance.status === 'ended') {
      socket.send(JSON.stringify({
        type: 'error',
        payload: { code: 'WORLD_ENDED', message: 'World has ended' },
      } satisfies WsMessage));
      socket.close(1008, 'World has ended');
      return;
    }

    activeSockets.set(connectionId, { ws: socket, connectionId, instanceId });
    deps.observerTracker.addObserver(connectionId, instanceId);

    logger.info({ event: 'ws_connected', connectionId, instanceId });

    const recentEvents = await deps.eventRepo.findRecent(instanceId, OBSERVER_HISTORY_LOAD);
    for (const evt of recentEvents.reverse()) {
      const worldEvent: WsMessage = {
        type: 'world_event',
        payload: {
          id: evt.id,
          instanceId: evt.instanceId,
          turn: evt.turn,
          eventType: evt.eventType as import('@murmur/types').WorldEventType,
          characterId: evt.characterId,
          content: evt.content,
          metadata: (evt.metadata as Record<string, unknown>) ?? null,
          createdAt: evt.createdAt,
        },
      };
      socket.send(JSON.stringify(worldEvent));
    }

    const count = deps.observerTracker.getCount(instanceId);
    socket.send(JSON.stringify({
      type: 'observer_count',
      payload: { instanceId, count },
    } satisfies WsMessage));

    socket.send(JSON.stringify({
      type: 'world_status',
      payload: { instanceId, status: instance.status },
    } satisfies WsMessage));

    socket.on('message', (data: Buffer | ArrayBuffer | Buffer[]) => {
      handleClientMessage(connectionId, instanceId, data, deps);
    });

    socket.on('close', () => {
      activeSockets.delete(connectionId);
      deps.observerTracker.removeObserver(connectionId, instanceId);
      logger.info({ event: 'ws_disconnected', connectionId, instanceId });
    });

    socket.on('error', (err: Error) => {
      logger.error({ event: 'ws_error', connectionId, instanceId, error: err.message });
    });
  });
}

function handleClientMessage(
  connectionId: string,
  instanceId: string,
  data: unknown,
  deps: WsHandlerDeps,
): void {
  const raw = typeof data === 'string' ? data : String(data);
  const parsed = clientMessageSchema.safeParse(safeJsonParse(raw));
  if (!parsed.success) return;

  const msg = parsed.data;

  switch (msg.type) {
    case 'heartbeat':
      deps.observerTracker.heartbeat(connectionId, instanceId);
      break;

    case 'set_speed': {
      const sp = speedPayloadSchema.safeParse(msg.payload);
      if (sp.success) {
        deps.observerTracker.setSpeed(
          connectionId,
          instanceId,
          sp.data.speed as SpeedSetting,
        );
      }
      break;
    }
  }
}

function safeJsonParse(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}
