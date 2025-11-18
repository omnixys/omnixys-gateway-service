// src/kafka/types/my-kafka-invitation.ts

/**
 * Beschreibt den Standard-Aufbau eines Kafka-Events im Omnixys-Ökosystem.
 * Alle Events enthalten Metadaten und einen Nutzlast-Body.
 */
export interface MyKafkaEvent<TPayload = unknown> {
  /** Eindeutige Invitation-ID (z. B. UUID v4) */
  id: string;

  /** Der Invitation-Typ, z. B. "invitation.created", "authentcation.login", ... */
  type: string;

  /** Zeitstempel (ISO 8601) */
  timestamp: string;

  /** Service, der das Invitation gesendet hat (z. B. "omnixys-authentication") */
  source: string;

  /** Nutzlast mit beliebigem Typ */
  payload: TPayload;

  /** Optionaler Trace-Kontext für verteilte Tracing-Systeme */
  trace?: {
    traceId: string;
    spanId?: string;
  };
}
