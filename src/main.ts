/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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

import { AppModule } from './app.module.js';
import { corsOptions } from './config/cors.js';
import { startOtelSDK } from './config/otel.js';
import compress from '@fastify/compress';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
// import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import 'reflect-metadata';

/**
 * @file main.ts
 * @description Einstiegspunkt der Anwendung.
 *
 * Diese Datei bootstrapped die NestJS-Applikation mit dem {@link AppModule}
 * und konfiguriert globale Features wie:
 *
 * - Verwendung von **Fastify** als HTTP-Adapter (statt Express)
 * - Globale Middleware-Registrierung (CORS, Helmet, Kompression, ETag)
 * - Aktivierung globaler **ValidationPipes** für DTO-Validierung
 * - Swagger-Integration für API-Dokumentation
 *
 * @remarks
 * Dieses File wird beim Start des Containers oder via `pnpm start:dev` ausgeführt.
 * Entwickler:innen müssen diese Datei i. d. R. **nicht verändern**, außer bei
 * Hinzufügen globaler Middleware, Security-Plugins oder Startup-Logik.
 *
 * @see AppModule
 * @see corsOptions
 * @see ValidationPipe
 * @see FastifyAdapter
 *
 * @example
 * ```bash
 * pnpm start:dev
 * ```
 *
 * Startet den Backend-Server auf dem konfigurierten Port (Standard: `4000`).
 */
async function bootstrap(): Promise<void> {
  await startOtelSDK(); // 🔥 OTel aktivieren
  /**
   * @constant app
   * @description Erstellt die NestJS-Applikation auf Basis von Fastify.
   *
   * Der {@link FastifyAdapter} ersetzt den standardmäßigen Express-Adapter
   * und sorgt für bis zu 3× höhere Performance bei gleichzeitigen Requests.
   */
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: true,
      /**
       * Optionaler JSON-Serializer für große numerische Werte.
       * Wandelt BigInt → Number um, um JSON-Parsing-Fehler zu vermeiden.
       */
      serializerOpts: {
        replacer: (_: string, value: unknown) =>
          typeof value === 'bigint' ? Number(value) : value,
      },
    }),
  );

  // const loggerService = app.get(LoggerPlusService);
  // logger = loggerService.getLogger('Bootstrap');

  // ======================================================
  // 🔐 SECURITY & MIDDLEWARE
  // ======================================================

  /**
   * @section Sicherheit
   * Aktiviert Sicherheits-Header via Helmet-Plugin.
   *
   * - Verhindert XSS, MIME Sniffing und Clickjacking.
   * - Sollte als eines der ersten Plugins registriert werden.
   */
  await app.register(helmet, {
    contentSecurityPolicy: false, // bei Swagger ggf. deaktivieren
    crossOriginResourcePolicy: false,
  });

  /**
   * Aktiviert globale CORS-Regeln (Cross-Origin Resource Sharing).
   *
   * Erlaubt Frontend-Anwendungen (z. B. Next.js) Zugriff auf die API.
   */
  await app.register(cors, corsOptions);

  /**
   * Komprimiert API-Antworten automatisch.
   *
   * Unterstützt Gzip, Brotli und Deflate.
   * Reduziert Bandbreite und verbessert Ladezeiten.
   */
  await app.register(compress, {
    global: true,
    encodings: ['br', 'gzip', 'deflate'],
    threshold: 1024, // nur komprimieren ab 1 KB
  });

  /**
   * Begrenzt Request-Rate pro IP-Adresse.
   *
   * Schützt vor Brute-Force-Angriffen und DoS.
   * Besonders wichtig für Auth- oder Login-Routen.
   */
  await app.register(rateLimit, {
    max: 100, // max. Requests pro Minute
    timeWindow: '1 minute',
  });

  // ======================================================
  // ⚙️ CONFIGURATION
  // ======================================================

  /**
   * @constant config
   * Zugriff auf Laufzeitkonfiguration über den NestJS ConfigService.
   *
   * Liest Werte aus `.env` oder Umgebungsvariablen.
   */
  const config = app.get(ConfigService);

  await app.register(cookie, {
    // secret: config.get('COOKIE_SECRET') ?? 'omnixys-default-secret',
    secret: process.env.COOKIE_SECRET ?? 'omnixys-default-secret',
  });

  // const multipart = (await import('@fastify/multipart')).default;

  // await app.register(multipart, {
  //   attachFieldsToBody: true,
  //   limits: {
  //     fileSize: 10 * 1024 * 1024, // 10 MB
  //   },
  // });

  /** Port-Definition (Standard: 4000) */
  const port = Number(config.get('PORT') ?? 4000);
  const service = config.get('SERVICE') ?? 'N/A';

  // ======================================================
  // 🧩 VALIDATION
  // ======================================================

  /**
   * Aktiviert globale Validierung für alle eingehenden Requests.
   *
   * - `transform: true`: konvertiert Payloads in DTO-Klassen
   * - `whitelist: true`: entfernt unbekannte Felder
   * - `forbidNonWhitelisted: true`: blockiert ungültige Felder
   */
  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     transform: true,
  //     whitelist: true,
  //     forbidNonWhitelisted: false,
  //     transformOptions: { enableImplicitConversion: true },
  //   }),
  // );

  // ======================================================
  // 🧹 LIFECYCLE & STARTUP
  // ======================================================

  /**
   * Aktiviert „graceful shutdown hooks“.
   *
   * Sorgt dafür, dass die Anwendung bei SIGTERM-Signalen (Docker, K8s)
   * ordnungsgemäß Ressourcen freigibt (z. B. DB-Verbindungen).
   */
  app.enableShutdownHooks();

  /**
   * Startet den Fastify-Server.
   *
   * @remarks
   * - Bindet auf 0.0.0.0 (Docker-kompatibel)
   * - Gibt Port über ENV vor
   */
  await app.listen(port, '0.0.0.0');

  console.debug(`✅ ${service}-Service läuft auf Port: ${port}`);
}

// ======================================================
// 🚀 BOOTSTRAP-CALL
// ======================================================

/**
 * Startet die Anwendung.
 *
 * Wird asynchron aufgerufen und ignoriert Rückgabewerte,
 * da NestJS den Event-Loop selbst verwaltet.
 */
void bootstrap();
