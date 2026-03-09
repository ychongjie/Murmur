import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'structural',
          include: ['tools/structural-tests/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'unit',
          include: ['packages/*/src/**/*.test.ts'],
        },
      },
    ],
  },
});
