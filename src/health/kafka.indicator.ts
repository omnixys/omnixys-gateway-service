import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult } from '@nestjs/terminus';
import { Kafka } from 'kafkajs';

@Injectable()
export class KafkaIndicator {
    async isHealthy(): Promise<HealthIndicatorResult> {
        const kafka = new Kafka({
            brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
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
            return {
                kafka: {
                    status: 'down',
                    message: 'Kafka not reachable',
                },
            };
        }
    }
}
