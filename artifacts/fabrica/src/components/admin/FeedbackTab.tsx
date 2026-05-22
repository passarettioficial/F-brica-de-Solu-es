import { useEffect, useState } from "react";
import { api } from "./shared";

interface ByArtifact {
  phaseNumber: number;
  artifactKey: string;
  up: number;
  down: number;
  total: number;
  comments: number;
  score: number | null;
  lastAt: string | null;
}
interface RecentComment {
  phaseNumber: number;
  artifactKey: string;
  rating: "up" | "down";
  comment: string;
  updatedAt: string;
}
interface Stats {
  byArtifact: ByArtifact[];
  recentComments: RecentComment[];
}

const PHASE_NAMES = ["Ideia", "PRD", "Segurança & LGPD", "Spec", "Implementação", "Teste", "Deploy"];

function scoreColor(score: number | null, total: number): string {
  if (score == null || total < 3) return "text-muted-foreground";
  if (score >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
  } catch {
    return "—";
  }
}

export function FeedbackTab() {
  const [data, setData] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"problemas" | "volume" | "fase">("problemas");

  useEffect(() => {
    api("/admin/feedback-stats")
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: Stats) => setData(d))
      .catch((e) => setErr(e instanceof Error ? e.message : "Erro"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-muted-foreground text-sm py-8">Carregando feedback...</div>;
  if (err || !data) return <div className="text-destructive text-sm py-8">Erro ao carregar feedback ({err})</div>;

  const rows = [...data.byArtifact];
  const tieBreak = (a: ByArtifact, b: ByArtifact) =>
    a.phaseNumber - b.phaseNumber || a.artifactKey.localeCompare(b.artifactKey);
  if (sortBy === "problemas") {
    rows.sort((a, b) => b.down - a.down || b.total - a.total || tieBreak(a, b));
  } else if (sortBy === "volume") {
    rows.sort((a, b) => b.total - a.total || tieBreak(a, b));
  } else {
    rows.sort(tieBreak);
  }

  const totalVotes = data.byArtifact.reduce((s, r) => s + r.total, 0);
  const totalDown = data.byArtifact.reduce((s, r) => s + r.down, 0);
  const totalUp = data.byArtifact.reduce((s, r) => s + r.up, 0);
  const overallScore = totalVotes > 0 ? Math.round((totalUp / totalVotes) * 100) : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl text-foreground">Feedback de artefatos</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Thumbs up/down enviados pelos usuários por artefato. Use os 👎 com comentário para iterar prompts em <code>ai.ts</code>.
        </p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Votos</div>
          <div className="text-2xl font-serif text-foreground mt-1">{totalVotes}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">👍 Úteis</div>
          <div className="text-2xl font-serif text-emerald-600 dark:text-emerald-400 mt-1">{totalUp}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">👎 Problemas</div>
          <div className="text-2xl font-serif text-destructive mt-1">{totalDown}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Aprovação</div>
          <div className={`text-2xl font-serif mt-1 ${scoreColor(overallScore, totalVotes)}`}>{overallScore != null ? `${overallScore}%` : "—"}</div>
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-serif text-base text-foreground">Por artefato</h3>
          <div className="flex items-center gap-1">
            {(["problemas", "volume", "fase"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSortBy(s)}
                aria-pressed={sortBy === s}
                aria-label={`Ordenar por ${s}`}
                className={`text-[11px] px-2 py-1 rounded-md border transition-colors ${
                  sortBy === s ? "bg-primary/10 border-primary/40 text-primary" : "bg-background border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                {s === "problemas" ? "+ 👎" : s === "volume" ? "+ Votos" : "Por fase"}
              </button>
            ))}
          </div>
        </div>
        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhum feedback registrado ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border/60">
                  <th className="px-4 py-2 font-medium">Fase</th>
                  <th className="px-4 py-2 font-medium">Artefato</th>
                  <th className="px-4 py-2 font-medium text-right">👍</th>
                  <th className="px-4 py-2 font-medium text-right">👎</th>
                  <th className="px-4 py-2 font-medium text-right">Aprov.</th>
                  <th className="px-4 py-2 font-medium text-right">Coment.</th>
                  <th className="px-4 py-2 font-medium text-right">Último</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.phaseNumber}-${r.artifactKey}`} className="border-b border-border/40 hover:bg-muted/30">
                    <td className="px-4 py-2 text-muted-foreground tabular-nums">
                      F{r.phaseNumber} <span className="text-[11px] text-muted-foreground/70">{PHASE_NAMES[r.phaseNumber - 1] ?? ""}</span>
                    </td>
                    <td className="px-4 py-2 font-mono text-[12px] text-foreground">{r.artifactKey}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{r.up}</td>
                    <td className={`px-4 py-2 text-right tabular-nums ${r.down > 0 ? "text-destructive font-medium" : "text-muted-foreground"}`}>{r.down}</td>
                    <td className={`px-4 py-2 text-right tabular-nums font-medium ${scoreColor(r.score, r.total)}`}>
                      {r.score != null ? `${r.score}%` : "—"}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{r.comments}</td>
                    <td className="px-4 py-2 text-right text-[11px] text-muted-foreground tabular-nums">{formatDate(r.lastAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Comentários recentes */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-serif text-base text-foreground">Comentários recentes</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Últimos 30 — leitura crítica pra iterar prompts.</p>
        </div>
        {data.recentComments.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhum comentário ainda.</div>
        ) : (
          <ul className="divide-y divide-border/40">
            {data.recentComments.map((c, i) => (
              <li key={i} className="px-4 py-3 flex gap-3">
                <span className={`text-lg leading-none mt-0.5 ${c.rating === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                  {c.rating === "up" ? "👍" : "👎"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="font-mono">F{c.phaseNumber} · {c.artifactKey}</span>
                    <span>·</span>
                    <span className="tabular-nums">{formatDate(c.updatedAt)}</span>
                  </div>
                  <p className="text-sm text-foreground mt-0.5 whitespace-pre-wrap break-words">{c.comment}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
