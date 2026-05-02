import { openai } from "@workspace/integrations-openai-ai-server";

export interface PhaseAIResult {
  artifactKey: string;
  content: string;
  contentJson: string | null;
}

const PHASE_NAMES = ["IDEIA", "PRD", "SPEC", "IMPLEMENTAÇÃO", "TESTE", "DEPLOY"];

const PHASE_PROMPTS: Record<number, string> = {
  1: `Você é um especialista em validação de ideias de produto e estratégia de negócio. Analise o briefing e gere os seguintes artefatos em português brasileiro. Seja específico para o negócio descrito, não genérico.

### LEAN_CANVAS
Lean Canvas completo em formato JSON com os 9 blocos bem detalhados:
{"problema": "...", "segmentos_clientes": "...", "proposta_valor_unica": "...", "solucao": "...", "canais": "...", "fluxo_receita": "...", "estrutura_custos": "...", "metricas_chave": "...", "vantagem_injusta": "..."}

### JTBD
Jobs to be Done — o que o cliente realmente está tentando realizar. Liste 5 jobs funcionais, 3 jobs emocionais e 2 jobs sociais no formato: "Quando [situação], quero [motivação], para [resultado esperado]."

### ANALISE_COMPETITIVA
Mapeie 5 concorrentes diretos e indiretos com: nome, proposta de valor, modelo de preço estimado, pontos fortes, pontos fracos, e por que o cliente escolheria esta solução em vez deles. Inclua uma tabela comparativa.

### SWOT
Análise SWOT detalhada em formato JSON:
{"forcas": [...], "fraquezas": [...], "oportunidades": [...], "ameacas": [...], "estrategias": {"SO": "...", "WO": "...", "ST": "...", "WT": "..."}}

### DIMENSIONAMENTO_MERCADO
TAM / SAM / SOM com metodologia bottom-up E top-down:
- TAM: mercado total global
- SAM: segmento endereçável (geografia + perfil)
- SOM: obtível em 18 meses
Inclua fontes de dados sugeridas e premissas explícitas.

### VALIDACAO_RAPIDA
Script de entrevista de descoberta com 10 perguntas abertas para validar a hipótese central. Inclua: o que observar nas respostas, sinais de validação vs. invalidação, e um template de registro de entrevista.

### HIPOTESE_CENTRAL
A hipótese central do negócio em 1 frase no formato:
"Acreditamos que [cliente] tem o problema de [problema] e estará disposto a [ação/pagamento] por uma solução que [proposta de valor], o que poderemos confirmar quando [métrica mensurável]."

### SCORE_POTENCIAL
Pontuação estratégica em formato JSON com justificativas detalhadas:
{"desejabilidade": N, "viabilidade": N, "factibilidade": N, "escalabilidade": N, "timing": N, "media": N, "justificativas": {"desejabilidade": "...", "viabilidade": "...", "factibilidade": "...", "escalabilidade": "...", "timing": "..."}, "recomendacao": "AVANÇAR | PIVOTAR | ABANDONAR", "proximos_passos": [...]}`,

  2: `Você é um Product Manager sênior com experiência em produtos de alto crescimento. Com base no briefing e artefatos da fase IDEIA, gere os seguintes artefatos em português brasileiro. Seja específico e orientado à ação.

### PRD
Documento de Product Requirements completo:
**Visão do Produto**: [1 parágrafo inspirador]
**Problema**: [definição precisa do problema]
**Solução**: [descrição da solução]
**Usuários-alvo**: [perfis principais]
**Funcionalidades MVP** (priorizado por RICE ou MoSCoW):
- Must Have: [lista]
- Should Have: [lista]
- Won't Have (v1): [lista]
**Critérios de Sucesso**: [3-5 métricas]
**Riscos e Mitigações**: [tabela]
**Fora do Escopo**: [lista explícita]

### PERSONAS
3 personas detalhadas em formato JSON:
{"primaria": {"nome": "...", "cargo": "...", "idade": N, "empresa": "...", "renda": "...", "dores": [...], "objetivos": [...], "ferramentas_atuais": [...], "comportamento_digital": "...", "citacao": "...", "disposicao_pagar": "..."}, "secundaria": {...}, "negativa": {"descricao": "quem NÃO é o cliente", "motivos": [...]}}

### USER_STORIES
15 user stories do MVP no formato "Como [persona], quero [ação], para [valor]" organizadas por épico. Para cada story: critérios de aceitação (Dado/Quando/Então), estimativa de esforço (P/M/G) e prioridade (1-5).

### METRICAS_SUCESSO
Framework de métricas completo em formato JSON:
{"north_star": {"metrica": "...", "definicao": "...", "formula": "...", "meta_30d": "...", "meta_90d": "..."}, "l1_inputs": [...], "l2_guardrails": [...], "pirate_metrics": {"acquisition": "...", "activation": "...", "retention": "...", "revenue": "...", "referral": "..."}}

### HIPOTESE_PRICING
Estratégia de precificação completa:
- Modelo recomendado e justificativa
- 3 tiers com nomes, preços e funcionalidades por tier
- Estratégia de go-to-market pricing (freemium, trial, etc.)
- Análise de sensibilidade de preço (willingness to pay)
- Comparação com concorrentes
- Unit economics projetados: CAC, LTV, LTV/CAC esperado

### BENCHMARKING
Análise de benchmarks de 3 produtos de referência global:
Para cada um: modelo de negócio, estratégia de pricing, canais de aquisição, métricas públicas conhecidas, o que copiar e o que evitar.

### ROADMAP_3_MESES
Roadmap trimestral em formato JSON:
{"mes_1": {"tema": "...", "objetivos": [...], "entregas_chave": [...], "metricas_sucesso": [...]}, "mes_2": {...}, "mes_3": {...}, "premissas": [...], "riscos": [...]}`,

  3: `Você é um arquiteto de software sênior com experiência em sistemas escaláveis e seguros. Com base no briefing e artefatos anteriores, gere os seguintes artefatos técnicos em português brasileiro.

### ARQUITETURA
Arquitetura completa do sistema:
**Estilo arquitetural**: [monolito/microsserviços/serverless — com justificativa]
**Diagrama de componentes** (ASCII art detalhado)
**Stack tecnológica recomendada** com justificativa para cada escolha (frontend, backend, banco, cache, fila, infra)
**Fluxo de dados principais** descritos em texto
**Decisões de trade-off**: [o que foi priorizado e por quê]

### MODELO_DADOS
Modelo de dados completo:
- Tabela/coleção para cada entidade com: nome, campos, tipos, constraints, índices
- Relacionamentos explícitos (1:1, 1:N, N:N)
- Estratégia de soft delete e auditoria
- Considerações de multi-tenancy (se aplicável)
- Scripts SQL ou schema de exemplo para entidades principais

### CONTRATOS_API
Contratos de API principais (mínimo 8 endpoints críticos) no formato:
**[MÉTODO] /caminho** — Descrição
- Auth: [required/optional]
- Params: [lista]
- Body: [schema JSON]
- Response 200: [schema JSON]
- Erros: [códigos e significados]

### SEGURANCA
Plano de segurança completo:
- Autenticação e autorização (fluxo detalhado)
- Proteção de dados sensíveis (LGPD/GDPR)
- Top 10 OWASP aplicáveis e mitigações específicas
- Política de secrets e variáveis de ambiente
- Rate limiting e proteção contra abuso
- Auditoria e logging de segurança

### FLUXOS_UI
5 fluxos de UX críticos mapeados em detalhe:
Para cada fluxo: tela por tela, decisões do usuário, estados de erro, estado de sucesso, e edge cases a tratar.

### ESCALABILIDADE
Plano de escalabilidade em formato JSON:
{"cenarios": [{"usuarios": "1K", "estrategia": "...", "infraestrutura": "..."}, {"usuarios": "10K", "estrategia": "..."}, {"usuarios": "100K", "estrategia": "..."}], "gargalos_esperados": [...], "estrategias_cache": [...], "banco_de_dados": {"sharding": "...", "read_replicas": "...", "particionamento": "..."}}

### ADR
5 Architecture Decision Records (ADRs) para as decisões mais importantes:
Para cada ADR: título, status (proposto/aceito), contexto, decisão, consequências positivas, consequências negativas, alternativas consideradas.

### SETUP_DEVOPS
Infraestrutura e DevOps:
- Ambientes necessários (dev/staging/prod) e diferenças
- Pipeline CI/CD recomendado (GitHub Actions/GitLab CI) com stages
- Estratégia de branches (GitFlow/trunk-based)
- Observabilidade: logs, métricas, traces, alertas
- Estratégia de backup e disaster recovery
- Estimativa de custo de infra para 1K, 10K e 100K usuários`,

  4: `Você é um especialista em engenharia de software e gestão ágil. Com base no briefing e artefatos anteriores, gere os seguintes artefatos em português brasileiro.

### MILESTONES
Plano de milestones detalhado em formato JSON:
[{"numero": 1, "nome": "...", "descricao": "...", "duracao": "...", "features": [{"nome": "...", "descricao": "...", "criterio_conclusao": "..."}], "dependencias": [...], "riscos": [...], "entregavel_demo": "..."}, ...]
Mínimo 5 milestones cobrindo todo o MVP.

### SPRINT_1
Plano detalhado da Sprint 1 (primeira semana de desenvolvimento):
- Objetivos claros e mensuráveis
- Tasks técnicas em ordem de execução (com estimativas em horas)
- Setup do ambiente de desenvolvimento passo a passo
- Definição de "done" para cada task
- Bloqueadores potenciais e como resolvê-los
- Checkpoint de fim de sprint: o que deve estar funcionando

### ESTRUTURA_PASTAS
Estrutura de pastas completa do projeto em formato de árvore ASCII, com comentário explicativo para cada pasta/arquivo importante. Inclua: arquivos de configuração, estrutura de testes, assets, docs.

### README
README.md completo com:
- Badge de status, tech stack, licença
- Descrição do produto (1 parágrafo)
- Funcionalidades principais (bullet points)
- Pré-requisitos
- Setup em exatamente 5 comandos
- Variáveis de ambiente necessárias (com .env.example)
- Rodando os testes
- Estrutura do projeto
- Como contribuir
- Roadmap

### GUIA_CONTRIBUICAO
CONTRIBUTING.md com:
- Padrões de código (naming, formatação, comentários)
- Fluxo de PR: como criar, revisar e aprovar
- Convenção de commits (Conventional Commits)
- Política de branches
- Checklist de PR
- Como reportar bugs e sugerir features
- Code review guidelines

### TECH_DEBT_LOG
Registro de decisões de débito técnico:
Para cada item: descrição do atalho tomado, motivo (velocidade/custo/conhecimento), impacto estimado (baixo/médio/alto), quando deve ser resolvido, e plano de resolução. Mínimo 8 itens.

### DEFINITION_OF_DONE
Definição de "Done" para o projeto em formato JSON:
{"codigo": [...], "testes": [...], "documentacao": [...], "performance": [...], "seguranca": [...], "deploy": [...], "produto": [...]}`,

  5: `Você é um especialista em qualidade de software e experiência do usuário. Com base no briefing e artefatos anteriores, gere os seguintes artefatos em português brasileiro.

### PLANO_TESTES
Plano de testes completo:
- Estratégia geral e filosofia de testes
- Pirâmide de testes: % unitários, integração, E2E
- Ferramentas recomendadas com justificativa
- Ambientes de teste e dados de teste
- Critérios de cobertura mínima
- Processo de regressão
- Integração com CI/CD

### CASOS_TESTE_CRITICOS
20 casos de teste críticos priorizados para os fluxos principais:
Para cada caso: ID, título, precondições, steps, resultado esperado, prioridade (P0/P1/P2), tipo (funcional/integração/E2E).

### CHECKLIST_QA
Checklist completo em formato JSON:
{"funcionalidade": [...], "performance": [...], "seguranca": [...], "acessibilidade": [...], "mobile_responsivo": [...], "cross_browser": [...], "offline": [...], "internacionalizacao": [...]}

### SCRIPT_USER_TEST
Roteiro de teste com usuários reais:
- Objetivo do teste e o que medir
- Perfil dos participantes (5 pessoas ideais)
- Tarefas para executar (com cenários realistas)
- Perguntas de follow-up
- Métricas a coletar (task completion, time on task, erros, NPS)
- Template de notas de observação
- Como analisar e priorizar os resultados

### RELATORIO_PERFORMANCE
Benchmarks de performance a atingir e como medir:
- Core Web Vitals alvo (LCP, FID, CLS)
- Tempo de resposta de API por endpoint crítico
- Carga suportada (usuários simultâneos)
- Ferramentas de medição recomendadas
- Plano de otimização se metas não forem atingidas

### BUGS_PREVENCAO
Os 10 bugs mais críticos a prevenir neste tipo de produto:
Para cada bug: nome descritivo, categoria (data/auth/race condition/etc.), como acontece, impacto no usuário, como prevenir (no código), como detectar (monitoramento), como resolver se acontecer.

### OBSERVABILIDADE
Plano de observabilidade em produção:
- Logs estruturados: o que logar, formato, níveis
- Métricas de negócio a monitorar em tempo real
- Métricas técnicas: CPU, memória, latência, error rate
- Alertas críticos: threshold e quem notificar
- Dashboard sugerido (o que mostrar para eng vs produto vs negócio)
- Ferramentas recomendadas (Datadog/Sentry/Grafana/etc.)`,

  6: `Você é um especialista em go-to-market, lançamento de produtos e crescimento. Com base no briefing e artefatos anteriores, gere os seguintes artefatos em português brasileiro.

### RUNBOOK_DEPLOY
Runbook de deploy completo:
**Pré-deploy** (checklist com responsável e tempo estimado para cada item)
**Deploy** (passo a passo técnico com comandos)
**Smoke tests pós-deploy** (o que verificar em produção)
**Monitoramento** (o que observar nas primeiras 24h)
**Rollback** (como reverter, critérios para acionar, tempo esperado)
**Comunicação** (como notificar usuários de manutenção e incidentes)

### GTM
Plano de Go-to-Market completo em formato JSON:
{"posicionamento": "...", "mensagem_chave": "...", "canal_primario": "...", "primeiros_10_clientes": [{"perfil": "...", "onde_encontrar": "...", "abordagem": "...", "proposta_de_valor": "..."}], "canais_aquisicao": [{"canal": "...", "custo_estimado": "...", "cac_esperado": "...", "prazo_resultados": "..."}], "metricas_lancamento": [...], "cronograma_30_dias": [...]}

### LAUNCH_CHECKLIST
Checklist de lançamento completo em formato JSON:
{"tecnico": [...], "produto": [...], "marketing": [...], "legal_compliance": [...], "operacional": [...], "suporte": [...], "comunicacao": [...]}

### METRICAS_POS_LAUNCH
Dashboard de métricas para as primeiras 4 semanas pós-lançamento em formato JSON:
{"semana_1": {"foco": "...", "metricas": [...], "meta": "...", "acao_se_abaixo": "..."}, "semana_2": {...}, "semana_3": {...}, "semana_4": {...}, "criterios_product_market_fit": [...]}

### PLANO_CRESCIMENTO_90_DIAS
Plano de crescimento para os primeiros 90 dias:
- Metas por período (30/60/90 dias)
- Estratégias de aquisição por canal com budget sugerido
- Estratégias de ativação e onboarding
- Estratégias de retenção (early)
- Experimentos a rodar (A/B tests, campanhas)
- Marcos de sucesso e triggers de pivô

### PITCH_INVESTIDORES
Narrativa para investidores (1-slide por seção, max 2 parágrafos):
1. Problema (dor real, tamanho)
2. Solução (demo em 1 frase)
3. Tração inicial (o que já foi validado)
4. Mercado (TAM/SAM/SOM resumido)
5. Modelo de negócio (como ganha dinheiro)
6. Vantagem competitiva (por que vocês ganham)
7. Time (quem são e por que vão vencer)
8. Pedido (quanto precisam e para quê)

### SLA_SUPORTE
Plano de suporte e SLA para o lançamento:
- Canais de suporte (email/chat/docs)
- Tempo de resposta por prioridade (P0/P1/P2/P3)
- Playbooks dos 10 problemas mais comuns esperados
- FAQ inicial (10 perguntas e respostas)
- Processo de escalação
- Como coletar e processar feedback dos primeiros usuários`,
};

