import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const PACKAGES_DIR = join(import.meta.dirname, '../../packages');

const PACKAGES = ['types', 'config', 'db', 'service', 'server', 'web'];

describe('Layer isolation', () => {
  it('each package should have a package.json', () => {
    for (const pkg of PACKAGES) {
      const pkgJsonPath = join(PACKAGES_DIR, pkg, 'package.json');
      expect(
        existsSync(pkgJsonPath),
        `${pkg} should have a package.json`
      ).toBe(true);
    }
  });

  it('each package should have a tsconfig.json', () => {
    for (const pkg of PACKAGES) {
      const tsconfigPath = join(PACKAGES_DIR, pkg, 'tsconfig.json');
      expect(
        existsSync(tsconfigPath),
        `${pkg} should have a tsconfig.json`
      ).toBe(true);
    }
  });

  it('types package should have zero internal dependencies', () => {
    const pkgJson = JSON.parse(
      readFileSync(
        join(PACKAGES_DIR, 'types', 'package.json'),
        'utf-8'
      )
    );
    const deps = Object.keys(pkgJson.dependencies ?? {});
    const internal = deps.filter((d) => d.startsWith('@murmur/'));
    expect(
      internal,
      '@murmur/types should have no @murmur/* dependencies'
    ).toEqual([]);
  });

  it('web package should only depend on @murmur/types', () => {
    const pkgJson = JSON.parse(
      readFileSync(
        join(PACKAGES_DIR, 'web', 'package.json'),
        'utf-8'
      )
    );
    const deps = [
      ...Object.keys(pkgJson.dependencies ?? {}),
      ...Object.keys(pkgJson.devDependencies ?? {}),
    ];
    const internal = deps.filter((d) => d.startsWith('@murmur/'));
    expect(internal).toEqual(['@murmur/types']);
  });
});
