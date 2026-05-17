import { useState } from "react";
import { Link } from "wouter";

type Tab = "datamap" | "classificacao" | "threatmodel" | "incidentes";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "datamap",       label: "Mapa de Dados & RAT",        icon: "🗂️" },
  { id: "classificacao", label: "Classificação de Dados",      icon: "🏷️" },
  { id: "threatmodel",   label: "Threat Model STRIDE",         icon: "🛡️" },
  { id: "incidentes",    label: "Plano de Incidentes",         icon: "🚨" },
];

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    green:  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    blue:   "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    red:    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    gray:   "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[color] ?? colors.gray}`}>
      {children}
    </span>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
      <div className="bg-secondary/50 px-6 py-3 border-b border-card-border">
        <h3 className="font-serif text-base font-medium text-foreground">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: (React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-card-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-secondary/60">
            {headers.map((h, i) => (
              <th key={i} className="text-left px-4 py-3 font-semibold text-foreground whitespace-nowrap first:rounded-tl-xl last:rounded-tr-xl">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-t border-card-border hover:bg-secondary/30 transition-colors">
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-3 text-muted-foreground align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DataMapTab() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-muted-foreground leading-relaxed mb-2">
          Este Registro de Atividades de Tratamento (RAT) documenta todos os dados pessoais coletados e tratados pela
          plataforma FoundersFlow, conforme exigido pelo Art. 37 da Lei 13.709/2018 (LGPD) e pelo Art. 30 do GDPR.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Controlador:</strong> FoundersFlow &nbsp;·&nbsp;
          <strong className="text-foreground">Encarregado (DPO):</strong> privacidade@foundersflow.com.br &nbsp;·&nbsp;
          <strong className="text-foreground">Última revisão:</strong> Maio 2026
        </p>
      </div>

      <SectionCard title="1. Dados de Identificação e Conta (via Clerk Auth)">
        <Table
          headers={["Dado", "Origem", "Finalidade", "Base Legal (LGPD)", "Retenção"]}
          rows={[
            ["Nome completo", "Clerk (usuário fornece)", "Personalizar a experiência e saudações no app", <Badge color="blue">Execução de contrato — Art. 7º, V</Badge>, "Enquanto a conta existir + 5 anos"],
            ["Endereço de e-mail", "Clerk (usuário fornece)", "Autenticação, comunicações transacionais (recibos, alertas)", <Badge color="blue">Execução de contrato — Art. 7º, V</Badge>, "Enquanto a conta existir + 5 anos"],
            ["Foto de perfil", "Clerk / Google OAuth (opcional)", "Exibição no app", <Badge color="purple">Consentimento — Art. 7º, I</Badge>, "Enquanto a conta existir"],
            ["ID único do usuário (clerkId)", "Gerado pelo Clerk", "Chave de relacionamento entre todos os dados do usuário", <Badge color="blue">Execução de contrato — Art. 7º, V</Badge>, "Enquanto a conta existir + 5 anos"],
            ["Data/hora de login", "Clerk", "Segurança e auditoria de acessos", <Badge color="green">Legítimo interesse — Art. 7º, IX</Badge>, "12 meses"],
          ]}
        />
      </SectionCard>

      <SectionCard title="2. Dados de Uso da Plataforma">
        <Table
          headers={["Dado", "Onde é armazenado", "Finalidade", "Base Legal (LGPD)", "Retenção"]}
          rows={[
            ["Plano contratado (free/basic/pro/advanced)", "DB próprio (tabela users)", "Controle de acesso a funcionalidades e faturamento", <Badge color="blue">Execução de contrato — Art. 7º, V</Badge>, "Enquanto a conta existir + 5 anos"],
            ["Contador de uso diário de IA (dailyAiUsage)", "DB próprio (tabela users)", "Enforçar limites do plano, prevenir abuso", <Badge color="green">Legítimo interesse — Art. 7º, IX</Badge>, "Resetado diariamente; histórico não mantido"],
            ["Fase atual do projeto (currentPhase)", "DB próprio (tabela projects)", "Salvar progresso e retomar onde parou", <Badge color="blue">Execução de contrato — Art. 7º, V</Badge>, "Enquanto o projeto existir"],
            ["Status dos gates de saída de cada fase", "DB próprio (tabela phases)", "Controlar avanço no pipeline de 7 fases", <Badge color="blue">Execução de contrato — Art. 7º, V</Badge>, "Enquanto o projeto existir"],
          ]}
        />
      </SectionCard>

      <SectionCard title="3. Conteúdo Gerado pelo Usuário (Dados de Negócio)">
        <div className="mb-4 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>⚠️ Atenção:</strong> Os briefings e artefatos podem conter informações confidenciais de negócio
            (ideias de produto, estratégias, dados financeiros) classificadas como <strong>CONFIDENCIAL</strong>.
            São tratados com criptografia em trânsito (TLS 1.3) e em repouso (AES-256 via PostgreSQL gerenciado).
          </p>
        </div>
        <Table
          headers={["Dado", "Finalidade", "Compartilhado com IA?", "Base Legal (LGPD)", "Retenção"]}
          rows={[
            ["Nome do projeto", "Identificação e organização", "Sim — contexto para geração", <Badge color="blue">Execução de contrato — Art. 7º, V</Badge>, "Enquanto o projeto existir"],
            ["Briefing do produto", "Base para todos os 7×8 artefatos gerados pela IA", "Sim — enviado ao GPT-4.1 como contexto", <Badge color="blue">Execução de contrato — Art. 7º, V</Badge>, "Enquanto o projeto existir"],
            ["Artefatos gerados (Lean Canvas, PRD, Threat Model, etc.)", "Entregáveis de valor do produto para o founder", "Não — são outputs, não inputs", <Badge color="blue">Execução de contrato — Art. 7º, V</Badge>, "Enquanto o projeto existir"],
          ]}
        />
      </SectionCard>

      <SectionCard title="4. Dados de Pagamento e Faturamento (via Stripe)">
        <div className="mb-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>ℹ️ Nota:</strong> A FoundersFlow <strong>não armazena</strong> dados de cartão de crédito ou dados bancários.
            Todo o tratamento de dados de pagamento é realizado diretamente pelo <strong>Stripe Inc.</strong>, certificado PCI-DSS Level 1.
          </p>
        </div>
        <Table
          headers={["Dado", "Onde é armazenado", "Finalidade", "Base Legal (LGPD)", "Retenção"]}
          rows={[
            ["ID do cliente Stripe (stripeCustomerId)", "DB próprio (tabela users)", "Associar conta à cobrança recorrente", <Badge color="blue">Execução de contrato — Art. 7º, V</Badge>, "5 anos após encerramento"],
            ["ID da assinatura Stripe (stripeSubscriptionId)", "DB próprio (tabela users)", "Verificar status da assinatura e plano ativo", <Badge color="blue">Execução de contrato — Art. 7º, V</Badge>, "5 anos após encerramento"],
            ["Status da assinatura (active/canceled/past_due)", "DB próprio (tabela users)", "Controlar acesso às funcionalidades do plano", <Badge color="blue">Execução de contrato — Art. 7º, V</Badge>, "5 anos após encerramento"],
            ["Dados do cartão, endereço de cobrança, histórico de faturas", "Stripe (terceiro)", "Processamento de pagamentos", <Badge color="blue">Execução de contrato — Art. 7º, V</Badge>, "Conforme política Stripe + obrigação legal fiscal"],
          ]}
        />
      </SectionCard>

      <SectionCard title="5. Comunicações e Suporte">
        <Table
          headers={["Dado", "Finalidade", "Base Legal (LGPD)", "Retenção"]}
          rows={[
            ["Notificações in-app (título, mensagem, tipo)", "Informar o usuário sobre eventos relevantes na plataforma", <Badge color="blue">Execução de contrato — Art. 7º, V</Badge>, "90 dias após leitura"],
            ["Tickets de suporte (assunto, mensagem, categoria)", "Resolver dúvidas, reclamações e solicitações LGPD", <Badge color="green">Legítimo interesse — Art. 7º, IX</Badge>, "3 anos"],
            ["Notas internas de admin em tickets", "Coordenação interna de atendimento", <Badge color="green">Legítimo interesse — Art. 7º, IX</Badge>, "3 anos"],
          ]}
        />
      </SectionCard>

      <SectionCard title="6. Transferências Internacionais de Dados">
        <Table
          headers={["Destinatário", "País", "Dados transferidos", "Garantia Adequada", "Base Legal"]}
          rows={[
            ["Clerk Inc.", "EUA", "Nome, e-mail, foto de perfil, sessões de autenticação", "Standard Contractual Clauses (SCCs) + SOC 2 Type II", <Badge color="blue">Execução de contrato — Art. 7º, V + Art. 33, II, LGPD</Badge>],
            ["Stripe Inc.", "EUA", "stripeCustomerId, stripeSubscriptionId (referências)", "PCI-DSS L1 + Standard Contractual Clauses", <Badge color="blue">Execução de contrato — Art. 7º, V + Art. 33, II, LGPD</Badge>],
            ["OpenAI Inc.", "EUA", "Nome do projeto + briefing + artefatos de contexto (fases anteriores)", "Data Processing Agreement (DPA) + SCCs + Zero Data Retention (API)", <Badge color="blue">Execução de contrato — Art. 7º, V + Art. 33, II, LGPD</Badge>],
          ]}
        />
        <p className="mt-4 text-xs text-muted-foreground">
          * A OpenAI, via API, não usa dados submetidos para treinar modelos (Zero Data Retention policy para API customers).
          Briefings são retidos pelos servidores da OpenAI por até 30 dias apenas para fins de abuso e segurança, conforme sua política de uso da API.
        </p>
      </SectionCard>
    </div>
  );
}

function ClassificacaoTab() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-muted-foreground leading-relaxed">
          Todos os ativos de dados da FoundersFlow são classificados em 4 níveis de sensibilidade.
          A classificação determina os controles de acesso, criptografia, retenção e procedimentos de resposta a incidentes aplicáveis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            level: "PÚBLICO",
            color: "border-green-400 bg-green-50 dark:bg-green-900/20",
            badge: <Badge color="green">PÚBLICO</Badge>,
            desc: "Informações intencionalmente disponíveis para qualquer pessoa, sem restrições.",
            impact: "Impacto de exposição: Nenhum",
            examples: [
              "Conteúdo da landing page e site institucional",
              "Planos e preços (página /pricing)",
              "Política de privacidade (/privacidade)",
              "Esta página de compliance (/compliance)",
              "Documentação pública da API",
            ],
            controls: [
              "Nenhum controle de acesso especial requerido",
              "Cache público permitido",
              "CDN sem restrições",
            ],
          },
          {
            level: "INTERNO",
            color: "border-blue-400 bg-blue-50 dark:bg-blue-900/20",
            badge: <Badge color="blue">INTERNO</Badge>,
            desc: "Informações operacionais acessíveis apenas a colaboradores e sistemas autenticados da plataforma.",
            impact: "Impacto de exposição: Baixo a Moderado",
            examples: [
              "Configurações do sistema (tabela settings)",
              "Estatísticas agregadas de uso (admin/stats)",
              "Logs de aplicação (sem dados pessoais identificáveis)",
              "Configuração de cupons de desconto",
              "Lista de planos e seus limites",
            ],
            controls: [
              "Acesso restrito a usuários com isAdmin=true",
              "Autenticação via Clerk obrigatória",
              "Logs de acesso auditados",
            ],
          },
          {
            level: "CONFIDENCIAL",
            color: "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20",
            badge: <Badge color="yellow">CONFIDENCIAL</Badge>,
            desc: "Dados pessoais e conteúdo de negócio do usuário. Exposição causa dano significativo ao titular.",
            impact: "Impacto de exposição: Alto — dever de notificação à ANPD",
            examples: [
              "Nome, e-mail e perfil do usuário (Clerk)",
              "Briefings de produto (ideias de negócio do founder)",
              "Artefatos gerados de IA (Lean Canvas, PRD, Threat Model, etc.)",
              "Tickets de suporte e seu conteúdo",
              "Notificações in-app",
              "Status e fase atual de projetos",
            ],
            controls: [
              "Acesso restrito ao próprio usuário (clerkId = userId)",
              "TLS 1.3 em trânsito + AES-256 em repouso",
              "Nunca logado em arquivos de log",
              "Isolamento por tenant enforçado em todas as queries",
              "Não enviado a terceiros exceto OpenAI (com DPA)",
            ],
          },
          {
            level: "RESTRITO",
            color: "border-red-400 bg-red-50 dark:bg-red-900/20",
            badge: <Badge color="red">RESTRITO</Badge>,
            desc: "Dados cuja exposição causa dano grave, irreversível ou com implicações legais severas.",
            impact: "Impacto de exposição: Crítico — incidente de segurança declarado",
            examples: [
              "Segredos de API (STRIPE_SECRET_KEY, CLERK_SECRET_KEY, OPENAI_API_KEY)",
              "SESSION_SECRET e tokens de sessão ativos",
              "STRIPE_WEBHOOK_SECRET",
              "ADMIN_CLERK_IDS e SUPERUSER_CLERK_IDS",
              "DATABASE_URL (string de conexão ao PostgreSQL)",
              "Dados de cartão de crédito (armazenados exclusivamente pelo Stripe)",
            ],
            controls: [
              "Nunca versionados em código (git) — sempre em variáveis de ambiente seguras",
              "Acesso restrito à equipe de engenharia sênior",
              "Rotação obrigatória a cada 90 dias",
              "Auditoria de acesso obrigatória",
              "Alertas de detecção de vazamento ativados (GitHub Secret Scanning)",
              "Zero logs — nunca registrados em nenhum sistema",
            ],
          },
        ].map(({ level, color, badge, desc, impact, examples, controls }) => (
          <div key={level} className={`rounded-2xl border-2 p-6 ${color}`}>
            <div className="flex items-center gap-3 mb-3">
              {badge}
              <span className="font-serif font-medium text-foreground text-lg">{level}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">{desc}</p>
            <p className="text-xs font-semibold text-muted-foreground mb-4">{impact}</p>

            <div className="mb-4">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Exemplos</p>
              <ul className="space-y-1">
                {examples.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="mt-0.5">→</span>{e}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Controles obrigatórios</p>
              <ul className="space-y-1">
                {controls.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="mt-0.5 text-green-600">✓</span>{c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <SectionCard title="Matriz de Acesso por Classificação">
        <Table
          headers={["Classificação", "Usuário anônimo", "Usuário autenticado", "Admin", "Superuser", "Sistema (API)"]}
          rows={[
            [<Badge color="green">PÚBLICO</Badge>,   "✅ Leitura", "✅ Leitura", "✅ Leitura", "✅ Leitura", "✅ Leitura"],
            [<Badge color="blue">INTERNO</Badge>,    "❌ Negado",  "❌ Negado",  "✅ Leitura + Escrita", "✅ Total", "✅ Leitura"],
            [<Badge color="yellow">CONFIDENCIAL</Badge>, "❌ Negado", "✅ Só seus dados", "✅ Leitura (auditado)", "✅ Total (auditado)", "✅ Só para o titular"],
            [<Badge color="red">RESTRITO</Badge>,    "❌ Negado",  "❌ Negado",  "❌ Negado", "❌ Negado", "✅ Runtime apenas"],
          ]}
        />
      </SectionCard>
    </div>
  );
}

function ThreatModelTab() {
  const threats = [
    {
      category: "S — Spoofing",
      color: "border-purple-400",
      badge: <Badge color="purple">SPOOFING</Badge>,
      threats: [
        {
          threat: "Roubo de token JWT / session hijacking",
          asset: "Sessão do usuário (Clerk)",
          vetores: "XSS em componentes de terceiros, rede insegura, phishing",
          impacto: "Alto — acesso total à conta do usuário e todos os seus projetos",
          mitigacoes: [
            "Clerk gerencia tokens com rotação automática e short-lived JWTs",
            "HTTPS obrigatório em produção (TLS 1.3) — Replit enforça",
            "HttpOnly cookies — não acessíveis via JavaScript",
            "Content Security Policy (CSP) recomendado como próximo passo",
          ],
          residual: <Badge color="yellow">BAIXO</Badge>,
        },
        {
          threat: "Impersonação de usuário via Clerk ID manipulado",
          asset: "Autenticação e autorização",
          vetores: "Modificação manual de requisições HTTP com clerkId de outro usuário",
          impacto: "Crítico — acesso a projetos e dados de outros founders",
          mitigacoes: [
            "clerkId sempre extraído do token JWT verificado pelo Clerk SDK — nunca do body da requisição",
            "Todas as queries filtram por AND(clerkId = userId autenticado)",
            "Middleware Clerk verifica assinatura do token em cada requisição",
          ],
          residual: <Badge color="green">MÍNIMO</Badge>,
        },
      ],
    },
    {
      category: "T — Tampering",
      color: "border-orange-400",
      badge: <Badge color="yellow">TAMPERING</Badge>,
      threats: [
        {
          threat: "Prompt injection no briefing do projeto",
          asset: "Pipeline de geração de IA (OpenAI GPT-4.1)",
          vetores: "Usuário insere instruções maliciosas no briefing para manipular output da IA",
          impacto: "Médio — conteúdo indesejado nos artefatos; sem acesso a dados de terceiros",
          mitigacoes: [
            "Briefing é injetado como dado de usuário (user message), não como instrução de sistema",
            "System prompt define comportamento rígido e scope dos artefatos",
            "Outputs são armazenados por usuário isoladamente — sem crossover entre tenants",
            "Mitigação completa via OpenAI Moderations API — recomendado como próximo passo",
          ],
          residual: <Badge color="yellow">MÉDIO</Badge>,
        },
        {
          threat: "Manipulação de artefatos via PATCH direto na API",
          asset: "Artefatos gerados (phase_artifacts)",
          vetores: "Usuário chama PATCH /artifacts com conteúdo malicioso ou adulterado",
          impacto: "Baixo — afeta apenas os próprios dados do usuário",
          mitigacoes: [
            "Validação Zod em todos os inputs do body (UpdateArtifactBody)",
            "Queries filtram por clerkId — usuário só edita seus próprios artefatos",
            "Sem execução de código no conteúdo armazenado",
          ],
          residual: <Badge color="green">MÍNIMO</Badge>,
        },
        {
          threat: "Bypass de limite de projetos por plano via API",
          asset: "Limites de plano (maxProjects)",
          vetores: "Chamada direta à API POST /projects sem passar pela UI",
          impacto: "Médio — uso além do plano pago sem cobrança adicional",
          mitigacoes: [
            "Backend verifica COUNT(projects WHERE clerkId=userId) antes de inserir",
            "Retorna 403 com código PROJECT_LIMIT_REACHED se limite atingido",
            "Verificação atômica no banco — não passível de race condition",
          ],
          residual: <Badge color="green">MÍNIMO</Badge>,
        },
      ],
    },
    {
      category: "R — Repudiation",
      color: "border-gray-400",
      badge: <Badge color="gray">REPUDIATION</Badge>,
      threats: [
        {
          threat: "Ação admin sem trilha de auditoria",
          asset: "Operações administrativas (promoção de usuário, alteração de plano)",
          vetores: "Admin altera plano ou promove usuário sem registro rastreável",
          impacto: "Médio — impossibilidade de reconstruir histórico de mudanças",
          mitigacoes: [
            "Logs de servidor via pino registram todas as requisições com IP, userId e timestamp",
            "Audit log dedicado para ações admin — recomendado como próximo passo",
            "PostgreSQL retém timestamps de criação/atualização em todas as tabelas",
          ],
          residual: <Badge color="yellow">MÉDIO</Badge>,
        },
      ],
    },
    {
      category: "I — Information Disclosure",
      color: "border-blue-400",
      badge: <Badge color="blue">INFO DISCLOSURE</Badge>,
      threats: [
        {
          threat: "Vazamento de briefing entre tenants (cross-tenant data leak)",
          asset: "Briefings e artefatos dos founders (CONFIDENCIAL)",
          vetores: "Bug em query sem filtro de clerkId expõe dados de outro usuário",
          impacto: "Crítico — exposição de segredos de negócio de terceiros",
          mitigacoes: [
            "Todas as queries de leitura incluem AND(clerkId = userId autenticado)",
            "Testes de isolamento de tenant em todos os endpoints",
            "Unique constraint e índice em projects.clerk_id previne colisões",
          ],
          residual: <Badge color="green">MÍNIMO</Badge>,
        },
        {
          threat: "Exposição de variáveis de ambiente / secrets em logs",
          asset: "Credenciais RESTRITO (API keys, DATABASE_URL)",
          vetores: "console.log acidental, error stacks retornados ao cliente",
          impacto: "Crítico — comprometimento total da infraestrutura",
          mitigacoes: [
            "Política: nunca usar console.log no código servidor — apenas req.log / logger (pino)",
            "Erros retornam mensagem genérica ao cliente, detalhes apenas no log do servidor",
            "GitHub Secret Scanning ativo no repositório",
            "Variáveis de ambiente gerenciadas via Replit Secrets — nunca em .env commitado",
          ],
          residual: <Badge color="green">MÍNIMO</Badge>,
        },
      ],
    },
    {
      category: "D — Denial of Service",
      color: "border-red-400",
      badge: <Badge color="red">DENIAL OF SERVICE</Badge>,
      threats: [
        {
          threat: "Burst de requisições no endpoint de geração de IA",
          asset: "Orçamento OpenAI + disponibilidade do serviço",
          vetores: "Usuário (ou script) dispara múltiplas execuções simultâneas de geração",
          impacto: "Alto — custo de API não planejado + degradação do serviço para outros usuários",
          mitigacoes: [
            "Rate limit global: 300 req/15min por IP (express-rate-limit)",
            "Rate limit específico de IA: 6 execuções/minuto por IP",
            "Limite diário por plano enforçado atomicamente (UPDATE ... WHERE usage < limit)",
            "Superusers têm limite separado e não afetam outros usuários",
          ],
          residual: <Badge color="yellow">BAIXO</Badge>,
        },
        {
          threat: "Sobrecarga do banco de dados via queries sem índice",
          asset: "PostgreSQL (disponibilidade da plataforma)",
          vetores: "Alto volume de usuários com queries full table scan em tabelas grandes",
          impacto: "Médio — lentidão progressiva conforme crescimento",
          mitigacoes: [
            "Índices criados em: projects.clerk_id, phases.project_id, phase_artifacts.phase_id, notifications.user_id, support_tickets.user_id",
            "Unique constraints em phases(project_id, phase_number) e phase_artifacts(phase_id, artifact_key)",
            "Connection pooling via Drizzle + node-postgres",
          ],
          residual: <Badge color="green">BAIXO</Badge>,
        },
      ],
    },
    {
      category: "E — Elevation of Privilege",
      color: "border-yellow-400",
      badge: <Badge color="yellow">ELEV. PRIVILEGE</Badge>,
      threats: [
        {
          threat: "Escalação para admin via manipulação de isAdmin no payload",
          asset: "Permissões administrativas",
          vetores: "Usuário envia isAdmin=true no body de uma requisição",
          impacto: "Crítico — acesso total ao painel admin e dados de todos os usuários",
          mitigacoes: [
            "isAdmin e isSuperuser são lidos exclusivamente do banco, nunca do request body",
            "requireAdmin verifica o banco em cada requisição — sem cache de permissão",
            "Promoção a admin somente via env var ADMIN_CLERK_IDS ou UPDATE direto no DB por DBA",
          ],
          residual: <Badge color="green">MÍNIMO</Badge>,
        },
        {
          threat: "Acesso a funcionalidades de plano superior sem pagamento",
          asset: "Controle de acesso por plano (canDownload, hasAiAdvisor, maxProjects)",
          vetores: "Chamada direta à API de funcionalidades premium sem plano correspondente",
          impacto: "Médio — uso sem receita correspondente",
          mitigacoes: [
            "Verificação de plano no backend: getPlanConfig(user.plan) em routes protegidas",
            "hasAiAdvisor verificado no servidor em /advisor",
            "maxProjects verificado no servidor em POST /projects",
            "canDownload/canCopy/canPrint — recomendado enforçar no servidor (próximo passo)",
          ],
          residual: <Badge color="yellow">MÉDIO</Badge>,
        },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-muted-foreground leading-relaxed mb-2">
          Threat Model usando metodologia <strong className="text-foreground">STRIDE</strong> (Microsoft) aplicado
          à plataforma FoundersFlow. Cada categoria analisa ameaças relevantes ao contexto de uma plataforma SaaS
          multi-tenant com geração de IA e processamento de dados pessoais.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="text-xs text-muted-foreground">Nível de risco residual:</span>
          <Badge color="red">CRÍTICO</Badge>
          <Badge color="yellow">MÉDIO</Badge>
          <Badge color="blue">BAIXO</Badge>
          <Badge color="green">MÍNIMO</Badge>
        </div>
      </div>

      {threats.map(({ category, color, badge, threats: tList }) => (
        <div key={category} className={`rounded-2xl border-2 ${color} overflow-hidden`}>
          <div className="px-6 py-4 bg-card/50 border-b border-card-border flex items-center gap-3">
            {badge}
            <h3 className="font-serif font-medium text-foreground">{category}</h3>
          </div>
          <div className="divide-y divide-card-border">
            {tList.map((t, i) => (
              <div key={i} className="p-6 bg-card">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-semibold text-foreground mb-1">{t.threat}</p>
                    <p className="text-xs text-muted-foreground">
                      <strong>Ativo em risco:</strong> {t.asset}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="text-xs text-muted-foreground mb-1 text-right">Risco residual</div>
                    {t.residual}
                  </div>
                </div>
                <div className="mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Vetores de ataque</p>
                  <p className="text-sm text-muted-foreground">{t.vetores}</p>
                </div>
                <div className="mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Impacto potencial</p>
                  <p className="text-sm text-muted-foreground">{t.impacto}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Mitigações implementadas</p>
                  <ul className="space-y-1">
                    {t.mitigacoes.map((m, mi) => (
                      <li key={mi} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-0.5 text-green-500 flex-shrink-0">✓</span>{m}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function IncidentesTab() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-muted-foreground leading-relaxed">
          Este plano define os procedimentos de resposta a incidentes de segurança e privacidade da FoundersFlow,
          conforme exigido pelo Art. 48 da LGPD (notificação à ANPD em até 72 horas) e boas práticas do
          NIST SP 800-61 (Computer Security Incident Handling Guide).
        </p>
      </div>

      <SectionCard title="1. Classificação de Incidentes">
        <Table
          headers={["Severidade", "Definição", "Exemplos", "Tempo de resposta inicial", "Notificar ANPD?"]}
          rows={[
            [<Badge color="red">P0 — CRÍTICO</Badge>, "Comprometimento confirmado de dados pessoais de usuários ou sistemas de produção", "Vazamento de briefings/artefatos, comprometimento de DATABASE_URL, acesso não autorizado confirmado a dados de terceiros", "Imediato (< 15 min)", "Sim — dentro de 72 horas"],
            [<Badge color="yellow">P1 — ALTO</Badge>, "Vulnerabilidade ativa explorável ou incidente contido mas com risco de escalada", "Webhook Stripe sem assinatura, endpoint admin exposto sem auth, secret key em log", "< 1 hora", "Avaliar caso a caso"],
            [<Badge color="blue">P2 — MÉDIO</Badge>, "Anomalia de segurança sem comprometimento confirmado", "Pico anormal de requisições, tentativa de brute-force detectada, usuário relatando comportamento suspeito", "< 4 horas", "Não (salvo escalar para P1)"],
            [<Badge color="green">P3 — BAIXO</Badge>, "Vulnerabilidade teórica ou de baixo impacto, sem exploração ativa", "Falta de header de segurança, dependência com CVE de baixa criticidade", "< 48 horas", "Não"],
          ]}
        />
      </SectionCard>

      <SectionCard title="2. Fluxo de Resposta a Incidentes">
        <div className="space-y-4">
          {[
            {
              step: "1", title: "DETECÇÃO", time: "T+0",
              color: "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700",
              actions: [
                "Monitorar alertas de logs do servidor (pino) em busca de padrões anômalos",
                "Verificar métricas de rate limiting (picos de 429) e erros 500 em série",
                "Investigar relatórios de usuários via tickets de suporte (/atendimento)",
                "Executar scan de secrets vazados: GitHub Secret Scanning + verificação manual de logs recentes",
              ],
            },
            {
              step: "2", title: "CONTENÇÃO", time: "T+0 a T+1h",
              color: "bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700",
              actions: [
                "P0/P1: Revogar imediatamente chaves comprometidas (Stripe, OpenAI, Clerk) e gerar novas",
                "P0: Considerar colocar a plataforma em modo de manutenção para conter propagação",
                "Revogar sessões ativas suspeitas via Clerk Dashboard",
                "Bloquear IPs/ranges maliciosos na configuração do proxy",
                "Preservar logs e evidências: não apagar nada antes de documentar",
                "Isolar o componente comprometido se possível (ex: desabilitar rota específica)",
              ],
            },
            {
              step: "3", title: "ANÁLISE & ERADICAÇÃO", time: "T+1h a T+24h",
              color: "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700",
              actions: [
                "Identificar root cause: revisar logs de acesso, diff de código, histórico de deploys",
                "Determinar escopo exato: quais usuários foram afetados? Quais dados? Qual período?",
                "Corrigir a vulnerabilidade no código e fazer deploy com validação",
                "Revogar e regenerar TODOS os segredos potencialmente comprometidos",
                "Executar scan de segurança completo (SAST + dependency audit) antes de reabrir",
                "Documentar linha do tempo completa do incidente",
              ],
            },
            {
              step: "4", title: "RECUPERAÇÃO", time: "T+24h a T+72h",
              color: "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700",
              actions: [
                "Restaurar serviço de forma gradual com monitoramento intensivo",
                "Verificar integridade do banco de dados — confirmar que dados não foram alterados",
                "Comunicar usuários afetados com linguagem clara: o que aconteceu, o que foi feito, o que devem fazer",
                "Notificar ANPD (se P0): portal gov.br/anpd dentro de 72h do conhecimento do incidente",
                "Preparar relatório de incidente para registro interno",
              ],
            },
            {
              step: "5", title: "PÓS-INCIDENTE", time: "T+72h a T+2 semanas",
              color: "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700",
              actions: [
                "Realizar reunião de post-mortem blameless (sem culpados, foco em sistemas)",
                "Documentar lições aprendidas e ações corretivas no backlog de segurança",
                "Atualizar este plano de resposta com base nos aprendizados",
                "Revisar e atualizar o Threat Model se novas ameaças foram descobertas",
                "Considerar comunicação proativa com a comunidade (disclosure responsável)",
              ],
            },
          ].map(({ step, title, time, color, actions }) => (
            <div key={step} className={`rounded-xl border p-5 ${color}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {step}
                </div>
                <div>
                  <span className="font-serif font-semibold text-foreground">{title}</span>
                  <span className="ml-3 text-xs text-muted-foreground font-mono">{time}</span>
                </div>
              </div>
              <ul className="space-y-1.5 ml-11">
                {actions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-0.5 flex-shrink-0">→</span>{a}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="3. Obrigações Legais — LGPD Art. 48">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
              Obrigação de Notificação (LGPD Art. 48 + Resolução ANPD CD/ANPD nº 2/2022)
            </p>
            <p className="text-sm text-muted-foreground">
              Em caso de incidente de segurança que possa acarretar risco ou dano relevante aos titulares,
              a FoundersFlow deve notificar a <strong>ANPD</strong> (Autoridade Nacional de Proteção de Dados)
              e os <strong>titulares afetados</strong> em prazo razoável — recomendado até <strong>72 horas</strong> do
              conhecimento do incidente.
            </p>
          </div>
          <Table
            headers={["Canal de notificação", "Destinatário", "Prazo", "Informações obrigatórias"]}
            rows={[
              ["Portal gov.br/anpd → Comunicação de Incidentes", "ANPD", "≤ 72h do conhecimento", "Data/hora, natureza dos dados afetados, titulares afetados, medidas tomadas, contato do DPO"],
              ["E-mail transacional (via Clerk)", "Usuários afetados", "≤ 72h (junto à ANPD)", "O que ocorreu, quais dados foram expostos, o que devem fazer (trocar senha, monitorar extratos)"],
              ["Página de status / banner no app", "Todos os usuários", "Assim que confirmado", "Comunicado geral sem expor detalhes técnicos do vetor"],
            ]}
          />
        </div>
      </SectionCard>

      <SectionCard title="4. Contatos de Emergência">
        <Table
          headers={["Papel", "Contato", "Quando acionar"]}
          rows={[
            ["DPO / Encarregado LGPD", "privacidade@foundersflow.com.br", "Todo incidente P0 ou P1 — responsável pela notificação à ANPD"],
            ["Engenharia (on-call)", "Canal #incidentes (Slack interno)", "Todo incidente P0 ou P1 imediatamente"],
            ["Stripe Support", "dashboard.stripe.com → Support", "Incidentes envolvendo webhooks ou dados de pagamento"],
            ["Clerk Support", "clerk.com/support", "Incidentes envolvendo autenticação ou vazamento de sessões"],
            ["OpenAI Trust & Safety", "openai.com/security", "Incidentes envolvendo dados enviados à API OpenAI"],
            ["ANPD", "gov.br/anpd → Fale conosco", "Notificação obrigatória em incidentes P0 com dados pessoais"],
          ]}
        />
      </SectionCard>
    </div>
  );
}

