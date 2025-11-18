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
import { type HttpsOptions } from '@nestjs/common/interfaces/external/https-options.interface.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const tlsDir = resolve(env.KEYS_PATH);

// public/private keys und Zertifikat fuer TLS
export const httpsOptions: HttpsOptions | undefined = env.HTTPS
  ? {
      key: readFileSync(resolve(tlsDir, 'key.pem')),
      cert: readFileSync(resolve(tlsDir, 'certificate.crt')),
    }
  : undefined;
