/**
 * @license GPL-3.0-or-later
 * Copyright (C) 2025 Caleb Gyamfi - Omnixys Technologies
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * For more information, visit <https://www.gnu.org/licenses/>.
 */

import { TraceContextProvider } from './trace-context.provider.js';
import { TraceContextUtil, TraceContext } from './trace-context.util.js';
import { Injectable } from '@nestjs/common';
import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export class TraceInterceptor<T = unknown> implements NestInterceptor<T, T> {
  constructor(private readonly traceContextProvider: TraceContextProvider) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<T> {
    const request = context.switchToHttp().getRequest<Request>();
    const headers = (request?.headers ?? {}) as Record<
      string,
      string | string[]
    >;

    // Extrahiere Trace-Kontext mit klar definiertem Typ
    const trace: TraceContext = TraceContextUtil.fromHeaders(headers);
    this.traceContextProvider.setContext(trace);

    return next.handle();
  }
}
