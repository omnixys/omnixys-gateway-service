import { Injectable } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { Kafka } from 'kafkajs';

@Injectable()
export class HealthService {
    async checkHealth() {
        const kafkaStatus = await this.checkKafka();
        const certStatus = this.checkCertificate(process.env.KEYS_PATH! + '/certificate.crt');
        const keyStatus = this.checkCertificate(process.env.KEYS_PATH! + '/key.pem');

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
                brokers: [process.env.KAFKA_BOOTSTRAP || 'kafka:9092'],
                clientId: 'health-check',
            });
            const admin = kafka.admin();
            await admin.connect();
            await admin.disconnect();
            return 'ok';
        } catch (error) {
            return 'unreachable';
        }
    }

    private checkCertificate(path: string): string {
        try {
            if (!existsSync(path)) return 'missing';
            readFileSync(path); // Trigger error if unreadable
            return 'ok';
        } catch {
            return 'unreadable';
        }
    }
}
