/**
 * @license GPL-3.0-or-later
 * © 2025 Caleb Gyamfi - Omnixys Technologies
 */

import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

import {
  detectResources,
  envDetector,
  hostDetector,
  osDetector,
  processDetector,
  resourceFromAttributes,
  defaultResource,
} from '@opentelemetry/resources';

import { AsyncHooksContextManager } from '@opentelemetry/context-async-hooks';
import { NodeSDK } from '@opentelemetry/sdk-node';

import { LoggerPlus } from '../logger/logger-plus.js';
import { env } from './env.js';

const { SERVICE, TEMPO_URI, PORT } = env;

// OTLP Collector – NICHT Tempo
const OTEL_COLLECTOR = TEMPO_URI;

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

const logger = new LoggerPlus('otel.ts');

let sdk: NodeSDK | undefined;

export async function startOtelSDK(): Promise<void> {
  logger.log('🔧 Starte OpenTelemetry Initialisierung…');

  // ----------------- Resource Detection ------------------
  const detected = detectResources({
    detectors: [envDetector, hostDetector, osDetector, processDetector],
  });

  const resource = defaultResource()
    .merge(detected)
    .merge(
      resourceFromAttributes({
        'service.name': SERVICE ?? 'undefined-service',
        'service.namespace': 'omnixys',
        'service.instance.id': process.pid,
      }),
    );

  // ---------------- Exporter ------------------------------
  const traceExporter = new OTLPTraceExporter({
    url: OTEL_COLLECTOR,
  });

  const prometheusExporter = new PrometheusExporter(
    {
      port: PORT + 10000,
      endpoint: '/metrics',
    },
    () => {
      logger.log(
        `📊 Prometheus läuft auf http://localhost:${PORT + 10000}/metrics`,
      );
    },
  );

  // ---------------- Context Propagation ------------------
  const contextManager = new AsyncHooksContextManager().enable();

  // ---------------- SDK Init -----------------------------
  sdk = new NodeSDK({
    resource,
    contextManager,
    traceExporter,

    metricReaders: [prometheusExporter],

    instrumentations: getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': { enabled: true },
      '@opentelemetry/instrumentation-nestjs-core': { enabled: true },
      '@opentelemetry/instrumentation-express': { enabled: true },
      '@opentelemetry/instrumentation-kafkajs': { enabled: true },
    }),
  });

  sdk.start();

  logger.log(`✅ OpenTelemetry gestartet – service="${SERVICE}"`);
  logger.log(`➡ Export → OTel Collector: ${OTEL_COLLECTOR}`);
}

export async function shutdownOtelSDK(): Promise<void> {
  if (!sdk) {
    return;
  }

  logger.log('🛑 Stoppe OpenTelemetry SDK…');
  await sdk.shutdown();
  logger.log('🧹 OpenTelemetry SDK wurde sauber gestoppt.');
}
