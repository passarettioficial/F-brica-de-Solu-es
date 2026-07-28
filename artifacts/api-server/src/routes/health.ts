import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { HealthCheckResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const DB_PING_TIMEOUT_MS = 2000;

async function pingDatabase(): Promise<"ok" | "error"> {
  try {
    await Promise.race([
      db.execute(sql`SELECT 1`),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), DB_PING_TIMEOUT_MS)),
    ]);
    return "ok";
  } catch (err) {
    logger.error({ err }, "Health check: database ping failed");
    return "error";
  }
}

router.get("/healthz", async (_req, res) => {
  const database = await pingDatabase();
  const status = database === "ok" ? "ok" : "degraded";

  const data = HealthCheckResponse.parse({ status, checks: { database } });
  res.status(status === "ok" ? 200 : 503).json(data);
});

export default router;
