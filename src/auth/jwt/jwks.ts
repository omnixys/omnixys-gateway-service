// TODO resolve eslint
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import jwksRsa from 'jwks-rsa';

export const createJwksClient = (jwksUri: string) =>
  jwksRsa({
    jwksUri,
    cache: true,
    cacheMaxEntries: 5,
    rateLimit: true,
    jwksRequestsPerMinute: 10,
  });
