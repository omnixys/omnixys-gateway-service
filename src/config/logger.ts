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

import { env } from './env.js';
import { nodeConfig } from './node.js';
import { resolve } from 'node:path';
import pino, { type Logger } from 'pino';
import type { DestinationStream } from 'pino';
import { type PrettyOptions } from 'pino-pretty';

/**
 * Dynamische Logger-Konfiguration für Omnixys-Microservices.
 * Unterstützt Datei-Logging und farbige Console-Ausgabe.
 */
const { nodeEnv } = nodeConfig;
const {
  LOG_DEFAULT,
  LOG_DIRECTORY,
  LOG_FILE_DEFAULT_NAME,
  LOG_PRETTY,
  LOG_LEVEL,
} = env;

const logFile = resolve(LOG_DIRECTORY, LOG_FILE_DEFAULT_NAME);
const isProd = nodeEnv === 'production';
const pretty = LOG_PRETTY && !isProd;

/** Standard-LogLevel */
const logLevel = isProd ? 'info' : LOG_LEVEL;

/** Datei-Transport */
const fileTarget = {
  level: logLevel,
  target: 'pino/file',
  options: {
    destination: logFile,
    mkdir: true,
  },
};

/** Pretty-Transport */
const prettyTarget = {
  level: logLevel,
  target: 'pino-pretty',
  options: {
    translateTime: 'SYS:standard',
    singleLine: true,
    colorize: true,
    ignore: 'pid,hostname',
  } satisfies PrettyOptions,
};

/** Multi-Transport */
const transports = pino.transport<Record<string, unknown>>(
  pretty
    ? {
        targets: [fileTarget, prettyTarget],
      }
    : {
        targets: [fileTarget],
      },
) as unknown as DestinationStream;

/** Haupt-Logger-Instanz */
export const parentLogger: Logger = LOG_DEFAULT
  ? pino(pino.destination(logFile))
  : pino(
      {
        level: logLevel,
      },
      transports,
    );
