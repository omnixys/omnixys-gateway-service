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

// kafka-event.decorator.ts
// ✅ KafkaEvent Decorator zur Registrierung von Methoden als Event-Handler

import { SetMetadata } from '@nestjs/common';

/**
 * Struktur zur Beschreibung einer Kafka-Handler-Methode
 */
export interface KafkaHandlerMethodMetadata {
  topics: string[];
}

/**
 * Symbol-Key zur Speicherung der Kafka-Metadaten auf Methoden
 */
export const KAFKA_EVENT_METADATA = Symbol('KAFKA_EVENT_METADATA');
export const KAFKA_HANDLER = 'KAFKA_HANDLER';
export const KAFKA_EVENT_TOPICS = 'KAFKA_EVENT_TOPICS';
// export const KAFKA_EVENT_METADATA = 'KAFKA_EVENT_METADATA';

/**
 * Klassen-Decorator – markiert eine Klasse als Kafka-Handler für eine Topic-Gruppe
 */
export function KafkaHandler(handlerName: string): ClassDecorator {
  return (target) => {
    SetMetadata(KAFKA_HANDLER, handlerName)(target);
  };
}

/**
 * Methoden-Decorator – weist einer Methode eine Liste von Kafka-Topics zu
 */
/**
 * Decorator zur Registrierung einer Methode als Kafka-Event-Handler für bestimmte Topics
 * @param topics - Ein oder mehrere Kafka-Topic-Namen
 * @returns Methodendekorator
 *
 * @example
 * ```ts
 * @KafkaEvent('authentication.create')
 * async handle(topic: string, data: any) {
 *   // ...
 * }
 * ```
 */
export function KafkaEvent(...topics: string[]): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    SetMetadata(KAFKA_EVENT_METADATA, {
      topics,
    })(target, propertyKey, descriptor);
  };
}

// export function KafkaEvent(...topics: string[]): MethodDecorator {
//   return (target, propertyKey, descriptor) => {
//     SetMetadata(KAFKA_EVENT_TOPICS, topics)(target, propertyKey, descriptor);
//   };
// }
