// World instance routes

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { EventRepo } from '@murmur/db';
import type { InstanceManager } from '@murmur/service';

const createBodySchema = z.object({
  templateId: z.string().min(1),
});

const idParamsSchema = z.object({
  id: z.string().uuid(),
});

const eventsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export function registerInstanceRoutes(
  app: FastifyInstance,
  instanceManager: InstanceManager,
  eventRepo: EventRepo,
): void {
  app.post('/api/instances', async (request, reply) => {
    const body = createBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_BODY', message: body.error.message },
      });
    }

    const result = await instanceManager.createInstance(body.data.templateId);
    if (!result.ok) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: result.error.message },
      });
    }

    return reply.status(201).send(result.value);
  });

  app.get('/api/instances/:id', async (request, reply) => {
    const params = idParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_PARAMS', message: params.error.message },
      });
    }

    const result = await instanceManager.getInstance(params.data.id);
    if (!result.ok) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: result.error.message },
      });
    }

    return reply.send(result.value);
  });

  app.get('/api/instances/:id/events', async (request, reply) => {
    const params = idParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_PARAMS', message: params.error.message },
      });
    }

    const query = eventsQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_QUERY', message: query.error.message },
      });
    }

    const events = await eventRepo.findByInstanceId(params.data.id, {
      limit: query.data.limit,
      offset: query.data.offset,
    });

    return reply.send(events);
  });
}
