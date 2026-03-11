'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { WorldEvent } from '@murmur/types';
import { useTypewriter } from '../hooks/useTypewriter';
import { getCharacterColorClass } from './CharacterPanel';

interface ChatStreamProps {
  events: WorldEvent[];
  characterNames: Record<string, string>;
  characterIndexes: Record<string, number>;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
}

export function ChatStream({
  events,
  characterNames,
  characterIndexes,
  onLoadMore,
  hasMore,
  loadingMore,
}: ChatStreamProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevHeightRef = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events.length]);

  useEffect(() => {
    const container = containerRef.current?.parentElement;
    if (!container || !prevHeightRef.current) return;
    container.scrollTop = container.scrollHeight - prevHeightRef.current;
  }, [loadingMore]);

  const handleScroll = useCallback(() => {
    if (!onLoadMore || !hasMore || loadingMore) return;
    const container = containerRef.current?.parentElement;
    if (!container) return;

    if (container.scrollTop < 80) {
      prevHeightRef.current = container.scrollHeight;
      onLoadMore();
    }
  }, [onLoadMore, hasMore, loadingMore]);

  useEffect(() => {
    const container = containerRef.current?.parentElement;
    if (!container) return;
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div ref={containerRef} className="flex flex-col gap-3">
      {loadingMore && (
        <p className="text-center text-xs text-[var(--terminal-text-dim)]">
          Loading earlier messages...
        </p>
      )}
      {hasMore === false && events.length > 0 && (
        <p className="text-center text-xs text-[var(--terminal-text-dim)]">
          — Beginning of history —
        </p>
      )}
      {events.map((evt, i) => {
        const isLatest = i === events.length - 1;
        return (
          <ChatMessage
            key={evt.id}
            event={evt}
            characterNames={characterNames}
            characterIndexes={characterIndexes}
            animate={isLatest}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

function ChatMessage({
  event,
  characterNames,
  characterIndexes,
  animate,
}: {
  event: WorldEvent;
  characterNames: Record<string, string>;
  characterIndexes: Record<string, number>;
  animate: boolean;
}) {
  const { displayedText, isTyping } = useTypewriter(
    animate ? event.content : '',
    30,
  );

  const text = animate ? displayedText : event.content;

  if (event.eventType === 'dialogue' && event.characterId) {
    const name = characterNames[event.characterId] ?? event.characterId;
    const idx = characterIndexes[event.characterId] ?? 0;
    const colorClass = getCharacterColorClass(idx);

    return (
      <div className="flex flex-col gap-0.5">
        <span className={`text-xs font-bold ${colorClass}`}>
          [{name}]
        </span>
        <p className="pl-2 text-sm">
          {text}
          {animate && isTyping && <span className="cursor-blink">_</span>}
        </p>
      </div>
    );
  }

  if (event.eventType === 'narration') {
    return (
      <p className="font-narration text-sm italic text-[var(--narration-color)]">
        {text}
        {animate && isTyping && <span className="cursor-blink">_</span>}
      </p>
    );
  }

  if (event.eventType === 'event') {
    return (
      <div className="my-1 rounded border border-[var(--terminal-text-dim)] px-3 py-2">
        <span className="text-xs font-bold text-[var(--char-color-1)]">
          EVENT
        </span>
        <p className="mt-1 text-sm">
          {text}
          {animate && isTyping && <span className="cursor-blink">_</span>}
        </p>
      </div>
    );
  }

  if (event.eventType === 'ending') {
    return (
      <div className="my-2 rounded border border-[var(--terminal-green)] px-4 py-3 text-center">
        <span className="text-sm font-bold text-[var(--terminal-green)]">
          THE END
        </span>
        <p className="mt-2 text-sm">
          {text}
          {animate && isTyping && <span className="cursor-blink">_</span>}
        </p>
      </div>
    );
  }

  return (
    <p className="text-sm">
      {text}
      {animate && isTyping && <span className="cursor-blink">_</span>}
    </p>
  );
}
