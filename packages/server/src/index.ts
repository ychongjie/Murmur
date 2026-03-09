// Server entry point
// Full implementation in Phase 3

import { buildApp } from './app.js';

const app = buildApp();

const start = async () => {
  const port = Number(process.env['PORT'] ?? 3001);
  await app.listen({ port, host: '0.0.0.0' });
};

start().catch((err) => {
  app.log.error(err);
  process.exit(1);
});
