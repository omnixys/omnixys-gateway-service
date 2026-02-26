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

import { kafka, kafkaProducer } from '../config/kafka.js';
import {
  LoggerPlusService,
  setGlobalKafkaProducer,
} from '../logger/logger-plus.service.js';
import { KafkaProducerService } from './kafka-producer.service.js';
import type { Provider, OnModuleDestroy } from '@nestjs/common';
import type { Kafka, Producer } from 'kafkajs';

/**
 * Injection tokens for Kafka services.
 */
export const KAFKA_INSTANCE = 'KAFKA_INSTANCE';
export const KAFKA_PRODUCER = 'KAFKA_PRODUCER';

const loggerPlusService = new LoggerPlusService();
const logger = loggerPlusService.getLogger('KafkaBootstrapProvider');

/**
 * Kafka client provider (singleton instance of KafkaJS client).
 */
export const kafkaInstanceProvider: Provider<Kafka> = {
  provide: KAFKA_INSTANCE,
  useValue: kafka,
};

/**
 * Kafka producer provider.
 * Connects once at startup and exposes a shared Producer instance.
 */
export const kafkaProducerProvider: Provider<Promise<Producer>> = {
  provide: KAFKA_PRODUCER,
  useFactory: async (): Promise<Producer> => {
    try {
      await kafkaProducer.connect();
      logger.info('Kafka producer connected (bootstrap)');
      const producerService = new KafkaProducerService(kafkaProducer);
      setGlobalKafkaProducer(producerService);
      return kafkaProducer;
    } catch (err) {
      logger.error('Failed to connect Kafka producer during bootstrap %o', err);
      throw err;
    }
  },
};

/**
 * Optional helper class to gracefully disconnect on app shutdown.
 */
export class KafkaLifecycle implements OnModuleDestroy {
  async onModuleDestroy(): Promise<void> {
    try {
      await kafkaProducer.disconnect();
      logger.info('Kafka producer disconnected');
    } catch {
      /* ignore */
    }
  }
}

/**
 * Aggregate providers for easy import into KafkaModule.
 */
export const kafkaBootstrapProvider: Provider[] = [
  kafkaInstanceProvider,
  kafkaProducerProvider,
  KafkaLifecycle,
];
