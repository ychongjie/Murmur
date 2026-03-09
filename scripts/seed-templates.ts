/**
 * Seed script: Import preset world templates into the database.
 * Usage: pnpm db:seed
 */

import { loadAllTemplates } from '@murmur/config';
import { createDbClient, createTemplateRepo } from '@murmur/db';
import type { WorldTemplate } from '@murmur/types';

function templateToConfig(t: WorldTemplate): Record<string, unknown> {
  return {
    id: t.id,
    name: t.name,
    genre: t.genre,
    description: t.description,
    coverEmoji: t.coverEmoji,
    setting: t.setting,
    characters: t.characters,
    director: t.director,
    maxTurns: t.maxTurns,
  };
}

async function main() {
  const db = createDbClient();
  const templateRepo = createTemplateRepo(db);
  const templates = loadAllTemplates();

  process.stderr.write(`Seeding ${templates.length} template(s)...\n`);

  for (const t of templates) {
    const row = await templateRepo.upsert({
      id: t.id,
      name: t.name,
      genre: t.genre,
      description: t.description,
      config: templateToConfig(t),
    });
    process.stderr.write(`  ✓ ${row.id} — ${row.name}\n`);
  }

  process.stderr.write('Seeding complete.\n');
  process.exit(0);
}

main().catch((err: unknown) => {
  process.stderr.write(
    `Seed failed: ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(1);
});
