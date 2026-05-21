import { db, projectsTable, phasesTable, phaseArtifactsTable } from "@workspace/db";
import { and, eq, isNull } from "drizzle-orm";

const DEMO_PROJECT_NAME = "Demo: GestaoPro — Plataforma de gestão para PMEs";
const DEMO_BRIEFING = "Quero criar uma plataforma SaaS para pequenas e médias empresas gerenciarem projetos, clientes e receitas. Problema: PMEs perdem contratos por falta de acompanhamento e usam planilhas + WhatsApp para tudo. Público-alvo: donos de empresas de serviços com 5-50 funcionários (consultorias, agências, escritórios) faturando R$50k-500k/mês. Diferencial: simplicidade real, onboarding em 15min, e preço acessível (R$99/mês por empresa, sem por-usuário). Modelo: freemium com limite de 5 projetos ativos, paid R$99/mês ilimitado.";

type Seed = { key: string; content: string; contentJson?: string | null };

const PHASE_1_SEEDS: Seed[] = [
  {
    key: "LEAN_CANVAS",
    content: "```json\n" + JSON.stringify({
      problema: "PMEs de serviços perdem 15-20% dos contratos por falhas de acompanhamento. Usam planilhas + WhatsApp + e-mail, sem fonte única de verdade. Quando o dono sai de férias, o time fica perdido.",
      segmentos_clientes: "Donos de consultorias, agências e escritórios com 5-50 funcionários, faturando R$50k-500k/mês, no Brasil. Persona inicial: sócio-fundador 30-45 anos, técnico em sua área (não em gestão).",
      proposta_valor_unica: "A primeira ferramenta de gestão de projetos brasileira que cabe na cabeça do dono em 15 minutos. Sem treinamento, sem consultor, sem por-usuário.",
      solucao: "App web + mobile com: (1) kanban simples de projetos, (2) timeline de cliente, (3) cobrança Pix integrada, (4) relatório semanal automático no WhatsApp do dono.",
      canais: "SEO de cauda longa (ex: 'gestão de projetos para agência'), parcerias com contadores, comunidade de donos de PME no Instagram/LinkedIn, programa de indicação 20% recorrente.",
      fluxo_receita: "Freemium: grátis até 5 projetos ativos. Pago: R$99/mês por empresa (ilimitado, sem por-usuário). Anual: R$990 (2 meses grátis). Target: 1.000 clientes pagos em 18 meses = R$1,2M ARR.",
      estrutura_custos: "Infra (R$3-8/cliente/mês), atendimento WhatsApp humano, conteúdo SEO, comissão de indicação. CAC alvo: R$280, payback 3 meses.",
      metricas_chave: "Ativação 7d (criou 3+ projetos), Retenção D30, MRR, NPS trimestral, % clientes que enviam relatório semanal.",
      vantagem_injusta: "Foco extremo em PME brasileira de serviços + integração Pix nativa + onboarding sem treinamento. Concorrentes globais (Asana, Monday) são complexos demais; nacionais (Runrun, Pipefy) são por-usuário e caros.",
    }, null, 2) + "\n```",
  },
  {
    key: "JTBD",
    content: `## Jobs to be Done — GestaoPro

### Jobs Funcionais
1. **Quando** recebo um novo projeto, **quero** registrar prazo, escopo e responsável em menos de 1 minuto, **para** não perder de vista nada do que combinei.
2. **Quando** o cliente me pergunta "como está meu projeto", **quero** mostrar status atualizado na hora, **para** parecer profissional e ganhar confiança.
3. **Quando** chega final de mês, **quero** ver receita prevista vs. recebida sem abrir planilha, **para** decidir se posso contratar ou investir.
4. **Quando** um funcionário sai, **quero** transferir os projetos dele sem perder histórico, **para** manter continuidade.
5. **Quando** preciso cobrar, **quero** gerar Pix com 1 clique e mandar no WhatsApp, **para** receber rápido sem fricção.

### Jobs Emocionais
1. **Quando** vou dormir, **quero** sentir que nada importante está caindo no esquecimento, **para** ter paz mental.
2. **Quando** mostro o sistema pro time, **quero** parecer organizado e moderno, **para** ter respeito profissional.
3. **Quando** comparo com a planilha de antes, **quero** sentir alívio, **para** validar minha decisão.

### Jobs Sociais
1. **Quando** outro dono pergunta como eu organizo a empresa, **quero** indicar uma ferramenta brasileira simples, **para** ser percebido como referência prática.
2. **Quando** atendo um cliente novo, **quero** que ele veja que eu uso um sistema sério, **para** justificar meu preço.`,
  },
  {
    key: "HIPOTESE_CENTRAL",
    content: `## Hipótese Central

> **Acreditamos que** donos de PMEs de serviços brasileiras (5-50 funcionários) **têm o problema de** perder contratos e horas todo mês por falta de uma fonte única de verdade sobre projetos e clientes, **e estarão dispostos a** pagar R$99/mês (sem cobrança por usuário) **por uma solução que** dê visibilidade completa em 15 minutos de setup, **o que poderemos confirmar quando** atingirmos 100 clientes pagantes orgânicos com retenção D90 ≥ 70% em 6 meses.

### Como validar (próximos 30 dias)
- 20 entrevistas com persona-alvo (ICP confirmado ou ajustado)
- Landing page com 3 pacotes de preço — meta de 100 leads qualificados
- 10 cartas de intenção de compra com Pix R$1 (validação financeira real, não só interesse)`,
  },
  {
    key: "SCORE_POTENCIAL",
    content: "```json\n" + JSON.stringify({
      desejabilidade: 4,
      viabilidade: 5,
      factibilidade: 4,
      escalabilidade: 4,
      timing: 5,
      media: 4.4,
      justificativas: {
        desejabilidade: "Dor é alta e reconhecida; PMEs já tentam resolver com planilhas. Validação inicial via comunidades mostra interesse forte.",
        viabilidade: "Modelo SaaS recorrente, margem bruta esperada 80%+, CAC payback ~3 meses. Mercado brasileiro tem capacidade de pagamento.",
        factibilidade: "Stack conhecido (React, Postgres, Pix via Stripe BR). Equipe técnica fundadora consegue MVP em 8-10 semanas.",
        escalabilidade: "TAM Brasil: ~1M PMEs de serviços. SAM realista: 100k. SOM 18m: 5k clientes = R$6M ARR. Limite real é canal de aquisição.",
        timing: "Pós-pandemia, donos brasileiros estão digitalizando gestão. Pix nativo é vantagem competitiva temporária (2 anos).",
      },
      recomendacao: "AVANÇAR",
      proximos_passos: [
        "Rodar 20 entrevistas de descoberta nas próximas 3 semanas",
        "Publicar landing com 3 pacotes e medir conversão",
        "Validar disposição a pagar com 10 Pix simbólicos de R$1",
        "Definir co-fundador comercial se entrevistas confirmarem",
      ],
    }, null, 2) + "\n```",
  },
];

