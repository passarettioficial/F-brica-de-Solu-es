import { Router, type IRouter } from "express";
import { eq, and, inArray } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, projectsTable, phasesTable, phaseArtifactsTable, usersTable } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { getPlanConfig } from "../lib/stripe";
import { sanitizeBriefing } from "../lib/ai";

const router: IRouter = Router();

function requireAuth(req: any) {
  const auth = getAuth(req);
  return auth?.userId ?? null;
}

// POST /projects/:projectId/advisor — AI Advisor SSE (Advanced plan only)
router.post("/projects/:projectId/advisor", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const plan = getPlanConfig(user.plan);
  if (!plan.hasAiAdvisor) {
    res.status(403).json({ error: "O AI Advisor está disponível nos planos Founder e Studio." });
    return;
  }

  const projectId = parseInt(Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId, 10);
  const { message, history } = req.body as {
    message: string;
    history: Array<{ role: "user" | "assistant"; content: string }>;
  };

  if (!message?.trim()) { res.status(400).json({ error: "Mensagem vazia" }); return; }

  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, projectId), eq(projectsTable.clerkId, userId))
  );
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  // Gather all generated artifacts as context — single query instead of N+1
  const phases = await db.select().from(phasesTable).where(eq(phasesTable.projectId, projectId));
  const phaseIds = phases.map(p => p.id);
  const rawArtifacts = phaseIds.length > 0
    ? await db.select().from(phaseArtifactsTable).where(inArray(phaseArtifactsTable.phaseId, phaseIds))
    : [];

  const artifactsByPhase = new Map<number, typeof rawArtifacts>();
  for (const a of rawArtifacts) {
    const list = artifactsByPhase.get(a.phaseId) ?? [];
    list.push(a);
    artifactsByPhase.set(a.phaseId, list);
  }

  const allArtifacts: string[] = [];
  for (const phase of phases.sort((a, b) => a.phaseNumber - b.phaseNumber)) {
    const artifacts = artifactsByPhase.get(phase.id) ?? [];
    const filled = artifacts.filter(a => a.content?.trim());
    if (filled.length > 0) {
      allArtifacts.push(`=== FASE ${phase.phaseNumber} ===`);
      for (const a of filled) {
        allArtifacts.push(`[${a.artifactKey}]\n${a.content.slice(0, 1200)}`);
      }
    }
  }

  const artifactContext = allArtifacts.join("\n\n");

  const safeBriefing = sanitizeBriefing(project.briefing);

  const systemPrompt = `Você é o AI Advisor da Fábrica de Soluções — um consultor de produto altamente experiente, especializado em startups e produtos digitais. Você tem acesso completo a todos os artefatos gerados para o projeto "${project.name}".

Seu papel é responder perguntas do founder sobre seu produto com profundidade e especificidade, sempre baseando suas respostas nos dados reais do projeto. Seja direto, crítico quando necessário, e sempre acionável.

PROJETO: ${project.name}
BRIEFING: ${safeBriefing}

ARTEFATOS GERADOS:
${artifactContext || "(Nenhum artefato gerado ainda — execute a IA nas fases primeiro)"}

INSTRUÇÕES:
- Responda SEMPRE em português brasileiro
- Seja específico para ESTE produto, não genérico
- Cite dados dos artefatos quando relevante
- Seja honesto: se algo parece fraco nos artefatos, diga
- Mantenha respostas densas e acionáveis
- Você pode ajudar com estratégia de produto, decisões técnicas, go-to-market, pricing, métricas, etc.`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
      ...(history ?? []).slice(-10).map(h => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    const stream = await openai.chat.completions.create({
      model: "gpt-4.1",
      max_completion_tokens: 2000,
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ type: "token", content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: "error", message: "Erro no AI Advisor" })}\n\n`);
    res.end();
  }
});

export default router;
