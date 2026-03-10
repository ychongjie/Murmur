// World template routes

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { TemplateRepo } from '@murmur/db';

const paramsSchema = z.object({
  id: z.string().min(1),
});

export function registerTemplateRoutes(
  app: FastifyInstance,
  templateRepo: TemplateRepo,
): void {
  app.get('/api/templates', async (_request, reply) => {
    const templates = await templateRepo.findAll();
    const result = templates.map((t) => ({
      id: t.id,
      name: t.name,
      genre: t.genre,
      description: t.description,
      playCount: t.playCount,
      createdAt: t.createdAt,
    }));
    return reply.send(result);
  });

  app.get('/api/templates/:id', async (request, reply) => {
    const params = paramsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_PARAMS', message: params.error.message },
      });
    }

    const template = await templateRepo.findById(params.data.id);
    if (!template) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: `Template not found: ${params.data.id}` },
      });
    }

    return reply.send({
      id: template.id,
      name: template.name,
      genre: template.genre,
      description: template.description,
      config: template.config,
      playCount: template.playCount,
      createdAt: template.createdAt,
    });
  });
}
