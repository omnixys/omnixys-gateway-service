/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// TODO resolve eslint
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { FastifyRequest } from 'fastify';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredRoles.length === 0) {
      return true;
    }

    const gqlCtx = GqlExecutionContext.create(context);
    const req: FastifyRequest = gqlCtx.getContext().req;

    const user = (req as any).user;
    if (!user) {
      throw new ForbiddenException('user not authenticated');
    }

    const roles = user.roles ?? [];
    const allowed = requiredRoles.some((r) => roles.includes(r));

    console.log({
      user,
      roles,
      requiredRoles,
    });

    if (!allowed) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
