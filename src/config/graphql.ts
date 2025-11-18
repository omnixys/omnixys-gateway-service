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
import type { ApolloFederationDriverConfig } from '@nestjs/apollo';
import {
  ApolloDriver,
  ApolloFederationDriver,
  type ApolloDriverConfig,
} from '@nestjs/apollo';
import { join } from 'node:path';

const { SCHEMA_TARGET } = env;

// Utility zur sicheren Pfadwahl
function getSafeSchemaPath(): string | false {
  const target = SCHEMA_TARGET;
  if (target === 'false') {
    return false;
  }
  if (target === 'tmp') {
    return '/tmp/schema.gql';
  }
  return join(process.cwd(), target, 'schema.gql');
}

/**
 * Standard-GraphQL-Konfiguration (ohne Federation).
 */
export const graphQlModuleOptions: ApolloDriverConfig = {
  autoSchemaFile: getSafeSchemaPath(),
  sortSchema: true,
  introspection: true,
  driver: ApolloDriver,
  playground: false,
};

/**
 * Federation-Unterstützung, z.B. für Subgraphen.
 */
export const graphQlModuleOptions2: ApolloFederationDriverConfig = {
  autoSchemaFile:
    SCHEMA_TARGET === 'tmp'
      ? {
          path: '/tmp/schema.gql',
          federation: 2,
        }
      : SCHEMA_TARGET === 'false'
        ? false
        : {
            path: 'dist/schema.gql',
            federation: 2,
          },
  driver: ApolloFederationDriver,
  playground: false,
};
