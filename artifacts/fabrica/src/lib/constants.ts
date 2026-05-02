export const PHASES = [
  {
    number: 1,
    name: "IDEIA",
    motivation: "Valide se sua ideia tem potencial real de mercado antes de construir qualquer linha de código",
    gates: [
      "Hipótese central escrita em 1 frase",
      "3 alternativas atuais mapeadas",
      "Score de potencial médio ≥ 3.5",
    ],
  },
  {
    number: 2,
    name: "PRD",
    motivation: "Defina exatamente o que será construído e por que os usuários vão pagar por isso",
    gates: [
      "MVP cabe em ≤ 4 semanas",
      "North Star metric definida e mensurável",
      "Proposta de valor não substituível por concorrente",
    ],
  },
  {
    number: 3,
    name: "SPEC",
    motivation: "Projete a arquitetura técnica antes de escrever a primeira linha de código",
    gates: [
      "Schema de dados completo",
      "Contratos de API definidos",
      "Plano de segurança revisado",
    ],
  },
  {
    number: 4,
    name: "IMPLEMENTAÇÃO",
    motivation: "Quebre o produto em milestones navegáveis e construa com disciplina",
    gates: [
      "Milestones quebrados em features navegáveis",
      "README com setup em ≤ 15 min",
      "Zero mocks em features críticas",
    ],
  },
  {
    number: 5,
    name: "TESTE",
    motivation: "Valide que o produto funciona e que usuários reais conseguem usá-lo",
    gates: [
      "Zero bugs P0 abertos",
      "3+ usuários reais testaram",
      "Performance validada",
    ],
  },
  {
    number: 6,
    name: "DEPLOY",
    motivation: "Lance com intenção e chegue aos seus primeiros 10 clientes",
    gates: [
      "Produto em URL pública",
      "Monitoramento ativo",
      "Lista dos 10 primeiros clientes pronta",
    ],
  },
];
