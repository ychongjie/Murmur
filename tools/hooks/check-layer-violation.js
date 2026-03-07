#!/usr/bin/env node

/**
 * PreToolUse hook: Check for dependency layer violations before file writes.
 *
 * Reads Claude Code tool input from stdin, checks if the file being written
 * contains imports that violate the dependency layering rules.
 *
 * Exit codes:
 *   0 = allow the write
 *   2 = block the write and send feedback to Claude
 */

import { readFileSync } from 'node:fs';

const LAYERS = {
  'packages/types/': 0,
  'packages/config/': 1,
  'packages/db/': 2,
  'packages/service/': 3,
  'packages/server/': 4,
  'packages/web/': 5,
};

try {
  const input = JSON.parse(readFileSync('/dev/stdin', 'utf8'));
  const filePath = input.tool_input?.file_path;

  if (!filePath) process.exit(0);

  // Find which layer this file belongs to
  const fileLayerEntry = Object.entries(LAYERS).find(([prefix]) =>
    filePath.includes(prefix)
  );

  if (!fileLayerEntry) process.exit(0); // Not a packages file, allow

  const [, fileLayer] = fileLayerEntry;

  // Check content for @murmur/ imports
  const content =
    input.tool_input?.new_string || input.tool_input?.content || '';
  const imports = content.match(/@murmur\/\w+/g) || [];

  for (const imp of imports) {
    const pkg = imp.replace('@murmur/', '');
    const importLayerValue = LAYERS[`packages/${pkg}/`];
    if (
      importLayerValue !== undefined &&
      importLayerValue >= fileLayer &&
      pkg !== 'types'
    ) {
      process.stderr.write(
        `Dependency violation: Layer ${fileLayer} file cannot import ${imp} (Layer ${importLayerValue}).\n` +
          `Fix: Move shared types to @murmur/types, or inject via function params.\n` +
          `See: docs/project-framework.md#3-依赖分层规则\n`
      );
      process.exit(2);
    }
  }

  process.exit(0);
} catch {
  // If we can't parse input, allow the write
  process.exit(0);
}
