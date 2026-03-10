// Observer count tracking & world freeze/unfreeze trigger

import pino from 'pino';
import type { SpeedSetting, ObserverSession } from '@murmur/types';
import { SPEED_INTERVALS } from '@murmur/types';

const logger = pino({ name: 'observer-tracker' });

export interface ObserverTrackerEvents {
  onFirstObserver: (instanceId: string) => void;
  onLastObserverLeft: (instanceId: string) => void;
  onSpeedChange: (instanceId: string, speed: SpeedSetting) => void;
  onCountChange: (instanceId: string, count: number) => void;
}

export class ObserverTracker {
  /** instanceId → Map<connectionId, ObserverSession> */
  private readonly sessions = new Map<string, Map<string, ObserverSession>>();
  private readonly events: ObserverTrackerEvents;

  constructor(events: ObserverTrackerEvents) {
    this.events = events;
  }

  addObserver(connectionId: string, instanceId: string): ObserverSession {
    const session: ObserverSession = {
      connectionId,
      instanceId,
      speed: 'normal',
      connectedAt: new Date(),
      lastHeartbeat: new Date(),
    };

    let instanceMap = this.sessions.get(instanceId);
    if (!instanceMap) {
      instanceMap = new Map();
      this.sessions.set(instanceId, instanceMap);
    }

    const wasFrozen = instanceMap.size === 0;
    instanceMap.set(connectionId, session);

    const count = instanceMap.size;
    logger.info({ event: 'observer_added', instanceId, connectionId, count });
    this.events.onCountChange(instanceId, count);

    if (wasFrozen) {
      logger.info({ event: 'world_unfreezing', instanceId });
      this.events.onFirstObserver(instanceId);
    }

    return session;
  }

  removeObserver(connectionId: string, instanceId: string): void {
    const instanceMap = this.sessions.get(instanceId);
    if (!instanceMap) return;

    instanceMap.delete(connectionId);
    const count = instanceMap.size;

    logger.info({ event: 'observer_removed', instanceId, connectionId, count });
    this.events.onCountChange(instanceId, count);

    if (count === 0) {
      this.sessions.delete(instanceId);
      logger.info({ event: 'world_freezing', instanceId });
      this.events.onLastObserverLeft(instanceId);
    }
  }

  heartbeat(connectionId: string, instanceId: string): void {
    const session = this.sessions.get(instanceId)?.get(connectionId);
    if (session) {
      session.lastHeartbeat = new Date();
    }
  }

  setSpeed(connectionId: string, instanceId: string, speed: SpeedSetting): void {
    const session = this.sessions.get(instanceId)?.get(connectionId);
    if (session) {
      session.speed = speed;
      const fastest = this.getFastestSpeed(instanceId);
      this.events.onSpeedChange(instanceId, fastest);
    }
  }

  getFastestSpeed(instanceId: string): SpeedSetting {
    const instanceMap = this.sessions.get(instanceId);
    if (!instanceMap || instanceMap.size === 0) return 'normal';

    let fastest: SpeedSetting = 'slow';
    let fastestInterval = SPEED_INTERVALS.slow;

    for (const session of instanceMap.values()) {
      const interval = SPEED_INTERVALS[session.speed];
      if (interval < fastestInterval) {
        fastest = session.speed;
        fastestInterval = interval;
      }
    }
    return fastest;
  }

  getCount(instanceId: string): number {
    return this.sessions.get(instanceId)?.size ?? 0;
  }

  getConnectionIds(instanceId: string): string[] {
    const instanceMap = this.sessions.get(instanceId);
    if (!instanceMap) return [];
    return Array.from(instanceMap.keys());
  }

  findStaleConnections(timeoutMs: number): Array<{ connectionId: string; instanceId: string }> {
    const now = Date.now();
    const stale: Array<{ connectionId: string; instanceId: string }> = [];

    for (const [instanceId, instanceMap] of this.sessions) {
      for (const [connectionId, session] of instanceMap) {
        if (now - session.lastHeartbeat.getTime() > timeoutMs) {
          stale.push({ connectionId, instanceId });
        }
      }
    }
    return stale;
  }
}
