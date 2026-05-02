import { openai } from "@workspace/integrations-openai-ai-server";

export interface PhaseAIResult {
  artifactKey: string;
  content: string;
  contentJson: string | null;
}

const PHASE_NAMES = ["IDEIA", "PRD", "SPEC", "IMPLEMENTAÇÃO", "TESTE", "DEPLOY"];

const PHASE_PROMPTS: Record<number, string> = {
  1: `Você é um assistente especializado em validação de ideias de produto. Analise o briefing do projeto e gere os seguintes artefatos em português brasileiro:

1. LEAN_CANVAS: Um Lean Canvas com 9 blocos em formato JSON:
   {"problema": "...", "segmentos_clientes": "...", "proposta_valor_unica": "...", "solucao": "...", "canais": "...", "fluxo_receita": "...", "estrutura_custos": "...", "metricas_chave": "...", "vantagem_injusta": "..."}

2. JTBD: Jobs to be Done - o que o cliente está tentando realizar (3-5 jobs principais)

3. DIMENSIONAMENTO_MERCADO: TAM (mercado total), SAM (mercado endereçável), SOM (mercado obtível) com valores estimados e raciocínio

4. HIPOTESE_CENTRAL: A hipótese central do negócio em 1 frase precisa e testável

5. SCORE_POTENCIAL: Notas de 1 a 5 em formato JSON:
   {"desejabilidade": N, "viabilidade": N, "factibilidade": N, "escalabilidade": N, "justificativas": {"desejabilidade": "...", "viabilidade": "...", "factibilidade": "...", "escalabilidade": "..."}}

Seja específico, crítico e honesto. Tom motivacional mas realista.`,

  2: `Você é um especialista em Product Management. Com base no briefing e nos artefatos da fase IDEIA, gere os seguintes artefatos em português brasileiro:

1. PRD: Documento de Product Requirements completo com: Visão, Problema, Solução, Funcionalidades (MVP), Fora do Escopo, Riscos

2. PERSONAS: Personas em formato JSON:
   {"primaria": {"nome": "...", "cargo": "...", "idade": N, "dores": [...], "objetivos": [...], "citacao": "..."}, "secundaria": {...}}

3. METRICAS_SUCESSO: Métricas em formato JSON:
   {"north_star": {"metrica": "...", "definicao": "...", "meta": "..."}, "inputs": [{"metrica": "...", "definicao": "..."}, ...]}

4. HIPOTESE_PRICING: Hipótese de precificação com modelo (freemium/assinatura/uso/único), faixas de preço e justificativa

Seja preciso e orientado a dados. Tom de parceiro de construção.`,

  3: `Você é um arquiteto de software sênior. Com base no briefing e artefatos anteriores, gere os seguintes artefatos técnicos em português brasileiro:

1. ARQUITETURA: Arquitetura do sistema com componentes, tecnologias recomendadas e justificativas, diagrama em texto (usando caracteres ASCII)

2. MODELO_DADOS: Modelo de dados com entidades, campos, tipos e relacionamentos em formato tabular

3. CONTRATOS_API: Principais contratos de API (endpoints críticos) em formato similar a OpenAPI simplificado

4. FLUXOS_UI: 3-5 fluxos de UI principais mapeados em texto descritivo (ex: "Usuário acessa dashboard → Clica em projeto → Vê fases → Executa IA → ...")

Seja técnico e detalhado. Tom de especialista confiante.`,

  4: `Você é um especialista em gestão de projetos ágeis. Com base no briefing e artefatos anteriores, gere os seguintes artefatos em português brasileiro:

1. MILESTONES: Plano de milestones em formato JSON, cada milestone é uma feature navegável:
   [{"numero": 1, "nome": "...", "descricao": "...", "features": [...], "duracao_estimada": "...", "criterio_conclusao": "..."}, ...]

2. ESTRUTURA_PASTAS: Estrutura de pastas sugerida do projeto em formato de árvore de texto

3. README: Conteúdo de README.md com: descrição, pré-requisitos, setup em exatamente 5 comandos, rodando o projeto, variáveis de ambiente necessárias

Seja prático e orientado à ação. Tom de mentor técnico.`,

  5: `Você é um especialista em qualidade de software. Com base no briefing e artefatos anteriores, gere os seguintes artefatos em português brasileiro:

1. PLANO_TESTES: Plano de testes completo com: estratégia, tipos de teste (unitário, integração, E2E), ferramentas recomendadas, cobertura mínima

2. CHECKLIST_QA: Checklist de QA em formato JSON:
   {"funcionalidade": [...], "performance": [...], "seguranca": [...], "acessibilidade": [...], "mobile": [...]}

3. BUGS_PREVENCAO: Lista dos 10 bugs mais comuns a prevenir neste tipo de produto, com causa raiz e solução preventiva

Tom de guardião da qualidade, meticuloso mas pragmático.`,

  6: `Você é um especialista em go-to-market e lançamento de produtos. Com base no briefing e artefatos anteriores, gere os seguintes artefatos em português brasileiro:

1. RUNBOOK_DEPLOY: Runbook de deploy passo a passo: pré-deploy, deploy, pós-deploy, rollback

2. GTM: Plano de Go-to-Market mínimo em formato JSON:
   {"canal_aquisicao_1": "...", "mensagem_chave": "...", "primeiros_10_clientes": [{"perfil": "...", "onde_encontrar": "...", "abordagem": "..."}, ...], "metricas_lancamento": [...]}

3. LAUNCH_CHECKLIST: Checklist de lançamento em formato JSON:
   {"tecnico": [...], "produto": [...], "marketing": [...], "legal": [...], "operacional": [...]}

Tom de parceiro estratégico animado com o lançamento iminente.`,
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
    ? `\n\nARTEFATOS DE FASES ANTERIORES:\n${previousArtifacts.map(a => `[${a.artifactKey}]\n${a.content}`).join("\n\n")}`
    : "";

  const systemPrompt = `${prompt}\n\nFormate cada artefato claramente com o prefixo ### NOME_DO_ARTEFATO (em maiúsculas com underlines, ex: ### LEAN_CANVAS). Responda SEMPRE em português brasileiro.`;

  const userMessage = `PROJETO: ${projectName}\n\nBRIEFING:\n${briefing}${previousContext}\n\nGere os artefatos da fase ${phaseNumber} - ${phaseName}.`;

  const stream = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 8192,
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
    1: ["LEAN_CANVAS", "JTBD", "DIMENSIONAMENTO_MERCADO", "HIPOTESE_CENTRAL", "SCORE_POTENCIAL"],
    2: ["PRD", "PERSONAS", "METRICAS_SUCESSO", "HIPOTESE_PRICING"],
    3: ["ARQUITETURA", "MODELO_DADOS", "CONTRATOS_API", "FLUXOS_UI"],
    4: ["MILESTONES", "ESTRUTURA_PASTAS", "README"],
    5: ["PLANO_TESTES", "CHECKLIST_QA", "BUGS_PREVENCAO"],
    6: ["RUNBOOK_DEPLOY", "GTM", "LAUNCH_CHECKLIST"],
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

    // Try to extract JSON content for structured artifacts
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
