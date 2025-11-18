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
import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult } from '@nestjs/terminus';
import { Kafka } from 'kafkajs';

const { KAFKA_BROKER } = env;
@Injectable()
export class KafkaIndicator {
  async isHealthy(): Promise<HealthIndicatorResult> {
    const kafka = new Kafka({
      brokers: [KAFKA_BROKER],
      clientId: 'health-check',
    });

    const admin = kafka.admin();

    try {
      await admin.connect();
      await admin.disconnect();

      return {
        kafka: {
          status: 'up',
        },
      };
    } catch (error) {
      console.error('Kafka health check failed:', error);
      return {
        kafka: {
          status: 'down',
          message: 'Kafka not reachable',
        },
      };
    }
  }
}
