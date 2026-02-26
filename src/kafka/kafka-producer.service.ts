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
 * For more information, visit <https://www.gnu.org/licenses/>.
 */

import { KafkaCircuitBreaker } from '../config/kafka-circuit-breaker.js';
import { setGlobalKafkaProducer } from '../logger/logger-plus.service.js';
import { UserSignedUpPayload } from '../subscriptions/models/payloads/user-signup.payload.js';
import type { TraceContext } from '../trace/trace-context.util.js';
import type { KafkaEnvelope } from './decorators/kafka-envelope.type.js';
import { KafkaHeaderBuilder } from './kafka-header-builder.js';
import { getTopic } from './kafka-topic.properties.js';
import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { Producer, ProducerRecord } from 'kafkajs';

/**
 * Verwaltet den Kafka Producer als langlebige, wiederverwendbare Instanz.
 * Fire-and-Forget-sicher, Trace- und Logging-fähig.
 */
@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private isReady = false;
  private isShuttingDown = false;
  private readonly circuit = new KafkaCircuitBreaker(5, 10000);

  constructor(@Inject('KAFKA_PRODUCER') private readonly producer: Producer) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.producer.connect();
      setGlobalKafkaProducer(this);
      this.isReady = true;

      console.debug('Kafka producer connected');
    } catch (err) {
      console.debug('Kafka producer connection failed %o', err);
      throw err;
    }
  }

  /**
   * Sendet eine Nachricht an das angegebene Topic.
   * Fehler führen nicht zum Abbruch (Fire-and-Forget).
   */
  async send<T>(topic: string, message: KafkaEnvelope<T>, trace?: TraceContext): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    if (!this.isReady) {
      return;
    }

    if (!this.circuit.canExecute()) {
      console.warn('Kafka circuit OPEN – dropping message for topic %s', topic);
      return;
    }

    const headers = KafkaHeaderBuilder.buildStandardHeaders(
      topic,
      message.event,
      trace,
      message.version,
      message.service,
    );
    const record: ProducerRecord = {
      topic,
      messages: [{ value: JSON.stringify(message), headers }],
    };

    try {
      await this.producer.send({
        ...record,
        acks: -1,
        timeout: 5000,
      });

      this.circuit.recordSuccess();
    } catch (err) {
      console.error('Kafka send failed for topic %s → %o', topic, err);

      const previousState = this.circuit.getState();
      this.circuit.recordFailure();
      const newState = this.circuit.getState();

      if (previousState !== newState) {
        console.warn('Kafka circuit state changed: %s → %s', previousState, newState);
      }
    }
  }

  /**
   * Convenience-Methode für Einladungsgenehmigung: sendet an auth.create
   * @param payload - Nutzdaten des Benutzers
   * @param service - Ursprungs-Service
   * @param trace - Optionaler Tracing-Kontext
   */
  async userSignedUp(
    payload: UserSignedUpPayload,
    service: string,
    trace?: TraceContext,
  ): Promise<void> {
    const envelope: KafkaEnvelope<typeof payload> = {
      event: 'notifyUser',
      service,
      version: 'v1',
      trace,
      payload,
    };
    await this.send(getTopic('sendCredentials'), envelope, trace);
  }

  async disconnect(): Promise<void> {
    if (this.producer) {
      await this.producer.disconnect();
      console.debug('[KafkaProducerService] 🧹 Disconnected cleanly');
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.isShuttingDown = true;
    await this.disconnect();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.disconnect();
  }
}
