import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL ?? 'redis://:deinStarkesPasswort@localhost:6379';

const redisOptions = {
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: +(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times: number) => Math.min(times * 50, 2000),
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
};

// Publisher/Subscriber explizit anlegen (robuster als implizit)
const publisher = redisUrl ? new Redis(redisUrl) : new Redis(redisOptions);
const subscriber = redisUrl ? new Redis(redisUrl) : new Redis(redisOptions);

export const pubsub = new RedisPubSub({ publisher, subscriber });

// Trigger zentral halten – EIN Name, überall gleich verwenden
export const TRIGGER = {
    INVITATION_UPDATED: 'INVITATION_UPDATED',
} as const;
