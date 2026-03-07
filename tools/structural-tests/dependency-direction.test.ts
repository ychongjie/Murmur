import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const PACKAGES_DIR = join(import.meta.dirname, '../../packages');

const LAYER_ORDER: Record<string, number> = {
  '@murmur/types': 0,
  '@murmur/config': 1,
  '@murmur/db': 2,
  '@murmur/service': 3,
  '@murmur/server': 4,
  '@murmur/web': 5,
};

const PKG_TO_NAME: Record<string, string> = {
  types: '@murmur/types',
  config: '@murmur/config',
  db: '@murmur/db',
  service: '@murmur/service',
  server: '@murmur/server',
  web: '@murmur/web',
};

function walkTs(dir: string, results: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (['node_modules', 'dist', '.next'].includes(entry)) continue;
      walkTs(full, results);
    } else if (['.ts', '.tsx'].includes(extname(entry))) {
      results.push(full);
    }
  }
  return results;
}

function getImports(filePath: string): string[] {
  const content = readFileSync(filePath, 'utf-8');
  const matches = content.matchAll(
    /from\s+['"](@murmur\/\w+)/g
  );
  return [...matches].map((m) => m[1]);
}

function getAllImportsForPackage(pkgDir: string): string[] {
  const srcDir = join(pkgDir, 'src');
  try {
    const files = walkTs(srcDir);
    const imports = new Set<string>();
    for (const file of files) {
      for (const imp of getImports(file)) {
        imports.add(imp);
      }
    }
    return [...imports];
  } catch {
    return [];
  }
}

describe('Dependency direction compliance', () => {
  it('types layer should have no internal package dependencies', () => {
    const imports = getAllImportsForPackage(join(PACKAGES_DIR, 'types'));
    const internal = imports.filter((i) => i.startsWith('@murmur/'));
    expect(internal).toEqual([]);
  });

  it('config layer should only depend on types', () => {
    const imports = getAllImportsForPackage(join(PACKAGES_DIR, 'config'));
    const internal = imports.filter((i) => i.startsWith('@murmur/'));
    for (const imp of internal) {
      expect(LAYER_ORDER[imp]).toBeLessThanOrEqual(0);
    }
  });

  it('db layer should only depend on types and config', () => {
    const imports = getAllImportsForPackage(join(PACKAGES_DIR, 'db'));
    const internal = imports.filter((i) => i.startsWith('@murmur/'));
    for (const imp of internal) {
      expect(LAYER_ORDER[imp]).toBeLessThanOrEqual(1);
    }
  });

  it('service layer should not depend on server or web', () => {
    const imports = getAllImportsForPackage(
      join(PACKAGES_DIR, 'service')
    );
    expect(imports).not.toContain('@murmur/server');
    expect(imports).not.toContain('@murmur/web');
  });

  it('server layer should not depend on web', () => {
    const imports = getAllImportsForPackage(
      join(PACKAGES_DIR, 'server')
    );
    expect(imports).not.toContain('@murmur/web');
  });

  it('web layer should only depend on types', () => {
    const imports = getAllImportsForPackage(join(PACKAGES_DIR, 'web'));
    const internal = imports.filter((i) => i.startsWith('@murmur/'));
    for (const imp of internal) {
      expect(imp).toBe('@murmur/types');
    }
  });

  for (const [pkg, name] of Object.entries(PKG_TO_NAME)) {
    it(`${name} should not import from higher layers`, () => {
      const myLayer = LAYER_ORDER[name]!;
      const imports = getAllImportsForPackage(
        join(PACKAGES_DIR, pkg)
      );
      for (const imp of imports) {
        const impLayer = LAYER_ORDER[imp];
        if (impLayer !== undefined) {
          expect(
            impLayer,
            `${name} (Layer ${myLayer}) should not import ${imp} (Layer ${impLayer}). ` +
              `Fix: move shared types to @murmur/types, or inject via function params. ` +
              `See docs/project-framework.md#3`
          ).toBeLessThan(myLayer);
        }
      }
    });
  }
});
