import { Router, type IRouter } from "express";
import { db, usersTable, feedbacksTable, activityLogTable, projectsTable } from "@workspace/db";
import { eq, count, avg, sql, desc, and, gte, isNotNull } from "drizzle-orm";
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

router.get("/admin/analytics", requireAdmin, async (_req, res): Promise<void> => {
  // ── 1. Overall KPIs ────────────────────────────────────────────────────────
  const [userStats] = await db
    .select({
      totalUsers: count(usersTable.id),
      activeUsers: sql<number>`COUNT(*) FILTER (WHERE ${usersTable.isActive} = true)`,
      managersCount: sql<number>`COUNT(*) FILTER (WHERE ${usersTable.role} = 'manager')`,
    })
    .from(usersTable);

  const [scoreStats] = await db
    .select({
      totalFeedbacks: count(feedbacksTable.id),
      processedFeedbacks: sql<number>`COUNT(*) FILTER (WHERE ${feedbacksTable.status} = 'processed')`,
      avgOverall: avg(feedbacksTable.scoreOverall),
      avgQuality: avg(feedbacksTable.scoreQuality),
      avgTimeliness: avg(feedbacksTable.scoreTimeliness),
      avgCommunication: avg(feedbacksTable.scoreCommunication),
      avgExpertise: avg(feedbacksTable.scoreExpertise),
    })
    .from(feedbacksTable);

  const parseAvg = (v: unknown) => (v ? parseFloat(v as string) : null);

  // ── 2. Weekly trend (last 12 weeks) ────────────────────────────────────────
  const weeklyTrend = await db.execute(sql`
    WITH weeks AS (
      SELECT generate_series(
        date_trunc('week', NOW() - interval '11 weeks'),
        date_trunc('week', NOW()),
        interval '1 week'
      ) AS week_start
    )
    SELECT
      TO_CHAR(w.week_start, 'YYYY-"W"IW') AS week,
      COUNT(f.id)::int AS count,
      ROUND(AVG(f.score_overall)::numeric, 2) AS avg_overall,
      ROUND(AVG(f.score_quality)::numeric, 2) AS avg_quality,
      ROUND(AVG(f.score_timeliness)::numeric, 2) AS avg_timeliness,
      ROUND(AVG(f.score_communication)::numeric, 2) AS avg_communication,
      ROUND(AVG(f.score_expertise)::numeric, 2) AS avg_expertise
    FROM weeks w
    LEFT JOIN feedbacks f
      ON f.created_at >= w.week_start
      AND f.created_at < w.week_start + interval '1 week'
      AND f.score_overall IS NOT NULL
    GROUP BY w.week_start
    ORDER BY w.week_start ASC
  `);

  // ── 3. Score distribution per criterion ────────────────────────────────────
  const distRaw = await db.execute(sql`
    SELECT
      SUM(CASE WHEN score_overall  BETWEEN 1 AND 4 THEN 1 ELSE 0 END)::int AS overall_low,
      SUM(CASE WHEN score_overall  BETWEEN 5 AND 7 THEN 1 ELSE 0 END)::int AS overall_mid,
      SUM(CASE WHEN score_overall  BETWEEN 8 AND 10 THEN 1 ELSE 0 END)::int AS overall_high,
      SUM(CASE WHEN score_quality  BETWEEN 1 AND 4 THEN 1 ELSE 0 END)::int AS quality_low,
      SUM(CASE WHEN score_quality  BETWEEN 5 AND 7 THEN 1 ELSE 0 END)::int AS quality_mid,
      SUM(CASE WHEN score_quality  BETWEEN 8 AND 10 THEN 1 ELSE 0 END)::int AS quality_high,
      SUM(CASE WHEN score_timeliness BETWEEN 1 AND 4 THEN 1 ELSE 0 END)::int AS timeliness_low,
      SUM(CASE WHEN score_timeliness BETWEEN 5 AND 7 THEN 1 ELSE 0 END)::int AS timeliness_mid,
      SUM(CASE WHEN score_timeliness BETWEEN 8 AND 10 THEN 1 ELSE 0 END)::int AS timeliness_high,
      SUM(CASE WHEN score_communication BETWEEN 1 AND 4 THEN 1 ELSE 0 END)::int AS communication_low,
      SUM(CASE WHEN score_communication BETWEEN 5 AND 7 THEN 1 ELSE 0 END)::int AS communication_mid,
      SUM(CASE WHEN score_communication BETWEEN 8 AND 10 THEN 1 ELSE 0 END)::int AS communication_high,
      SUM(CASE WHEN score_expertise BETWEEN 1 AND 4 THEN 1 ELSE 0 END)::int AS expertise_low,
      SUM(CASE WHEN score_expertise BETWEEN 5 AND 7 THEN 1 ELSE 0 END)::int AS expertise_mid,
      SUM(CASE WHEN score_expertise BETWEEN 8 AND 10 THEN 1 ELSE 0 END)::int AS expertise_high
    FROM feedbacks
    WHERE score_overall IS NOT NULL
  `);
  const d = distRaw.rows[0] as Record<string, number>;

  // ── 4. Project performance ──────────────────────────────────────────────────
  const projectStats = await db.execute(sql`
    SELECT
      p.name AS project_name,
      COUNT(f.id)::int AS feedback_count,
      ROUND(AVG(f.score_overall)::numeric, 2)       AS avg_overall,
      ROUND(AVG(f.score_quality)::numeric, 2)        AS avg_quality,
      ROUND(AVG(f.score_timeliness)::numeric, 2)     AS avg_timeliness,
      ROUND(AVG(f.score_communication)::numeric, 2)  AS avg_communication,
      ROUND(AVG(f.score_expertise)::numeric, 2)      AS avg_expertise
    FROM projects p
    JOIN feedbacks f ON f.project_id = p.id
    WHERE f.score_overall IS NOT NULL
    GROUP BY p.id, p.name
    ORDER BY avg_overall DESC NULLS LAST
  `);

  // ── 5. Manager performance ──────────────────────────────────────────────────
  const managerStats = await db.execute(sql`
    SELECT
      u.name AS manager_name,
      COUNT(f.id)::int AS feedback_count,
      ROUND(AVG(f.score_overall)::numeric, 2) AS avg_overall,
      MAX(f.created_at)::text AS last_feedback_at
    FROM users u
    JOIN feedbacks f ON f.user_id = u.id
    WHERE u.role = 'manager' AND f.score_overall IS NOT NULL
    GROUP BY u.id, u.name
    ORDER BY feedback_count DESC
  `);

  res.json({
    overview: {
      totalUsers: Number(userStats?.totalUsers ?? 0),
      activeUsers: Number(userStats?.activeUsers ?? 0),
      managersCount: Number(userStats?.managersCount ?? 0),
      totalFeedbacks: Number(scoreStats?.totalFeedbacks ?? 0),
      processedFeedbacks: Number(scoreStats?.processedFeedbacks ?? 0),
      avgOverall: parseAvg(scoreStats?.avgOverall),
      avgQuality: parseAvg(scoreStats?.avgQuality),
      avgTimeliness: parseAvg(scoreStats?.avgTimeliness),
      avgCommunication: parseAvg(scoreStats?.avgCommunication),
      avgExpertise: parseAvg(scoreStats?.avgExpertise),
    },
    weeklyTrend: weeklyTrend.rows.map((r: Record<string, unknown>) => ({
      week: r.week,
      count: Number(r.count),
      avgOverall: r.avg_overall != null ? parseFloat(r.avg_overall as string) : null,
      avgQuality: r.avg_quality != null ? parseFloat(r.avg_quality as string) : null,
      avgTimeliness: r.avg_timeliness != null ? parseFloat(r.avg_timeliness as string) : null,
      avgCommunication: r.avg_communication != null ? parseFloat(r.avg_communication as string) : null,
      avgExpertise: r.avg_expertise != null ? parseFloat(r.avg_expertise as string) : null,
    })),
    scoreDistribution: {
      overall:       { low: d.overall_low ?? 0,       mid: d.overall_mid ?? 0,       high: d.overall_high ?? 0 },
      quality:       { low: d.quality_low ?? 0,       mid: d.quality_mid ?? 0,       high: d.quality_high ?? 0 },
      timeliness:    { low: d.timeliness_low ?? 0,    mid: d.timeliness_mid ?? 0,    high: d.timeliness_high ?? 0 },
      communication: { low: d.communication_low ?? 0, mid: d.communication_mid ?? 0, high: d.communication_high ?? 0 },
      expertise:     { low: d.expertise_low ?? 0,     mid: d.expertise_mid ?? 0,     high: d.expertise_high ?? 0 },
    },
    projectStats: projectStats.rows.map((r: Record<string, unknown>) => ({
      projectName: r.project_name,
      feedbackCount: Number(r.feedback_count),
      avgOverall: r.avg_overall != null ? parseFloat(r.avg_overall as string) : null,
      avgQuality: r.avg_quality != null ? parseFloat(r.avg_quality as string) : null,
      avgTimeliness: r.avg_timeliness != null ? parseFloat(r.avg_timeliness as string) : null,
      avgCommunication: r.avg_communication != null ? parseFloat(r.avg_communication as string) : null,
      avgExpertise: r.avg_expertise != null ? parseFloat(r.avg_expertise as string) : null,
    })),
    managerStats: managerStats.rows.map((r: Record<string, unknown>) => ({
      managerName: r.manager_name,
      feedbackCount: Number(r.feedback_count),
      avgOverall: r.avg_overall != null ? parseFloat(r.avg_overall as string) : null,
      lastFeedbackAt: r.last_feedback_at,
    })),
  });
});

export default router;
