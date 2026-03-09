CREATE TABLE IF NOT EXISTS "world_templates" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "genre" text,
  "description" text,
  "config" jsonb NOT NULL,
  "author_id" text,
  "play_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "world_instances" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "template_id" text NOT NULL REFERENCES "world_templates"("id"),
  "status" text DEFAULT 'frozen' NOT NULL,
  "current_turn" integer DEFAULT 0 NOT NULL,
  "observer_count" integer DEFAULT 0 NOT NULL,
  "world_state" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "ended_at" timestamp
);

CREATE TABLE IF NOT EXISTS "world_events" (
  "id" serial PRIMARY KEY NOT NULL,
  "instance_id" uuid NOT NULL REFERENCES "world_instances"("id"),
  "turn" integer NOT NULL,
  "event_type" text NOT NULL,
  "character_id" text,
  "content" text NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "novels" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "instance_id" uuid NOT NULL REFERENCES "world_instances"("id"),
  "style" text NOT NULL,
  "content" text NOT NULL,
  "word_count" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_world_events_instance_id"
  ON "world_events" ("instance_id");

CREATE INDEX IF NOT EXISTS "idx_world_events_instance_turn"
  ON "world_events" ("instance_id", "turn");

CREATE INDEX IF NOT EXISTS "idx_world_instances_template_id"
  ON "world_instances" ("template_id");
