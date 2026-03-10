// Server entry point

import pino from 'pino';
import { buildApp } from './app.js';

const logger = pino({ name: 'server' });

const start = async () => {
  const { app } = await buildApp();
  const port = Number(process.env['PORT'] ?? 3001);
  await app.listen({ port, host: '0.0.0.0' });
};

start().catch((err: unknown) => {
  logger.error({ event: 'startup_failed', err });
  process.exit(1);
});
