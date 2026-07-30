export const PHASE_NAMES_UPPER: Record<number, string> = {
  1: "IDEIA",
  2: "PRD",
  3: "SEGURANÇA & LGPD",
  4: "SPEC",
  5: "PLANO DE IMPLEMENTAÇÃO",
  6: "PLANO DE TESTES",
  7: "PLANO DE DEPLOY",
};

export const PHASE_NAMES_UPPER_ARRAY: string[] = [1, 2, 3, 4, 5, 6, 7].map((n) => PHASE_NAMES_UPPER[n]);

export const PHASE_NAMES_TITLE: Record<number, string> = {
  1: "Ideia",
  2: "PRD",
  3: "Segurança & LGPD",
  4: "Spec",
  5: "Plano de Implementação",
  6: "Plano de Testes",
  7: "Plano de Deploy",
};

export const PHASE_NAMES_TITLE_ARRAY: string[] = [1, 2, 3, 4, 5, 6, 7].map((n) => PHASE_NAMES_TITLE[n]);
