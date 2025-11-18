import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HttpHealthIndicator } from '@nestjs/terminus';
import { KafkaIndicator } from './kafka.indicator.js';

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
    liveness() {
        return this.#health.check([() => Promise.resolve({ app: { status: 'up' } })]);
    }

    @Get('readiness')
    @HealthCheck()
    readiness() {
        return this.#health.check([
            () => this.#kafka.isHealthy(),
            () => this.#http.pingCheck('prometheus', process.env.PROMETHEUS_HEALTH_URL!),
        ]);
    }
}