export function CompliancePage() {
  const [activeTab, setActiveTab] = useState<Tab>("datamap");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link href="/" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
            Início
          </Link>
          <span className="text-muted-foreground text-sm">/</span>
          <Link href="/privacidade" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
            Privacidade & LGPD
          </Link>
          <span className="text-muted-foreground text-sm">/</span>
          <span className="text-foreground text-sm font-medium">Central de Segurança & Compliance</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full mb-4">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Praticamos o que pregamos
          </div>
          <h1 className="text-4xl font-serif text-foreground mb-3">Central de Segurança & Compliance</h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-3xl">
            A FoundersFlow ajuda founders a construir produtos seguros e em conformidade com a LGPD.
            Esta página documenta como aplicamos esses mesmos princípios em nós mesmos —
            com os 4 artefatos da nossa própria Fase 3.
          </p>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Conformidade", value: "LGPD + GDPR", color: "text-primary" },
              { label: "Criptografia", value: "TLS 1.3 + AES-256", color: "text-green-600" },
              { label: "Auth", value: "Clerk · SOC 2 Type II", color: "text-primary" },
              { label: "Última revisão", value: "Maio 2026", color: "text-muted-foreground" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-card border border-card-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className={`text-sm font-semibold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-secondary/50 p-1.5 rounded-2xl">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm border border-card-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div>
          {activeTab === "datamap"       && <DataMapTab />}
          {activeTab === "classificacao" && <ClassificacaoTab />}
          {activeTab === "threatmodel"   && <ThreatModelTab />}
          {activeTab === "incidentes"    && <IncidentesTab />}
        </div>

        {/* Footer note */}
        <div className="mt-12 pt-8 border-t border-card-border">
          <p className="text-xs text-muted-foreground text-center">
            Este documento é revisado a cada 6 meses ou após qualquer incidente de segurança.
            Dúvidas ou sugestões: <a href="mailto:privacidade@foundersflow.com.br" className="text-primary hover:underline">privacidade@foundersflow.com.br</a>
            &nbsp;·&nbsp;
            <Link href="/privacidade" className="text-primary hover:underline">Política de Privacidade completa</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
