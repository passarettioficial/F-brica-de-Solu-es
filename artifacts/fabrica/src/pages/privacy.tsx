import { Link } from "wouter";

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link href="/" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
            Início
          </Link>
          <span className="text-muted-foreground text-sm">/</span>
          <span className="text-foreground text-sm font-medium">Privacidade e LGPD</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full mb-4">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            LGPD Compliant
          </div>
          <h1 className="text-4xl font-serif text-foreground mb-3">Política de Privacidade</h1>
          <p className="text-muted-foreground">Atualizada em Janeiro de 2025 · Conforme a Lei 13.709/2018 (LGPD)</p>
        </div>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground prose-headings:text-foreground">

          <section className="bg-card border border-card-border rounded-2xl p-6">
            <h2 className="font-serif text-xl mb-3">1. Quem somos</h2>
            <p className="text-muted-foreground leading-relaxed">
              A FoundersFlow é uma plataforma de inteligência artificial para founders e empreendedores,
              que os ajuda a estruturar, validar e lançar produtos digitais através de um processo de 7 fases guiado por IA.
              Atuamos como Controlador de Dados Pessoais conforme definido pela LGPD.
            </p>
          </section>

          <section className="bg-card border border-card-border rounded-2xl p-6">
            <h2 className="font-serif text-xl mb-3">2. Dados que coletamos</h2>
            <div className="space-y-3 text-muted-foreground">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-xs font-bold">1</span>
                </div>
                <div>
                  <strong className="text-foreground">Dados de conta:</strong> nome de exibição, endereço de e-mail, identificador de autenticação (via Clerk). Finalidade: identificação e acesso à plataforma.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-xs font-bold">2</span>
                </div>
                <div>
                  <strong className="text-foreground">Dados de uso:</strong> projetos criados, artefatos gerados, uso de IA. Finalidade: prestação do serviço e melhoria da plataforma.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-xs font-bold">3</span>
                </div>
                <div>
                  <strong className="text-foreground">Dados de pagamento:</strong> gerenciados exclusivamente pela Stripe (PCI-DSS nível 1). Não armazenamos dados de cartão de crédito.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-xs font-bold">4</span>
                </div>
                <div>
                  <strong className="text-foreground">Chamados de suporte:</strong> assunto e mensagem enviados para nossa equipe. Finalidade: resolução de dúvidas e problemas.
                </div>
              </div>
            </div>
          </section>

          <section className="bg-card border border-card-border rounded-2xl p-6">
            <h2 className="font-serif text-xl mb-3">3. Segurança e criptografia</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              {[
                { icon: "🔒", title: "Criptografia em trânsito", desc: "TLS 1.3 em todas as comunicações entre cliente e servidor." },
                { icon: "🗄️", title: "Criptografia em repouso", desc: "Banco de dados PostgreSQL com criptografia de dados sensíveis." },
                { icon: "🔑", title: "Autenticação segura", desc: "Gerenciada pela Clerk com suporte a MFA e OAuth." },
                { icon: "🌐", title: "Infraestrutura segura", desc: "Hospedagem em data centers certificados com monitoramento 24/7." },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 bg-muted/30 rounded-xl p-3">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <div className="font-medium text-foreground text-xs mb-0.5">{item.title}</div>
                    <div className="text-xs">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-card border border-card-border rounded-2xl p-6">
            <h2 className="font-serif text-xl mb-3">4. Seus direitos (LGPD, Art. 18)</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              {[
                ["Acesso", "Solicitar confirmação e acesso aos seus dados pessoais."],
                ["Correção", "Corrigir dados incompletos, inexatos ou desatualizados."],
                ["Anonimização", "Solicitar anonimização, bloqueio ou eliminação de dados desnecessários."],
                ["Portabilidade", "Receber seus dados em formato estruturado e legível por máquina."],
                ["Eliminação", "Solicitar a exclusão dos seus dados pessoais da plataforma."],
                ["Revogação", "Revogar o consentimento para tratamento de dados a qualquer momento."],
              ].map(([right, desc]) => (
                <div key={right} className="flex items-start gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5 text-primary">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span><strong className="text-foreground">{right}:</strong> {desc}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-xs text-muted-foreground">
                Para exercer seus direitos, abra um chamado na categoria "Privacidade e LGPD" em{" "}
                <Link href="/atendimento" className="text-primary hover:underline">nossa página de suporte</Link>{" "}
                ou contate nosso Encarregado de Dados (DPO) via WhatsApp.
              </p>
            </div>
          </section>

          <section className="bg-card border border-card-border rounded-2xl p-6">
            <h2 className="font-serif text-xl mb-3">5. Compartilhamento de dados</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Não vendemos ou compartilhamos seus dados pessoais com terceiros para fins comerciais.
              Apenas compartilhamos dados com:
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" /><strong className="text-foreground">Clerk:</strong> autenticação e gestão de sessões</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" /><strong className="text-foreground">Stripe:</strong> processamento de pagamentos (dados financeiros apenas)</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" /><strong className="text-foreground">Anthropic:</strong> geração de conteúdo por IA (apenas o conteúdo do prompt)</li>
            </ul>
          </section>

          <section className="bg-card border border-card-border rounded-2xl p-6">
            <h2 className="font-serif text-xl mb-3">6. Retenção de dados</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Seus dados são mantidos enquanto sua conta estiver ativa. Após o cancelamento da conta,
              os dados são anonimizados em até 30 dias, exceto onde obrigados por lei a manter por período maior.
              Você pode solicitar exclusão imediata abrindo um chamado LGPD.
            </p>
          </section>

          <section className="bg-card border border-card-border rounded-2xl p-6">
            <h2 className="font-serif text-xl mb-3">7. Contato</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Para qualquer questão relacionada à privacidade ou exercício dos seus direitos LGPD:
            </p>
            <div className="grid gap-2 text-sm mb-4">
              <div>
                <strong className="text-foreground">Contato geral:</strong>{" "}
                <a href="mailto:contato@foundersflow.com.br" className="text-primary hover:underline">contato@foundersflow.com.br</a>
              </div>
              <div>
                <strong className="text-foreground">Encarregado (DPO):</strong>{" "}
                <a href="mailto:privacidade@foundersflow.com.br" className="text-primary hover:underline">privacidade@foundersflow.com.br</a>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Link href="/atendimento">
                <button className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                  Abrir chamado LGPD
                </button>
              </Link>
              <a
                href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER ?? "5511999999999"}?text=${encodeURIComponent("Olá! Quero exercer meus direitos LGPD.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                WhatsApp
              </a>
            </div>
          </section>

          <section className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <h2 className="font-serif text-xl mb-2">Central de Segurança & Compliance</h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Acesse a documentação técnica completa de segurança da FoundersFlow: Mapa de Dados (RAT),
                  Classificação de Dados, Threat Model STRIDE e Plano de Resposta a Incidentes.
                  Praticamos o que ensinamos.
                </p>
                <Link href="/compliance" className="inline-flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                  Ver documentação de compliance
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
