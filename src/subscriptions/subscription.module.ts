// /backend/gateway/src/subscriptions/subscription.module.ts

import { KafkaModule } from '../messaging/kafka.module.js';
import { ValkeyModule } from '../valkey/valkey.module.js';
import { UserSignupSubscriptionResolver } from './subscription.resolver.js';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';

@Module({
  imports: [
    ValkeyModule,
    KafkaModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      path: '/ws',
      autoSchemaFile: true,
      sortSchema: true,
      playground: false,
      subscriptions: {
        'graphql-ws': {
          path: '/ws',
          onConnect: async () => {
            // Token validierung optional
          },
        },
      },
    }),
  ],

  providers: [UserSignupSubscriptionResolver],
})
export class SubscriptionServerModule {}
