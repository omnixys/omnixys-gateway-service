import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    cookies: {
      access_token?: string;
      refresh_token?: string;
      [key: string]: string | undefined;
    };
  }
}
