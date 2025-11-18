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

/**
 * Security configuration module for Fastify.
 * Provides HTTP security headers such as CSP, HSTS, X-Frame-Options,
 * X-Content-Type-Options, and others through @fastify/helmet.
 * @packageDocumentation
 */

import helmet from '@fastify/helmet';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

/**
 * Registers @fastify/helmet with predefined security settings.
 *
 * @param app Fastify instance
 */
export async function registerHelmet(
  app: NestFastifyApplication,
): Promise<void> {
  await app.register(helmet, {
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'", 'https:'],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https:'],
        imgSrc: ["'self'", 'data:'],
      },
      reportOnly: false,
    },
    // Strict Transport Security
    hsts: {
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true,
    },
    // Hide X-Powered-By header
    hidePoweredBy: true,
    // Prevent MIME sniffing
    noSniff: true,
    // Frameguard (click-jacking)
    frameguard: {
      action: 'sameorigin',
    },
  });
}