export async function generatePhaseArtifacts(
  phaseNumber: number,
  projectName: string,
  briefing: string,
  previousArtifacts: Array<{ artifactKey: string; content: string }>,
  onProgress: (text: string) => void
): Promise<PhaseAIResult[]> {
  const phaseName = PHASE_NAMES[phaseNumber - 1];
  const prompt = PHASE_PROMPTS[phaseNumber];

  const previousContext = previousArtifacts.length > 0
    ? `\n\nARTEFATOS DE FASES ANTERIORES (use como contexto e seja coerente com eles):\n${previousArtifacts.slice(0, 8).map(a => `[${a.artifactKey}]\n${a.content.slice(0, 800)}`).join("\n\n")}`
    : "";

  const systemPrompt = `${prompt}

INSTRUÇÕES DE FORMATAÇÃO:
- Use exatamente "### NOME_DO_ARTEFATO" (em maiúsculas com underlines) como separador entre artefatos
- Seja ESPECÍFICO para o produto/negócio descrito — nunca genérico
- Todos os artefatos devem estar em português brasileiro
- Para conteúdo JSON, use blocos \`\`\`json ... \`\`\`
- Seja denso e valioso — cada artefato deve ser um entregável que o founder pode usar imediatamente`;

  const userMessage = `PROJETO: ${projectName}\n\nBRIEFING:\n${briefing}${previousContext}\n\nGere todos os artefatos da Fase ${phaseNumber} — ${phaseName}. Seja específico, detalhado e acionável.`;

  const stream = await openai.chat.completions.create({
    model: "gpt-4.1",
    max_completion_tokens: 16000,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    stream: true,
  });

  let fullResponse = "";
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      fullResponse += content;
      onProgress(content);
    }
  }

  return parseArtifacts(fullResponse, phaseNumber);
}

