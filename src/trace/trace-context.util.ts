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

/**
 * Kontextinformationen für Tracing mit Zipkin / B3.
 */
export interface TraceContext extends Record<string, string | undefined> {
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
  sampled?: string;
}

/**
 * Hilfsfunktionen zur Extraktion von Trace-Informationen aus Headern.
 */
export class TraceContextUtil {
  /**
   * Erzeugt einen TraceContext aus HTTP- oder Kafka-Headern.
   *
   * Unterstützt sowohl B3- als auch W3C Trace Context (z.B. traceparent).
   */
  static fromHeaders(
    headers: Record<string, unknown> | undefined,
  ): TraceContext {
    if (!headers) {
      return {};
    }

    const get = (key: string): string | undefined =>
      (headers[key] ?? headers[key.toLowerCase()]) as string | undefined;

    // 🎯 W3C trace context parsing
    const traceparent = get('traceparent');

    if (traceparent) {
      // Format: version-traceid-spanid-flags (z.B. 00-<traceId>-<spanId>-01)
      const match = traceparent.match(/^(\w+)-(\w{32})-(\w{16})-(\w{2})$/);
      if (match) {
        const [, , traceId, spanId, flags] = match;
        return {
          traceId,
          spanId,
          sampled: String(flags === '01'),
        };
      }
    }

    // 🧾 Fallback: B3/Zipkin Header parsing
    const traceId = get('x-b3-traceid') ?? get('x-trace-id');
    const spanId = get('x-b3-spanid');
    const parentSpanId = get('x-b3-parentspanid');
    const sampledRaw = get('x-b3-sampled');
    const sampled = sampledRaw === '1' || sampledRaw === 'true';

    return {
      traceId,
      spanId,
      parentSpanId,
      sampled: sampledRaw !== undefined ? String(sampled) : undefined,
    };
  }
}
