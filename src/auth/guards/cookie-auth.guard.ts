/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CurrentUserData } from '../decorators/current-user.decorator.js';
import { KeycloakRawOutput } from '../dto/kc-rwa.dto.js';
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
export class CookieAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const gql = GqlExecutionContext.create(context);
    const req: FastifyRequest = gql.getContext().req;

    const cookies = (req as any).cookies ?? {};

    const accessToken: string = cookies.access_token;
    const refreshToken: string = cookies.refresh_token;

    if (!accessToken) {
      throw new UnauthorizedException('Missing access_token cookie');
    }

    let payload: KeycloakRawOutput;
    try {
      payload = this.jwt.decode(accessToken);
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }

    const roles = extractUserRoles(payload);

    const user: CurrentUserData = {
      id: payload.sub,
      username: payload.preferred_username,
      firstName: payload.given_name,
      lastName: payload.family_name,
      email: payload.email,
      roles,

      access_token: accessToken,
      refresh_token: refreshToken,

      raw: payload,
      sub: payload.sub,
      preferred_username: payload.preferred_username,
      given_name: payload.given_name,
      family_name: payload.family_name,
      realm_access: payload.realm_access,
    };

    req.user = user;

    return true;
  }
}
