import { openai } from "@workspace/integrations-openai-ai-server";
import { recordOpenAiCost } from "./openaiCost";
import { PHASE_NAMES_UPPER_ARRAY as PHASE_NAMES } from "./phase-names";

export interface PhaseAIResult {
  artifactKey: string;
  content: string;
  contentJson: string | null;
}

const PHASE_PROMPTS: Record<number, string> = {
  1: `Você é um especialista em validação de ideias de produto e estratégia de negócio (Método FoundersFlow). Analise o briefing e gere os seguintes artefatos em português brasileiro. Seja específico para o negócio descrito, não genérico. **Sempre que pedir formato JSON, devolva o JSON dentro de bloco \`\`\`json ... \`\`\`.**

### SELETOR_NICHO_INICIAL
Identifique 5 a 8 segmentos candidatos a serem o "nicho inicial" (mercado de entrada). Para cada um, pontue de 1 a 5 nos 6 critérios. Formato JSON:
\`\`\`json
{
  "segmentos": [
    {
      "nome": "ex: clínicas odontológicas SP com 2-5 dentistas",
      "tamanho": N,
      "intensidade_dor": N,
      "alcance_canal": N,
      "capacidade_pagar": N,
      "sinergia_produto": N,
      "urgencia": N,
      "total": N,
      "justificativa": "1-2 frases por que esse score"
    }
  ],
  "criterios": {
    "tamanho": "quantos potenciais clientes",
    "intensidade_dor": "quão grave é o problema hoje",
    "alcance_canal": "facilidade de chegar até eles",
    "capacidade_pagar": "têm orçamento real",
    "sinergia_produto": "encaixe com nossa solução",
    "urgencia": "precisam resolver agora ou pode esperar"
  },
  "recomendacao": {
    "segmento_escolhido": "nome do top 1",
    "justificativa": "por que esse é o ponto de entrada certo",
    "primeiros_passos": ["3-5 ações imediatas para começar a explorar esse nicho"]
  }
}
\`\`\`

### LEAN_CANVAS
Lean Canvas completo em formato JSON com os 9 blocos bem detalhados:
\`\`\`json
{"problema": "...", "segmentos_clientes": "...", "proposta_valor_unica": "...", "solucao": "...", "canais": "...", "fluxo_receita": "...", "estrutura_custos": "...", "metricas_chave": "...", "vantagem_injusta": "..."}
\`\`\`

### JTBD
Jobs to be Done — o que o cliente realmente está tentando realizar. Liste 5 jobs funcionais, 3 jobs emocionais e 2 jobs sociais no formato: "Quando [situação], quero [motivação], para [resultado esperado]."

### ANALISE_COMPETITIVA
Mapeie 5 concorrentes diretos e indiretos com: nome, proposta de valor, modelo de preço estimado, pontos fortes, pontos fracos, e por que o cliente escolheria esta solução em vez deles. Inclua uma tabela comparativa.

### MATRIZ_COMPETITIVA
Posicionamento competitivo em matriz 2×2. Escolha os 2 eixos que melhor representam as PRIORIDADES DO CLIENTE neste mercado (ex: "preço × especialização", "facilidade × profundidade", "automação × personalização"). Plote os concorrentes + nossa solução. Formato JSON:
\`\`\`json
{
  "eixo_x": {"label": "ex: Especialização (genérico → especialista)", "min_label": "Genérico", "max_label": "Especialista"},
  "eixo_y": {"label": "ex: Preço (baixo → alto)", "min_label": "Baixo", "max_label": "Alto"},
  "concorrentes": [
    {"nome": "...", "x": N, "y": N, "observacao": "1 frase de contexto"}
  ],
  "nossa_posicao": {"x": N, "y": N, "justificativa": "por que esse é o quadrante certo"},
  "quadrante_alvo": "ex: alto especialização + preço médio",
  "vacuo_identificado": "qual quadrante está vazio ou mal servido e por que importa"
}
\`\`\`

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

### CARTAO_PERSONA
Cartão de persona estruturado — UMA persona principal do nicho inicial (não 3). Formato JSON:
\`\`\`json
{
  "nome_ficticio": "ex: Mariana, 34",
  "cargo_papel": "ex: Sócia-fundadora de clínica odontológica",
  "contexto": {
    "empresa_segmento": "...",
    "porte": "...",
    "localizacao": "..."
  },
  "demografia": {"idade": N, "renda_aproximada": "...", "formacao": "..."},
  "dia_tipico": ["3-5 bullets descrevendo um dia comum"],
  "prioridades_top3": ["o que mais importa pra ela hoje"],
  "dores_top3": ["dores específicas relacionadas ao nosso espaço"],
  "objetivos_top3": ["o que ela quer alcançar nos próximos 12 meses"],
  "gatilhos_de_compra": ["o que faz ela buscar uma solução AGORA"],
  "objecoes_provaveis": ["3-5 objeções que vamos enfrentar"],
  "fontes_informacao": ["onde ela aprende: comunidades, podcasts, newsletters, eventos"],
  "watering_holes": ["lugares físicos/digitais onde ela está concentrada — para canais de aquisição"],
  "ferramentas_atuais": ["o que ela usa hoje para resolver isso parcialmente"],
  "citacao_representativa": "frase que ela diria que captura sua situação",
  "disposicao_pagar": "faixa estimada em R$ e por quê"
}
\`\`\`

### MAPA_DECISAO_COMPRA
Mapa da decisão de compra — quem participa quando o cliente decide comprar. Crítico em B2B. Formato JSON:
\`\`\`json
{
  "contexto_compra": "ex: venda B2B, ticket médio R$X, ciclo Y dias",
  "papeis": {
    "usuario_final": {"quem": "...", "interesse": "o que ele ganha", "influencia": "alta|media|baixa"},
    "campeao_interno": {"quem": "...", "como_engajar": "..."},
    "comprador_economico": {"quem": "quem assina o cheque", "criterio_decisao": "..."},
    "influenciadores": [{"quem": "...", "tipo": "técnico|financeiro|operacional", "papel": "..."}],
    "veto": {"quem": "quem pode matar a compra", "como_neutralizar": "..."}
  },
  "estrategia_por_papel": ["ações concretas para conquistar cada papel"],
  "ciclo_venda_estimado": "X semanas/meses",
  "principais_riscos": ["3 riscos do processo de compra"]
}
\`\`\`

### VALOR_QUANTIFICADO
Proposta de valor quantificada — situação atual vs. possível, com ganho mensurável. O canvas que mais convence cliente e investidor. Formato JSON:
\`\`\`json
{
  "situacao_atual": {
    "descricao": "como o cliente resolve isso hoje",
    "tempo_gasto": "X horas/semana",
    "custo_financeiro": "R$ Y/mês",
    "custos_ocultos": ["frustração, erros, oportunidade perdida..."]
  },
  "situacao_possivel": {
    "descricao": "como fica com nossa solução",
    "tempo_gasto": "X horas/semana",
    "custo_financeiro": "R$ Y/mês",
    "novos_ganhos": ["o que ele passa a poder fazer"]
  },
  "ganho_liquido": {
    "tempo_economizado": "X horas/semana",
    "dinheiro_economizado": "R$ Y/mês",
    "ganho_qualitativo": "ex: dorme melhor, escala sem contratar"
  },
  "payback_estimado": "em X semanas/meses o cliente recupera o investimento",
  "premissas": ["3-5 premissas que sustentam os números"]
}
\`\`\`

### USER_STORIES
15 user stories do MVP organizadas por épico, em formato JSON estruturado:
\`\`\`json
{
  "stories": [
    {
      "id": "US-01",
      "epico": "Onboarding",
      "persona": "founder solo",
      "acao": "criar uma conta com Google em 1 clique",
      "valor": "começar a usar sem fricção de cadastro",
      "esforco": "P",
      "prioridade": 1,
      "aceitacao": [
        "Dado que estou na landing, Quando clico em 'Entrar com Google', Então sou redirecionado e logado em menos de 5s",
        "Dado que é meu primeiro login, Quando entro, Então vejo o onboarding tour"
      ]
    }
  ]
}
\`\`\`
Regras:
- "id": "US-01" a "US-15" (sequencial, único)
- "esforco": "P" (até 1 dia), "M" (2-3 dias) ou "G" (1 semana+)
- "prioridade": 1 (must-have MVP) a 5 (nice-to-have pós-MVP)
- "aceitacao": 1-3 critérios em formato Gherkin "Dado / Quando / Então"
- Ordene as stories aproximadamente por prioridade (1 primeiro), agrupando por épico quando possível

### METRICAS_SUCESSO
Framework de métricas completo em formato JSON:
\`\`\`json
{"north_star": {"metrica": "...", "definicao": "...", "formula": "...", "meta_30d": "...", "meta_90d": "..."}, "l1_inputs": [...], "l2_guardrails": [...], "pirate_metrics": {"acquisition": "...", "activation": "...", "retention": "...", "revenue": "...", "referral": "..."}}
\`\`\`

### HIPOTESE_PRICING
Modelo de precificação completo:
- Modelo recomendado e justificativa
- 3 tiers com nomes, preços e funcionalidades por tier
- 3 perguntas-chave respondidas: (a) valor entregue vs. capturado, (b) custo atual do cliente sem nós, (c) sensibilidade a preço dos decisores
- Estratégia de go-to-market pricing (freemium, trial, etc.)
- Comparação com concorrentes

### LTV_CAC
Calculadora de unit economics LTV ÷ CAC. Use premissas realistas baseadas no briefing e nos artefatos anteriores. Formato JSON:
\`\`\`json
{
  "premissas": {
    "ticket_medio_mensal": N,
    "margem_bruta_pct": N,
    "churn_mensal_pct": N,
    "tempo_vida_estimado_meses": N
  },
  "ltv": {
    "valor_calculado": N,
    "formula": "ticket × margem ÷ churn",
    "explicacao": "1-2 frases"
  },
  "cac": {
    "valor_calculado": N,
    "canais": [
      {"canal": "ex: Google Ads", "custo_estimado_lead": N, "taxa_conversao_pct": N, "cac_canal": N},
      {"canal": "ex: outbound", "custo_estimado_lead": N, "taxa_conversao_pct": N, "cac_canal": N}
    ],
    "explicacao": "1-2 frases"
  },
  "razao_ltv_cac": N,
  "payback_meses": N,
  "veredito": "SAUDAVEL | AJUSTAR | INVIAVEL",
  "interpretacao": "se ≥3 saudável · 1-3 ajustar · <1 inviável — explicação contextual",
  "acoes_recomendadas": ["3-5 ações concretas para melhorar a razão"]
}
\`\`\`

### BENCHMARKING
Análise de benchmarks de 3 produtos de referência global:
Para cada um: modelo de negócio, estratégia de pricing, canais de aquisição, métricas públicas conhecidas, o que copiar e o que evitar.

### ROADMAP_3_MESES
Roadmap trimestral em formato JSON:
{"mes_1": {"tema": "...", "objetivos": [...], "entregas_chave": [...], "metricas_sucesso": [...]}, "mes_2": {...}, "mes_3": {...}, "premissas": [...], "riscos": [...]}`,

  3: `Você é um especialista em segurança de software, privacidade por design e conformidade com LGPD. Com base no briefing e nos artefatos do PRD, gere os seguintes artefatos em português brasileiro. Seja específico para o produto descrito — identifique os dados reais que serão coletados, as features reais que apresentam riscos, e os controles concretos necessários.

### DATA_MAP
Mapeamento completo de dados pessoais em formato JSON:
{
  "dados_coletados": [
    {
      "dado": "nome do dado",
      "categoria": "identificação | contato | financeiro | comportamental | sensível | técnico",
      "finalidade": "para que é usado",
      "base_legal_lgpd": "consentimento | obrigação legal | execução de contrato | legítimo interesse | exercício regular de direitos",
      "retencao": "período de retenção",
      "armazenamento": "onde é armazenado",
      "quem_acessa": ["lista de papéis"],
      "compartilhado_com_terceiros": true/false,
      "terceiros": ["lista se compartilhado"],
      "sensivel_lgpd_art11": true/false
    }
  ],
  "fluxo_dados": "descrição do ciclo completo: coleta → processamento → armazenamento → compartilhamento → descarte",
  "registro_atividades_tratamento": {
    "controlador": "nome da empresa/produto",
    "encarregado_dpo": "a definir",
    "finalidades_tratamento": [...],
    "categorias_titulares": [...],
    "transferencias_internacionais": true/false,
    "medidas_seguranca": [...]
  }
}

### CLASSIFICACAO_DADOS
Classificação dos dados por nível de sensibilidade em formato JSON:
{
  "publicos": {"descricao": "...", "dados": [...], "controles": [...]},
  "internos": {"descricao": "...", "dados": [...], "controles": [...]},
  "confidenciais": {"descricao": "...", "dados": [...], "controles": [...]},
  "sensiveis": {"descricao": "LGPD Art. 11 — dados de saúde, biometria, origem racial, religião, etc.", "dados": [...], "controles": [...], "base_legal_art11": "..."}
}
Para cada nível: exemplos concretos do produto, controles técnicos e organizacionais necessários.

### PRIVACY_BY_DESIGN
Checklist Privacy by Design aplicado a este produto específico:

**Os 7 Princípios de Cavoukian — aplicação prática:**
1. Proativo, não reativo: [ações concretas]
2. Privacidade como padrão (privacy as default): [configurações default a implementar]
3. Privacidade incorporada ao design: [decisões de arquitetura]
4. Funcionalidade total: [como não sacrificar usabilidade]
5. Segurança ponta a ponta: [controles do ciclo de vida]
6. Visibilidade e transparência: [o que expor aos usuários]
7. Respeito pelo usuário: [UX de privacidade]

**Direitos dos titulares (LGPD Art. 18) — features necessárias:**
Para cada direito: feature a construir, endpoint de API necessário, prazo de resposta (máx 15 dias úteis):
- Acesso aos dados: [feature]
- Correção: [feature]
- Anonimização/bloqueio: [feature]
- Portabilidade: [feature — formato de exportação]
- Eliminação: [feature]
- Informação sobre compartilhamento: [feature]
- Revogação de consentimento: [feature]

**Minimização de dados:** Liste dados no PRD que podem ser removidos ou anonimizados.

### POLITICA_PRIVACIDADE
Rascunho completo da Política de Privacidade adaptada ao produto:

**1. Quem somos** (controlador de dados)
**2. Quais dados coletamos** (listagem específica do produto)
**3. Por que coletamos** (finalidades e bases legais por dado)
**4. Com quem compartilhamos** (terceiros, SDKs, APIs externas)
**5. Por quanto tempo armazenamos** (tabela de retenção)
**6. Seus direitos** (Art. 18 LGPD — como exercer cada um)
**7. Cookies e rastreadores** (categorias: essenciais, funcionais, analíticos, publicitários)
**8. Transferência internacional** (se aplicável — Art. 33 LGPD)
**9. Segurança** (medidas técnicas adotadas)
**10. Contato do DPO/encarregado**

Inclua também o fluxo de consentimento em formato JSON:
{"consentimento_inicial": {"momento": "...", "como_obter": "...", "granularidade": [...]}, "revogacao": {"como": "...", "prazo_efeito": "..."}, "banner_cookies": {"categorias": [...]}}

### THREAT_MODEL
Modelagem de ameaças STRIDE para as features críticas deste produto, em formato JSON:

\`\`\`json
{
  "features": [
    {
      "feature": "nome da feature crítica",
      "ameacas": [
        {"categoria": "Spoofing", "ameaca": "ameaça específica a esta feature", "probabilidade": 3, "impacto": 4, "score": 12, "controle": "controle requerido concreto"},
        {"categoria": "Tampering", "ameaca": "...", "probabilidade": 1, "impacto": 5, "score": 5, "controle": "..."},
        {"categoria": "Repudiation", "ameaca": "...", "probabilidade": 2, "impacto": 3, "score": 6, "controle": "..."},
        {"categoria": "Information Disclosure", "ameaca": "...", "probabilidade": 3, "impacto": 5, "score": 15, "controle": "..."},
        {"categoria": "Denial of Service", "ameaca": "...", "probabilidade": 2, "impacto": 4, "score": 8, "controle": "..."},
        {"categoria": "Elevation of Privilege", "ameaca": "...", "probabilidade": 1, "impacto": 5, "score": 5, "controle": "..."}
      ]
    }
  ],
  "superficie_ataque": {
    "endpoints_api": ["endpoints de API expostos"],
    "mecanismos_auth": ["mecanismos de autenticação"],
    "upload_arquivos": ["se aplicável"],
    "webhooks_integracoes": ["webhooks/integrações externas"],
    "dados_sensiveis_transito": ["dados sensíveis em trânsito"]
  },
  "riscos_criticos": ["risco crítico consolidado 1", "..."],
  "riscos_altos": ["..."],
  "riscos_medios": ["..."],
  "controles_prioritarios": ["..."]
}
\`\`\`

Mínimo 4 features, cada uma com as 6 categorias STRIDE preenchidas. \`score\` = \`probabilidade × impacto\` (1-25). Probabilidade e impacto em escala 1-5.

### MATRIZ_RBAC
Modelo de identidade e controle de acesso. Use a forma "matriz" — lista de papéis e lista de recursos com o nível de acesso de cada papel em cada recurso. Formato JSON:
\`\`\`json
{
  "papeis": [
    {"nome": "ex: admin", "descricao": "...", "usuarios_esperados": "ex: 1-3 sócios"},
    {"nome": "ex: usuario_pago", "descricao": "...", "usuarios_esperados": "ex: clientes"}
  ],
  "recursos": [
    {"nome": "Projeto", "operacoes": {"admin": "CRUD", "usuario_pago": "CRU", "guest": "-"}, "observacao": "scoping por user_id"},
    {"nome": "Billing", "operacoes": {"admin": "R", "usuario_pago": "R"}, "observacao": "apenas próprio billing"}
  ],
  "convencao": "C=Criar · R=Ler · U=Atualizar · D=Deletar · - = sem acesso",
  "auth_flow": "1-2 parágrafos descrevendo: login, emissão de sessão, propagação de papel, refresh, logout",
  "armadilhas_evitar": ["3-5 erros comuns de RBAC neste contexto"]
}
\`\`\`

**Depois do JSON, inclua um checklist de autenticação (lista curta, formato markdown):**
- **Protocolo:** ex: OAuth 2.0 + OIDC com refresh token rotacionado, ou JWT curto com refresh
- **MFA:** obrigatório para [papéis] / opcional para [papéis] — justifique
- **Sessão:** expiração em [X] minutos · revogação em [cenários] · onde armazenar (cookie httpOnly / token)
- **Provedor recomendado:** Clerk / Auth0 / Supabase Auth / próprio — justificativa de 1 linha
- **Diagrama de sequência de login** em ASCII curto (4-6 passos: client → auth → callback → token → recurso)

### OWASP_CHECKLIST
Checklist OWASP Top 10 2021 adaptado à stack e features deste produto:

Para cada item do Top 10, indique: aplicabilidade ao produto, vulnerabilidade específica a monitorar, controle de mitigação concreto, e como testar:

1. **A01 — Controle de Acesso Quebrado**: [riscos específicos + controles]
2. **A02 — Falhas Criptográficas**: [dados sensíveis + algoritmos a usar]
3. **A03 — Injeção**: [endpoints vulneráveis + ORM/parametrização]
4. **A04 — Design Inseguro**: [decisões de design a evitar]
5. **A05 — Configuração Incorreta**: [headers, CORS, erros expostos]
6. **A06 — Componentes Vulneráveis**: [dependências críticas + política de updates]
7. **A07 — Falha de Autenticação**: [política de senhas, bloqueio, MFA]
8. **A08 — Integridade de Software**: [CI/CD, assinatura de artefatos]
9. **A09 — Falha de Logging**: [o que logar, sem dados pessoais!]
10. **A10 — SSRF**: [se aplicável — integrações externas]

**Política de gestão de segredos:**
- Nunca hardcodar: [lista de segredos deste produto]
- Usar: .env local / secrets manager em produção
- Rotação: [frequência por tipo de segredo]

**Checklist de revisão de código gerado por IA:**
Lista de 10 verificações obrigatórias antes do merge de qualquer código gerado por LLM.

### PLANO_INCIDENTES
Plano completo de resposta a incidentes e operações seguras em formato JSON:
{
  "jurisdicao_dados": {
    "pais_armazenamento": "...",
    "transferencia_internacional": true/false,
    "base_legal_transferencia": "...",
    "provedores_cloud": [{"nome": "...", "servico": "...", "pais": "...", "adequacao_lgpd": "..."}]
  },
  "politica_backup": {
    "frequencia": "...",
    "retencao": "...",
    "criptografia": "...",
    "teste_restauracao": "mensal",
    "rpo": "Recovery Point Objective",
    "rto": "Recovery Time Objective"
  },
  "politica_logs": {
    "o_que_registrar": [...],
    "o_que_NAO_registrar": ["dados pessoais", "senhas", "tokens completos"],
    "formato": "JSON estruturado",
    "retencao": "...",
    "quem_acessa": [...]
  },
  "plano_resposta_incidentes": {
    "responsavel_principal": "a definir",
    "responsavel_backup": "a definir",
    "classificacao_incidentes": [
      {"nivel": "crítico", "exemplos": [...], "sla_contencao": "1h", "sla_notificacao_usuarios": "24h"},
      {"nivel": "alto", "exemplos": [...], "sla_contencao": "4h"},
      {"nivel": "medio", "exemplos": [...], "sla_contencao": "24h"}
    ],
    "sla_notificacao_anpd": "72 horas após ciência do incidente (LGPD Art. 48 + Resolução ANPD 4/2023)",
    "passos_resposta": ["Detecção", "Contenção", "Erradicação", "Recuperação", "Lições aprendidas"],
    "template_comunicado_usuarios": "...",
    "template_notificacao_anpd": "..."
  }
}`,

  4: `Você é um arquiteto de software sênior com experiência em sistemas escaláveis e seguros. Com base no briefing e artefatos anteriores (incluindo o Threat Model e Matriz RBAC da fase Segurança & LGPD), gere os seguintes artefatos técnicos em português brasileiro.

### ARQUITETURA
Arquitetura completa do sistema, em formato JSON:

\`\`\`json
{
  "estilo_arquitetural": {"escolha": "ex: monolito modular", "justificativa": "por que este estilo e não microsserviços/serverless"},
  "componentes": [
    {"nome": "ex: Web App", "tipo": "frontend", "descricao": "1 linha"},
    {"nome": "ex: API Server", "tipo": "backend", "descricao": "1 linha"},
    {"nome": "ex: PostgreSQL", "tipo": "database", "descricao": "1 linha"}
  ],
  "conexoes": [
    {"de": "Web App", "para": "API Server", "protocolo": "REST/HTTPS", "descricao": "opcional"}
  ],
  "stack_tecnologica": [
    {"camada": "frontend", "escolha": "...", "justificativa": "..."},
    {"camada": "backend", "escolha": "...", "justificativa": "..."},
    {"camada": "banco", "escolha": "...", "justificativa": "..."},
    {"camada": "cache", "escolha": "...", "justificativa": "..."},
    {"camada": "fila", "escolha": "...", "justificativa": "..."},
    {"camada": "infra", "escolha": "...", "justificativa": "..."}
  ],
  "fluxos_dados_principais": ["descrição do fluxo 1", "descrição do fluxo 2"],
  "decisoes_trade_off": ["o que foi priorizado e por quê — item 1", "..."]
}
\`\`\`

Cubra todos os componentes reais do produto descrito (mínimo 5) e todas as conexões relevantes entre eles.

### MODELO_DADOS
Modelo de dados em formato JSON estruturado, seguido de notas sobre soft-delete, auditoria e multi-tenancy.

\`\`\`json
{
  "entidades": [
    {
      "nome": "User",
      "descricao": "1 linha — qual papel cumpre",
      "campos": [
        {"nome": "id", "tipo": "uuid", "pk": true, "obs": "gerado no insert"},
        {"nome": "email", "tipo": "text", "unique": true, "nullable": false},
        {"nome": "created_at", "tipo": "timestamptz", "default": "now()"}
      ],
      "indices": ["email", "created_at"],
      "relacoes": ["1:N → Project (FK user_id)"]
    }
  ],
  "estrategia_soft_delete": "ex: coluna deleted_at timestamptz nullable + filtro padrão",
  "estrategia_auditoria": "ex: tabela audit_log + trigger / coluna updated_by",
  "multi_tenancy": "ex: scoping por user_id, sem tenant_id porque produto é B2C",
  "notas_migracao": "como aplicar mudanças sem downtime"
}
\`\`\`

Mínimo 4 entidades cobrindo os fluxos principais do PRD.

### CONTRATOS_API
Contratos de API principais (mínimo 8 endpoints críticos) no formato:
**[MÉTODO] /caminho** — Descrição
- Auth: [required/optional]
- Params: [lista]
- Body: [schema JSON]
- Response 200: [schema JSON]
- Erros: [códigos e significados]

### SEGURANCA
Plano de segurança completo (incorporando outputs da fase Segurança & LGPD):
- Autenticação e autorização (implementação da Matriz RBAC definida)
- Proteção de dados sensíveis conforme classificação de dados aprovada
- Controles OWASP Top 10 aplicados à stack escolhida
- Política de secrets e variáveis de ambiente
- Rate limiting e proteção contra abuso
- Auditoria e logging de segurança (sem dados pessoais)

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

  5: `Você é um especialista em engenharia de software e gestão ágil. Com base no briefing e artefatos anteriores, gere os seguintes artefatos em português brasileiro.

### MILESTONES
Plano de milestones em formato JSON. Cada milestone deve ter um entregável navegável que dê para mostrar a um usuário ou investidor.

\`\`\`json
{
  "milestones": [
    {
      "numero": 1,
      "nome": "ex: Auth + Onboarding",
      "duracao": "1 semana",
      "features": ["ex: Cadastro com Clerk", "ex: Tour de boas-vindas"],
      "criterio_aceitacao": "Novo usuário consegue criar conta e ver tela vazia do dashboard",
      "demo": "Gravação de tela 30s mostrando o fluxo",
      "risco": "baixo",
      "dependencias": []
    }
  ],
  "duracao_total_estimada": "ex: 6 semanas",
  "marco_mvp": "número do milestone que marca MVP entregável"
}
\`\`\`

Mínimo 5 milestones cobrindo todo o MVP. Risco ∈ {baixo, medio, alto}.

### SPRINT_1
Plano detalhado da Sprint 1 (primeira semana de desenvolvimento), em formato JSON:

\`\`\`json
{
  "objetivos": ["objetivo claro e mensurável 1", "..."],
  "tasks": [
    {"titulo": "ex: Setup do repo e CI", "estimativa_horas": 3, "categoria": "Setup"},
    {"titulo": "ex: Modelo de dados + migrations", "estimativa_horas": 4, "categoria": "Backend"}
  ],
  "setup_passos": ["passo a passo do ambiente de desenvolvimento"],
  "definition_of_done": ["definição de done aplicável a cada task"],
  "bloqueadores": [{"risco": "bloqueador potencial", "mitigacao": "como resolver"}],
  "checkpoint_fim_sprint": "o que deve estar funcionando ao final da sprint"
}
\`\`\`

Tasks em ordem de execução, categorias como Setup/Backend/Frontend/Testes/Deploy. Mínimo 8 tasks cobrindo a primeira semana inteira.

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

  6: `Você é um especialista em qualidade de software e experiência do usuário. Com base no briefing e artefatos anteriores, gere os seguintes artefatos em português brasileiro.

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
20 casos de teste críticos em formato JSON, priorizados P0/P1/P2.

\`\`\`json
{
  "casos": [
    {
      "id": "TC-01",
      "titulo": "Usuário cria projeto com sucesso",
      "prioridade": "P0",
      "tipo": "funcional",
      "preconds": "Usuário autenticado, plano free",
      "steps": ["1. Abrir dashboard", "2. Clicar Novo Projeto", "3. Preencher nome", "4. Confirmar"],
      "esperado": "Projeto aparece na lista e usuário é redirecionado para Fase 1"
    }
  ],
  "distribuicao_alvo": "P0 cobre caminho crítico; P1 cobre fluxos secundários; P2 cobre edge cases"
}
\`\`\`

Distribuição sugerida: 6-8 P0 (caminho crítico, bloqueia release), 6-8 P1 (alto valor), 4-6 P2 (edge cases). Tipo ∈ {funcional, integracao, e2e, performance, seguranca, acessibilidade}.

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

  7: `Você é um especialista em go-to-market, lançamento de produtos e crescimento. Com base no briefing e artefatos anteriores, gere os seguintes artefatos em português brasileiro.

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
Dashboard pós-lançamento — 4 primeiras semanas com métricas AARRR + north star.

\`\`\`json
{
  "north_star": {"nome": "ex: Projetos completos por semana", "meta_semana_4": "ex: 10"},
  "semanas": [
    {
      "semana": 1,
      "foco": "Aquisição inicial",
      "metricas": {
        "aquisicao": {"meta": "ex: 50 cadastros", "como_medir": "Clerk dashboard"},
        "ativacao": {"meta": "ex: 30% completam Fase 1", "como_medir": "evento phase_complete"},
        "retencao": {"meta": "—", "como_medir": "—"},
        "receita": {"meta": "—", "como_medir": "—"},
        "indicacao": {"meta": "—", "como_medir": "—"}
      },
      "acoes_se_abaixo": "ex: Postar em 3 comunidades de founders"
    }
  ],
  "criterios_product_market_fit": [
    "ex: ≥40% dos usuários ativos disseram que ficariam 'muito decepcionados' sem o produto",
    "ex: retenção semana 4 ≥ 30%"
  ]
}
\`\`\`

Inclua as 4 semanas com metas progressivas.

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

function sanitizeInput(input: string, maxLength: number): string {
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .slice(0, maxLength)
    .trim();
}

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/gi,
  /esquece?\s+(o\s+que\s+foi\s+dito|as\s+instru[çc][oõ]es)/gi,
  /you\s+are\s+now\s+/gi,
  /act\s+as\s+(?!if)/gi,
  /pretend\s+(you\s+are|to\s+be)/gi,
  /disregard\s+(all\s+)?(previous|prior)/gi,
  /new\s+instructions?\s*:/gi,
  /<\/?s(?:ystem|cript)[^>]*>/gi,
  /\[SYSTEM\]|\[INST\]|\[\/INST\]/gi,
];

export function sanitizeBriefing(briefing: string): string {
  let safe = briefing;
  for (const pattern of INJECTION_PATTERNS) {
    safe = safe.replace(pattern, "[conteúdo removido]");
  }
  return sanitizeInput(safe, 2000);
}

export async function generatePhaseArtifacts(
  phaseNumber: number,
  projectName: string,
  briefing: string,
  previousArtifacts: Array<{ artifactKey: string; content: string }>,
  onProgress: (text: string) => void,
  founderProfile?: Record<string, string>
): Promise<PhaseAIResult[]> {
  const safeName = sanitizeInput(projectName, 200);
  const safeBriefing = sanitizeBriefing(briefing);

  const phaseName = PHASE_NAMES[phaseNumber - 1];
  const prompt = PHASE_PROMPTS[phaseNumber];

  const previousContext = previousArtifacts.length > 0
    ? `\n\nARTEFATOS DE FASES ANTERIORES (use como contexto e seja coerente com eles):\n${previousArtifacts.map(a => `[${a.artifactKey}]\n${a.content.slice(0, 2500)}`).join("\n\n")}`
    : "";

  const profileContext = founderProfile && Object.keys(founderProfile).length > 0
    ? `\n\nCONTEXTO DO FOUNDER: Estágio do projeto: ${founderProfile.estagio ?? "não informado"} | Setor: ${founderProfile.setor ?? "não informado"} | Equipe: ${founderProfile.equipe ?? "não informado"}. Leve esse contexto em conta ao gerar os artefatos — ajuste profundidade, tom e foco de acordo.`
    : "";

  const systemPrompt = `${prompt}

INSTRUÇÕES DE FORMATAÇÃO:
- Use exatamente "### NOME_DO_ARTEFATO" (em maiúsculas com underlines) como separador entre artefatos
- Seja ESPECÍFICO para o produto/negócio descrito — nunca genérico
- Todos os artefatos devem estar em português brasileiro
- Para conteúdo JSON, use blocos \`\`\`json ... \`\`\`
- Seja denso e valioso — cada artefato deve ser um entregável que o founder pode usar imediatamente`;

  const userMessage = `PROJETO: ${safeName}\n\nBRIEFING:\n${safeBriefing}${profileContext}${previousContext}\n\nGere todos os artefatos da Fase ${phaseNumber} — ${phaseName}. Seja específico, detalhado e acionável.`;

  const stream = await openai.chat.completions.create({
    model: "gpt-4.1",
    max_completion_tokens: 16000,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    stream: true,
    stream_options: { include_usage: true },
  });

  let fullResponse = "";
  let lastUsage: { prompt_tokens?: number; completion_tokens?: number } | null = null;
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      fullResponse += content;
      onProgress(content);
    }
    if (chunk.usage) lastUsage = chunk.usage;
  }
  void recordOpenAiCost("gpt-4.1", lastUsage);

  return parseArtifacts(fullResponse, phaseNumber);
}

