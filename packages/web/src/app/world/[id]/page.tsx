import { fetchInstance, fetchTemplate } from '../../../lib/api';
import { WorldViewer } from '../../../components/WorldViewer';

export default async function WorldPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let instance: Awaited<ReturnType<typeof fetchInstance>> | null = null;
  let templateConfig: Awaited<ReturnType<typeof fetchTemplate>> | null = null;
  let error: string | null = null;

  try {
    instance = await fetchInstance(id);
    templateConfig = await fetchTemplate(instance.templateId);
  } catch {
    error = 'Failed to load world. Is the server running?';
  }

  if (error || !instance || !templateConfig) {
    return (
      <main className="mx-auto min-h-screen max-w-5xl p-6 md:p-8">
        <div className="rounded border border-[var(--char-color-1)] px-4 py-3 text-sm text-[var(--char-color-1)]">
          {error ?? 'World not found'}
        </div>
      </main>
    );
  }

  const characters = (templateConfig.config.characters ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    role: c.role,
    personality: c.personality,
  }));

  return (
    <WorldViewer
      instanceId={instance.id}
      worldName={templateConfig.name}
      characters={characters}
    />
  );
}
