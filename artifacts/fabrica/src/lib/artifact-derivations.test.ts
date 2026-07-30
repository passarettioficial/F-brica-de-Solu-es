import { describe, it, expect } from "vitest";
import { deriveArtifactBadge } from "./artifact-derivations";

describe("deriveArtifactBadge", () => {
  it("retorna null para conteúdo vazio", () => {
    expect(deriveArtifactBadge("SCORE_POTENCIAL", "")).toBeNull();
    expect(deriveArtifactBadge("SCORE_POTENCIAL", "   ")).toBeNull();
  });

  it("retorna null para artifactKey sem deriver mapeado", () => {
    expect(deriveArtifactBadge("CHAVE_INEXISTENTE", '{"a":1}')).toBeNull();
  });

  it("não lança exceção com JSON malformado", () => {
    expect(() => deriveArtifactBadge("SCORE_POTENCIAL", "{ json quebrado")).not.toThrow();
    expect(deriveArtifactBadge("SCORE_POTENCIAL", "{ json quebrado")).toBeNull();
  });

  describe("SCORE_POTENCIAL", () => {
    it("ok quando score >= 3.5", () => {
      expect(deriveArtifactBadge("SCORE_POTENCIAL", '{"media": 4}')).toMatchObject({ state: "ok" });
    });
    it("warn entre 2.5 e 3.5", () => {
      expect(deriveArtifactBadge("SCORE_POTENCIAL", '{"media": 3}')).toMatchObject({ state: "warn" });
    });
    it("alert abaixo de 2.5", () => {
      expect(deriveArtifactBadge("SCORE_POTENCIAL", '{"media": 1.5}')).toMatchObject({ state: "alert" });
    });
  });

  describe("LTV_CAC", () => {
    it("ok quando razão >= 3", () => {
      expect(deriveArtifactBadge("LTV_CAC", '{"razao_ltv_cac": 4}')).toMatchObject({ state: "ok" });
    });
    it("warn entre 1 e 3", () => {
      expect(deriveArtifactBadge("LTV_CAC", '{"razao_ltv_cac": 2}')).toMatchObject({ state: "warn" });
    });
    it("alert (insustentável) abaixo de 1", () => {
      expect(deriveArtifactBadge("LTV_CAC", '{"razao_ltv_cac": 0.5}')).toMatchObject({ state: "alert" });
    });
  });

  describe("THREAT_MODEL (Onda 0 — schema JSON novo)", () => {
    it("ok com 4+ features e zero riscos críticos", () => {
      const content = JSON.stringify({ features: [1, 2, 3, 4].map((i) => ({ feature: `f${i}` })), riscos_criticos: [] });
      expect(deriveArtifactBadge("THREAT_MODEL", content)).toMatchObject({ state: "ok" });
    });
    it("warn com 4+ features mas riscos críticos presentes", () => {
      const content = JSON.stringify({ features: [1, 2, 3, 4].map((i) => ({ feature: `f${i}` })), riscos_criticos: ["x"] });
      expect(deriveArtifactBadge("THREAT_MODEL", content)).toMatchObject({ state: "warn" });
    });
    it("warn com menos de 4 features", () => {
      const content = JSON.stringify({ features: [{ feature: "f1" }] });
      expect(deriveArtifactBadge("THREAT_MODEL", content)).toMatchObject({ state: "warn" });
    });
    it("null sem nenhuma feature", () => {
      expect(deriveArtifactBadge("THREAT_MODEL", JSON.stringify({ features: [] }))).toBeNull();
    });
  });

  describe("ARQUITETURA (Onda 0 — schema JSON novo)", () => {
    it("ok com 5+ componentes", () => {
      const content = JSON.stringify({ componentes: [1, 2, 3, 4, 5].map((i) => ({ nome: `c${i}` })), conexoes: [] });
      expect(deriveArtifactBadge("ARQUITETURA", content)).toMatchObject({ state: "ok" });
    });
    it("warn com menos de 5 componentes", () => {
      const content = JSON.stringify({ componentes: [{ nome: "c1" }] });
      expect(deriveArtifactBadge("ARQUITETURA", content)).toMatchObject({ state: "warn" });
    });
  });

  describe("SPRINT_1 (Onda 0 — schema JSON novo)", () => {
    it("ok com 8+ tasks, soma as horas no label", () => {
      const tasks = Array.from({ length: 8 }, (_, i) => ({ estimativa_horas: 2 }));
      const badge = deriveArtifactBadge("SPRINT_1", JSON.stringify({ tasks }));
      expect(badge).toMatchObject({ state: "ok" });
      expect(badge?.label).toContain("16h"); // 8 tasks × 2h
    });
    it("warn com menos de 8 tasks", () => {
      const badge = deriveArtifactBadge("SPRINT_1", JSON.stringify({ tasks: [{ estimativa_horas: 1 }] }));
      expect(badge).toMatchObject({ state: "warn" });
    });
    it("null sem tasks", () => {
      expect(deriveArtifactBadge("SPRINT_1", JSON.stringify({ tasks: [] }))).toBeNull();
    });
  });

  describe("MILESTONES", () => {
    it("ok com 5+ milestones", () => {
      const content = JSON.stringify({ milestones: [1, 2, 3, 4, 5], duracao_total_estimada: "6 semanas" });
      const badge = deriveArtifactBadge("MILESTONES", content);
      expect(badge).toMatchObject({ state: "ok" });
      expect(badge?.label).toContain("6 semanas");
    });
    it("warn com menos de 5 milestones", () => {
      expect(deriveArtifactBadge("MILESTONES", JSON.stringify({ milestones: [1, 2] }))).toMatchObject({ state: "warn" });
    });
  });
});