function parseArtifacts(fullResponse: string, phaseNumber: number): PhaseAIResult[] {
  const phaseArtifactKeys: Record<number, string[]> = {
    1: ["SELETOR_NICHO_INICIAL", "LEAN_CANVAS", "JTBD", "ANALISE_COMPETITIVA", "MATRIZ_COMPETITIVA", "DIMENSIONAMENTO_MERCADO", "VALIDACAO_RAPIDA", "HIPOTESE_CENTRAL", "SCORE_POTENCIAL"],
    2: ["PRD", "CARTAO_PERSONA", "MAPA_DECISAO_COMPRA", "VALOR_QUANTIFICADO", "USER_STORIES", "METRICAS_SUCESSO", "HIPOTESE_PRICING", "LTV_CAC", "BENCHMARKING", "ROADMAP_3_MESES"],
    3: ["DATA_MAP", "CLASSIFICACAO_DADOS", "PRIVACY_BY_DESIGN", "POLITICA_PRIVACIDADE", "THREAT_MODEL", "MATRIZ_RBAC", "OWASP_CHECKLIST", "PLANO_INCIDENTES"],
    4: ["ARQUITETURA", "MODELO_DADOS", "CONTRATOS_API", "SEGURANCA", "FLUXOS_UI", "ESCALABILIDADE", "ADR", "SETUP_DEVOPS"],
    5: ["MILESTONES", "SPRINT_1", "ESTRUTURA_PASTAS", "README", "GUIA_CONTRIBUICAO", "TECH_DEBT_LOG", "DEFINITION_OF_DONE"],
    6: ["PLANO_TESTES", "CASOS_TESTE_CRITICOS", "CHECKLIST_QA", "SCRIPT_USER_TEST", "RELATORIO_PERFORMANCE", "BUGS_PREVENCAO", "OBSERVABILIDADE"],
    7: ["RUNBOOK_DEPLOY", "GTM", "LAUNCH_CHECKLIST", "METRICAS_POS_LAUNCH", "PLANO_CRESCIMENTO_90_DIAS", "PITCH_INVESTIDORES", "SLA_SUPORTE"],
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

// ─── Market Validation: Interview Script Generation (SSE) ───────────────────

const INTERVIEW_SCRIPT_PROMPT = (phaseNumber: number, projectName: string, artifactContext: string) => `
Você é um especialista em pesquisa de usuário e descoberta de produto. Com base nos artefatos da Fase ${phaseNumber} do projeto "${projectName}", gere um roteiro estruturado de entrevistas de descoberta em português brasileiro.

ARTEFATOS DA FASE:
${artifactContext}

Gere o roteiro completo assim:

## Objetivo das Entrevistas
[1-2 frases claras sobre o que esta rodada vai validar]

## Hipóteses que Estamos Testando
1. [hipótese 1]
2. [hipótese 2]
3. [hipótese 3]

## Perfil do Entrevistado Ideal
[Descrição detalhada de quem entrevistar, como recrutá-los, quantos]

## Roteiro (45-60 min)

### Aquecimento (5 min)
[2-3 perguntas abertas sobre o contexto do entrevistado]

### Descoberta de Problema (15 min)
[4-5 perguntas abertas sem mencionar sua solução — foco no problema deles]

### Exploração de Comportamento (15 min)
[4 perguntas sobre como resolvem hoje, frequência, custo emocional]

### Aprofundamento (10 min)
[3 perguntas follow-up para ir mais fundo nos pontos críticos]

### Encerramento (5 min)
[Pergunta de recomendação + abertura para dúvidas]

## O Que Observar
Para cada seção acima, liste: sinal de validação vs. sinal de invalidação (o que as respostas ideais se parecem).

## Template de Registro
Forneça um template markdown que o founder preencherá após cada entrevista (entrevistado, data, respostas por pergunta, insights, veredicto).

## Critério de Avanço
[N entrevistas mínimas, o que você precisa ouvir para avançar com confiança para a próxima fase]
`.trim();

export async function generateInterviewScript(
  phaseNumber: number,
  projectName: string,
  artifactContext: string,
  onToken: (token: string) => void,
): Promise<string> {
  const stream = await openai.chat.completions.create({
    model: "gpt-4.1",
    max_completion_tokens: 4000,
    messages: [
      { role: "system", content: INTERVIEW_SCRIPT_PROMPT(phaseNumber, projectName, artifactContext) },
    ],
    stream: true,
    stream_options: { include_usage: true },
  });

  let fullText = "";
  let lastUsage: { prompt_tokens?: number; completion_tokens?: number } | null = null;
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      fullText += content;
      onToken(content);
    }
    if (chunk.usage) lastUsage = chunk.usage;
  }
  void recordOpenAiCost("gpt-4.1", lastUsage);
  return fullText;
}

