import { type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ensureUser } from "./auth";

export async function requireAdmin(req: Request, res: Response): Promise<{ clerkId: string; displayName: string | null; isAdmin: boolean; isSuperuser: boolean } | null> {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  await ensureUser(userId);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));
  if (!user || (!user.isAdmin && !user.isSuperuser)) {
    res.status(403).json({ error: "Acesso negado. Área restrita a administradores." });
    return null;
  }

  return { clerkId: userId, displayName: user.displayName ?? null, isAdmin: user.isAdmin, isSuperuser: user.isSuperuser };
}

/**
 * isAdmin/isSuperuser/plan concedem privilégio (IA irrestrita, bypass de billing).
 * Só superusuários podem alterá-los, e nunca sobre a própria conta — evita
 * auto-promoção (admin comum virando superuser) e auto-concessão de plano pago.
 */
export function checkPrivilegedFieldUpdate(
  admin: { clerkId: string; isSuperuser: boolean },
  targetClerkId: string,
  fields: { plan?: string; isAdmin?: boolean; isSuperuser?: boolean },
): { allowed: true } | { allowed: false; error: string } {
  const grantsPrivilege = fields.plan !== undefined || fields.isAdmin !== undefined || fields.isSuperuser !== undefined;
  if (!grantsPrivilege) return { allowed: true };
  if (!admin.isSuperuser) {
    return { allowed: false, error: "Alterar plano, admin ou superusuário requer privilégio de superusuário." };
  }
  if (targetClerkId === admin.clerkId) {
    return { allowed: false, error: "Não é permitido alterar seu próprio plano ou privilégios administrativos." };
  }
  return { allowed: true };
}
