import type { FastifyRequest } from 'fastify';

export class TokenExtractor {
  // Extracts Bearer token from Authorization header
  static fromHeader(req: FastifyRequest): string | null {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return null;
    }
    return header.substring(7).trim();
  }

  // Extract access_token cookie
  static fromCookie(req: FastifyRequest): string | null {
    const cookies = req.cookies;
    if (!cookies) {
      return null;
    }
    return cookies.access_token ?? null;
  }

  // Extract refresh_token cookie
  static refreshFromCookie(req: FastifyRequest): string | null {
    const cookies = req.cookies;
    if (!cookies) {
      return null;
    }
    return cookies.refresh_token ?? null;
  }
}