// ─── Market Validation: Notes Analysis (SSE) ────────────────────────────────

const ANALYSIS_PROMPT = (projectName: string, artifactContext: string, notes: string) => `
Você é um estrategista de produto sênior. O founder concluiu entrevistas de descoberta. Analise os achados vs. as hipóteses originais do projeto.

PROJETO: ${projectName}

ARTEFATOS E HIPÓTESES ORIGINAIS:
${artifactContext}

NOTAS DAS ENTREVISTAS DO FOUNDER:
${notes}

Gere uma análise completa em português brasileiro:

## Score de Validação: [0-100]/100
[1 frase explicando o score — seja honesto, não inflacione]

## Hipóteses Confirmadas ✓
[Lista de hipóteses que as entrevistas confirmaram, com evidências diretas das notas]

## Hipóteses Refutadas ✗
[Lista de hipóteses refutadas, com evidências e o que isso implica para o produto]

## Insights Inesperados
[Descobertas que não estavam nos artefatos originais mas emergiram das entrevistas]

## Veredicto
**RECOMENDAÇÃO: AVANÇAR | PIVOTAR | MAIS ENTREVISTAS**

[Justificativa em 2-3 parágrafos — seja direto e acionável]

## Ajustes Sugeridos nos Artefatos
[Lista específica: "Atualize [ARTEFATO] para refletir que [descoberta]"]

## Próximos Passos Concretos
1. [ação específica com prazo]
2. [ação específica com prazo]
3. [ação específica com prazo]
`.trim();

