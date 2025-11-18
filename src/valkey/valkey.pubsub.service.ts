/* eslint-disable @typescript-eslint/no-explicit-any */
// TODO resolve eslint

/* eslint-disable @typescript-eslint/explicit-function-return-type */

// src/infra/valkey/valkey.pubsub.service.ts
import { env } from '../config/env.js';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient } from '@valkey/client';

const { VALKEY_URL } = env;

@Injectable()
export class ValkeyPubSubService implements OnModuleInit, OnModuleDestroy {
  publisher = createClient({ url: VALKEY_URL });
  subscriber = createClient({ url: VALKEY_URL });

  async onModuleInit() {
    await this.publisher.connect();
    await this.subscriber.connect();
  }

  async publish(channel: string, payload: unknown): Promise<void> {
    await this.publisher.publish(channel, JSON.stringify(payload));
  }

  async subscribe(channel: string, handler: (data: any) => void): Promise<void> {
    await this.subscriber.subscribe(channel, (message) => {
      handler(JSON.parse(message));
    });
  }

  async onModuleDestroy() {
    await this.publisher.quit();
    await this.subscriber.quit();
  }
}
