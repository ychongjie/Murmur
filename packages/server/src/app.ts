// Fastify application initialization
// Full implementation in Phase 3

import Fastify from 'fastify';

export function buildApp() {
  const app = Fastify({
    logger: {
      level: 'info',
    },
  });

  // TODO: Register plugins, routes, WebSocket handler
  // Phase 3 implementation

  return app;
}
