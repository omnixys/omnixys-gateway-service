// /Users/gentlebookpro/Projekte/checkpoint/backend/gateway/src/app.module.ts
import { IntrospectAndCompose, RemoteGraphQLDataSource } from '@apollo/gateway';
import { GraphQLRequestContextWillSendResponse } from '@apollo/server';
import { ApolloGatewayDriver, ApolloGatewayDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import type { Request } from 'express';
import { subgraph } from './config/subgraph.js';
import { HealthModule } from './health/health.module.js';
import { LoggerModule } from './logger/logger.module.js';
import { SubscriptionServerModule } from './subscriptions/subscription.module.js';

function getCookieValue(name: string, cookieHeader: string | null): string | null {
    if (!cookieHeader) return null;
    const m = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
    return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Extrahiert Auth + Cookies aus dem eingehenden Gateway-Request.
 * - token: der komplette Authorization-Header (wenn vorhanden)
 * - cookieHeader: der rohe Cookie-Header (wenn vorhanden), damit Subgraphs Cookie-basierte Auth nutzen können
 * - isIntrospection: Flag für __schema/__type
 * - meta: optionale Forward-Infos (IP, UA), falls Subgraphs logs/ratelimiting brauchen
 */
const handleAuth = ({ req }: { req: Request }) => {
    const token = (req.headers?.authorization as string | undefined) ?? null;
    const cookieHeader = (req.headers?.cookie as string | undefined) ?? null;

    // Fallback: Token aus Cookie ziehen, wenn kein Authorization-Header
    const cookieToken = getCookieValue('kc_access_token', cookieHeader);
    const bearerToken = token ?? (cookieToken ? `Bearer ${cookieToken}` : null);


    const query = (req.body as any)?.query ?? '';
    const isIntrospection =
        typeof query === 'string' && (query.includes('__schema') || query.includes('__type'));

    const meta = {
        ip: (req.headers['x-forwarded-for'] as string) ?? req.socket.remoteAddress ?? '',
        ua: (req.headers['user-agent'] as string) ?? '',
        host: (req.headers['host'] as string) ?? '',
        origin: (req.headers['origin'] as string) ?? '',
    };

    return { token: bearerToken, cookieHeader, isIntrospection, meta };
};
// Hilfsfunktion: Cookies setzen (auf Gateway-Origin)
function appendCookieHeaders(ctx: GraphQLRequestContextWillSendResponse<any>) {
    console.log('appendCookieHeaders called on gateway');
    // console.log('Context keys:', Object.keys(ctx));
    // console.log('Response:', (ctx as any).response);
    if ((ctx as any).response.body.singleResult.errors) {
        console.error('Response:', (ctx as any).response.body.singleResult);
        console.log('Request:', (ctx as any).request);
    }

    // Safety
    const res = (ctx as any).response;
    const http = (res as any).http;
    if (!http) return;

    const data = (res as any).body?.singleResult?.data ?? {};
    // Wir erkennen zwei typische Rückgaben aus dem Auth-Subgraph:
    // mutation { login(...) { accessToken refreshToken ... } }
    // mutation { refresh(...) { accessToken refreshToken ... } }
    const authPayload = data?.login ?? data?.refresh ?? data?.authenticate ?? null;
    const didLogout: boolean = !!data?.logout?.ok;

    // 1) Logout: lösche Cookies
    if (didLogout) {
        const sameSite = (process.env.COOKIE_SAMESITE ?? 'lax').toLowerCase(); // 'lax' | 'strict' | 'none'
        const secure = process.env.COOKIE_SECURE === 'true'; // true nur mit HTTPS

        const clearOpts = {
            sameSite: (sameSite[0].toUpperCase() + sameSite.slice(1)) as 'Lax' | 'Strict' | 'None',
            secure,
        };
        const cookies = [
            clearCookie('kc_access_token', clearOpts),
            clearCookie('kc_refresh_token', clearOpts),
        ];
        http.headers.set('set-cookie', cookies);
        return;
    }

    // 2) Login / Refresh: setze neue Cookies
    if (!authPayload) return; // nichts zu tun

    const accessToken: string | undefined = authPayload?.accessToken;
    const tokenExpiresIn = authPayload?.expiresIn;
    const refreshToken: string | undefined = authPayload?.refreshToken;
    const refreshExpiresIn = authPayload?.refreshExpiresIn;

    if (!accessToken || !refreshToken) return;

    const sameSite = (process.env.COOKIE_SAMESITE ?? 'lax').toLowerCase(); // 'lax' | 'strict' | 'none'
    const secure = process.env.COOKIE_SECURE === 'true'; // true nur mit HTTPS

    const cookieBase = `Path=/; HttpOnly; SameSite=${sameSite[0].toUpperCase()}${sameSite.slice(1)}${
        secure ? '; Secure' : ''
    }`;

    const cookies: string[] = [
        `kc_access_token=${accessToken}; Max-Age=${tokenExpiresIn ?? 300}; ${cookieBase}`,
        `kc_refresh_token=${refreshToken}; Max-Age=${refreshExpiresIn ?? 1800}; ${cookieBase}`,
    ];

    http.headers.set('set-cookie', cookies);
}

function clearCookie(
    name: string,
    opts?: { secure?: boolean; sameSite?: 'Lax' | 'Strict' | 'None' },
) {
    const parts: string[] = [
        `${name}=`,
        `Path=/`,
        `HttpOnly`,
        `Max-Age=0`,
        `Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
        `SameSite=${opts?.sameSite ?? 'Lax'}`,
    ];
    if (opts?.secure) parts.push(`Secure`);
    return parts.join('; ');
}

@Module({
    imports: [
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
                                        appendCookieHeaders(ctx);
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
                    subgraphs: [
                        { name: 'authentication', url: subgraph.authentication },
                        { name: 'event', url: subgraph.event },
                        { name: 'invitation', url: subgraph.invitation },
                        { name: 'ticket', url: subgraph.ticket },
                        { name: 'notification', url: subgraph.notification },
                    ],
                }),

                // RemoteGraphQLDataSource: hier leiten wir Headers an die Subgraphs weiter
                buildService: ({ url }) =>
                    new (class extends RemoteGraphQLDataSource {
                        override willSendRequest({ request, context }: any) {
                            // 1) Authorization (so wie vom Client gesendet)
                            if (context?.token) {
                                // Erwartet wird normal "Bearer <token>"
                                request.http?.headers.set('authorization', String(context.token));
                            }

                            // 2) Cookies 1:1 weiterleiten (falls Subgraph Cookie-basierte Session/JWT prüft)
                            if (context?.cookieHeader) {
                                request.http?.headers.set('cookie', String(context.cookieHeader));
                            }

                            // 3) Introspection Marker (nur falls du auf Subgraph-Seite unterscheiden möchtest)
                            if (context?.isIntrospection) {
                                request.http?.headers.set('x-introspection', 'true');
                            }

                            // 4) Nützliche Meta-Header (optional für Logging / Rate-Limiting downstream)
                            if (context?.meta?.ip)
                                request.http?.headers.set(
                                    'x-forwarded-for',
                                    String(context.meta.ip),
                                );
                            if (context?.meta?.ua)
                                request.http?.headers.set(
                                    'x-forwarded-user-agent',
                                    String(context.meta.ua),
                                );
                            if (context?.meta?.host)
                                request.http?.headers.set(
                                    'x-forwarded-host',
                                    String(context.meta.host),
                                );
                            if (context?.meta?.origin)
                                request.http?.headers.set('origin', String(context.meta.origin));
                        }
                    })({ url }),
            },
        }),
        LoggerModule,
        HealthModule,
        SubscriptionServerModule,
    ],
})
export class AppModule {}
