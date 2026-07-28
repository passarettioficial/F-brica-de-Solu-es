/**
 * Minimal in-process observability: request counts, error rate, and latency percentiles.
 * No external APM dependency — this is a stopgap so the team has *some* infra visibility
 * beyond structured logs, not a replacement for real tracing/metrics if usage grows.
 * State resets on every restart/deploy and is per-instance (not aggregated across autoscale
 * replicas) — good enough for a single small deployment, not for a fleet.
 */

interface RouteStats {
  count: number;
  errors: number;
}

const MAX_LATENCY_SAMPLES = 1000;

const routeStats = new Map<string, RouteStats>();
const latencySamples: number[] = [];
let totalRequests = 0;
let totalErrors = 0;
const startedAt = Date.now();

export function recordRequest(route: string, statusCode: number, durationMs: number): void {
  totalRequests += 1;
  const isError = statusCode >= 500;
  if (isError) totalErrors += 1;

  const stats = routeStats.get(route) ?? { count: 0, errors: 0 };
  stats.count += 1;
  if (isError) stats.errors += 1;
  routeStats.set(route, stats);

  latencySamples.push(durationMs);
  if (latencySamples.length > MAX_LATENCY_SAMPLES) latencySamples.shift();
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return Math.round(sorted[idx]! * 100) / 100;
}

export interface MetricsSnapshot {
  uptimeSeconds: number;
  totalRequests: number;
  totalErrors: number;
  errorRate: number;
  latencyMs: { p50: number; p95: number; p99: number; sampleCount: number };
  routes: Record<string, RouteStats>;
}

export function getMetricsSnapshot(): MetricsSnapshot {
  const sorted = [...latencySamples].sort((a, b) => a - b);

  return {
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    totalRequests,
    totalErrors,
    errorRate: totalRequests === 0 ? 0 : Math.round((totalErrors / totalRequests) * 10000) / 10000,
    latencyMs: {
      p50: percentile(sorted, 50),
      p95: percentile(sorted, 95),
      p99: percentile(sorted, 99),
      sampleCount: sorted.length,
    },
    routes: Object.fromEntries(
      [...routeStats.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 30),
    ),
  };
}
