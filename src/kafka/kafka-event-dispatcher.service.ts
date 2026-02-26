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

import { LoggerPlusService } from '../logger/logger-plus.service.js';
import { TraceContextProvider } from '../trace/trace-context.provider.js';
import { KAFKA_EVENT_METADATA, KAFKA_HANDLER } from './decorators/kafka-event.decorator.js';
import { type KafkaEventContext, KafkaEventHandlerFn } from './interface/kafka-event.interface.js';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';

interface RegisteredHandler {
  handler: object;
  methodName: string;
}

export function safeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : fallback;
}

/**
 * Kafka Invitation Dispatcher.
 * Scans for all classes annotated with `@KafkaHandler`
 * and automatically wires their `@KafkaEvent`-decorated methods.
 */

@Injectable()
export class KafkaEventDispatcherService implements OnModuleInit {
  private readonly logger;
  private readonly topicToHandler = new Map<string, RegisteredHandler>();

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
    private readonly loggerService: LoggerPlusService,
  ) {
    this.logger = this.loggerService.getLogger(KafkaEventDispatcherService.name);
  }

  onModuleInit(): void {
    const providers = this.discoveryService.getProviders();

    for (const wrapper of providers) {
      const instance = wrapper.instance as object | undefined;
      if (!instance) {
        continue;
      }

      const handlerName = this.reflector.get<string>(KAFKA_HANDLER, instance.constructor);
      if (!handlerName) {
        continue;
      }

      this.logger.debug('📦 KafkaHandler erkannt: %s', instance.constructor.name);

      // explicitly cast to a generic object prototype
      const prototype = Object.getPrototypeOf(instance) as Record<string, unknown>;

      const methodNames = this.metadataScanner.getAllMethodNames(prototype);

      for (const methodName of methodNames) {
        const methodRef = prototype[methodName] as (...args: unknown[]) => unknown;
        const metadata = this.reflector.get<{ topics: string[] }>(KAFKA_EVENT_METADATA, methodRef);

        if (!metadata) {
          continue;
        }

        for (const topic of metadata.topics) {
          this.logger.debug(
            '📩 Registriere Topic "%s" für %s.%s()',
            topic,
            instance.constructor.name,
            methodName,
          );
          this.topicToHandler.set(topic, { handler: instance, methodName });
        }
      }
    }

    const allTopics = Array.from(this.topicToHandler.keys());
    this.logger.info('✅ Kafka Topics registriert: %s', allTopics.join(', ') || '— none —');
  }

  /**
   * Führt den passenden Kafka-Handler für ein Topic aus.
   */
  async dispatch<TPayload>(
    topic: string,
    payload: TPayload,
    context: Record<string, unknown>,
  ): Promise<void> {
    const match = this.topicToHandler.get(topic);

    if (!match) {
      this.logger.warn('⚠ Kein Kafka-Handler für Topic "%s" gefunden.', topic);
      return;
    }

    const { handler, methodName } = match;
    const fn = (handler as Record<string, unknown>)[methodName];

    if (typeof fn !== 'function') {
      this.logger.warn('⚠ Ungültiger Handler für Topic "%s" → %s', topic, methodName);
      return;
    }

    // TraceContext aus Headern extrahieren
    const headers = (context.headers ?? {}) as Record<string, string | undefined>;
    const traceId = headers['x-trace-id'] ?? 'unknown-trace';
    const spanId = headers['x-span-id'] ?? 'unknown-span';

    // ✅ KORREKT typisiertes Context-Objekt erzeugen
    const kafkaContext: KafkaEventContext = {
      topic: safeString(context.topic, topic),
      partition: Number(context.partition ?? 0),
      offset: safeString(context.offset, '0'),
      headers,
      timestamp: safeString(context.timestamp, new Date().toISOString()),
    };

    const method = (handler as Record<string, KafkaEventHandlerFn>)[methodName];

    if (typeof method !== 'function') {
      this.logger.warn('⚠ Ungültiger Handler für Topic "%s" → %s', topic, methodName);
      return;
    }

    // ✅ bind(this) damit "this" im Handler (AdminHandler) korrekt bleibt
    const boundFn = method.bind(handler);

    await TraceContextProvider.run(
      { traceId: traceId ?? 'unknown-trace', spanId: spanId ?? 'unknown-span' },
      async () => {
        try {
          await boundFn(topic, payload, kafkaContext);
          this.logger.debug('✅ Topic "%s" erfolgreich verarbeitet.', topic);
        } catch (err: unknown) {
          const message =
            err instanceof Error
              ? `${err.name}: ${err.message}`
              : err
                ? JSON.stringify(err)
                : 'Unknown error or empty rejection';
          this.logger.error('❌ Fehler bei der Verarbeitung von "%s" → %s', topic, message);
        }
      },
    );
  }
}
