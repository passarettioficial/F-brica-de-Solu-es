import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER ?? "5511999999999";

const FAQ = [
  {
    q: "Como funciona o processo de 6 fases?",
    a: "Cada projeto passa por seis fases sequenciais: Ideação, Definição, Especificação, Prototipação, Validação e Deploy. A IA guia você em cada etapa gerando artefatos específicos como PRDs, diagramas, planos de lançamento e muito mais.",
  },
  {
    q: "O que são créditos de IA?",
    a: "Cada execução de fase consome um crédito de IA. O número de créditos diários depende do seu plano: Gratuito (2/dia), Básico (5/dia), Pro (20/dia) e Avançado (ilimitado). Os créditos são renovados automaticamente todo dia à meia-noite.",
  },
  {
    q: "Posso cancelar minha assinatura?",
    a: "Sim. Você pode cancelar a qualquer momento pelo portal de assinaturas em Configurações → Assinatura. O acesso premium continua até o fim do período já pago.",
  },
  {
    q: "Meus dados estão seguros?",
    a: "Sim. Todos os dados são armazenados em banco de dados seguro com criptografia em repouso e em trânsito (TLS). Cumprimos integralmente a LGPD — Lei Geral de Proteção de Dados. Você pode solicitar a exclusão dos seus dados a qualquer momento.",
  },
  {
    q: "Como funciona o AI Advisor?",
    a: "O AI Advisor é um consultor de IA disponível no plano Avançado. Ele lê todos os artefatos dos seus projetos e responde perguntas específicas sobre o seu produto, estratégia, mercado e execução com contexto completo.",
  },
  {
    q: "Posso migrar entre planos?",
    a: "Sim. Você pode fazer upgrade ou downgrade a qualquer momento pela página de Assinatura. Upgrades são imediatos; downgrades entram em vigor no próximo ciclo de faturamento.",
  },
];

const CATEGORIES = [
  { value: "general", label: "Dúvida geral" },
  { value: "billing", label: "Faturamento e planos" },
  { value: "technical", label: "Problema técnico" },
  { value: "lgpd", label: "Privacidade e LGPD" },
];

export function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${basePath}/api/support/tickets`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim(), category }),
      });
      if (res.ok) {
        setSubmitted(true);
        setSubject("");
        setMessage("");
        setCategory("general");
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Erro ao enviar. Tente novamente.");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá! Preciso de ajuda com a Fábrica de Soluções.")}`;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
              Painel
            </Link>
            <span className="text-muted-foreground text-sm">/</span>
            <span className="text-foreground text-sm font-medium">Atendimento</span>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-12">
        {/* Hero */}
        <div className="text-center">
          <h1 className="text-4xl font-serif text-foreground mb-3">Como podemos ajudar?</h1>
          <p className="text-muted-foreground">Nossa equipe está disponível para apoiar o seu crescimento.</p>
        </div>

        {/* Contact channels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-card border border-card-border rounded-2xl p-6 hover:border-[#25D366]/40 hover:shadow-md transition-all group block"
          >
            <div className="w-10 h-10 bg-[#25D366]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#25D366]/20 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <h3 className="font-medium text-foreground mb-1">WhatsApp</h3>
            <p className="text-sm text-muted-foreground">Resposta em até 2 horas em dias úteis</p>
            <span className="text-xs text-[#25D366] font-medium mt-2 block">Abrir conversa →</span>
          </a>

          <div className="bg-card border border-card-border rounded-2xl p-6">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b8461e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h3 className="font-medium text-foreground mb-1">E-mail / Ticket</h3>
            <p className="text-sm text-muted-foreground">Preencha o formulário abaixo e receba a resposta por e-mail</p>
            <span className="text-xs text-primary font-medium mt-2 block">Ver formulário ↓</span>
          </div>

          <div className="bg-card border border-card-border rounded-2xl p-6">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4M12 8h.01"/>
              </svg>
            </div>
            <h3 className="font-medium text-foreground mb-1">Base de Conhecimento</h3>
            <p className="text-sm text-muted-foreground">Perguntas frequentes e tutoriais sobre a plataforma</p>
            <span className="text-xs text-blue-500 font-medium mt-2 block">Ver FAQ ↓</span>
          </div>
        </div>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-serif text-foreground mb-6">Perguntas frequentes</h2>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <div key={i} className="bg-card border border-card-border rounded-xl overflow-hidden">
                <button
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium text-foreground text-sm">{item.q}</span>
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className={`flex-shrink-0 text-muted-foreground transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Contact form */}
        <section>
          <h2 className="text-2xl font-serif text-foreground mb-2">Abrir um chamado</h2>
          <p className="text-sm text-muted-foreground mb-6">Nossa equipe retorna em até 1 dia útil. Os dados do chamado são protegidos conforme a LGPD.</p>

          {submitted ? (
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-3">✓</div>
              <h3 className="font-serif text-lg text-foreground mb-2">Chamado enviado com sucesso!</h3>
              <p className="text-sm text-muted-foreground mb-4">Nossa equipe vai responder em breve.</p>
              <Button variant="outline" onClick={() => setSubmitted(false)}>Abrir outro chamado</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-card border border-card-border rounded-2xl p-6 space-y-4">
              <div>
                <Label htmlFor="category" className="text-sm font-medium">Categoria</Label>
                <select
                  id="category"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="mt-1.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="subject" className="text-sm font-medium">Assunto</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Ex: Não consigo fazer upgrade de plano"
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="support-message" className="text-sm font-medium">Mensagem</Label>
                <Textarea
                  id="support-message"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Descreva sua dúvida ou problema com o máximo de detalhes..."
                  className="mt-1.5 min-h-[120px]"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Seus dados são tratados conforme nossa{" "}
                  <Link href="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>.
                </p>
                <Button
                  type="submit"
                  disabled={submitting || !subject.trim() || !message.trim()}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {submitting ? "Enviando..." : "Enviar chamado"}
                </Button>
              </div>
            </form>
          )}
        </section>

        {/* LGPD notice */}
        <section className="bg-muted/30 border border-border rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-background border border-border rounded-xl flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-1">Segurança e Privacidade (LGPD)</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A Fábrica de Soluções está em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018).
                Seus dados são criptografados em repouso e em trânsito. Você tem direito de acessar, corrigir e excluir
                seus dados a qualquer momento.{" "}
                <Link href="/privacidade" className="text-primary hover:underline">
                  Ver política completa →
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
