import { Router, type IRouter } from "express";
import { db, usersTable, feedbacksTable, activityLogTable } from "@workspace/db";
import { eq, count, avg, sql, desc, and, gte } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const [userStats] = await db
    .select({
      totalUsers: count(usersTable.id),
    })
    .from(usersTable);

  const [activeUsersRow] = await db
    .select({ activeUsers: count(usersTable.id) })
    .from(usersTable)
    .where(eq(usersTable.isActive, true));

  const [feedbackStats] = await db
    .select({
      totalFeedbacks: count(feedbacksTable.id),
      avgOverallScore: avg(feedbacksTable.scoreOverall),
      avgQualityScore: avg(feedbacksTable.scoreQuality),
      avgTimelinessScore: avg(feedbacksTable.scoreTimeliness),
      avgCommunicationScore: avg(feedbacksTable.scoreCommunication),
      avgExpertiseScore: avg(feedbacksTable.scoreExpertise),
    })
    .from(feedbacksTable);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [monthlyFeedbacks] = await db
    .select({ count: count(feedbacksTable.id) })
    .from(feedbacksTable)
    .where(gte(feedbacksTable.createdAt, monthStart));

  res.json({
    totalUsers: userStats?.totalUsers ?? 0,
    activeUsers: activeUsersRow?.activeUsers ?? 0,
    totalFeedbacks: feedbackStats?.totalFeedbacks ?? 0,
    feedbacksThisMonth: monthlyFeedbacks?.count ?? 0,
    avgOverallScore: feedbackStats?.avgOverallScore ? parseFloat(feedbackStats.avgOverallScore as string) : null,
    avgQualityScore: feedbackStats?.avgQualityScore ? parseFloat(feedbackStats.avgQualityScore as string) : null,
    avgTimelinessScore: feedbackStats?.avgTimelinessScore ? parseFloat(feedbackStats.avgTimelinessScore as string) : null,
    avgCommunicationScore: feedbackStats?.avgCommunicationScore ? parseFloat(feedbackStats.avgCommunicationScore as string) : null,
    avgExpertiseScore: feedbackStats?.avgExpertiseScore ? parseFloat(feedbackStats.avgExpertiseScore as string) : null,
  });
});

router.get("/admin/cohort", requireAdmin, async (_req, res): Promise<void> => {
  const cohortData = await db.execute(sql`
    WITH months AS (
      SELECT generate_series(
        date_trunc('month', NOW() - interval '5 months'),
        date_trunc('month', NOW()),
        interval '1 month'
      ) AS month
    ),
    registered AS (
      SELECT date_trunc('month', created_at) AS month, COUNT(*) AS registered_users
      FROM users GROUP BY 1
    ),
    active AS (
      SELECT date_trunc('month', last_seen_at) AS month, COUNT(*) AS active_users
      FROM users WHERE last_seen_at IS NOT NULL GROUP BY 1
    ),
    fbs AS (
      SELECT date_trunc('month', created_at) AS month, COUNT(*) AS feedbacks_submitted
      FROM feedbacks GROUP BY 1
    )
    SELECT
      TO_CHAR(m.month, 'YYYY-MM') AS month,
      COALESCE(r.registered_users, 0)::int AS registered_users,
      COALESCE(a.active_users, 0)::int AS active_users,
      COALESCE(f.feedbacks_submitted, 0)::int AS feedbacks_submitted,
      CASE
        WHEN COALESCE(r.registered_users, 0) = 0 THEN 0
        ELSE ROUND((COALESCE(f.feedbacks_submitted, 0)::numeric / r.registered_users) * 100, 1)
      END AS conversion_rate
    FROM months m
    LEFT JOIN registered r ON r.month = m.month
    LEFT JOIN active a ON a.month = m.month
    LEFT JOIN fbs f ON f.month = m.month
    ORDER BY m.month ASC
  `);

  res.json(cohortData.rows.map((r: Record<string, unknown>) => ({
    month: r.month,
    registeredUsers: Number(r.registered_users),
    activeUsers: Number(r.active_users),
    feedbacksSubmitted: Number(r.feedbacks_submitted),
    conversionRate: Number(r.conversion_rate),
  })));
});

router.get("/admin/activity", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      activity: activityLogTable,
      userName: usersTable.name,
    })
    .from(activityLogTable)
    .leftJoin(usersTable, eq(activityLogTable.userId, usersTable.id))
    .orderBy(desc(activityLogTable.createdAt))
    .limit(50);

  res.json(rows.map((r) => ({
    id: r.activity.id,
    type: r.activity.type,
    description: r.activity.description,
    userName: r.userName ?? "Unknown",
    createdAt: r.activity.createdAt.toISOString(),
  })));
});

export default router;
