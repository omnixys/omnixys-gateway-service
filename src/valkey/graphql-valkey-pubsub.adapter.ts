/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { ValkeyPubSubService } from './valkey.pubsub.service.js';
import { Injectable } from '@nestjs/common';
import { PubSubEngine } from 'graphql-subscriptions';

type Listener = (payload: any) => void;

@Injectable()
export class GraphQLValkeyPubSubAdapter extends PubSubEngine {
  private listeners = new Map<string, Set<Listener>>();

  constructor(private readonly valkey: ValkeyPubSubService) {
    super();
  }

  async publish(trigger: string, payload: any): Promise<void> {
    await this.valkey.publish(trigger, payload);
  }

  subscribe(): Promise<number> {
    return Promise.resolve(0);
  }

  unsubscribe(_id: number): void {
    return;
  }

  asyncIterator<T>(trigger: string): AsyncIterator<T> {
    const self = this;

    // 1) ERST das Objekt erzeugen
    const iterator: AsyncIterator<T> = {
      async next() {
        return new Promise((resolve) => {
          // Erste Subscription für diesen Kanal → registrieren
          if (!self.listeners.has(trigger)) {
            self.listeners.set(trigger, new Set<Listener>());

            // global valkey subscription
            self.valkey.subscribe(trigger, (msg) => {
              const set = self.listeners.get(trigger);
              if (set) {
                for (const fn of set) {
                  fn(msg);
                }
              }
            });
          }

          // one-time listener
          const listener: Listener = (payload) => {
            resolve({
              value: payload as T,
              done: false,
            });
          };

          self.listeners.get(trigger)!.add(listener);
        });
      },

      return() {
        return Promise.resolve({
          value: undefined,
          done: true,
        });
      },

      throw(error) {
        return Promise.reject(error);
      },
    };

    // 2) JETZT Symbol.asyncIterator hinzufügen
    (iterator as any)[Symbol.asyncIterator] = () => iterator;

    // 3) Iterator zurückgeben
    return iterator;
  }
}
