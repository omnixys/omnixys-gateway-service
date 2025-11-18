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

import { getLogger } from './get-logger.js';
import { Injectable, type NestMiddleware } from '@nestjs/common';
import { type NextFunction, type Request, type Response } from 'express';

/**
 * Die Middleware (-Funktion) wird vor dem "Route Handler" aufgerufen.
 * `RequestLoggerMiddleware` protokolliert die HTTP-Methode, die aufgerufene
 * URL und den Request-Header.
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  readonly #logger = getLogger(RequestLoggerMiddleware.name);

  /**
   * @param req Request-Objekt von Express
   * @param _res Nicht-verwendetes Response-Objekt von Express
   * @param next Funktion der als nächstes aufzurufenden Middleware
   */
  use(req: Request, _res: Response, next: NextFunction): void {
    const { method, originalUrl, headers } = req;
    this.#logger.debug(
      'method=%s, url=%s, header=%o',
      method,
      originalUrl,
      headers,
    );
    next();
  }
}
