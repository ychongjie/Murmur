'use client';

import Link from 'next/link';

interface WorldCardProps {
  id: string;
  name: string;
  genre: string;
  description: string;
  coverEmoji?: string;
  currentTurn?: number;
  observerCount?: number;
  status?: 'frozen' | 'running' | 'ended';
  href: string;
}

const STATUS_LABELS: Record<string, string> = {
  frozen: 'FROZEN',
  running: 'RUNNING',
  ended: 'ENDED',
};

const STATUS_COLORS: Record<string, string> = {
  frozen: 'text-[var(--terminal-text-dim)]',
  running: 'text-[var(--terminal-green)]',
  ended: 'text-[var(--char-color-1)]',
};

export function WorldCard({
  name,
  genre,
  description,
  coverEmoji,
  currentTurn,
  observerCount,
  status,
  href,
}: WorldCardProps) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-[var(--border-color)] bg-[var(--terminal-bg-secondary)] p-4 transition-colors hover:border-[var(--terminal-text)] hover:bg-[var(--terminal-bg-secondary)]/80"
    >
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          {coverEmoji && <span className="text-2xl">{coverEmoji}</span>}
          <h3 className="text-lg font-bold text-glow">{name}</h3>
        </div>
        {status && (
          <span className={`text-xs font-mono ${STATUS_COLORS[status] ?? ''}`}>
            {STATUS_LABELS[status] ?? status}
          </span>
        )}
      </div>

      <span className="mb-2 inline-block rounded border border-[var(--border-color)] px-1.5 py-0.5 text-xs text-[var(--terminal-text-dim)]">
        {genre}
      </span>

      <p className="mb-3 text-sm text-[var(--terminal-text-dim)] line-clamp-2">
        {description}
      </p>

      <div className="flex items-center gap-4 text-xs text-[var(--terminal-text-dim)]">
        {currentTurn !== undefined && <span>Round {currentTurn}</span>}
        {observerCount !== undefined && <span>👁 {observerCount}</span>}
      </div>
    </Link>
  );
}
