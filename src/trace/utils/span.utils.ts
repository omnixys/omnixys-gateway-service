import type { LoggerPlus } from '../../logger/logger-plus.js';
import type { Span } from '@opentelemetry/api';
import {
  context as otelContext,
  trace,
  SpanStatusCode,
  type Tracer,
} from '@opentelemetry/api';

/**
 * Executes the given async function within an OpenTelemetry span.
 * The span is automatically ended even if an error occurs.
 * Requires explicit tracer + logger arguments.
 */
export async function withSpan<T>(
  tracer: Tracer,
  logger: LoggerPlus,
  name: string,
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  const span = tracer.startSpan(name);

  try {
    return await otelContext.with(
      trace.setSpan(otelContext.active(), span),
      () => fn(span),
    );
  } catch (err) {
    logger.error(`${name} failed: ${(err as Error).message}`);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: (err as Error).message,
    });
    span.recordException(err as Error);
    throw err;
  } finally {
    span.end();
  }
}
