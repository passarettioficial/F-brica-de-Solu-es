import { db, notificationsTable } from "@workspace/db";
import { and, eq, gte, isNull } from "drizzle-orm";
import { logger } from "./logger";

export type NotificationType =
  | "PHASE_REMINDER"
  | "PROJECT_STALE"
  | "USER_INACTIVE"
  | "PHASE_COMPLETED"
  | "PROJECT_COMPLETED"
  | "AI_LIMIT_WARNING"
  | "UPGRADE_SUGGESTION";

const TYPE_TO_DISPLAY: Record<NotificationType, "info" | "success" | "warning" | "alert"> = {
  PHASE_REMINDER:    "info",
  PROJECT_STALE:     "info",
  USER_INACTIVE:     "info",
  PHASE_COMPLETED:   "success",
  PROJECT_COMPLETED: "success",
  AI_LIMIT_WARNING:  "warning",
  UPGRADE_SUGGESTION: "info",
};

export async function createNotification(
  userId: string,
  notifType: NotificationType,
  title: string,
  message: string,
  link?: string
): Promise<void> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Deduplication: skip if same type+link+user exists in last 7 days
    const existing = await db
      .select({ id: notificationsTable.id })
      .from(notificationsTable)
      .where(
        and(
          eq(notificationsTable.userId, userId),
          eq(notificationsTable.type, notifType),
          link ? eq(notificationsTable.link, link) : isNull(notificationsTable.link),
          gte(notificationsTable.createdAt, sevenDaysAgo)
        )
      )
      .limit(1);

    if (existing.length > 0) return;

    await db.insert(notificationsTable).values({
      userId,
      title,
      message,
      type: notifType,
      link: link ?? null,
      isRead: false,
    });
  } catch (err) {
    logger.error({ err, userId, notifType }, "Failed to create notification");
  }
}
