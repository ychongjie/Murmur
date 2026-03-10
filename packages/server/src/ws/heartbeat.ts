// WebSocket heartbeat detection — prunes stale connections

import pino from 'pino';
import { HEARTBEAT } from '@murmur/config';
import type { ObserverTracker } from '@murmur/service';

const logger = pino({ name: 'ws-heartbeat' });

export interface HeartbeatMonitorDeps {
  observerTracker: ObserverTracker;
  closeConnection: (connectionId: string) => void;
}

export class HeartbeatMonitor {
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly deps: HeartbeatMonitorDeps;

  constructor(deps: HeartbeatMonitorDeps) {
    this.deps = deps;
  }

  start(): void {
    if (this.timer) return;

    this.timer = setInterval(() => {
      this.pruneStale();
    }, HEARTBEAT.intervalMs);

    logger.info({
      event: 'heartbeat_monitor_started',
      intervalMs: HEARTBEAT.intervalMs,
      timeoutMs: HEARTBEAT.timeoutMs,
    });
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logger.info({ event: 'heartbeat_monitor_stopped' });
    }
  }

  private pruneStale(): void {
    const stale = this.deps.observerTracker.findStaleConnections(HEARTBEAT.timeoutMs);
    for (const { connectionId, instanceId } of stale) {
      logger.info({ event: 'stale_connection', connectionId, instanceId });
      this.deps.closeConnection(connectionId);
    }
  }
}
