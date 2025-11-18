import type { FastifyRequest, FastifyReply } from 'fastify';

export interface GqlFastifyContext {
  req: FastifyRequest;
  res: FastifyReply;
}
