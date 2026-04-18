import { Router, type IRouter } from "express";
import { db, usersTable, feedbacksTable } from "@workspace/db";
import { eq, count, max } from "drizzle-orm";
import { UpdateUserBody } from "@workspace/api-zod";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

function formatUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
    lastSeenAt: u.lastSeenAt?.toISOString() ?? null,
  };
}

router.get("/users", requireAdmin, async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);

  const statsRows = await db
    .select({
      userId: feedbacksTable.userId,
      feedbackCount: count(feedbacksTable.id),
      lastFeedbackAt: max(feedbacksTable.createdAt),
    })
    .from(feedbacksTable)
    .groupBy(feedbacksTable.userId);

  const statsMap = new Map(statsRows.map((r) => [r.userId, r]));

  const result = users.map((u) => {
    const stats = statsMap.get(u.id);
    return {
      ...formatUser(u),
      feedbackCount: stats?.feedbackCount ?? 0,
      lastFeedbackAt: stats?.lastFeedbackAt?.toISOString() ?? null,
    };
  });

  res.json(result);
});

router.get("/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [stats] = await db
    .select({
      feedbackCount: count(feedbacksTable.id),
      lastFeedbackAt: max(feedbacksTable.createdAt),
    })
    .from(feedbacksTable)
    .where(eq(feedbacksTable.userId, id));

  res.json({
    ...formatUser(user),
    feedbackCount: stats?.feedbackCount ?? 0,
    lastFeedbackAt: stats?.lastFeedbackAt?.toISOString() ?? null,
  });
});

router.patch("/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Partial<typeof usersTable.$inferInsert> = {};
  if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;
  if (parsed.data.role !== undefined) updateData.role = parsed.data.role;
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;

  const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(formatUser(user));
});

export default router;
