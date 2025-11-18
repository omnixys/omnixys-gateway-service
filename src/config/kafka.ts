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

// ✅ Zentrale Kafka-Instanz mit korrektem Partitioner und Timeouts

import { env } from './env.js';
import type { Consumer } from 'kafkajs';
import { Kafka, Partitioners, logLevel } from 'kafkajs';

const { SERVICE, KAFKA_BROKER } = env;

/**
 * Kafka-Konfiguration für den Microservice.
 * Diese Instanz wird als Singleton verwendet.
 */
export const kafka = new Kafka({
  clientId: `omnixys-${SERVICE}`,
  brokers: [KAFKA_BROKER],
  logLevel: logLevel.INFO,
  connectionTimeout: 10000,
  requestTimeout: 30000,
});

/**
 * KafkaJS Producer mit Legacy Partitioner (wichtig für stabile Verteilung)
 */
export const kafkaProducer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
});

/**
 * KafkaJS Consumer Factory
 * @param groupId - ConsumerGroup-ID
 */
export const createKafkaConsumer = (): Consumer =>
  kafka.consumer({
    groupId: `omnixys-${SERVICE}-group`,
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
  });
