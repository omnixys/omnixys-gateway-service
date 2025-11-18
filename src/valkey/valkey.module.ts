import { ValkeyLockService } from './valkey.lock.service.js';
import { ValkeyPubSubService } from './valkey.pubsub.service.js';
import { ValkeyService } from './valkey.service.js';
import { Module } from '@nestjs/common';

@Module({
  providers: [ValkeyService, ValkeyLockService, ValkeyPubSubService],
  exports: [ValkeyService, ValkeyLockService, ValkeyPubSubService],
})
export class ValkeyModule {}
