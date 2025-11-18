// TODO resolve eslint

/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { env } from '../config/env.js';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, ValkeyClientType } from '@valkey/client';

const { VALKEY_URL } = env;

@Injectable()
export class ValkeyService implements OnModuleInit, OnModuleDestroy {
  client: ValkeyClientType;

  constructor() {
    this.client = createClient({
      url: VALKEY_URL,
    });
  }

  async onModuleInit() {
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
