/**
 * Rule: Enforce file size limit
 *
 * Single .ts/.tsx files must not exceed 300 lines.
 * This keeps files focused and easy to understand.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

export const MAX_LINES = 300;

export function checkFileSize(filePath: string): {
  ok: boolean;
  lines: number;
} {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').length;
  return { ok: lines <= MAX_LINES, lines };
}

function walkDir(dir: string, results: string[] = []): string[] {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (
        entry === 'node_modules' ||
        entry === 'dist' ||
        entry === '.next'
      ) {
        continue;
      }
      walkDir(fullPath, results);
    } else if (['.ts', '.tsx'].includes(extname(entry))) {
      results.push(fullPath);
    }
  }
  return results;
}

export function checkAllFiles(
  packagesDir: string
): { file: string; lines: number }[] {
  const files = walkDir(packagesDir);
  const violations: { file: string; lines: number }[] = [];
  for (const file of files) {
    const result = checkFileSize(file);
    if (!result.ok) {
      violations.push({ file, lines: result.lines });
    }
  }
  return violations;
}
