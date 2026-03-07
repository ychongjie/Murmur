/**
 * Custom lint rule: No cross-layer imports
 *
 * Enforces the dependency layering rule:
 *   types(0) → config(1) → db(2) → service(3) → server(4) → web(5)
 *
 * Each layer can only import from layers with a lower index.
 * Exception: all layers can import @murmur/types (Layer 0).
 *
 * This file is used by:
 * 1. The structural test (dependency-direction.test.ts)
 * 2. The Claude Code PreToolUse hook (check-layer-violation.js)
 */

export const LAYER_ORDER: Record<string, number> = {
  '@murmur/types': 0,
  '@murmur/config': 1,
  '@murmur/db': 2,
  '@murmur/service': 3,
  '@murmur/server': 4,
  '@murmur/web': 5,
};

export const PACKAGE_DIR_TO_LAYER: Record<string, number> = {
  'packages/types/': 0,
  'packages/config/': 1,
  'packages/db/': 2,
  'packages/service/': 3,
  'packages/server/': 4,
  'packages/web/': 5,
};

export function getLayerFromPath(filePath: string): number | null {
  for (const [dir, layer] of Object.entries(PACKAGE_DIR_TO_LAYER)) {
    if (filePath.includes(dir)) return layer;
  }
  return null;
}

export function getLayerFromPackage(pkgName: string): number | null {
  return LAYER_ORDER[pkgName] ?? null;
}

export function isValidImport(
  sourceLayer: number,
  targetPkg: string
): boolean {
  const targetLayer = getLayerFromPackage(targetPkg);
  if (targetLayer === null) return true; // External package, allow
  if (targetPkg === '@murmur/types') return true; // Types is always allowed
  return targetLayer < sourceLayer;
}
