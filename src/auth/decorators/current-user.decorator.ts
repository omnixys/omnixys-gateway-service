// TODO resolve eslint
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { KeycloakRawOutput } from '../dto/kc-rwa.dto.js';
import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { FastifyRequest } from 'fastify';

export interface CurrentUserData {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];

  access_token: string;
  refresh_token: string;

  raw: KeycloakRawOutput; // full KC payload

  // duplicated raw for convenience
  sub: string;
  preferred_username: string;
  given_name: string;
  family_name: string;
  realm_access: {
    roles: string[];
  };
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUserData | null => {
    const gqlCtx = GqlExecutionContext.create(context);
    const req: FastifyRequest = gqlCtx.getContext().req;

    const user = req.user;

    if (!user) {
      return null;
    }

    return {
      id: user.sub,
      username: user.preferred_username,
      email: user.email,

      firstName: user.given_name,
      lastName: user.family_name,

      roles: user.realm_access?.roles ?? [],

      access_token: user.access_token,
      refresh_token: user.refresh_token,

      raw: user.raw,

      // duplicated raw fields
      sub: user.sub,
      preferred_username: user.preferred_username,
      given_name: user.given_name,
      family_name: user.family_name,
      realm_access: user.realm_access,
    };
  },
);
