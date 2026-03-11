'use client';

import { useEffect, useRef } from 'react';
import type { WorldEvent } from '@murmur/types';
import { useTypewriter } from '../hooks/useTypewriter';
import { getCharacterColor } from './CharacterPanel';

interface ChatStreamProps {
  events: WorldEvent[];
  characterNames: Record<string, string>;
  characterIndexes: Record<string, number>;
}

export function ChatStream({
  events,
  characterNames,
  characterIndexes,
}: ChatStreamProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events.length]);

  return (
    <div className="flex flex-col gap-3">
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
    const color = getCharacterColor(idx);

    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-bold" style={{ color }}>
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
      <p
        className="text-sm italic text-[var(--narration-color)]"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
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
