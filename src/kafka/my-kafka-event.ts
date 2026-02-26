/**
 * Beschreibt den Standard-Aufbau eines Kafka-Events im Omnixys-Ökosystem.
 * Alle Events enthalten Metadaten und einen Nutzlast-Body.
 */
export interface MyKafkaEvent<TPayload = unknown> {
  /** Eindeutige Gateway-ID (z. B. UUID v4) */
  id: string;

  /** Der Event-Typ, z. B. "user.created", "authentcation.login", ... */
  type: string;

  /** Zeitstempel (ISO 8601) */
  timestamp: string;

  /** Service, der das Event gesendet hat (z. B. "omnixys-authentication") */
  source: string;

  /** Nutzlast mit beliebigem Typ */
  payload: TPayload;

  /** Optionaler Trace-Kontext für verteilte Tracing-Systeme */
  trace?: {
    traceId: string;
    spanId?: string;
  };
}