export async function analyzeInterviewNotes(
  projectName: string,
  artifactContext: string,
  notes: string,
  onToken: (token: string) => void,
): Promise<string> {
  const stream = await openai.chat.completions.create({
    model: "gpt-4.1",
    max_completion_tokens: 3000,
    messages: [
      { role: "system", content: ANALYSIS_PROMPT(projectName, artifactContext, notes) },
    ],
    stream: true,
    stream_options: { include_usage: true },
  });

  let fullText = "";
  let lastUsage: { prompt_tokens?: number; completion_tokens?: number } | null = null;
  for await (const chunk of stream) {
    if (chunk.usage) lastUsage = chunk.usage;
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      fullText += content;
      onToken(content);
    }
  }
  void recordOpenAiCost("gpt-4.1", lastUsage);
  return fullText;
}

// ─── Coherence Analysis (JSON, non-streaming) ────────────────────────────────

const COHERENCE_PROMPT = (projectName: string, briefing: string, artifactContext: string) => `
Você é um advisor sênior de produto. Analise todos os artefatos gerados para este projeto e avalie a coerência interna — ou seja, se os documentos são consistentes entre si ou se há contradições, lacunas ou conflitos entre eles.

PROJETO: ${projectName}
BRIEFING: ${briefing}

TODOS OS ARTEFATOS GERADOS:
${artifactContext}

Retorne APENAS JSON válido (sem texto antes ou depois):

{
  "score": <número de 0 a 100>,
  "resumo": "<1-2 frases sobre o estado de coerência do projeto>",
  "conflitos": [
    {
      "severidade": "alta|media|baixa",
      "descricao": "<descrição clara e específica do conflito encontrado>",
      "artefatos_envolvidos": ["ARTEFATO_A", "ARTEFATO_B"],
      "sugestao": "<o que fazer concretamente para resolver>"
    }
  ],
  "alinhamentos": [
    {
      "descricao": "<o que está bem alinhado e coeso>",
      "artefatos_envolvidos": ["ARTEFATO_A", "ARTEFATO_B"]
    }
  ],
  "recomendacao_geral": "<recomendação de 1-2 frases para o founder>"
}
`.trim();

