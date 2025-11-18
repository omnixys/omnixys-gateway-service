import { HttpsOptions } from '@nestjs/common/interfaces/external/https-options.interface.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { env } from './env.js';

const tlsDir = resolve(env.KEYS_PATH ?? '');
console.debug('tlsDir = %s', tlsDir);

// public/private keys und Zertifikat fuer TLS
export const httpsOptions: HttpsOptions | undefined =
    env.HTTPS === 'true'
        ? {
              key: readFileSync(resolve(tlsDir, 'key.pem')),
              cert: readFileSync(resolve(tlsDir, 'certificate.crt')),
          }
        : undefined;
