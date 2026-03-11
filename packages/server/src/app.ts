// Fastify application initialization

import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import fastifyCors from '@fastify/cors';
import pino from 'pino';
import type { WorldTemplate } from '@murmur/types';
import { loadEnv } from '@murmur/config';
import {
  createDbClient,
  createTemplateRepo,
  createInstanceRepo,
  createEventRepo,
} from '@murmur/db';
import { ObserverTracker, WorldClock, InstanceManager } from '@murmur/service';
import { errorHandler } from './middleware/error-handler.js';
import { registerTemplateRoutes } from './routes/template.routes.js';
import { registerInstanceRoutes } from './routes/instance.routes.js';
import {
  registerWsHandler,
  broadcastToInstance,
  closeConnectionById,
} from './ws/handler.js';
import { HeartbeatMonitor } from './ws/heartbeat.js';

export interface AppContext {
  worldClock: WorldClock;
  heartbeatMonitor: HeartbeatMonitor;
  observerTracker: ObserverTracker;
}

const logger = pino({ name: 'app' });

export async function buildApp() {
  const env = loadEnv();

  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
    },
  });

  // Database
  const db = createDbClient(env.DATABASE_URL);
  const templateRepo = createTemplateRepo(db);
  const instanceRepo = createInstanceRepo(db);
  const eventRepo = createEventRepo(db);

  // Template cache (in-memory for fast lookup)
  const templateCache = new Map<string, WorldTemplate>();

  function getTemplate(templateId: string): WorldTemplate | null {
    return templateCache.get(templateId) ?? null;
  }

  async function loadTemplateForInstance(templateId: string): Promise<WorldTemplate | null> {
    const cached = templateCache.get(templateId);
    if (cached) return cached;

    const row = await templateRepo.findById(templateId);
    if (!row) return null;

    const config = row.config as Record<string, unknown>;
    const template: WorldTemplate = {
      id: row.id,
      name: row.name ?? '',
      genre: row.genre ?? '',
      description: row.description ?? '',
      coverEmoji: (config['cover_emoji'] as string) ?? '',
      setting: config['setting'] as WorldTemplate['setting'],
      characters: config['characters'] as WorldTemplate['characters'],
      director: config['director'] as WorldTemplate['director'],
      maxTurns: (config['max_turns'] as number) ?? 80,
    };
    templateCache.set(templateId, template);
    return template;
  }

  // Observer tracker with event wiring
  const observerTracker = new ObserverTracker({
    onFirstObserver: (instanceId) => {
      (async () => {
        const instance = await instanceRepo.findById(instanceId);
        if (!instance || instance.status === 'ended') return;
        const template = await loadTemplateForInstance(instance.templateId);
        if (!template) return;
        const speed = observerTracker.getFastestSpeed(instanceId);
        await worldClock.start(instanceId, instance.templateId, speed);
      })().catch((err: unknown) => {
        logger.error({ event: 'world_start_failed', instanceId, error: err instanceof Error ? err.message : String(err) });
      });
    },
    onLastObserverLeft: (instanceId) => {
      worldClock.stop(instanceId);
      instanceRepo.updateStatus(instanceId, 'frozen').catch((err: unknown) => {
        logger.error({ event: 'freeze_status_update_failed', instanceId, error: err instanceof Error ? err.message : String(err) });
      });
      broadcastToInstance(instanceId, {
        type: 'world_status',
        payload: { instanceId, status: 'frozen' },
      });
    },
    onSpeedChange: (instanceId, speed) => {
      worldClock.updateSpeed(instanceId, speed);
    },
    onCountChange: (instanceId, count) => {
      instanceRepo.updateObserverCount(instanceId, count).catch((err: unknown) => {
        logger.error({ event: 'observer_count_update_failed', instanceId, error: err instanceof Error ? err.message : String(err) });
      });
      broadcastToInstance(instanceId, {
        type: 'observer_count',
        payload: { instanceId, count },
      });
    },
  });

  // World clock
  const worldClock = new WorldClock({
    eventRepo,
    instanceRepo,
    broadcast: broadcastToInstance,
    getTemplate,
  });

  // Instance manager
  const instanceManager = new InstanceManager({
    instanceRepo,
    templateRepo,
    resolveTemplate: getTemplate,
  });

  // Heartbeat monitor
  const heartbeatMonitor = new HeartbeatMonitor({
    observerTracker,
    closeConnection: closeConnectionById,
  });

  // Plugins
  await app.register(fastifyCors, { origin: true });
  await app.register(fastifyWebsocket);

  // Error handler
  app.setErrorHandler(errorHandler);

  // Health check (used by Render for liveness probes)
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  // Routes
  registerTemplateRoutes(app, templateRepo);
  registerInstanceRoutes(app, instanceManager, eventRepo);

  // WebSocket
  registerWsHandler(app, {
    observerTracker,
    worldClock,
    eventRepo,
    instanceRepo,
  });

  // Graceful shutdown
  app.addHook('onClose', () => {
    worldClock.stopAll();
    heartbeatMonitor.stop();
  });

  // Start heartbeat monitor after server is ready
  app.addHook('onReady', () => {
    heartbeatMonitor.start();
  });

  const context: AppContext = { worldClock, heartbeatMonitor, observerTracker };

  return { app, context };
}
