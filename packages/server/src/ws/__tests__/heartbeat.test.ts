import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HeartbeatMonitor } from '../heartbeat.js';
import type { HeartbeatMonitorDeps } from '../heartbeat.js';

function makeDeps(): HeartbeatMonitorDeps {
  return {
    observerTracker: {
      findStaleConnections: vi.fn().mockReturnValue([]),
    } as unknown as HeartbeatMonitorDeps['observerTracker'],
    closeConnection: vi.fn(),
  };
}

describe('HeartbeatMonitor', () => {
  let monitor: HeartbeatMonitor;
  let deps: HeartbeatMonitorDeps;

  beforeEach(() => {
    vi.useFakeTimers();
    deps = makeDeps();
    monitor = new HeartbeatMonitor(deps);
  });

  afterEach(() => {
    monitor.stop();
    vi.useRealTimers();
  });

  it('starts and stops without error', () => {
    monitor.start();
    monitor.stop();
  });

  it('does not start twice', () => {
    monitor.start();
    monitor.start();
    monitor.stop();
  });

  it('prunes stale connections on interval', () => {
    const stale = [
      { connectionId: 'conn-1', instanceId: 'inst-1' },
      { connectionId: 'conn-2', instanceId: 'inst-2' },
    ];
    (deps.observerTracker.findStaleConnections as ReturnType<typeof vi.fn>)
      .mockReturnValue(stale);

    monitor.start();
    vi.advanceTimersByTime(30_000);

    expect(deps.observerTracker.findStaleConnections).toHaveBeenCalled();
    expect(deps.closeConnection).toHaveBeenCalledWith('conn-1');
    expect(deps.closeConnection).toHaveBeenCalledWith('conn-2');
    expect(deps.closeConnection).toHaveBeenCalledTimes(2);
  });

  it('does not prune when no stale connections', () => {
    monitor.start();
    vi.advanceTimersByTime(30_000);

    expect(deps.closeConnection).not.toHaveBeenCalled();
  });

  it('stops checking after stop()', () => {
    monitor.start();
    vi.advanceTimersByTime(30_000);
    monitor.stop();

    (deps.observerTracker.findStaleConnections as ReturnType<typeof vi.fn>)
      .mockClear();
    vi.advanceTimersByTime(60_000);

    expect(deps.observerTracker.findStaleConnections).not.toHaveBeenCalled();
  });
});
