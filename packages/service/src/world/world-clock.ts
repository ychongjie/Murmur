// World clock scheduler — drives turn progression per instance

import pino from 'pino';
import type { SpeedSetting, WorldTemplate, WsMessage } from '@murmur/types';
import { SPEED_INTERVALS } from '@murmur/types';
import type { EventRepo, InstanceRepo } from '@murmur/db';
import { runTurn } from './turn-runner.js';

const logger = pino({ name: 'world-clock' });

export interface WorldClockDeps {
  eventRepo: EventRepo;
  instanceRepo: InstanceRepo;
  broadcast: (instanceId: string, message: WsMessage) => void;
  getTemplate: (templateId: string) => WorldTemplate | null;
}

interface ClockEntry {
  instanceId: string;
  templateId: string;
  timer: ReturnType<typeof setTimeout> | null;
  running: boolean;
  speed: SpeedSetting;
}

export class WorldClock {
  private readonly clocks = new Map<string, ClockEntry>();
  private readonly deps: WorldClockDeps;

  constructor(deps: WorldClockDeps) {
    this.deps = deps;
  }

  async start(instanceId: string, templateId: string, speed: SpeedSetting): Promise<void> {
    if (this.clocks.has(instanceId)) {
      logger.info({ event: 'clock_already_running', instanceId });
      return;
    }

    const entry: ClockEntry = {
      instanceId,
      templateId,
      timer: null,
      running: true,
      speed,
    };
    this.clocks.set(instanceId, entry);

    logger.info({ event: 'clock_started', instanceId, speed });

    await this.deps.instanceRepo.updateStatus(instanceId, 'running');
    this.deps.broadcast(instanceId, {
      type: 'world_status',
      payload: { instanceId, status: 'running' },
    });

    this.scheduleNext(instanceId);
  }

  stop(instanceId: string): void {
    const entry = this.clocks.get(instanceId);
    if (!entry) return;

    entry.running = false;
    if (entry.timer) {
      clearTimeout(entry.timer);
      entry.timer = null;
    }
    this.clocks.delete(instanceId);
    logger.info({ event: 'clock_stopped', instanceId });
  }

  updateSpeed(instanceId: string, speed: SpeedSetting): void {
    const entry = this.clocks.get(instanceId);
    if (!entry || !entry.running) return;

    entry.speed = speed;
    if (entry.timer) {
      clearTimeout(entry.timer);
      entry.timer = null;
    }
    this.scheduleNext(instanceId);
    logger.info({ event: 'clock_speed_changed', instanceId, speed });
  }

  isRunning(instanceId: string): boolean {
    return this.clocks.get(instanceId)?.running ?? false;
  }

  stopAll(): void {
    for (const instanceId of this.clocks.keys()) {
      this.stop(instanceId);
    }
  }

  private scheduleNext(instanceId: string): void {
    const entry = this.clocks.get(instanceId);
    if (!entry || !entry.running) return;

    const interval = SPEED_INTERVALS[entry.speed];
    entry.timer = setTimeout(() => {
      void this.tick(instanceId);
    }, interval);
  }

  private async tick(instanceId: string): Promise<void> {
    const entry = this.clocks.get(instanceId);
    if (!entry || !entry.running) return;

    const instance = await this.deps.instanceRepo.findById(instanceId);
    if (!instance || instance.status === 'ended') {
      this.stop(instanceId);
      return;
    }

    const template = this.deps.getTemplate(instance.templateId);
    if (!template) {
      logger.error({ event: 'template_not_found', instanceId, templateId: instance.templateId });
      this.stop(instanceId);
      return;
    }

    const result = await runTurn(
      instanceId,
      template,
      instance.currentTurn,
      { eventRepo: this.deps.eventRepo, instanceRepo: this.deps.instanceRepo },
    );

    if (!result.ok) {
      logger.error({ event: 'turn_failed', instanceId, error: result.error.message });
      this.scheduleNext(instanceId);
      return;
    }

    const { event, eventId, ended } = result.value;
    this.deps.broadcast(instanceId, {
      type: 'world_event',
      payload: {
        id: eventId,
        instanceId: event.instanceId,
        turn: event.turn,
        eventType: event.eventType,
        characterId: event.characterId,
        content: event.content,
        metadata: event.metadata,
        createdAt: new Date(),
      },
    });

    if (ended) {
      this.stop(instanceId);
      this.deps.broadcast(instanceId, {
        type: 'world_status',
        payload: { instanceId, status: 'ended' },
      });
      return;
    }

    this.scheduleNext(instanceId);
  }
}
