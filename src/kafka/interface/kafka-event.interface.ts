/**
 * @license GPL-3.0-or-later
 * Copyright (C) 2025 Caleb Gyamfi - Omnixys Technologies
 *
 * For full license text, see <https://www.gnu.org/licenses/>.
 */

// kafka-invitation.interface.ts
// ✅ Schnittstellen für alle Kafka-Invitation-Handler-Klassen

/**
 * Kontextinformationen, die Kafka beim Invitation mitliefert.
 */
export interface KafkaEventContext {
  topic: string;
  partition: number;
  offset: string;
  headers: Record<string, string | undefined>;
  timestamp: string;
}

/**
 * Basis-Interface für Kafka-Handler.
 * Jeder Handler, der mit @KafkaEvent annotiert ist, muss diese Signatur erfüllen.
 */
export interface KafkaEventHandler {
  /**
   * Wird beim Empfang eines Events aufgerufen.
   * @param topic Kafka-Topic, von dem das Invitation stammt
   * @param data  Deserialisierte Nutzlast
   * @param context  Kafka-Metadaten (Header, Partition usw.)
   */
  handle(
    topic: string,
    data: unknown,
    context: KafkaEventContext,
  ): Promise<void>;
}

/** Alternative Typalias für reine Funktionshandler */
export type KafkaEventHandlerFn = (
  topic: string,
  payload: unknown,
  context: KafkaEventContext,
) => Promise<void> | void;
