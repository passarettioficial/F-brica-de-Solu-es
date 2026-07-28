import { describe, it, expect } from "vitest";
import { normalizePlanId, getPlanConfig, PLANS } from "./stripe";

describe("normalizePlanId", () => {
  it("mantém planos atuais inalterados", () => {
    expect(normalizePlanId("free")).toBe("free");
    expect(normalizePlanId("founder")).toBe("founder");
    expect(normalizePlanId("studio")).toBe("studio");
  });

  it("mapeia IDs legados para os planos atuais", () => {
    expect(normalizePlanId("basic")).toBe("founder");
    expect(normalizePlanId("starter")).toBe("founder");
    expect(normalizePlanId("pro")).toBe("founder");
    expect(normalizePlanId("advanced")).toBe("studio");
  });

  it("cai para free em IDs desconhecidos", () => {
    expect(normalizePlanId("plano-inexistente")).toBe("free");
  });
});

describe("getPlanConfig", () => {
  it("retorna a config correta por plano", () => {
    expect(getPlanConfig("founder").aiDailyLimit).toBe(PLANS.founder.aiDailyLimit);
    expect(getPlanConfig("studio").maxProjects).toBe(PLANS.studio.maxProjects);
  });

  it("normaliza plano legado antes de resolver a config", () => {
    expect(getPlanConfig("advanced").id).toBe("studio");
  });

  it("superuser sempre recebe limites ilimitados, mesmo em plano free", () => {
    const config = getPlanConfig("free", true);
    expect(config.aiDailyLimit).toBe(999999);
    expect(config.maxProjects).toBe(999999);
    expect(config.canDownload).toBe(true);
  });

  it("free plan não tem cópia/download/impressão nem AI advisor", () => {
    const config = getPlanConfig("free");
    expect(config.canCopy).toBe(false);
    expect(config.canDownload).toBe(false);
    expect(config.canPrint).toBe(false);
    expect(config.hasAiAdvisor).toBe(false);
  });
});