export interface CoherenceResult {
  score: number;
  resumo: string;
  conflitos: Array<{
    severidade: "alta" | "media" | "baixa";
    descricao: string;
    artefatos_envolvidos: string[];
    sugestao: string;
  }>;
  alinhamentos: Array<{
    descricao: string;
    artefatos_envolvidos: string[];
  }>;
  recomendacao_geral: string;
}

// ─── Market Potential Score (JSON, non-streaming) ─────────────────────────────

const MARKET_POTENTIAL_PROMPT = (projectName: string, briefing: string, artifactContext: string) => `
Você é um investidor sênior de venture capital com experiência em startups B2B e B2C no Brasil.
Analise este projeto de startup e avalie seu potencial de mercado de forma objetiva e honesta.

PROJETO: ${projectName}
BRIEFING: ${briefing}

ARTEFATOS DISPONÍVEIS:
${artifactContext}

Avalie nas dimensões abaixo e retorne APENAS JSON válido (sem texto antes ou depois):

{
  "score": <número de 0 a 100 — média ponderada das dimensões>,
  "dimensoes": {
    "tamanho_mercado": <0–100>,
    "urgencia_problema": <0–100>,
    "modelo_receita": <0–100>,
    "diferencial_competitivo": <0–100>,
    "viabilidade_execucao": <0–100>
  },
  "tam_estimado": "<estimativa de TAM para o Brasil com base nos dados do briefing — seja específico com números>",
  "nivel_inovacao": "<Incremental|Disruptivo|Plataforma> — <1 frase explicando>",
  "resumo": "<2-3 frases honestas sobre o potencial do projeto — pontos fortes e riscos principais>",
  "alertas": ["<risco crítico 1>", "<risco crítico 2>"],
  "acelerador": "<1 ação concreta que mais aumentaria o potencial de sucesso do projeto>"
}
`.trim();

