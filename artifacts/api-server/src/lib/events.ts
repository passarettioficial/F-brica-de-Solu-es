import { db } from "@workspace/db";
import { eventsTable, type EventType } from "@workspace/db";

export async function logEvent(
  clerkId: string,
  eventType: EventType,
  meta?: { projectId?: number; phaseId?: number; [key: string]: unknown },
): Promise<void> {
  try {
    await db.insert(eventsTable).values({
      clerkId,
      projectId: meta?.projectId ?? null,
      phaseId: meta?.phaseId ?? null,
      eventType,
      meta: meta ? JSON.stringify(meta) : null,
    });
  } catch {
    // Non-blocking — event tracking must never disrupt the main flow
  }
}
