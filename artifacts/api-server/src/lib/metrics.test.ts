import { describe, it, expect, beforeEach, vi } from "vitest";

describe("metrics", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("agrega contagem, erros e latência por rota", async () => {
    const { recordRequest, getMetricsSnapshot } = await import("./metrics");

    recordRequest("GET /api/projects", 200, 10);
    recordRequest("GET /api/projects", 200, 20);
    recordRequest("GET /api/projects", 500, 30);
    recordRequest("POST /api/billing/checkout", 200, 100);

    const snapshot = getMetricsSnapshot();

    expect(snapshot.totalRequests).toBe(4);
    expect(snapshot.totalErrors).toBe(1);
    expect(snapshot.errorRate).toBe(0.25);
    expect(snapshot.routes["GET /api/projects"]).toEqual({ count: 3, errors: 1 });
    expect(snapshot.routes["POST /api/billing/checkout"]).toEqual({ count: 1, errors: 0 });
  });

  it("calcula percentis de latência a partir das amostras", async () => {
    const { recordRequest, getMetricsSnapshot } = await import("./metrics");

    for (let i = 1; i <= 100; i++) {
      recordRequest("GET /api/health", 200, i);
    }

    const snapshot = getMetricsSnapshot();
    expect(snapshot.latencyMs.sampleCount).toBe(100);
    expect(snapshot.latencyMs.p50).toBeGreaterThan(0);
    expect(snapshot.latencyMs.p99).toBeGreaterThanOrEqual(snapshot.latencyMs.p95);
    expect(snapshot.latencyMs.p95).toBeGreaterThanOrEqual(snapshot.latencyMs.p50);
  });

  it("errorRate é 0 sem nenhuma requisição registrada", async () => {
    const { getMetricsSnapshot } = await import("./metrics");
    const snapshot = getMetricsSnapshot();
    expect(snapshot.totalRequests).toBe(0);
    expect(snapshot.errorRate).toBe(0);
  });

  it("mantém no máximo as últimas 1000 amostras de latência", async () => {
    const { recordRequest, getMetricsSnapshot } = await import("./metrics");
    for (let i = 0; i < 1500; i++) {
      recordRequest("GET /api/x", 200, i);
    }
    expect(getMetricsSnapshot().latencyMs.sampleCount).toBe(1000);
  });
});
