import type { ReactNode } from "react";
import { ArtifactBody } from "../artifact-body";

// ───────────────────────── Helpers compartilhados entre canvases ─────────────────────────

export function parseJsonBlock<T = Record<string, unknown>>(content: string): T | null {
  try {
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) return JSON.parse(jsonMatch[1]) as T;
    const t = content.trim();
    if (t.startsWith("{")) return JSON.parse(t) as T;
  } catch { /* fall through */ }
  return null;
}

export function Fallback({ content }: { content: string }) {
  return <ArtifactBody content={content} />;
}

export function Attribution({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] text-muted-foreground mt-4 pt-3 border-t border-border/60 italic">
      {children}
    </p>
  );
}

export function replaceJsonBlock(original: string, newJson: object): string {
  const pretty = "```json\n" + JSON.stringify(newJson, null, 2) + "\n```";
  // Only replace fences whose contents parse as JSON (avoids corrupting unrelated code blocks)
  const fenceRe = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/g;
  let replaced = false;
  const out = original.replace(fenceRe, (match, body) => {
    if (replaced) return match;
    try { JSON.parse(body); replaced = true; return pretty; }
    catch { return match; }
  });
  if (replaced) return out;
  const trimmed = original.trim();
  if (trimmed.startsWith("{")) {
    try { JSON.parse(trimmed); return pretty; } catch { /* fall through */ }
  }
  return original.trim() ? `${original.trim()}\n\n${pretty}\n` : pretty;
}

export function clampNonNeg(n: number, max?: number): number {
  if (!isFinite(n) || n < 0) return 0;
  if (max != null && n > max) return max;
  return n;
}

export function fmtBRLmes(n: number): string {
  return `R$ ${Math.round(n).toLocaleString("pt-BR")}/mês`;
}

export function parseBrlFromStr(s?: string): number | null {
  if (!s) return null;
  const cleaned = s.replace(/r\$/gi, "").replace(/\./g, "").replace(",", ".").trim();
  const m = cleaned.match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}
