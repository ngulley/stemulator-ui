/**
 * Health-check / status service for STEMulator.
 *
 * Periodically pings the backend and exposes live status that the UI can
 * consume to show banners, disable buttons, or switch to offline fallbacks.
 *
 * Also aggregates circuit-breaker states from the resilience layer so that
 * a single `getSystemHealth()` call returns a full picture.
 */

import { logger } from "./logger";
import { CircuitBreaker, type CircuitState } from "./resilience";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ServiceStatus {
  name: string;
  healthy: boolean;
  circuitState: CircuitState;
  lastChecked: string;
  latencyMs?: number;
  error?: string;
}

export interface SystemHealth {
  overall: "healthy" | "degraded" | "unhealthy";
  services: ServiceStatus[];
  checkedAt: string;
}

export type HealthSubscriber = (health: SystemHealth) => void;

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_BASE_URL = import.meta.env.VITE_API_URL || "/stemulator/v1";
const POLL_INTERVAL_MS = 60_000; // check every 60 s

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

const subscribers: Set<HealthSubscriber> = new Set();
let latestHealth: SystemHealth | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;

// Registry: external code registers circuit breakers here
const registeredBreakers: Map<string, CircuitBreaker> = new Map();

// ---------------------------------------------------------------------------
// Core check
// ---------------------------------------------------------------------------

async function pingService(
  name: string,
  url: string,
): Promise<Omit<ServiceStatus, "circuitState">> {
  const start = performance.now();
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(10_000),
    });
    const latencyMs = Math.round(performance.now() - start);
    return {
      name,
      healthy: res.ok,
      lastChecked: new Date().toISOString(),
      latencyMs,
      ...(res.ok ? {} : { error: `HTTP ${res.status}` }),
    };
  } catch (err) {
    return {
      name,
      healthy: false,
      lastChecked: new Date().toISOString(),
      latencyMs: Math.round(performance.now() - start),
      error: (err as Error).message,
    };
  }
}

function deriveOverall(
  services: ServiceStatus[],
): "healthy" | "degraded" | "unhealthy" {
  const allHealthy = services.every((s) => s.healthy);
  const allDown = services.every((s) => !s.healthy);
  if (allHealthy) return "healthy";
  if (allDown) return "unhealthy";
  return "degraded";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Register a circuit breaker so its state appears in health reports.
 * Call this once per breaker, typically at module init time.
 */
export function registerCircuitBreaker(name: string, cb: CircuitBreaker): void {
  registeredBreakers.set(name, cb);
}

/**
 * Run a one-shot health check against all known services.
 */
export async function checkHealth(): Promise<SystemHealth> {
  const labsPing = await pingService("Labs API", `${API_BASE_URL}/labs`);

  // Attach circuit-breaker state to each service
  const services: ServiceStatus[] = [
    {
      ...labsPing,
      circuitState: registeredBreakers.get("labs")?.getState() ?? "CLOSED",
    },
  ];

  // Add AI chat service (best-effort — OPTIONS or a lightweight probe)
  const aiPing = await pingService(
    "AI Coach",
    `${API_BASE_URL}/chat/completions`,
  );
  services.push({
    ...aiPing,
    circuitState: registeredBreakers.get("ai")?.getState() ?? "CLOSED",
  });

  const health: SystemHealth = {
    overall: deriveOverall(services),
    services,
    checkedAt: new Date().toISOString(),
  };

  latestHealth = health;
  logger.info("Health check completed", {
    overall: health.overall,
    services: health.services.map((s) => ({
      name: s.name,
      healthy: s.healthy,
      circuit: s.circuitState,
      latencyMs: s.latencyMs,
    })),
  });

  // Notify UI subscribers
  for (const sub of subscribers) {
    try {
      sub(health);
    } catch {
      // never crash the poller
    }
  }

  return health;
}

/** Start periodic background health checks. Idempotent. */
export function startHealthPolling(): void {
  if (pollTimer) return;
  // Fire immediately, then repeat
  checkHealth();
  pollTimer = setInterval(checkHealth, POLL_INTERVAL_MS);
  logger.info("Health polling started", { intervalMs: POLL_INTERVAL_MS });
}

/** Stop periodic health checks. */
export function stopHealthPolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
    logger.info("Health polling stopped");
  }
}

/** Subscribe to health updates (returns unsubscribe). */
export function onHealthChange(fn: HealthSubscriber): () => void {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

/** Latest cached health snapshot (may be null if never checked). */
export function getLatestHealth(): SystemHealth | null {
  return latestHealth;
}
