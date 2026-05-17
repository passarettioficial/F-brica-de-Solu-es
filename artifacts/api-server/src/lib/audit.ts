import { db, auditLogsTable } from "@workspace/db";
import type { AuditEventType } from "@workspace/db";
import type { Request } from "express";
import { logger } from "./logger";

interface AuditOptions {
  eventType: AuditEventType;
  actorClerkId?: string | null;
  actorName?: string | null;
  targetClerkId?: string | null;
  targetName?: string | null;
  meta?: Record<string, unknown>;
  req?: Request;
}

export async function auditLog(opts: AuditOptions): Promise<void> {
  try {
    const ip = opts.req
      ? (opts.req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
        opts.req.socket?.remoteAddress ?? null
      : null;
    const userAgent = opts.req
      ? (opts.req.headers["user-agent"] ?? null)
      : null;

    await db.insert(auditLogsTable).values({
      eventType: opts.eventType,
      actorClerkId: opts.actorClerkId ?? null,
      actorName: opts.actorName ?? null,
      targetClerkId: opts.targetClerkId ?? null,
      targetName: opts.targetName ?? null,
      meta: opts.meta ? JSON.stringify(opts.meta) : null,
      ip,
      userAgent,
    });
  } catch (err) {
    logger.error({ err }, "audit log write failed");
  }
}
