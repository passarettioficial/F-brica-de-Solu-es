import { Router, type Request, type Response, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, notificationsTable } from "@workspace/db";
import { ensureUser } from "../lib/auth";

const router: IRouter = Router();

function requireAuth(req: Request): string {
  const auth = getAuth(req);
  if (!auth?.userId) throw Object.assign(new Error("Unauthorized"), { status: 401 });
  return auth.userId;
}

// GET /notifications — list user notifications
router.get("/notifications", async (req: Request, res: Response): Promise<void> => {
  let userId: string;
  try { userId = requireAuth(req); } catch { res.status(401).json({ error: "Unauthorized" }); return; }

  await ensureUser(userId);

  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);

  res.json(notifications);
});

// PATCH /notifications/read-all — mark all as read
router.patch("/notifications/read-all", async (req: Request, res: Response): Promise<void> => {
  let userId: string;
  try { userId = requireAuth(req); } catch { res.status(401).json({ error: "Unauthorized" }); return; }

  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.isRead, false)));

  res.json({ ok: true });
});

// PATCH /notifications/:id/read — mark single as read
router.patch("/notifications/:id/read", async (req: Request, res: Response): Promise<void> => {
  let userId: string;
  try { userId = requireAuth(req); } catch { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = parseInt(String(req.params.id ?? "0"));
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)));

  res.json({ ok: true });
});

// DELETE /notifications/:id — delete notification
router.delete("/notifications/:id", async (req: Request, res: Response): Promise<void> => {
  let userId: string;
  try { userId = requireAuth(req); } catch { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = parseInt(String(req.params.id ?? "0"));
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  await db
    .delete(notificationsTable)
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)));

  res.json({ ok: true });
});

export default router;
