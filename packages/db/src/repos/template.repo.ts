import { eq } from 'drizzle-orm';
import type { Database } from '../client.js';
import { worldTemplates } from '../schema.js';

export interface CreateTemplateInput {
  id: string;
  name: string;
  genre: string | null;
  description: string | null;
  config: Record<string, unknown>;
  authorId?: string | null;
}

export function createTemplateRepo(db: Database) {
  return {
    async findAll() {
      return db.select().from(worldTemplates);
    },

    async findById(id: string) {
      const rows = await db
        .select()
        .from(worldTemplates)
        .where(eq(worldTemplates.id, id));
      return rows[0] ?? null;
    },

    async create(input: CreateTemplateInput) {
      const rows = await db
        .insert(worldTemplates)
        .values({
          id: input.id,
          name: input.name,
          genre: input.genre,
          description: input.description,
          config: input.config,
          authorId: input.authorId ?? null,
        })
        .returning();
      return rows[0]!;
    },

    async upsert(input: CreateTemplateInput) {
      const rows = await db
        .insert(worldTemplates)
        .values({
          id: input.id,
          name: input.name,
          genre: input.genre,
          description: input.description,
          config: input.config,
          authorId: input.authorId ?? null,
        })
        .onConflictDoUpdate({
          target: worldTemplates.id,
          set: {
            name: input.name,
            genre: input.genre,
            description: input.description,
            config: input.config,
          },
        })
        .returning();
      return rows[0]!;
    },

    async incrementPlayCount(id: string) {
      const current = await db
        .select({ playCount: worldTemplates.playCount })
        .from(worldTemplates)
        .where(eq(worldTemplates.id, id));
      if (!current[0]) return null;
      const rows = await db
        .update(worldTemplates)
        .set({ playCount: current[0].playCount + 1 })
        .where(eq(worldTemplates.id, id))
        .returning();
      return rows[0] ?? null;
    },
  };
}

export type TemplateRepo = ReturnType<typeof createTemplateRepo>;
