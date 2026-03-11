'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TemplateListItem } from '../lib/api';
import { createInstance } from '../lib/api';
import { Terminal } from './Terminal';

interface HomeContentProps {
  templates: TemplateListItem[];
}

export function HomeContent({ templates }: HomeContentProps) {
  const router = useRouter();
  const [creating, setCreating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(templateId: string) {
    if (creating) return;
    setCreating(templateId);
    setError(null);

    try {
      const instance = await createInstance(templateId);
      router.push(`/world/${instance.id}`);
    } catch {
      setError('Failed to create world instance');
      setCreating(null);
    }
  }

  return (
    <div>
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-glow">World Templates</h2>
        {error && (
          <p className="mb-4 text-sm text-[var(--char-color-1)]">{error}</p>
        )}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              creating={creating === t.id}
              onCreateWorld={() => handleCreate(t.id)}
            />
          ))}
        </div>
        {templates.length === 0 && (
          <Terminal>
            <p className="text-sm text-[var(--terminal-text-dim)]">
              No templates available. Run{' '}
              <code className="text-[var(--terminal-text)]">pnpm db:seed</code>{' '}
              to load prebuilt templates.
            </p>
          </Terminal>
        )}
      </section>
    </div>
  );
}

function TemplateCard({
  template,
  creating,
  onCreateWorld,
}: {
  template: TemplateListItem;
  creating: boolean;
  onCreateWorld: () => void;
}) {
  return (
    <div className="flex flex-col rounded-lg border border-[var(--border-color)] bg-[var(--terminal-bg-secondary)] p-4">
      <div className="mb-2 flex items-start justify-between">
        <h3 className="text-base font-bold text-glow">{template.name}</h3>
        <span className="rounded border border-[var(--border-color)] px-1.5 py-0.5 text-xs text-[var(--terminal-text-dim)]">
          {template.genre}
        </span>
      </div>

      <p className="mb-4 flex-1 text-sm text-[var(--terminal-text-dim)]">
        {template.description}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--terminal-text-dim)]">
          Played {template.playCount}x
        </span>
        <button
          onClick={onCreateWorld}
          disabled={creating}
          className="rounded border border-[var(--terminal-text)] px-3 py-1 text-xs font-bold text-[var(--terminal-text)] transition-colors hover:bg-[var(--terminal-text)] hover:text-[var(--terminal-bg)] disabled:opacity-50"
        >
          {creating ? 'Creating...' : '+ New World'}
        </button>
      </div>
    </div>
  );
}
