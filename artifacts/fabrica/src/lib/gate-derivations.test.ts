import { describe, it, expect } from "vitest";
import { deriveGate } from "./gate-derivations";

function artifact(artifactKey: string, content: string) {
  return { artifactKey, content };
}

describe("deriveGate", () => {
  it("retorna unknown para fase/gate sem derivação definida", () => {
    expect(deriveGate(99, 1, [])).toEqual({ state: "unknown" });
  });

  it("retorna unknown quando não há artefatos", () => {
    expect(deriveGate(1, 1, [])).toEqual({ state: "unknown" });
  });

  describe("Fase 1, Gate 1 — Seletor de Nicho + Dimensionamento", () => {
    it("passa quando há segmento escolhido e TAM detalhado (>100 chars)", () => {
      const result = deriveGate(1, 1, [
        artifact("SELETOR_NICHO_INICIAL", '```json\n{"recomendacao":{"segmento_escolhido":"Clínicas odontológicas SP"}}\n```'),
        artifact("DIMENSIONAMENTO_MERCADO", "x".repeat(150)),
      ]);
      expect(result.state).toBe("pass");
      if (result.state === "pass") expect(result.message).toContain("Clínicas odontológicas SP");
    });

    it("fica unknown se o TAM for muito curto, mesmo com segmento escolhido", () => {
      const result = deriveGate(1, 1, [
        artifact("SELETOR_NICHO_INICIAL", '```json\n{"recomendacao":{"segmento_escolhido":"X"}}\n```'),
        artifact("DIMENSIONAMENTO_MERCADO", "muito curto"),
      ]);
      expect(result.state).toBe("unknown");
    });

    it("fica unknown com JSON malformado (não lança exceção)", () => {
      const result = deriveGate(1, 1, [
        artifact("SELETOR_NICHO_INICIAL", "```json\n{ isto não é json válido \n```"),
        artifact("DIMENSIONAMENTO_MERCADO", "x".repeat(150)),
      ]);
      expect(result.state).toBe("unknown");
    });
  });

  describe("Fase 1, Gate 3 — Score de Potencial (múltiplos formatos de fallback)", () => {
    it("usa `media` quando presente e passa se >= 3.5", () => {
      const result = deriveGate(1, 3, [artifact("SCORE_POTENCIAL", '{"media": 4.2}')]);
      expect(result.state).toBe("pass");
    });

    it("calcula média das 5 dimensões quando `media` está ausente", () => {
      const result = deriveGate(1, 3, [
        artifact("SCORE_POTENCIAL", '{"desejabilidade":4,"viabilidade":4,"factibilidade":4,"escalabilidade":4,"timing":4}'),
      ]);
      expect(result.state).toBe("pass");
    });

    it("warn quando a média das dimensões fica abaixo de 3.5", () => {
      const result = deriveGate(1, 3, [
        artifact("SCORE_POTENCIAL", '{"desejabilidade":2,"viabilidade":2,"factibilidade":2,"escalabilidade":2,"timing":2}'),
      ]);
      expect(result.state).toBe("warn");
    });

    it("usa pontuacao_total/5 como último fallback numérico", () => {
      const result = deriveGate(1, 3, [artifact("SCORE_POTENCIAL", '{"pontuacao_total": 20}')]);
      // 20/5 = 4.0 >= 3.5
      expect(result.state).toBe("pass");
    });

    it("cai para recomendacao textual quando não há nenhum número aproveitável", () => {
      const pass = deriveGate(1, 3, [artifact("SCORE_POTENCIAL", '{"recomendacao": "AVANÇAR"}')]);
      expect(pass.state).toBe("pass");

      const warn = deriveGate(1, 3, [artifact("SCORE_POTENCIAL", '{"recomendacao": "PIVOTAR"}')]);
      expect(warn.state).toBe("warn");
    });

    it("unknown quando não há artefato SCORE_POTENCIAL", () => {
      expect(deriveGate(1, 3, [artifact("OUTRA_COISA", "x")]).state).toBe("unknown");
    });
  });

  describe("Fase 2, Gate 3 — LTV÷CAC", () => {
    it("passa quando razao_ltv_cac >= 3", () => {
      const result = deriveGate(2, 3, [artifact("LTV_CAC", '{"razao_ltv_cac": 3.5}')]);
      expect(result.state).toBe("pass");
    });

    it("warn quando razao_ltv_cac < 3", () => {
      const result = deriveGate(2, 3, [artifact("LTV_CAC", '{"razao_ltv_cac": 1.2}')]);
      expect(result.state).toBe("warn");
    });

    it("passa via veredito SAUDAVEL quando não há razao_ltv_cac numérica", () => {
      const result = deriveGate(2, 3, [artifact("LTV_CAC", '{"veredito": "SAUDAVEL"}')]);
      expect(result.state).toBe("pass");
    });
  });

  describe("Fase 4, Gate 2 — Contratos de API (contagem por regex)", () => {
    it("passa com 6+ endpoints documentados no formato MÉTODO /caminho", () => {
      const content = [
        "**GET /projects**", "**POST /projects**", "**GET /projects/:id**",
        "**PATCH /projects/:id**", "**DELETE /projects/:id**", "**POST /projects/:id/share**",
      ].join("\n");
      const result = deriveGate(4, 2, [artifact("CONTRATOS_API", content)]);
      expect(result.state).toBe("pass");
    });

    it("unknown com menos de 6 endpoints", () => {
      const result = deriveGate(4, 2, [artifact("CONTRATOS_API", "**GET /projects**\n**POST /projects**")]);
      expect(result.state).toBe("unknown");
    });
  });

  describe("robustez a conteúdo vazio/ausente", () => {
    it("não lança exceção com content vazio em nenhuma das derivações mapeadas", () => {
      for (let phase = 1; phase <= 7; phase++) {
        for (let gate = 1; gate <= 3; gate++) {
          expect(() => deriveGate(phase, gate, [])).not.toThrow();
        }
      }
    });
  });
});
