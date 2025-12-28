/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /Users/gentlebookpro/Projekte/checkpoint/backend/gateway/src/app.module.ts
import { env } from './config/env.js';
import { HandlerModule } from './handlers/handler.module.js';
import { KafkaModule } from './messaging/kafka.module.js';
import { SubscriptionServerModule } from './subscriptions/subscription.module.js';
import { IntrospectAndCompose, RemoteGraphQLDataSource } from '@apollo/gateway';
import { ApolloGatewayDriver, ApolloGatewayDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';

const {
  AUTHENTICATION_URI,
  EVENT_URI,
  INVITATION_URI,
  TICKET_URI,
  USER_URI,
  SEAT_URI,
  NOTIFICATION_URI,
} = env;

export interface AuthToken {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshExpiresIn: number;
  idToken: string;
  scope: string;
}

// Secure Flag
export const secureCookie = process.env.COOKIE_SECURE === 'true';

// Basis für alle Cookies
const isProd = process.env.NODE_ENV === 'production';

export const timerCookieBase = isProd
  ? `Path=/; SameSite=None; Secure; Domain=.omnixys.com`
  : `Path=/; SameSite=Lax`;

export const cookieBase = isProd
  ? `Path=/; HttpOnly; SameSite=None; Secure; Domain=.omnixys.com`
  : `Path=/; HttpOnly; SameSite=Lax`;

function getCookieValue(name: string, cookieHeader: string | null): string | null {
  if (!cookieHeader) {
    return null;
  }
  const m = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return m?.[1] ? decodeURIComponent(m[1]) : null;
}

/**
 * Extrahiert Auth + Cookies aus dem eingehenden Gateway-Request.
 * - token: der komplette Authorization-Header (wenn vorhanden)
 * - cookieHeader: der rohe Cookie-Header (wenn vorhanden), damit Subgraphs Cookie-basierte Auth nutzen können
 * - isIntrospection: Flag für __schema/__type
 * - meta: optionale Forward-Infos (IP, UA), falls Subgraphs logs/ratelimiting brauchen
 */
const handleAuth = (ctx: any) => {
  // Fastify compatible
  const req = ctx?.request ?? ctx?.req ?? ctx?.raw ?? null;

  // Federation / Internal Apollo queries have no request object
  if (!req) {
    return {
      token: null,
      cookieHeader: null,
      isIntrospection: true,
      meta: {},
    };
  }

  // FASTIFY: headers on req
  const headers = req.headers ?? {};

  // FASTIFY: body on req.body
  const body = req.body ?? {};

  const token = headers['authorization'] ?? null;
  const cookieHeader = headers['cookie'] ?? null;

  // Extract JWT from cookie if no Authorization header present
  const cookieToken = getCookieValue('access_token', cookieHeader);
  const bearerToken = token ?? (cookieToken ? `Bearer ${cookieToken}` : null);

  const query = body?.query ?? '';
  const isIntrospection =
    typeof query === 'string' &&
    (query.includes('__schema') ||
      query.includes('__type') ||
      query.includes('_service') ||
      query.includes('__Apollo'));

  const meta = {
    ip: headers['x-forwarded-for'] ?? req.ip ?? '',
    ua: headers['user-agent'] ?? '',
    host: headers['host'] ?? '',
    origin: headers['origin'] ?? '',
  };

  return { token: bearerToken, cookieHeader, isIntrospection, meta };
};

// Hilfsfunktion: Cookies setzen (auf Gateway-Origin)
function appendCookieHeaders(ctx: any) {
  const res = ctx?.response;
  const http = res?.http;

  // Wenn kein HTTP-Response (z. B. WS, Fehler), abbrechen
  if (!http) {
    return;
  }

  const body = res?.body;
  const single = body?.singleResult;

  // Falls nicht existiert -> keine Cookie-Analyse möglich
  if (!single || typeof single !== 'object') {
    return;
  }

  const data = single.data ?? {};
  const errors = single.errors;

  // Debug-Log bei Fehlern
  if (errors && errors.length > 0) {
    console.error('GraphQL Errors:', errors);
  }

  // --- Logout ---
  const didLogout = data?.logout?.ok ?? false;
  if (didLogout) {
    const sameSite = isProd ? 'none' : 'lax';
    const secure = process.env.COOKIE_SECURE === 'true';

    http.headers.set('set-cookie', [
      clearCookie('access_token', { sameSite, secure }),
      clearCookie('refresh_token', { sameSite, secure }),
      clearCookie('access_expires_at', { sameSite, secure }),
    ]);
    return;
  }

  // --- Login / Refresh ---
  const authPayload: AuthToken = data?.login ?? data?.refresh ?? data?.authenticate;
  if (!authPayload) {
    return;
  }

  const accessToken = authPayload?.accessToken;
  const refreshToken = authPayload?.refreshToken;
  const expiresAt = Date.now() + (authPayload?.expiresIn ?? 300) * 1000;

  if (!accessToken || !refreshToken) {
    return;
  }

  http.headers.set('set-cookie', [
    `access_token=${accessToken}; Max-Age=${authPayload?.expiresIn ?? 300}; ${cookieBase}`,
    `refresh_token=${refreshToken}; Max-Age=${authPayload?.refreshExpiresIn ?? 1800}; ${cookieBase}`,
    `access_expires_at=${expiresAt}; Max-Age=${authPayload?.expiresIn ?? 300}; ${timerCookieBase}`,
  ]);
}

function clearCookie(
  name: string,
  opts?: { secure?: boolean; sameSite?: 'lax' | 'Strict' | 'none' },
) {
  const parts: string[] = [
    `${name}=`,
    `Path=/`,
    `HttpOnly`,
    `Max-Age=0`,
    `Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    `SameSite=${opts?.sameSite ?? 'Lax'}`,
  ];
  // HttpOnly MUSS identisch sein
  parts.push(`HttpOnly`);

  // Secure MUSS identisch sein
  if (opts?.secure) {
    parts.push(`Secure`);
  }

  // Domain MUSS identisch sein (PROD!)
  if (process.env.NODE_ENV === 'production') {
    parts.push(`Domain=.omnixys.com`);
  }

  return parts.join('; ');
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRoot<ApolloGatewayDriverConfig>({
      driver: ApolloGatewayDriver,
      server: {
        // Wichtig: Context baut die Infos, die in willSendRequest unten landen
        context: handleAuth,
        // Plugin: fange Auth-Antworten ab und setze Cookies auf Gateway-Origin
        plugins: [
          {
            async requestDidStart() {
              return {
                async willSendResponse(ctx) {
                  try {
                    appendCookieHeaders(ctx as any);
                  } catch (e) {
                    // Optional: Logging, aber aufpassen, dass das Response nicht bricht
                    console.error('cookie set error', e);
                  }
                },
              };
            },
          },
        ],
      },
      gateway: {
        // Federation v2 via Introspect & Compose
        supergraphSdl: new IntrospectAndCompose({
          pollIntervalInMs: 10_000,
          subgraphs: [
            { name: 'authentication', url: AUTHENTICATION_URI },
            { name: 'event', url: EVENT_URI },
            { name: 'invitation', url: INVITATION_URI },
            { name: 'ticket', url: TICKET_URI },
            { name: 'user', url: USER_URI },
            { name: 'notification', url: NOTIFICATION_URI },
            { name: 'seat', url: SEAT_URI },
          ],
        }),

        // RemoteGraphQLDataSource: hier leiten wir Headers an die Subgraphs weiter
        buildService: ({ url }) =>
          new (class extends RemoteGraphQLDataSource {
            override async willSendRequest({ request, context }: any) {
              // 3) Introspection Marker (nur falls du auf Subgraph-Seite unterscheiden möchtest)
              if (context?.isIntrospection) {
                request.http?.headers.set('x-introspection', 'true');
                return;
              }

              // 1) Authorization (so wie vom Client gesendet)
              if (context?.token) {
                // Erwartet wird normal "Bearer <token>"
                request.http?.headers.set('authorization', String(context.token));
              }

              // 2) Cookies 1:1 weiterleiten (falls Subgraph Cookie-basierte Session/JWT prüft)
              if (context?.cookieHeader) {
                request.http?.headers.set('cookie', String(context.cookieHeader));
              }
              // 4) Nützliche Meta-Header (optional für Logging / Rate-Limiting downstream)
              if (context?.meta?.ip) {
                request.http?.headers.set('x-forwarded-for', String(context.meta.ip));
              }
              if (context?.meta?.ua) {
                request.http?.headers.set('x-forwarded-user-agent', String(context.meta.ua));
              }
              if (context?.meta?.host) {
                request.http?.headers.set('x-forwarded-host', String(context.meta.host));
              }
              if (context?.meta?.origin) {
                request.http?.headers.set('origin', String(context.meta.origin));
              }
            }
          })({ url }),
      },
    }),
    SubscriptionServerModule,
    KafkaModule,
    HandlerModule,
  ],
})
export class AppModule {}
