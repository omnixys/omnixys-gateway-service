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
import { KafkaIndicator } from './kafka.indicator.js';
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HttpHealthIndicator,
  HealthCheck,
  HealthCheckResult,
} from '@nestjs/terminus';

const { KEYCLOAK_HEALTH_URL, TEMPO_HEALTH_URL, PROMETHEUS_HEALTH_URL } = env;
@Controller('health')
export class HealthController {
  readonly #health: HealthCheckService;
  readonly #http: HttpHealthIndicator;
  readonly #kafka: KafkaIndicator;

  constructor(health: HealthCheckService, http: HttpHealthIndicator, kafka: KafkaIndicator) {
    this.#health = health;
    this.#http = http;
    this.#kafka = kafka;
  }

  @Get('liveness')
  @HealthCheck()
  liveness(): Promise<HealthCheckResult> {
    return this.#health.check([() => Promise.resolve({ app: { status: 'up' } })]);
  }

  @Get('readiness')
  @HealthCheck()
  readiness(): Promise<HealthCheckResult> {
    return this.#health.check([
      () => Promise.resolve({ app: { status: 'up' } }),
      () => this.#kafka.isHealthy(),
      () => this.#http.pingCheck('keycloak', KEYCLOAK_HEALTH_URL),
      () => this.#http.pingCheck('tempo', TEMPO_HEALTH_URL),
      () => this.#http.pingCheck('prometheus', PROMETHEUS_HEALTH_URL),
    ]);
  }
}
