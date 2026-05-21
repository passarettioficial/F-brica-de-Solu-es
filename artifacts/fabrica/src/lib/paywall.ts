export type PaywallReason = {
  limit: number;
  used: number;
  plan: string;
  context?: string | null;
};

type Listener = (reason: PaywallReason) => void;
const listeners = new Set<Listener>();

export function subscribePaywall(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function triggerPaywall(reason: PaywallReason): void {
  for (const fn of listeners) fn(reason);
}

/**
 * Inspect a fetch response. If it is a 429 with AI_LIMIT_EXCEEDED payload, open the paywall modal
 * and return true. Otherwise return false. Caller should treat true as "handled, stop".
 *
 * Pass the already-parsed JSON body (or undefined) to avoid double-reading the stream.
 */
export async function handleAiLimit(res: Response, parsed?: unknown): Promise<boolean> {
  if (res.status !== 429) return false;
  let body: unknown = parsed;
  if (body === undefined) {
    body = await res.clone().json().catch(() => null);
  }
  if (!body || typeof body !== "object") return false;
  const b = body as { code?: string; limit?: number; used?: number; plan?: string; context?: string | null };
  if (b.code !== "AI_LIMIT_EXCEEDED") return false;
  triggerPaywall({
    limit: typeof b.limit === "number" ? b.limit : 0,
    used: typeof b.used === "number" ? b.used : 0,
    plan: typeof b.plan === "string" ? b.plan : "free",
    context: b.context ?? null,
  });
  return true;
}
