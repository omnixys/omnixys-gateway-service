// /backend/gateway/src/subscriptions/subscription.module.ts
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { GatewaySubscriptionResolver } from './subscription.resolver.js';

@Module({
    imports: [
        // separater GraphQL-Server NUR für Subscriptions
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            path: '/ws', // eigener Endpoint für WS (HTTP auf diesem Server ignorieren wir de facto)
            autoSchemaFile: true, // code-first
            sortSchema: true,
            playground: false,
            // Wichtig: 'graphql-ws' aktivieren
            // resolvers: {
            //     JSONObject: GraphQLJSONObject,
            // },
            subscriptions: {
                'graphql-ws': {
                    path: '/ws', // WS Pfad (muss zum path oben passen)
                    // optional onConnect für Auth/Cookies
                    onConnect: async () => {
                        // z.B. Token/Cookies prüfen und in ctx.extra speichern
                    },
                },
            },
        }),
    ],
    providers: [GatewaySubscriptionResolver],
})
export class SubscriptionServerModule {}