const PHASE_2_SEEDS: Seed[] = [
  {
    key: "PRD",
    content: `# PRD — GestaoPro v1 (MVP)

## Visão do Produto
GestaoPro é a primeira ferramenta de gestão para PMEs brasileiras de serviços que o dono entende sozinho em 15 minutos. Substitui planilha + WhatsApp + e-mail por uma fonte única de verdade que cabe no celular do time.

## Problema
PMEs de serviços (5-50 funcionários) perdem 15-20% dos contratos por falhas de acompanhamento. Atualmente usam: planilha (sem mobile), WhatsApp (sem histórico), e-mail (sem ações), trello (sem cobrança). Resultado: dono é o único ponto único de falha.

## Solução
Web + mobile (PWA) com: kanban de projetos, timeline por cliente, cobrança Pix integrada, relatório semanal automático no WhatsApp do dono. Onboarding zero-treinamento.

## Usuários-alvo
- **Primário:** Sócio-fundador 30-45 anos, técnico (não gestor), responsável por entregas e cobrança.
- **Secundário:** 1-3 funcionários operacionais que executam projetos.
- **Terciário (v1.1):** Cliente final que recebe link público de status.

## Funcionalidades MVP (RICE-ordered)

### Must Have (v1.0 — 8 semanas)
1. Cadastro/login (Clerk)
2. Criar projeto: nome, cliente, prazo, valor, responsável
3. Kanban com 4 colunas configuráveis (Backlog, Em andamento, Aguardando cliente, Concluído)
4. Timeline de cliente: todos os projetos + histórico de pagamentos
5. Gerar cobrança Pix via integração (Stripe BR ou Pagar.me)
6. Relatório semanal automático no WhatsApp do dono (sexta 18h)
7. Convidar funcionário por e-mail (sem cobrança extra)

### Should Have (v1.1 — semanas 9-12)
1. Página pública de status para cliente final
2. Templates de projetos (consultoria, design, dev)
3. Exportar relatório em PDF
4. Lembretes automáticos de prazo

### Won't Have (v1)
1. Gantt chart
2. Time tracking
3. Faturamento de NF-e
4. Integração com calendário Google

## Critérios de Sucesso (90 dias após launch)
1. **Ativação:** 60%+ dos signups criam ≥3 projetos em 7 dias
2. **Retenção:** D30 ≥ 70%, D90 ≥ 55%
3. **Receita:** 100 clientes pagos = R$10k MRR
4. **NPS:** ≥ 50 em pesquisa trimestral
5. **WhatsApp open rate:** ≥ 80% dos relatórios semanais abertos

## Riscos e Mitigações
| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Concorrente lança feature igual | Média | Alto | Foco em UX simples + integração Pix nativa, difícil de copiar bem |
| Falha na entrega WhatsApp | Alta | Médio | Fallback e-mail + monitoramento Twilio |
| Churn alto na free | Alta | Médio | Onboarding com checklist + ativação D7 monitorada |
| Stripe BR demora aprovação | Média | Alto | Pagar.me como plano B desde o dia 1 |

## Fora do Escopo
- App nativo iOS/Android (PWA basta)
- Marketplace de freelancers
- CRM completo (foco é projetos, não funil comercial)
- Integração contábil ERP`,
  },
  {
    key: "CARTAO_PERSONA",
    content: "```json\n" + JSON.stringify({
      nome_ficticio: "Rafael, 38",
      cargo_papel: "Sócio-fundador de agência de design e branding (12 funcionários)",
      contexto: {
        empresa_segmento: "Agência boutique de branding/design — atende 8-12 clientes B2B simultâneos",
        porte: "12 funcionários, faturamento R$180k/mês",
        localizacao: "São Paulo capital, escritório híbrido",
      },
      demografia: { idade: 38, renda_aproximada: "R$25k/mês pró-labore + lucros variáveis", formacao: "Design Gráfico + MBA inacabado" },
      dia_tipico: [
        "Acorda 7h, checa WhatsApp de cliente antes de tomar café",
        "Reunião de status interna 9h — toda segunda perde 1h por falta de visão consolidada",
        "Atende 2-3 reuniões de cliente entre 10h-17h",
        "Faz cobrança manual no Pix sexta — esquece 20% dos faturamentos",
        "Responde demandas de funcionários por WhatsApp até 22h",
      ],
      prioridades_top3: [
        "Aumentar margem (hoje 18%, quer 30%)",
        "Conseguir tirar férias sem agência parar",
        "Profissionalizar imagem para fechar clientes maiores",
      ],
      dores_top3: [
        "Perde 2-3 contratos/mês por esquecer follow-up",
        "Não sabe quem da equipe está sobrecarregado vs. ocioso",
        "Cobra cliente atrasado e descobre que já tinha pago",
      ],
      objetivos_top3: [
        "Dobrar faturamento sem dobrar funcionários (12 → R$360k/mês)",
        "Reduzir horas trabalhadas de 65 para 45 por semana",
        "Documentar processos para vender a agência em 3-5 anos",
      ],
      gatilhos_de_compra: [
        "Perdeu um cliente grande por falha de comunicação",
        "Funcionário-chave saiu e levou contexto na cabeça",
        "Foi a um evento de gestão e ouviu colega elogiar ferramenta",
      ],
      objecoes_provaveis: [
        "Já tentei Trello/Asana, time não usou",
        "Por R$99 deve ser simples demais pra minha realidade",
        "Não tenho tempo de migrar planilha pra outro lugar",
        "Meu time é resistente a software novo",
      ],
      fontes_informacao: [
        "Comunidade ‘Donos de Agência’ no WhatsApp",
        "Newsletter do Bruno Perin",
        "Podcasts: Like a Boss, G4 Educação",
        "LinkedIn 1-2x por semana",
      ],
      watering_holes: [
        "Eventos RD Summit, ProXXIma",
        "Comunidade do G4, Endeavor",
        "Grupo de WhatsApp Donos de Agência",
        "Sócios visitam coworkings em SP",
      ],
      ferramentas_atuais: ["Planilha Google", "WhatsApp Business", "Trello (abandonado)", "Conta Azul"],
      citacao_representativa: "Eu não preciso de mais um sistema, preciso de menos planilha. Se eu não entender em 10 minutos, esqueço.",
      disposicao_pagar: "R$100-300/mês pela empresa toda — paga sem pensar se for ‘óbvio’. Recusa cobrança por usuário.",
    }, null, 2) + "\n```",
  },
  {
    key: "METRICAS_SUCESSO",
    content: `## Métricas de Sucesso — GestaoPro

### North Star Metric
**Projetos ativos por cliente pagante** (proxy de uso real e valor entregue). Meta: média ≥ 8 projetos ativos por conta em D60.

### KPIs por etapa do funil

**Aquisição**
- Visitantes únicos/mês (meta D90: 5k)
- Conversão landing → signup (meta: ≥ 4%)
- CAC blended (meta: ≤ R$280)

**Ativação (primeiros 7 dias)**
- % signups que criam 3+ projetos: ≥ 60%
- % que adiciona 1+ funcionário: ≥ 35%
- % que dispara primeira cobrança Pix: ≥ 25%

**Engajamento (semanal)**
- WAU/MAU ratio: ≥ 0.55
- WhatsApp report open rate: ≥ 80%
- Sessões por usuário/semana: ≥ 5

**Retenção**
- D30: ≥ 70%
- D90: ≥ 55%
- Logo churn mensal: ≤ 4%

**Receita**
- MRR (meta D180: R$10k; D365: R$100k)
- ARPA (meta: R$95)
- LTV/CAC: ≥ 3.5x em 12 meses

### Métricas de saúde
- NPS trimestral ≥ 50
- Tempo médio de resposta no suporte: ≤ 2h em horário comercial
- Uptime: ≥ 99.5%`,
  },
];

