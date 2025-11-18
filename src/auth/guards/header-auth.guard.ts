// TODO resolve eslint

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { CurrentUserData } from '../decorators/current-user.decorator.js';
import { KeycloakRawOutput } from '../dto/kc-rwa.dto.js';
import { TokenExtractor } from '../lib/token-extractor.js';
import { extractUserRoles } from '../utils/extract-roles.util.js';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { FastifyRequest } from 'fastify';

@Injectable()
export class HeaderAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlCtx = GqlExecutionContext.create(context);
    const req: FastifyRequest = gqlCtx.getContext().req;

    const token = TokenExtractor.fromHeader(req);
    if (!token) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    let payload: KeycloakRawOutput;
    try {
      payload = this.jwt.decode(token);
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }

    const roles = extractUserRoles(payload);

    const invitation: CurrentUserData = {
      id: payload.sub,
      username: payload.preferred_username,
      firstName: payload.given_name,
      lastName: payload.family_name,
      email: payload.email,
      roles,

      access_token: token,
      refresh_token: '',

      raw: payload,
      sub: payload.sub,
      preferred_username: payload.preferred_username,
      given_name: payload.given_name,
      family_name: payload.family_name,
      realm_access: payload.realm_access,
    };

    req.invitation = invitation;

    return true;
  }
}
