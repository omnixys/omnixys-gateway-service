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
import { existsSync, readFileSync } from 'fs';
import { Kafka } from 'kafkajs';

export interface CheckHealth {
  self: string;
  kafka: string;
  tlsCertificate: string;
  tlsKey: string;
}

const { KAFKA_BROKER, KEYS_PATH } = env;
@Injectable()
export class HealthService {
  async checkHealth(): Promise<CheckHealth> {
    const kafkaStatus = await this.checkKafka();
    const certStatus = this.checkCertificate(`${KEYS_PATH}/certificate.crt`);
    const keyStatus = this.checkCertificate(`${KEYS_PATH}/key.pem`);

    return {
      self: 'ok',
      kafka: kafkaStatus,
      tlsCertificate: certStatus,
      tlsKey: keyStatus,
    };
  }

  private async checkKafka(): Promise<string> {
    try {
      const kafka = new Kafka({
        brokers: [KAFKA_BROKER],
        clientId: 'health-check',
      });
      const admin = kafka.admin();
      await admin.connect();
      await admin.disconnect();
      return 'ok';
    } catch (error: unknown) {
      console.error('Kafka health check failed:', error);
      return 'unreachable';
    }
  }

  private checkCertificate(path: string): string {
    try {
      if (!existsSync(path)) {
        return 'missing';
      }
      readFileSync(path); // Trigger error if unreadable
      return 'ok';
    } catch {
      return 'unreadable';
    }
  }
}
