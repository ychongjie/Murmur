import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import type { WorldTemplate } from '@murmur/types';
import { worldTemplateYamlSchema } from './template-schema.js';
import type { WorldTemplateYaml } from './template-schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function resolveTemplatesDir(): string {
  // When running from src/ (tsx) → src/templates/
  // When running from dist/ (compiled) → try src/templates/ relative to package root
  const fromCurrent = join(__dirname, 'templates');
  try {
    readdirSync(fromCurrent);
    return fromCurrent;
  } catch {
    // Fallback: dist/ → go up to package root, then src/templates/
    return join(__dirname, '..', 'src', 'templates');
  }
}

const TEMPLATES_DIR = resolveTemplatesDir();

function yamlToWorldTemplate(raw: WorldTemplateYaml): WorldTemplate {
  return {
    id: raw.id,
    name: raw.name,
    genre: raw.genre,
    description: raw.description,
    coverEmoji: raw.cover_emoji,
    setting: {
      background: raw.setting.background,
      tone: raw.setting.tone,
      era: raw.setting.era,
    },
    characters: raw.characters.map((c) => ({
      id: c.id,
      name: c.name,
      role: c.role,
      personality: c.personality,
      secret: c.secret,
      relationships: c.relationships,
      speechStyle: c.speech_style,
    })),
    director: {
      pacing: raw.director.pacing,
      eventTriggers: raw.director.event_triggers.map((t) => ({
        condition: t.condition,
        action: t.action,
      })),
      endingConditions: raw.director.ending_conditions,
    },
    maxTurns: raw.max_turns,
  };
}

export function loadTemplate(id: string): WorldTemplate {
  const filePath = join(TEMPLATES_DIR, `${id}.yaml`);
  const content = readFileSync(filePath, 'utf-8');
  const parsed = parseYaml(content) as unknown;
  const validated = worldTemplateYamlSchema.parse(parsed);
  return yamlToWorldTemplate(validated);
}

export function loadAllTemplates(): WorldTemplate[] {
  const files = readdirSync(TEMPLATES_DIR).filter((f) =>
    f.endsWith('.yaml'),
  );
  return files.map((f) => {
    const id = f.replace(/\.yaml$/, '');
    return loadTemplate(id);
  });
}
