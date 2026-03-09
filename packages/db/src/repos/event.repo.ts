import { eq, desc, asc } from 'drizzle-orm';
import type { WorldEventType } from '@murmur/types';
import type { Database } from '../client.js';
import { worldEvents } from '../schema.js';

export interface CreateEventInput {
  instanceId: string;
  turn: number;
  eventType: WorldEventType;
  characterId?: string | null;
  content: string;
  metadata?: Record<string, unknown> | null;
}

export function createEventRepo(db: Database) {
  return {
    async create(input: CreateEventInput) {
      const rows = await db
        .insert(worldEvents)
        .values({
          instanceId: input.instanceId,
          turn: input.turn,
          eventType: input.eventType,
          characterId: input.characterId ?? null,
          content: input.content,
          metadata: input.metadata ?? null,
        })
        .returning();
      return rows[0]!;
    },

    async findByInstanceId(
      instanceId: string,
      opts?: { limit?: number; offset?: number },
    ) {
      const limit = opts?.limit ?? 50;
      const offset = opts?.offset ?? 0;
      return db
        .select()
        .from(worldEvents)
        .where(eq(worldEvents.instanceId, instanceId))
        .orderBy(asc(worldEvents.turn), asc(worldEvents.id))
        .limit(limit)
        .offset(offset);
    },

    async findRecent(instanceId: string, limit: number = 20) {
      return db
        .select()
        .from(worldEvents)
        .where(eq(worldEvents.instanceId, instanceId))
        .orderBy(desc(worldEvents.id))
        .limit(limit);
    },

    async countByInstanceId(instanceId: string) {
      const rows = await db
        .select({ id: worldEvents.id })
        .from(worldEvents)
        .where(eq(worldEvents.instanceId, instanceId));
      return rows.length;
    },
  };
}

export type EventRepo = ReturnType<typeof createEventRepo>;
