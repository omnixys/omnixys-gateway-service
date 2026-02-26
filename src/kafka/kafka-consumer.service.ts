/**
 * @license GPL-3.0-or-later
 * Copyright (C) 2025 Caleb Gyamfi - Omnixys Technologies
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * For more information, visit <https://www.gnu.org/licenses/>.
 */

import { env } from '../config/env.js';
import { createKafkaConsumer } from '../config/kafka.js';
import { LoggerPlus } from '../logger/logger-plus.js';
import { TraceContextProvider } from '../trace/trace-context.provider.js';
import { KafkaEventDispatcherService } from './kafka-event-dispatcher.service.js';
import { getKafkaTopicsBy } from './kafka-topic.properties.js';
import { MyKafkaEvent } from './my-kafka-event.js';
import { Injectable, OnApplicationShutdown, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

const { SERVICE } = env;

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy, OnApplicationShutdown {
  private readonly logger = new LoggerPlus(KafkaConsumerService.name);
  private readonly consumer = createKafkaConsumer();
  private isRunning = false;
  private shutdownRequested = false;

  constructor(private readonly dispatcher: KafkaEventDispatcherService) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.consumer.connect();
      const topics = [...getKafkaTopicsBy([SERVICE, 'admin'])];
      await this.consumer.subscribe({ topics, fromBeginning: false });

      this.logger.info('✅ Kafka consumer connected & subscribed: %o', topics);

      this.isRunning = true;

      // 🎯 Start consuming in a safe loop
      void this.consumer
        .run({
          eachMessage: async ({ topic, partition, message }) => {
            if (this.shutdownRequested) {
              return;
            }

            const rawValue = message.value?.toString();
            if (!rawValue) {
              return;
            }

            try {
              const payload = JSON.parse(rawValue) as MyKafkaEvent<unknown>;
              const traceId = message.headers?.['x-trace-id']?.toString();
              const spanId = message.headers?.['x-span-id']?.toString();

              await TraceContextProvider.run(
                {
                  traceId: traceId ?? 'unknown-trace',
                  spanId: spanId ?? 'unknown-span',
                },
                async () => {
                  this.logger.debug('📩 Kafka event on topic %s', topic);
                  await this.dispatcher.dispatch(topic, payload, {
                    topic,
                    partition,
                    offset: message.offset,
                    headers: Object.fromEntries(
                      Object.entries(message.headers ?? {}).map(([k, v]) => [
                        k,
                        v?.toString() ?? '',
                      ]),
                    ),
                    timestamp: message.timestamp,
                  });
                },
              );
            } catch (err) {
              this.logger.error('Kafka message processing error on %s → %o', topic, err);
            }
          },
        })
        .then(() => this.logger.info('Kafka consumer run loop exited.'))
        .catch((err) => this.logger.error('Kafka consumer run loop error %o', err));

      this.logger.info('Kafka consumer started.');
    } catch (err) {
      this.logger.error('Kafka consumer init failed %o', err);
      throw err;
    }
  }

  // 🧹 Clean shutdown
  async disconnect(): Promise<void> {
    if (!this.isRunning) {
      return;
    }
    this.shutdownRequested = true;

    try {
      this.logger.info('🔻 Stopping Kafka consumer...');
      await this.consumer.stop();
      await this.consumer.disconnect();

      this.isRunning = false;
      this.logger.info('[KafkaConsumerService] 🧹 Disconnected cleanly');
    } catch (err) {
      this.logger.error('[KafkaConsumerService] Error during disconnect', err);
    } finally {
      // forcefully clear timers (KafkaJS sometimes leaves one active)
      for (const timer of Object.values(setTimeout)) {
        clearTimeout(timer as NodeJS.Timeout);
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  async onApplicationShutdown(signal?: string): Promise<void> {
    this.logger.debug(`🔻 onApplicationShutdown (${signal ?? 'no-signal'})`);
    await this.disconnect();
  }
}
