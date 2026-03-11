import { fetchTemplates } from '../lib/api';
import { HomeContent } from '../components/HomeContent';

export default async function HomePage() {
  let templates: Awaited<ReturnType<typeof fetchTemplates>> = [];
  let error: string | null = null;

  try {
    templates = await fetchTemplates();
  } catch {
    error = 'Failed to load templates. Is the server running?';
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl p-6 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-glow">MURMUR</h1>
        <p className="mt-1 text-sm text-[var(--terminal-text-dim)]">
          AI 自演化文字世界 — 观察 AI 角色们的自主对话与博弈
        </p>
      </header>

      {error ? (
        <div className="rounded border border-[var(--char-color-1)] px-4 py-3 text-sm text-[var(--char-color-1)]">
          {error}
        </div>
      ) : (
        <HomeContent templates={templates} />
      )}
    </main>
  );
}
