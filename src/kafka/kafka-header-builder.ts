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

import type { TraceContext } from '../trace/trace-context.util.js';
import { randomUUID } from 'crypto';

export const KAFKA_HEADER_KEYS = {
  TRACE_ID: 'x-trace-id',
  EVENT_NAME: 'x-event-name',
  EVENT_TYPE: 'x-event-type',
  EVENT_VERSION: 'x-event-version',
  SERVICE: 'x-service',
  B3_TRACE_ID: 'x-b3-traceid',
  B3_SAMPLED: 'x-b3-sampled',
} as const;

export function buildKafkaHeaders(
  headers: Record<string, string> = {},
): Record<string, Buffer> {
  return Object.entries({
    [KAFKA_HEADER_KEYS.TRACE_ID]: randomUUID(),
    ...headers,
  }).reduce<Record<string, Buffer>>((acc, [key, value]) => {
    acc[key] = Buffer.from(value);
    return acc;
  }, {});
}

export type StandardKafkaHeaders = Record<string, string>;

/**
 * Erzeugt standardisierte Kafka-Header für event-Messages.
 */
export class KafkaHeaderBuilder {
  static buildStandardHeaders(
    topic: string,
    operation: string,
    trace?: TraceContext,
    version = 'v1',
    service = 'unknown-service',
  ): StandardKafkaHeaders {
    const headers: StandardKafkaHeaders = {
      [KAFKA_HEADER_KEYS.EVENT_NAME]: topic,
      [KAFKA_HEADER_KEYS.EVENT_TYPE]: operation,
      [KAFKA_HEADER_KEYS.EVENT_VERSION]: version,
      [KAFKA_HEADER_KEYS.SERVICE]: service,
    };

    if (trace?.traceId) {
      headers[KAFKA_HEADER_KEYS.TRACE_ID] = trace.traceId;
      headers[KAFKA_HEADER_KEYS.B3_TRACE_ID] = trace.traceId;
    }

    if (trace?.sampled !== undefined) {
      headers[KAFKA_HEADER_KEYS.B3_SAMPLED] = trace.sampled ? '1' : '0';
    }

    return headers;
  }
}
