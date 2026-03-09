import { eq } from 'drizzle-orm';
import type { WorldStatus } from '@murmur/types';
import type { Database } from '../client.js';
import { worldInstances } from '../schema.js';

export interface CreateInstanceInput {
  templateId: string;
}

export function createInstanceRepo(db: Database) {
  return {
    async findById(id: string) {
      const rows = await db
        .select()
        .from(worldInstances)
        .where(eq(worldInstances.id, id));
      return rows[0] ?? null;
    },

    async findByTemplateId(templateId: string) {
      return db
        .select()
        .from(worldInstances)
        .where(eq(worldInstances.templateId, templateId));
    },

    async create(input: CreateInstanceInput) {
      const rows = await db
        .insert(worldInstances)
        .values({ templateId: input.templateId })
        .returning();
      return rows[0]!;
    },

    async updateStatus(id: string, status: WorldStatus) {
      const set: Record<string, unknown> = { status };
      if (status === 'ended') {
        set['endedAt'] = new Date();
      }
      const rows = await db
        .update(worldInstances)
        .set(set)
        .where(eq(worldInstances.id, id))
        .returning();
      return rows[0] ?? null;
    },

    async incrementTurn(id: string) {
      const current = await db
        .select({ currentTurn: worldInstances.currentTurn })
        .from(worldInstances)
        .where(eq(worldInstances.id, id));
      if (!current[0]) return null;
      const rows = await db
        .update(worldInstances)
        .set({ currentTurn: current[0].currentTurn + 1 })
        .where(eq(worldInstances.id, id))
        .returning();
      return rows[0] ?? null;
    },

    async updateObserverCount(id: string, count: number) {
      const rows = await db
        .update(worldInstances)
        .set({ observerCount: count })
        .where(eq(worldInstances.id, id))
        .returning();
      return rows[0] ?? null;
    },

    async updateWorldState(
      id: string,
      state: Record<string, unknown>,
    ) {
      const rows = await db
        .update(worldInstances)
        .set({ worldState: state })
        .where(eq(worldInstances.id, id))
        .returning();
      return rows[0] ?? null;
    },
  };
}

export type InstanceRepo = ReturnType<typeof createInstanceRepo>;
