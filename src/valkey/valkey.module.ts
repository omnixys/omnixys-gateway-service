import { GraphQLValkeyPubSubAdapter } from './graphql-valkey-pubsub.adapter.js';
import { ValkeyLockService } from './valkey.lock.service.js';
import { ValkeyPubSubService } from './valkey.pubsub.service.js';
import { ValkeyService } from './valkey.service.js';
import { Module } from '@nestjs/common';

@Module({
  providers: [
    ValkeyService,
    ValkeyLockService,
    ValkeyPubSubService,
    GraphQLValkeyPubSubAdapter,
    {
      provide: 'PUBSUB',
      useExisting: GraphQLValkeyPubSubAdapter,
    },
  ],
  exports: [
    ValkeyService,
    ValkeyLockService,
    ValkeyPubSubService,
    'PUBSUB',
    GraphQLValkeyPubSubAdapter,
  ],
})
export class ValkeyModule {}