const PHASE_3_SEEDS: Seed[] = [
  {
    key: "DATA_MAP",
    content: `## Mapa de Dados Pessoais — GestaoPro

### Dados coletados

| Categoria | Campos | Fonte | Onde armazena | Retenção |
|---|---|---|---|---|
| Identificação do dono | Nome, e-mail, telefone | Cadastro Clerk | Postgres (users) + Clerk | Enquanto conta ativa + 5 anos pós-cancelamento (obrigação fiscal) |
| Identificação de funcionário | Nome, e-mail | Convite do dono | Postgres (members) | Enquanto vinculado à conta + 90 dias |
| Identificação de cliente final | Nome, e-mail, telefone, CPF/CNPJ | Cadastro pelo dono | Postgres (clients) | Enquanto a conta do dono estiver ativa |
| Dados financeiros | Valor de projetos, chaves Pix, comprovantes | Stripe/Pagar.me + upload | Stripe (PCI) + S3 criptografado | 5 anos (Receita Federal) |
| Conteúdo de projetos | Descrições, anexos, comentários | Input do usuário | Postgres + S3 | Enquanto conta ativa |
| Logs de uso | IP, user-agent, eventos | Automático | Postgres (events) | 12 meses |

### Categorias LGPD
- **Dados pessoais comuns:** nome, e-mail, telefone — base legal: execução de contrato + consentimento
- **Dados pessoais sensíveis:** nenhum coletado (saúde, biometria, opinião política — fora do escopo)
- **Dados de menores:** não previsto. Tela de cadastro exige declaração de maioridade.

### Compartilhamento com terceiros
| Operador | Dados | Finalidade | Salvaguarda |
|---|---|---|---|
| Clerk (US) | Identificação | Autenticação | DPA assinado, Privacy Shield successor (SCCs) |
| Stripe BR | Financeiros | Cobrança Pix | DPA, PCI-DSS Level 1 |
| AWS São Paulo | Tudo | Hospedagem | DPA AWS, ISO 27001/27018 |
| Twilio (US) | Telefone + texto | WhatsApp | DPA, SCCs, opt-out |
| OpenAI (US) | Conteúdo de projetos (anonimizado) | Sugestões IA | DPA, dados não usados para treino |`,
  },
  {
    key: "THREAT_MODEL",
    content: `## Threat Model — GestaoPro (STRIDE)

### Escopo
MVP web + mobile (PWA), API REST Express, Postgres, S3, Stripe BR, Clerk. Multi-tenant por conta (organizationId).

### Atores
- **Dono da conta** (admin)
- **Funcionário convidado** (member, escopo limitado)
- **Cliente final** (view-only via link público v1.1)
- **Atacante externo** (não autenticado)
- **Funcionário interno FoundersFlow** (suporte)

### Ameaças por categoria (STRIDE)

**S — Spoofing**
- Sessão hijack via cookie roubado → mitigado por: cookies HTTPOnly+Secure+SameSite=Lax, JWT curto + refresh, Clerk session validation
- Reuso de link público de cliente → mitigado por: tokens com expiração 30d + rotação

**T — Tampering**
- IDOR em /api/projects/:id permitindo ver projeto de outra conta → mitigado por: middleware que valida organizationId em TODAS as queries; testes automatizados de IDOR no CI
- Edição de valor de cobrança via API → mitigado por: validação Zod estrita + assinatura Stripe imutável após emissão

**R — Repudiation**
- Funcionário deleta projeto e nega → mitigado por: tabela audit_logs com eventType + actor + IP + timestamp, retenção 12m, exposição na UI de admin

**I — Information Disclosure**
- Dump de DB exposto → mitigado por: criptografia em repouso (AWS RDS KMS), backups criptografados, acesso por IAM + 2FA
- Logs com PII em plano-texto → mitigado por: redactor pino (e-mail, CPF, telefone), revisão manual mensal
- Cliente final vê dados de outros clientes via link → mitigado por: link contém shareId aleatório 72-bit, header noindex

**D — Denial of Service**
- Flood na API → mitigado por: rate limit express-rate-limit 300 req/15min por IP+user, Cloudflare na frente
- Upload de anexo gigante → mitigado por: limite 25MB, tipo MIME validado server-side, scan ClamAV antes de S3

**E — Elevation of Privilege**
- Funcionário convidado tenta virar admin → mitigado por: role checada server-side em cada request, sem campo "role" mutável via API pública
- Bypass de planlimit → mitigado por: limite enforced no backend antes de qualquer write

### Top 5 riscos priorizados (matriz prob×impacto)
1. **IDOR multi-tenant** (Alta × Crítico) — bloqueador de launch
2. **Vazamento via link público** (Média × Alto) — implementar antes de v1.1
3. **Roubo de credenciais Stripe** (Baixa × Crítico) — KMS + rotação semestral
4. **DDoS na cobrança** (Média × Médio) — Cloudflare rate limit
5. **Insider FoundersFlow** (Baixa × Alto) — least privilege + audit log de acessos admin

### Itens para o backlog de segurança
- [ ] Pen test antes do launch público (R$8-15k, contratar Conviso ou Tempest)
- [ ] Bug bounty programa após 1.000 usuários
- [ ] SOC 2 Type 1 em 18 meses (quando entrar conta enterprise)`,
  },
  {
    key: "MATRIZ_RBAC",
    content: `## Matriz RBAC — GestaoPro

| Recurso / Ação | Owner | Admin | Member | Cliente Final (link) |
|---|:-:|:-:|:-:|:-:|
| **Conta** |  |  |  |  |
| Editar dados da empresa | ✅ | ✅ | ❌ | ❌ |
| Convidar/remover membros | ✅ | ✅ | ❌ | ❌ |
| Trocar plano / cancelar | ✅ | ❌ | ❌ | ❌ |
| Excluir conta | ✅ | ❌ | ❌ | ❌ |
| **Projetos** |  |  |  |  |
| Criar projeto | ✅ | ✅ | ✅ | ❌ |
| Editar qualquer projeto | ✅ | ✅ | ❌ | ❌ |
| Editar projeto que é responsável | ✅ | ✅ | ✅ | ❌ |
| Excluir projeto | ✅ | ✅ | ❌ | ❌ |
| Ver todos os projetos | ✅ | ✅ | ⚠️ apenas vinculados | ❌ |
| Ver status de UM projeto | ✅ | ✅ | ✅ | ✅ |
| **Clientes** |  |  |  |  |
| Criar/editar cliente | ✅ | ✅ | ✅ | ❌ |
| Excluir cliente | ✅ | ✅ | ❌ | ❌ |
| **Financeiro** |  |  |  |  |
| Emitir cobrança Pix | ✅ | ✅ | ❌ | ❌ |
| Ver relatório de receita | ✅ | ✅ | ❌ | ❌ |
| **Audit log** |  |  |  |  |
| Ver audit log | ✅ | ✅ | ❌ | ❌ |
| Exportar audit log | ✅ | ❌ | ❌ | ❌ |

### Princípios aplicados
- **Least privilege:** Member não vê financeiro nem audit por padrão
- **Separação owner/admin:** owner é único, admin pode ser revogado pelo owner
- **Cliente final read-only:** apenas via link com token expirável, nunca cria sessão`,
  },
];

