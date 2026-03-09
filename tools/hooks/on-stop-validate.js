#!/usr/bin/env node

/**
 * Stop hook: Final validation before Claude finishes.
 *
 * Runs typecheck and lint to catch any remaining issues.
 *
 * Exit codes:
 *   0 = all good
 *   2 = issues found, Claude should continue fixing
 */

import { execSync } from 'node:child_process';

const checks = [
  { name: 'typecheck', cmd: 'pnpm typecheck' },
  { name: 'lint', cmd: 'pnpm lint' },
];

const failures = [];

for (const check of checks) {
  try {
    execSync(check.cmd, { stdio: 'pipe', timeout: 120_000 });
  } catch (err) {
    const output = err.stdout?.toString().slice(-500) || '';
    const stderr = err.stderr?.toString().slice(-500) || '';
    failures.push({ name: check.name, output, stderr });
  }
}

if (failures.length > 0) {
  const msg = failures
    .map(
      (f) =>
        `${f.name} failed:\n${f.output}\n${f.stderr}`
    )
    .join('\n---\n');
  process.stderr.write(
    `Stop hook: ${failures.length} check(s) failed. Please fix before finishing.\n\n${msg}\n`
  );
  process.exit(2);
}

process.exit(0);
