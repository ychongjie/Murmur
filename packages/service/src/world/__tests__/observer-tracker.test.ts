import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ObserverTrackerEvents } from '../observer-tracker.js';
import { ObserverTracker } from '../observer-tracker.js';

function makeEvents(): ObserverTrackerEvents {
  return {
    onFirstObserver: vi.fn(),
    onLastObserverLeft: vi.fn(),
    onSpeedChange: vi.fn(),
    onCountChange: vi.fn(),
  };
}

describe('ObserverTracker', () => {
  let events: ObserverTrackerEvents;
  let tracker: ObserverTracker;

  beforeEach(() => {
    events = makeEvents();
    tracker = new ObserverTracker(events);
  });

  it('triggers onFirstObserver when count goes from 0 to 1', () => {
    tracker.addObserver('conn-1', 'inst-1');

    expect(events.onFirstObserver).toHaveBeenCalledWith('inst-1');
    expect(events.onCountChange).toHaveBeenCalledWith('inst-1', 1);
    expect(tracker.getCount('inst-1')).toBe(1);
  });

  it('does not trigger onFirstObserver for subsequent observers', () => {
    tracker.addObserver('conn-1', 'inst-1');
    tracker.addObserver('conn-2', 'inst-1');

    expect(events.onFirstObserver).toHaveBeenCalledTimes(1);
    expect(events.onCountChange).toHaveBeenCalledTimes(2);
    expect(tracker.getCount('inst-1')).toBe(2);
  });

  it('triggers onLastObserverLeft when count goes from 1 to 0', () => {
    tracker.addObserver('conn-1', 'inst-1');
    tracker.removeObserver('conn-1', 'inst-1');

    expect(events.onLastObserverLeft).toHaveBeenCalledWith('inst-1');
    expect(tracker.getCount('inst-1')).toBe(0);
  });

  it('does not trigger onLastObserverLeft if observers remain', () => {
    tracker.addObserver('conn-1', 'inst-1');
    tracker.addObserver('conn-2', 'inst-1');
    tracker.removeObserver('conn-1', 'inst-1');

    expect(events.onLastObserverLeft).not.toHaveBeenCalled();
    expect(tracker.getCount('inst-1')).toBe(1);
  });

  it('tracks separate instances independently', () => {
    tracker.addObserver('conn-1', 'inst-1');
    tracker.addObserver('conn-2', 'inst-2');

    expect(events.onFirstObserver).toHaveBeenCalledTimes(2);
    expect(tracker.getCount('inst-1')).toBe(1);
    expect(tracker.getCount('inst-2')).toBe(1);
  });

  it('returns 0 for unknown instances', () => {
    expect(tracker.getCount('nonexistent')).toBe(0);
  });

  it('returns connection ids for an instance', () => {
    tracker.addObserver('conn-1', 'inst-1');
    tracker.addObserver('conn-2', 'inst-1');

    const ids = tracker.getConnectionIds('inst-1');
    expect(ids).toContain('conn-1');
    expect(ids).toContain('conn-2');
    expect(ids).toHaveLength(2);
  });

  it('returns empty array for unknown instance connection ids', () => {
    expect(tracker.getConnectionIds('nonexistent')).toEqual([]);
  });

  it('updates heartbeat timestamp', () => {
    tracker.addObserver('conn-1', 'inst-1');
    tracker.heartbeat('conn-1', 'inst-1');
    const stale = tracker.findStaleConnections(60_000);
    expect(stale).toEqual([]);
  });

  it('detects stale connections', async () => {
    tracker.addObserver('conn-1', 'inst-1');
    // Wait a bit so the lastHeartbeat ages
    await new Promise((r) => setTimeout(r, 50));
    const stale = tracker.findStaleConnections(10);
    expect(stale).toEqual([{ connectionId: 'conn-1', instanceId: 'inst-1' }]);
  });

  it('does not report recently heartbeated connections as stale', async () => {
    tracker.addObserver('conn-1', 'inst-1');
    await new Promise((r) => setTimeout(r, 20));
    tracker.heartbeat('conn-1', 'inst-1');
    const stale = tracker.findStaleConnections(60_000);
    expect(stale).toEqual([]);
  });

  describe('speed management', () => {
    it('defaults to normal speed', () => {
      tracker.addObserver('conn-1', 'inst-1');
      expect(tracker.getFastestSpeed('inst-1')).toBe('normal');
    });

    it('returns fastest speed among observers', () => {
      tracker.addObserver('conn-1', 'inst-1');
      tracker.addObserver('conn-2', 'inst-1');

      tracker.setSpeed('conn-1', 'inst-1', 'slow');
      tracker.setSpeed('conn-2', 'inst-1', 'fast');

      expect(tracker.getFastestSpeed('inst-1')).toBe('fast');
      expect(events.onSpeedChange).toHaveBeenLastCalledWith('inst-1', 'fast');
    });

    it('recalculates fastest when fast observer leaves', () => {
      tracker.addObserver('conn-1', 'inst-1');
      tracker.addObserver('conn-2', 'inst-1');
      tracker.setSpeed('conn-1', 'inst-1', 'slow');
      tracker.setSpeed('conn-2', 'inst-1', 'fast');

      tracker.removeObserver('conn-2', 'inst-1');
      expect(tracker.getFastestSpeed('inst-1')).toBe('slow');
    });

    it('returns normal for unknown instance', () => {
      expect(tracker.getFastestSpeed('nonexistent')).toBe('normal');
    });
  });

  it('handles removing non-existent observer gracefully', () => {
    tracker.removeObserver('nonexistent', 'nonexistent');
    expect(events.onLastObserverLeft).not.toHaveBeenCalled();
  });
});
