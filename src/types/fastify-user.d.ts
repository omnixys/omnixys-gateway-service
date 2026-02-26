import type { KeycloakRawOutput } from '../auth/dto/kc-rwa.dto.ts';
import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string; // added
      username: string; // added
      email: string; // added
      roles: string[]; // ✔ CORRECT
      raw: KeycloakRawOutput; // full JWT payload

      sub: string;
      preferred_username: string;
      given_name: string;
      family_name: string;
      realm_access: {
        roles: string[];
      };

      access_token: string;
      refresh_token: string;
    };
  }
}