export interface MarketPotentialResult {
  score: number;
  dimensoes: {
    tamanho_mercado: number;
    urgencia_problema: number;
    modelo_receita: number;
    diferencial_competitivo: number;
    viabilidade_execucao: number;
  };
  tam_estimado: string;
  nivel_inovacao: string;
  resumo: string;
  alertas: string[];
  acelerador: string;
}

export async function analyzeMarketPotential(
  projectName: string,
  briefing: string,
  artifactContext: string,
): Promise<MarketPotentialResult> {
  const safeBriefing = sanitizeBriefing(briefing);
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1",
    max_completion_tokens: 2000,
    messages: [
      { role: "system", content: MARKET_POTENTIAL_PROMPT(projectName, safeBriefing, artifactContext) },
    ],
    stream: false,
  });
  void recordOpenAiCost("gpt-4.1", completion.usage ?? null);

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Market potential analysis returned invalid JSON");
  return JSON.parse(jsonMatch[0]) as MarketPotentialResult;
}

export async function analyzeProjectCoherence(
  projectName: string,
  briefing: string,
  artifactContext: string,
): Promise<CoherenceResult> {
  const safeBriefing = sanitizeBriefing(briefing);
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1",
    max_completion_tokens: 3000,
    messages: [
      { role: "system", content: COHERENCE_PROMPT(projectName, safeBriefing, artifactContext) },
    ],
    stream: false,
  });
  void recordOpenAiCost("gpt-4.1", completion.usage ?? null);

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Coherence analysis returned invalid JSON");
  return JSON.parse(jsonMatch[0]) as CoherenceResult;
}