const SEEDS: Record<number, Seed[]> = { 1: PHASE_1_SEEDS, 2: PHASE_2_SEEDS, 3: PHASE_3_SEEDS };

async function findExistingDemo(userId: string) {
  const [existing] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.clerkId, userId), eq(projectsTable.isDemo, true), isNull(projectsTable.deletedAt))
  );
  return existing;
}

export async function seedDemoProject(userId: string): Promise<{ created: boolean; project: typeof projectsTable.$inferSelect }> {
  // Fast path: idempotent return if demo already exists
  const existing = await findExistingDemo(userId);
  if (existing) return { created: false, project: existing };

  try {
    return await db.transaction(async (tx) => {
      const [project] = await tx.insert(projectsTable).values({
        clerkId: userId,
        name: DEMO_PROJECT_NAME,
        briefing: DEMO_BRIEFING,
        currentPhase: 4,
        isDemo: true,
      }).returning();

      const phaseValues = [1, 2, 3, 4, 5, 6, 7].map((num) => ({
        projectId: project.id,
        phaseNumber: num,
        status: (num <= 3 ? "completed" : num === 4 ? "active" : "locked") as "active" | "locked" | "completed",
        gate1Checked: num <= 3,
        gate2Checked: num <= 3,
        gate3Checked: num <= 3,
      }));
      const insertedPhases = await tx.insert(phasesTable).values(phaseValues).returning();

      const artifactValues: Array<{ phaseId: number; artifactKey: string; content: string; contentJson: string | null }> = [];
      for (const phase of insertedPhases) {
        const seeds = SEEDS[phase.phaseNumber];
        if (!seeds) continue;
        for (const s of seeds) {
          artifactValues.push({
            phaseId: phase.id,
            artifactKey: s.key,
            content: s.content,
            contentJson: s.contentJson ?? null,
          });
        }
      }
      if (artifactValues.length > 0) {
        await tx.insert(phaseArtifactsTable).values(artifactValues);
      }

      return { created: true, project };
    });
  } catch (err: unknown) {
    // PG 23505 = unique_violation. Partial unique index `projects_one_active_demo_per_user`
    // guarantees only one active demo per user even under concurrent requests.
    const code = (err as { code?: string })?.code;
    if (code === "23505") {
      const existingAfterRace = await findExistingDemo(userId);
      if (existingAfterRace) return { created: false, project: existingAfterRace };
    }
    throw err;
  }
}
