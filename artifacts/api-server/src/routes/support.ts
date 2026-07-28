import { Router, type Request, type Response, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, supportTicketsTable } from "@workspace/db";
import { requireAuth, ensureUser } from "../lib/auth";

const router: IRouter = Router();

const VALID_CATEGORIES = ["general", "billing", "technical", "lgpd"] as const;

// POST /support/tickets — create a ticket
router.post("/support/tickets", async (req: Request, res: Response): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const body = req.body as { subject?: unknown; message?: unknown; category?: unknown };
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const rawCategory = typeof body.category === "string" ? body.category : "general";
  const category = (VALID_CATEGORIES as readonly string[]).includes(rawCategory) ? rawCategory : "general";

  if (!subject || subject.length < 3 || subject.length > 200) {
    res.status(400).json({ error: "Assunto deve ter entre 3 e 200 caracteres." }); return;
  }
  if (!message || message.length < 10 || message.length > 5000) {
    res.status(400).json({ error: "Mensagem deve ter entre 10 e 5000 caracteres." }); return;
  }

  await ensureUser(userId);

  const [ticket] = await db
    .insert(supportTicketsTable)
    .values({ userId, subject, message, category, status: "open" })
    .returning();

  res.status(201).json(ticket);
});

// GET /support/tickets — list user's tickets
router.get("/support/tickets", async (req: Request, res: Response): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const tickets = await db
    .select()
    .from(supportTicketsTable)
    .where(eq(supportTicketsTable.userId, userId))
    .orderBy(desc(supportTicketsTable.createdAt))
    .limit(20);

  res.json(tickets);
});

// GET /support/tickets/:id — get single ticket
router.get("/support/tickets/:id", async (req: Request, res: Response): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = parseInt(String(req.params.id ?? "0"));
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const [ticket] = await db
    .select()
    .from(supportTicketsTable)
    .where(eq(supportTicketsTable.id, id));

  if (!ticket || ticket.userId !== userId) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json(ticket);
});

export default router;
