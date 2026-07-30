import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { ArtifactBody } from "@/components/artifact-body";
import { PHASES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { CoherenceGauge } from "@/components/coherence-gauge";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

type SharedArtifact = { artifactKey: string; content: string };
type SharedPhase = { phaseNumber: number; status: string; artifacts: SharedArtifact[] };
type SharedProject = {
  name: string;
  briefing: string;
  currentPhase: number;
  coherenceScore: number | null;
  marketPotentialScore: number | null;
  sharedAt: string | null;
  createdAt: string;
  phases: SharedPhase[];
};

const ARTIFACT_LABELS: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const phase of PHASES as any[]) {
    for (const a of (phase.artifacts ?? [])) map[a.key] = a.label;
  }
  return map;
})();

export function PublicSharePage() {
  const params = useParams<{ shareId: string }>();
  const shareId = params.shareId;
  const [data, setData] = useState<SharedProject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhase, setActivePhase] = useState<number>(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${basePath}/api/public/projects/${shareId}`)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body?.error || "Não foi possível carregar este projeto.");
        }
        return r.json() as Promise<SharedProject>;
      })
      .then((d) => {
        if (cancelled) return;
        setData(d);
        const firstWithArtifacts = d.phases.find((p) => p.artifacts.length > 0);
        setActivePhase(firstWithArtifacts?.phaseNumber ?? d.currentPhase ?? 1);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Carregando projeto compartilhado…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 px-6 text-center">
        <h1 className="text-2xl font-serif text-foreground">Projeto não disponível</h1>
        <p className="text-sm text-muted-foreground max-w-md">{error || "O link pode ter sido revogado pelo autor."}</p>
        <Link href="/landing">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Conhecer a FoundersFlow</Button>
        </Link>
      </div>
    );
  }

  const phase = data.phases.find((p) => p.phaseNumber === activePhase);
  const completedCount = data.phases.filter((p) => p.status === "completed").length;
  const progressPct = Math.round((completedCount / 7) * 100);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{data.name} — FoundersFlow</title>
        <meta name="description" content={`Plano de produto: ${data.name}`} />
        <meta name="robots" content="noindex, nofollow, noarchive" />
      </Helmet>

      {/* Public header */}
      <header className="border-b border-card-border bg-card/60 backdrop-blur sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link href="/landing" className="flex items-center gap-2">
            <img src={`${basePath}/logo.png`} alt="FoundersFlow" className="h-7 w-7 rounded" />
            <span className="text-sm font-serif font-medium text-foreground">FoundersFlow</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-muted-foreground font-mono uppercase tracking-wider">Modo leitura</span>
            <Link href="/sign-up">
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">Criar meu plano</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Title + meta */}
        <div className="mb-8">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Plano compartilhado</p>
          <h1 className="text-3xl md:text-4xl font-serif tracking-tight text-foreground mb-3">{data.name}</h1>
          {data.briefing && (
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-3xl whitespace-pre-wrap">
              {data.briefing}
            </p>
          )}
          <div className="flex items-center flex-wrap gap-6 mt-4">
            {data.coherenceScore != null && (
              <div className="flex items-center gap-2">
                <CoherenceGauge score={data.coherenceScore} variant="coherence" size={64} />
                <span className="text-xs text-muted-foreground">Coerência</span>
              </div>
            )}
            {data.marketPotentialScore != null && (
              <div className="flex items-center gap-2">
                <CoherenceGauge score={data.marketPotentialScore} variant="potential" size={64} />
                <span className="text-xs text-muted-foreground">Potencial</span>
              </div>
            )}
            <span className="text-xs text-muted-foreground">{completedCount} de 7 fases concluídas</span>
          </div>
        </div>

        {/* Progress */}
        <div className="w-full bg-muted rounded-full h-2 mb-8">
          <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
        </div>

        {/* Phase tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-card-border pb-3">
          {data.phases.map((p) => {
            const def = PHASES[p.phaseNumber - 1] as any;
            const hasContent = p.artifacts.length > 0;
            const isActive = activePhase === p.phaseNumber;
            return (
              <button
                key={p.phaseNumber}
                onClick={() => setActivePhase(p.phaseNumber)}
                disabled={!hasContent}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : hasContent
                    ? "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                    : "text-muted-foreground/50 cursor-not-allowed"
                }`}
              >
                {p.phaseNumber}. {def?.name ?? `Fase ${p.phaseNumber}`}
              </button>
            );
          })}
        </div>

        {/* Phase content */}
        {phase && phase.artifacts.length > 0 ? (
          <div className="space-y-6">
            {phase.artifacts.map((a, i) => (
              <article key={i} className="bg-card border border-card-border rounded-2xl p-6">
                <h2 className="text-lg font-serif text-foreground mb-4">
                  {ARTIFACT_LABELS[a.artifactKey] ?? a.artifactKey}
                </h2>
                <ArtifactBody content={a.content} />
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground text-sm">
            Esta fase ainda não tem entregáveis gerados.
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-16 border-t border-card-border pt-10 text-center">
          <p className="text-sm text-muted-foreground mb-4">Gere seu próprio plano de produto com IA em minutos.</p>
          <Link href="/sign-up">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">Começar grátis</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
