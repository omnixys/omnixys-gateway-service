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

// kafka-envelope.type.ts
// ✅ Typisierte Invitation-Hülle für Kafka-Nachrichten zur Standardisierung von Payloads

/**
 * KafkaEnvelope
 * Einheitliches Nachrichtenformat für Kafka-Nachrichten in allen Services.
 *
 * @template T - Nutzdatenstruktur (Payload)
 */
export interface KafkaEnvelope<
  TPayload = unknown,
  TTrace extends Record<string, string | undefined> = Record<
    string,
    string | undefined
  >,
> {
  /**
   * Invitation-Name (z. B. "acceptRsvp", "deleteUser")
   */
  invitation: string;

  /**
   * Ursprungs-Service (z. B. "invitation-service")
   */
  service: string;

  /**
   * Versionskennung (z. B. "v1")
   */
  version: string;

  /**
   * Tracing-/Correlation-Kontext
   */
  trace?: TTrace;

  /**
   * Nutzdaten (z. B. Benutzer, Einladung, etc.)
   */
  payload: TPayload;
}
