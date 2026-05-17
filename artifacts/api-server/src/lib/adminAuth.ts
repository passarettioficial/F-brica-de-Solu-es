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
