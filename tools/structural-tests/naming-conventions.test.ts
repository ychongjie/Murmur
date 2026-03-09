import { describe, it, expect } from 'vitest';
import { readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const PACKAGES_DIR = join(import.meta.dirname, '../../packages');

function safeReaddir(dir: string): string[] {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}

describe('Naming conventions', () => {
  it('repo files should end with .repo.ts', () => {
    const repoDir = join(PACKAGES_DIR, 'db/src/repos');
    if (!existsSync(repoDir)) return;
    const files = safeReaddir(repoDir).filter(
      (f) => f !== 'index.ts' && f.endsWith('.ts')
    );
    for (const f of files) {
      expect(f, `Repo file ${f} should end with .repo.ts`).toMatch(
        /\.repo\.ts$/
      );
    }
  });

  it('route files should end with .routes.ts', () => {
    const routeDir = join(PACKAGES_DIR, 'server/src/routes');
    if (!existsSync(routeDir)) return;
    const files = safeReaddir(routeDir).filter(
      (f) => f !== 'index.ts' && f.endsWith('.ts')
    );
    for (const f of files) {
      expect(
        f,
        `Route file ${f} should end with .routes.ts`
      ).toMatch(/\.routes\.ts$/);
    }
  });

  it('component files should use PascalCase', () => {
    const componentDir = join(PACKAGES_DIR, 'web/src/components');
    if (!existsSync(componentDir)) return;
    const files = safeReaddir(componentDir).filter(
      (f) => f.endsWith('.tsx')
    );
    for (const f of files) {
      expect(
        basename(f),
        `Component file ${f} should start with uppercase (PascalCase)`
      ).toMatch(/^[A-Z]/);
    }
  });
});
