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

/**
 * @file kafka.module.ts
 * Vollständiges Kafka-Nest-Modul inkl. Discovery für Handler-Autoregistrierung.
 * Macht KafkaProducerService und KafkaConsumerService global verfügbar.
 */

import { LoggerPlusService } from '../logger/logger-plus.service.js';
import { TraceModule } from '../trace/trace.module.js';
import {
  kafkaBootstrapProvider,
  KAFKA_INSTANCE,
  KAFKA_PRODUCER,
} from './kafka-bootstrap.provider.js';
import { KafkaConsumerService } from './kafka-consumer.service.js';
import { KafkaEventDispatcherService } from './kafka-event-dispatcher.service.js';
import { KafkaHeaderBuilder } from './kafka-header-builder.js';
import { KafkaProducerService } from './kafka-producer.service.js';
import { Global, Module, OnApplicationShutdown } from '@nestjs/common';
import { DiscoveryModule, Reflector } from '@nestjs/core';

@Global()
@Module({
  imports: [DiscoveryModule, TraceModule],
  providers: [
    KafkaProducerService,
    KafkaConsumerService,
    KafkaEventDispatcherService,
    KafkaHeaderBuilder,
    Reflector,
    ...kafkaBootstrapProvider,
  ],
  exports: [
    KafkaProducerService,
    KafkaConsumerService,
    KafkaEventDispatcherService,
    KafkaHeaderBuilder,
    KAFKA_PRODUCER,
    KAFKA_INSTANCE,
  ],
})
export class KafkaModule implements OnApplicationShutdown {
  private readonly logger;
  constructor(
    private readonly producer: KafkaProducerService,
    private readonly consumer: KafkaConsumerService,
    private readonly loggerService: LoggerPlusService,
  ) {
    this.logger = this.loggerService.getLogger(KafkaModule.name);
  }

  /**
   * @method onApplicationShutdown
   * Wird automatisch aufgerufen, wenn NestJS herunterfährt (SIGINT, SIGTERM oder app.close()).
   * Schließt Producer & Consumer sauber.
   */
  async onApplicationShutdown(signal?: string): Promise<void> {
    this.logger.log(`[KafkaModule] 🧹 Application shutdown triggered (${signal ?? 'manual'})`);
    await Promise.allSettled([this.producer.disconnect(), this.consumer.disconnect()]);
    this.logger.log(`[KafkaModule] ✅ Kafka services disconnected`);
  }
}
