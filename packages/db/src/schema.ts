import {
  pgTable,
  text,
  integer,
  jsonb,
  timestamp,
  serial,
  uuid,
} from 'drizzle-orm/pg-core';

export const worldTemplates = pgTable('world_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  genre: text('genre'),
  description: text('description'),
  config: jsonb('config').notNull(),
  authorId: text('author_id'),
  playCount: integer('play_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const worldInstances = pgTable('world_instances', {
  id: uuid('id').defaultRandom().primaryKey(),
  templateId: text('template_id')
    .references(() => worldTemplates.id)
    .notNull(),
  status: text('status', {
    enum: ['frozen', 'running', 'ended'],
  })
    .default('frozen')
    .notNull(),
  currentTurn: integer('current_turn').default(0).notNull(),
  observerCount: integer('observer_count').default(0).notNull(),
  worldState: jsonb('world_state'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
});

export const worldEvents = pgTable('world_events', {
  id: serial('id').primaryKey(),
  instanceId: uuid('instance_id')
    .references(() => worldInstances.id)
    .notNull(),
  turn: integer('turn').notNull(),
  eventType: text('event_type', {
    enum: ['narration', 'dialogue', 'event', 'ending'],
  }).notNull(),
  characterId: text('character_id'),
  content: text('content').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const novels = pgTable('novels', {
  id: uuid('id').defaultRandom().primaryKey(),
  instanceId: uuid('instance_id')
    .references(() => worldInstances.id)
    .notNull(),
  style: text('style', {
    enum: ['literary', 'webnovel', 'commentary'],
  }).notNull(),
  content: text('content').notNull(),
  wordCount: integer('word_count'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
