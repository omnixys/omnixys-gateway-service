// TODO resolve eslint

// src/infra/valkey/valkey.lock.service.ts
import { ValkeyService } from './valkey.service.js';
import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

@Injectable()
export class ValkeyLockService {
  constructor(private readonly valkey: ValkeyService) {}

  async acquireLock(key: string, ttlMs = 3000): Promise<string | null> {
    const token = randomBytes(16).toString('hex');

    const ok = await this.valkey.client.set(key, token, {
      NX: true,
      PX: ttlMs,
    });

    return ok ? token : null;
  }

  async releaseLock(key: string, token: string): Promise<boolean> {
    const script = `
      if redis.call("GET", KEYS[1]) == ARGV[1]
      then return redis.call("DEL", KEYS[1])
      else return 0
      end
    `;

    const result = await this.valkey.client.eval(script, {
      keys: [key],
      arguments: [token],
    });

    return result === 1;
  }
}
