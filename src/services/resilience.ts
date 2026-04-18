/**
 * Resilience patterns for STEMulator frontend services.
 *
 * Provides:
 *   1. **Retry with exponential back-off** — automatically retries transient
 *      failures (network errors, 5xx, 429) with configurable delay and jitter.
 *   2. **Circuit breaker** — prevents cascading failure by short-circuiting
 *      requests when a backend is repeatedly failing.
 *   3. **Timeout wrapper** — aborts any fetch that exceeds a deadline.
 *   4. **`resilientFetch`** — a drop-in `fetch` replacement that composes all
 *      three patterns into a single call.
 */

import { logger } from "./logger";

// ---------------------------------------------------------------------------
// 1. Retry with exponential back-off
// ---------------------------------------------------------------------------

export interface RetryOptions {
  /** Maximum number of attempts (including the first). Default 3. */
  maxAttempts?: number;
  /** Base delay in ms before the first retry. Default 500. */
  baseDelayMs?: number;
  /** Maximum delay cap in ms. Default 8 000. */
  maxDelayMs?: number;
  /** Predicate that decides whether a failed response is retryable. */
  isRetryable?: (response: Response) => boolean;
}

const DEFAULT_RETRY: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelayMs: 500,
  maxDelayMs: 8_000,
  isRetryable: (res) => res.status >= 500 || res.status === 429,
};

/** Sleep helper with jitter (±25 %). */
function sleep(ms: number): Promise<void> {
  const jitter = ms * 0.25 * (Math.random() * 2 - 1);
  return new Promise((resolve) => setTimeout(resolve, ms + jitter));
}

/**
 * Executes `fn` with retries on transient failures.
 * Network errors and responses matching `isRetryable` trigger a retry.
 */
export async function withRetry(
  fn: () => Promise<Response>,
  opts: RetryOptions = {},
): Promise<Response> {
  const { maxAttempts, baseDelayMs, maxDelayMs, isRetryable } = {
    ...DEFAULT_RETRY,
    ...opts,
  };

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fn();

      if (!isRetryable(res) || attempt === maxAttempts) {
        return res;
      }

      // Retryable response — log and back off
      logger.warn(
        `Retryable response (${res.status}), attempt ${attempt}/${maxAttempts}`,
        { url: res.url, status: res.status },
      );
    } catch (err) {
      // Network failure — retryable
      lastError = err;
      if (attempt === maxAttempts) break;

      logger.warn(
        `Network error on attempt ${attempt}/${maxAttempts}: ${(err as Error).message}`,
      );
    }

    const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
    await sleep(delay);
  }

  throw lastError ?? new Error("All retry attempts exhausted");
}

// ---------------------------------------------------------------------------
// 2. Circuit breaker
// ---------------------------------------------------------------------------

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerOptions {
  /** Failures in a row before opening the circuit. Default 5. */
  failureThreshold?: number;
  /** Ms to wait before transitioning from OPEN → HALF_OPEN. Default 30 000. */
  resetTimeoutMs?: number;
  /** Optional label used in log messages. */
  name?: string;
}

const DEFAULT_CB: Required<CircuitBreakerOptions> = {
  failureThreshold: 5,
  resetTimeoutMs: 30_000,
  name: "default",
};

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failures = 0;
  private nextAttemptAt = 0;
  private readonly opts: Required<CircuitBreakerOptions>;

  constructor(opts: CircuitBreakerOptions = {}) {
    this.opts = { ...DEFAULT_CB, ...opts };
  }

  /** Current state of the breaker (useful for health-check reporting). */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Execute `fn` through the circuit breaker.
   * Throws immediately when the circuit is OPEN and the cool-down hasn't elapsed.
   */
  async exec<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() < this.nextAttemptAt) {
        logger.warn(`Circuit [${this.opts.name}] is OPEN — failing fast`);
        throw new Error(
          `Service temporarily unavailable (circuit breaker open: ${this.opts.name})`,
        );
      }
      // Transition to HALF_OPEN for a trial request
      this.state = "HALF_OPEN";
      logger.info(`Circuit [${this.opts.name}] → HALF_OPEN (trial request)`);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess(): void {
    if (this.state === "HALF_OPEN" || this.failures > 0) {
      logger.info(`Circuit [${this.opts.name}] → CLOSED (success)`);
    }
    this.failures = 0;
    this.state = "CLOSED";
  }

  private onFailure(): void {
    this.failures++;
    if (this.failures >= this.opts.failureThreshold) {
      this.state = "OPEN";
      this.nextAttemptAt = Date.now() + this.opts.resetTimeoutMs;
      logger.error(
        `Circuit [${this.opts.name}] → OPEN after ${this.failures} failures. ` +
          `Will retry after ${this.opts.resetTimeoutMs / 1000}s`,
      );
    }
  }

  /** Reset the breaker to CLOSED with zero failures. Useful in tests. */
  reset(): void {
    this.state = "CLOSED";
    this.failures = 0;
    this.nextAttemptAt = 0;
  }
}

// ---------------------------------------------------------------------------
// 3. Timeout wrapper
// ---------------------------------------------------------------------------

export interface TimeoutOptions {
  /** Maximum ms before the request is aborted. Default 15 000. */
  timeoutMs?: number;
}

/**
 * Wraps a `fetch` call with an `AbortController` timeout.
 * The caller can also pass its own `signal` — both are honoured.
 */
export async function withTimeout(
  fn: (signal: AbortSignal) => Promise<Response>,
  opts: TimeoutOptions = {},
): Promise<Response> {
  const { timeoutMs = 15_000 } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fn(controller.signal);
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// 4. Composed resilient fetch
// ---------------------------------------------------------------------------

export interface ResilientFetchOptions extends RetryOptions, TimeoutOptions {
  /** Optional circuit breaker instance to route the request through. */
  circuitBreaker?: CircuitBreaker;
}

/**
 * Drop-in replacement for `fetch` that adds timeout, retry, and optional
 * circuit-breaker protection.
 *
 * ```ts
 * const res = await resilientFetch(url, { method: "GET" }, {
 *   maxAttempts: 3,
 *   timeoutMs: 10_000,
 *   circuitBreaker: labsCircuit,
 * });
 * ```
 */
export async function resilientFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  opts: ResilientFetchOptions = {},
): Promise<Response> {
  const { circuitBreaker, timeoutMs, ...retryOpts } = opts;

  const doFetch = () =>
    withRetry(
      () =>
        withTimeout((signal) => fetch(input, { ...init, signal }), {
          timeoutMs,
        }),
      retryOpts,
    );

  if (circuitBreaker) {
    return circuitBreaker.exec(doFetch);
  }
  return doFetch();
}
