/**
 * @license GPL-3.0-or-later
 * Copyright (C) 2025 Caleb Gyamfi - Omnixys Technologies
 *
 * For full license text, see <https://www.gnu.org/licenses/>.
 */

import type { TraceContext } from './trace-context.util.js';
import { Injectable, Scope } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Globale TraceContext-Verwaltung über AsyncLocalStorage.
 * Thread-sicher für gleichzeitige Requests oder Kafka-Events.
 */
@Injectable({
  scope: Scope.DEFAULT,
})
export class TraceContextProvider {
  private static readonly storage = new AsyncLocalStorage<TraceContext>();

  /**
   * Führt eine Funktion innerhalb eines Trace-Kontexts aus.
   * @param ctx TraceContext
   * @param fn  Callback
   */
  static run<T>(ctx: TraceContext, fn: () => T): T {
    return this.storage.run(ctx, fn);
  }

  /** Gibt den aktuellen TraceContext zurück, falls vorhanden. */
  static get(): TraceContext | undefined {
    return this.storage.getStore();
  }

  /** Prüft, ob ein TraceContext aktiv ist. */
  static has(): boolean {
    return !!this.storage.getStore();
  }

  /** Setzt den aktuellen Kontext manuell (z. B. im Consumer). */
  setContext(ctx: TraceContext): void {
    TraceContextProvider.storage.enterWith(ctx);
  }

  /** Ruft den aktuellen Kontext ab. */
  getContext(): TraceContext | undefined {
    return TraceContextProvider.storage.getStore();
  }

  /** Löscht den aktiven Kontext. */
  clear(): void {
    TraceContextProvider.storage.disable();
  }
}

/**
 * Request-scoped Variante, falls du pro HTTP-Request
 * einen eigenen TraceContext injizieren möchtest.
 */
@Injectable({
  scope: Scope.REQUEST,
})
export class TraceContextProviderHTTP {
  private readonly local = new AsyncLocalStorage<TraceContext>();

  setContext(ctx: TraceContext): void {
    this.local.enterWith(ctx);
  }

  getContext(): TraceContext | undefined {
    return this.local.getStore();
  }

  has(): boolean {
    return !!this.local.getStore();
  }
}
