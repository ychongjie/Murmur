import { z } from 'zod';

const characterSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  name: z.string().min(1),
  role: z.string().min(1),
  personality: z.string().min(1),
  secret: z.string().min(1),
  relationships: z.record(z.string(), z.string()),
  speech_style: z.string().min(1),
});

const eventTriggerSchema = z.object({
  condition: z.string().min(1),
  action: z.string().min(1),
});

const directorSchema = z.object({
  pacing: z.string().min(1),
  event_triggers: z.array(eventTriggerSchema).min(1),
  ending_conditions: z.array(z.string().min(1)).min(1),
});

const settingSchema = z.object({
  background: z.string().min(1),
  tone: z.string().min(1),
  era: z.string().min(1),
});

export const worldTemplateYamlSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  name: z.string().min(1),
  genre: z.string().min(1),
  description: z.string().min(1),
  cover_emoji: z.string().min(1),
  setting: settingSchema,
  characters: z.array(characterSchema).min(2).max(6),
  director: directorSchema,
  max_turns: z.number().int().positive(),
});

export type WorldTemplateYaml = z.infer<typeof worldTemplateYamlSchema>;
