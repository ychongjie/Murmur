// Global error handler middleware for Fastify

import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export interface AppError {
  statusCode: number;
  code: string;
  message: string;
}

export function errorHandler(
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply,
): void {
  const statusCode = error.statusCode ?? 500;
  const code = error.code ?? 'INTERNAL_ERROR';

  if (statusCode >= 500) {
    _request.log.error({ event: 'unhandled_error', err: error });
  }

  void reply.status(statusCode).send({
    error: {
      code,
      message: statusCode >= 500 ? 'Internal server error' : error.message,
    },
  });
}
