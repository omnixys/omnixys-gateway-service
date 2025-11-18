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

    const invitation = req.invitation;

    if (!invitation) {
      return null;
    }

    return {
      id: invitation.sub,
      username: invitation.preferred_username,
      email: invitation.email,

      firstName: invitation.given_name,
      lastName: invitation.family_name,

      roles: invitation.realm_access?.roles ?? [],

      access_token: invitation.access_token,
      refresh_token: invitation.refresh_token,

      raw: invitation.raw,

      // duplicated raw fields
      sub: invitation.sub,
      preferred_username: invitation.preferred_username,
      given_name: invitation.given_name,
      family_name: invitation.family_name,
      realm_access: invitation.realm_access,
    };
  },
);
