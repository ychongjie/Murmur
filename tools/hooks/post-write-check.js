#!/usr/bin/env node

/**
 * PostToolUse hook: Validate files after write.
 *
 * Checks:
 * 1. File size (≤ 300 lines)
 *
 * Exit codes:
 *   0 = no issues
 *   2 = issue found, feedback sent to Claude
 */

import { readFileSync } from 'node:fs';

const MAX_LINES = 300;

try {
  const input = JSON.parse(readFileSync('/dev/stdin', 'utf8'));
  const filePath = input.tool_input?.file_path;

  if (!filePath) process.exit(0);
  if (!filePath.match(/\.(ts|tsx)$/)) process.exit(0);

  const content = readFileSync(filePath, 'utf-8');
  const lineCount = content.split('\n').length;

  if (lineCount > MAX_LINES) {
    process.stderr.write(
      `File too large: ${filePath} has ${lineCount} lines (limit: ${MAX_LINES}).\n` +
        `Fix: Split this file into smaller, focused modules.\n` +
        `See: docs/project-framework.md#4-结构化测试\n`
    );
    process.exit(2);
  }

  process.exit(0);
} catch {
  process.exit(0);
}