function parseArtifacts(fullResponse: string, phaseNumber: number): PhaseAIResult[] {
  const phaseArtifactKeys: Record<number, string[]> = {
    1: ["LEAN_CANVAS", "JTBD", "ANALISE_COMPETITIVA", "SWOT", "DIMENSIONAMENTO_MERCADO", "VALIDACAO_RAPIDA", "HIPOTESE_CENTRAL", "SCORE_POTENCIAL"],
    2: ["PRD", "PERSONAS", "USER_STORIES", "METRICAS_SUCESSO", "HIPOTESE_PRICING", "BENCHMARKING", "ROADMAP_3_MESES"],
    3: ["ARQUITETURA", "MODELO_DADOS", "CONTRATOS_API", "SEGURANCA", "FLUXOS_UI", "ESCALABILIDADE", "ADR", "SETUP_DEVOPS"],
    4: ["MILESTONES", "SPRINT_1", "ESTRUTURA_PASTAS", "README", "GUIA_CONTRIBUICAO", "TECH_DEBT_LOG", "DEFINITION_OF_DONE"],
    5: ["PLANO_TESTES", "CASOS_TESTE_CRITICOS", "CHECKLIST_QA", "SCRIPT_USER_TEST", "RELATORIO_PERFORMANCE", "BUGS_PREVENCAO", "OBSERVABILIDADE"],
    6: ["RUNBOOK_DEPLOY", "GTM", "LAUNCH_CHECKLIST", "METRICAS_POS_LAUNCH", "PLANO_CRESCIMENTO_90_DIAS", "PITCH_INVESTIDORES", "SLA_SUPORTE"],
  };

  const keys = phaseArtifactKeys[phaseNumber] || [];
  const results: PhaseAIResult[] = [];

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];
    const startMarker = `### ${key}`;
    const startIdx = fullResponse.indexOf(startMarker);

    if (startIdx === -1) {
      results.push({ artifactKey: key, content: "", contentJson: null });
      continue;
    }

    let endIdx: number;
    if (nextKey) {
      const nextMarker = `### ${nextKey}`;
      endIdx = fullResponse.indexOf(nextMarker, startIdx);
      if (endIdx === -1) endIdx = fullResponse.length;
    } else {
      endIdx = fullResponse.length;
    }

    const content = fullResponse.slice(startIdx + startMarker.length, endIdx).trim();

    let contentJson: string | null = null;
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\}|\[[\s\S]*?\])\s*```/);
    if (jsonMatch) {
      try {
        JSON.parse(jsonMatch[1]);
        contentJson = jsonMatch[1];
      } catch {
        contentJson = null;
      }
    }

    results.push({ artifactKey: key, content, contentJson });
  }

  return results;
}
