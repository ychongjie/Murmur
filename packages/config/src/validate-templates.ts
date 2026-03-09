#!/usr/bin/env tsx

/**
 * Validate world template YAML files against the zod schema.
 * Run: pnpm validate:templates
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { worldTemplateYamlSchema } from './template-schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, 'templates');

const files = readdirSync(TEMPLATES_DIR).filter((f) => f.endsWith('.yaml'));

if (files.length === 0) {
  console.error('validate-templates: No YAML files found in', TEMPLATES_DIR);
  process.exit(1);
}

let hasErrors = false;

for (const file of files) {
  const filePath = join(TEMPLATES_DIR, file);
  const content = readFileSync(filePath, 'utf-8');

  try {
    const parsed = parseYaml(content) as unknown;
    worldTemplateYamlSchema.parse(parsed);
    console.error(`  ✓ ${file}`);
  } catch (err) {
    hasErrors = true;
    console.error(`  ✗ ${file}`);
    if (err instanceof Error && 'issues' in err) {
      const zodErr = err as {
        issues: Array<{ path: (string | number)[]; message: string }>;
      };
      for (const issue of zodErr.issues) {
        console.error(`    → ${issue.path.join('.')}: ${issue.message}`);
      }
    } else {
      console.error(`    → ${String(err)}`);
    }
  }
}

if (hasErrors) {
  console.error(
    '\nTemplate validation failed. See docs/world-template-schema.md',
  );
  process.exit(1);
}

console.error('\nAll templates valid.');
