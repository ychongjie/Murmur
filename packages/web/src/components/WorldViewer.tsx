'use client';

import { useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import type { SpeedSetting, WorldEvent } from '@murmur/types';
import { useWorldSocket } from '../hooks/useWorldSocket';
import { fetchEvents } from '../lib/api';
import { Terminal } from './Terminal';
import { ChatStream } from './ChatStream';
import { CharacterPanel } from './CharacterPanel';
import { SpeedControl } from './SpeedControl';

interface CharacterInfo {
  id: string;
  name: string;
  role: string;
  personality: string;
}

interface WorldViewerProps {
  instanceId: string;
  worldName: string;
  characters: CharacterInfo[];
}

const HISTORY_PAGE_SIZE = 20;

export function WorldViewer({
  instanceId,
  worldName,
  characters,
}: WorldViewerProps) {
  const [speed, setSpeed] = useState<SpeedSetting>('normal');
  const [historyEvents, setHistoryEvents] = useState<WorldEvent[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const {
    connected,
    events: liveEvents,
    observerCount,
    worldStatus,
    error,
    setSpeed: wsSetSpeed,
  } = useWorldSocket(instanceId);

  const allEvents = useMemo(() => {
    const seen = new Set(liveEvents.map((e) => e.id));
    const deduped = historyEvents.filter((e) => !seen.has(e.id));
    return [...deduped, ...liveEvents];
  }, [historyEvents, liveEvents]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const offset = historyEvents.length;
      const older = await fetchEvents(instanceId, HISTORY_PAGE_SIZE, offset);
      if (older.length < HISTORY_PAGE_SIZE) setHasMore(false);
      const mapped: WorldEvent[] = older.map((e) => ({
        id: e.id,
        instanceId: e.instanceId,
        turn: e.turn,
        eventType: e.eventType,
        characterId: e.characterId,
        content: e.content,
        metadata: e.metadata,
        createdAt: new Date(e.createdAt),
      }));
      setHistoryEvents((prev) => [...mapped.reverse(), ...prev]);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [instanceId, historyEvents.length, loadingMore, hasMore]);

  const characterNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of characters) {
      map[c.id] = c.name;
    }
    return map;
  }, [characters]);

  const characterIndexes = useMemo(() => {
    const map: Record<string, number> = {};
    characters.forEach((c, i) => {
      map[c.id] = i;
    });
    return map;
  }, [characters]);

  const lastEvent = allEvents[allEvents.length - 1];
  const speakingCharacterId = lastEvent?.characterId ?? null;
  const currentTurn = lastEvent?.turn ?? 0;

  function handleSpeedChange(newSpeed: SpeedSetting) {
    setSpeed(newSpeed);
    wsSetSpeed(newSpeed);
  }

  const frozenMessage =
    connected && worldStatus === 'frozen' && allEvents.length === 0
      ? 'World is frozen. Waiting for the story to begin...'
      : connected && worldStatus === 'frozen'
        ? 'World is frozen. It will resume when an observer joins.'
        : connected
          ? 'Waiting for the world to begin...'
          : 'Connecting...';

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-4 md:p-6">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm text-[var(--terminal-text-dim)] hover:text-[var(--terminal-text)]"
          >
            &larr; MURMUR
          </Link>
          <h1 className="text-lg font-bold text-glow">{worldName}</h1>
          <span className="text-xs text-[var(--terminal-text-dim)]">
            #{instanceId.slice(0, 8)}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <StatusIndicator connected={connected} status={worldStatus} />
          <span className="text-[var(--terminal-text-dim)]">
            Round {currentTurn}
          </span>
          <span className="text-[var(--terminal-text-dim)]">
            👁 {observerCount}
          </span>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded border border-[var(--char-color-1)] px-3 py-2 text-sm text-[var(--char-color-1)]">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex-1">
          <Terminal title={`${worldName} — Live`}>
            <div className="h-[calc(100vh-220px)] overflow-y-auto pr-2">
              {allEvents.length === 0 ? (
                <p className="text-sm text-[var(--terminal-text-dim)]">
                  {frozenMessage}
                </p>
              ) : (
                <ChatStream
                  events={allEvents}
                  characterNames={characterNames}
                  characterIndexes={characterIndexes}
                  onLoadMore={loadMore}
                  hasMore={hasMore}
                  loadingMore={loadingMore}
                />
              )}
            </div>
          </Terminal>

          <div className="mt-3 flex items-center justify-between">
            <SpeedControl current={speed} onChange={handleSpeedChange} />
            <div className="flex items-center gap-2 text-xs text-[var(--terminal-text-dim)]">
              <span>{allEvents.length} messages</span>
            </div>
          </div>
        </div>

        <aside className="hidden w-56 shrink-0 md:block">
          <Terminal title="Characters">
            <CharacterPanel
              characters={characters}
              speakingCharacterId={speakingCharacterId}
            />
          </Terminal>
        </aside>
      </div>
    </main>
  );
}

function StatusIndicator({
  connected,
  status,
}: {
  connected: boolean;
  status: string | null;
}) {
  if (!connected) {
    return (
      <span className="flex items-center gap-1 text-[var(--terminal-text-dim)]">
        <span className="inline-block h-2 w-2 rounded-full bg-[var(--terminal-text-dim)]" />
        Offline
      </span>
    );
  }

  const statusColor =
    status === 'running'
      ? 'bg-[var(--terminal-green)]'
      : status === 'ended'
        ? 'bg-[var(--char-color-1)]'
        : 'bg-[var(--terminal-amber)]';

  const statusLabel =
    status === 'running'
      ? 'Live'
      : status === 'ended'
        ? 'Ended'
        : 'Frozen';

  return (
    <span className="flex items-center gap-1">
      <span className={`inline-block h-2 w-2 rounded-full ${statusColor}`} />
      <span className="text-[var(--terminal-text-dim)]">{statusLabel}</span>
    </span>
  );
}
