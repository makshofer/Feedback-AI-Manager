import { Router, type IRouter } from "express";
import { db, feedbacksTable, usersTable, projectsTable, activityLogTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  CreateFeedbackBody,
  UpdateFeedbackBody,
  GetFeedbackParams,
  UpdateFeedbackParams,
  DeleteFeedbackParams,
  ListFeedbacksQueryParams,
  TranscribeFeedbackBody,
  AnalyzeFeedbackBody,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin, getUser } from "../lib/auth";
import { analyzeFeedbackText, transcribeAudio } from "../lib/openai";

const router: IRouter = Router();

async function buildRagContextForUser(userId: number): Promise<string> {
  const rows = await db
    .select({ summary: feedbacksTable.summary, content: feedbacksTable.content })
    .from(feedbacksTable)
    .where(eq(feedbacksTable.userId, userId))
    .orderBy(desc(feedbacksTable.createdAt))
    .limit(5);

  if (rows.length === 0) {
    return "No historical feedback context available.";
  }

  return rows
    .map((row, index) => `Context ${index + 1}: ${row.summary ?? row.content}`)
    .join("\n");
}

function formatFeedback(f: typeof feedbacksTable.$inferSelect, userName?: string | null, projectName?: string | null) {
  return {
    id: f.id,
    userId: f.userId,
    projectId: f.projectId ?? null,
    content: f.content,
    summary: f.summary ?? null,
    scores: {
      quality: f.scoreQuality ?? null,
      timeliness: f.scoreTimeliness ?? null,
      communication: f.scoreCommunication ?? null,
      expertise: f.scoreExpertise ?? null,
      overall: f.scoreOverall ?? null,
    },
    inputType: f.inputType,
    status: f.status,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
    userName: userName ?? null,
    projectName: projectName ?? null,
  };
}

router.post("/feedbacks/transcribe", requireAuth, async (req, res): Promise<void> => {
  const parsed = TranscribeFeedbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { audioBase64, mimeType } = parsed.data;

  const authUser = getUser(req)!;
  const transcript = await transcribeAudio(audioBase64, mimeType ?? undefined);
  const ragContext = await buildRagContextForUser(authUser.userId);
  const analysis = await analyzeFeedbackText(transcript, ragContext);

  res.json({
    transcript,
    scores: analysis.scores,
    summary: analysis.summary,
  });
});

router.post("/feedbacks/analyze", requireAuth, async (req, res): Promise<void> => {
  const parsed = AnalyzeFeedbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const authUser = getUser(req)!;
  const ragContext = await buildRagContextForUser(authUser.userId);
  const analysis = await analyzeFeedbackText(parsed.data.content, ragContext);
  res.json(analysis);
});

router.get("/feedbacks", requireAuth, async (req, res): Promise<void> => {
  const authUser = getUser(req)!;
  const params = ListFeedbacksQueryParams.safeParse(req.query);

  let query = db
    .select({
      feedback: feedbacksTable,
      userName: usersTable.name,
      projectName: projectsTable.name,
    })
    .from(feedbacksTable)
    .leftJoin(usersTable, eq(feedbacksTable.userId, usersTable.id))
    .leftJoin(projectsTable, eq(feedbacksTable.projectId, projectsTable.id));

  if (authUser.role !== "admin") {
    query = query.where(eq(feedbacksTable.userId, authUser.userId)) as typeof query;
  } else if (params.success && params.data.userId) {
    query = query.where(eq(feedbacksTable.userId, params.data.userId)) as typeof query;
  }

  const rows = await query.orderBy(desc(feedbacksTable.createdAt));
  res.json(rows.map((r) => formatFeedback(r.feedback, r.userName, r.projectName)));
});

router.post("/feedbacks", requireAuth, async (req, res): Promise<void> => {
  const authUser = getUser(req)!;
  const parsed = CreateFeedbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { content, projectId, inputType, scores, summary } = parsed.data;

  const [fb] = await db.insert(feedbacksTable).values({
    userId: authUser.userId,
    projectId: projectId ?? null,
    content,
    summary: summary ?? null,
    scoreQuality: scores?.quality ?? null,
    scoreTimeliness: scores?.timeliness ?? null,
    scoreCommunication: scores?.communication ?? null,
    scoreExpertise: scores?.expertise ?? null,
    scoreOverall: scores?.overall ?? null,
    inputType,
    status: scores ? "processed" : "pending",
  }).returning();

  await db.insert(activityLogTable).values({
    type: "feedback_created",
    description: `New feedback submitted via ${inputType}`,
    userId: authUser.userId,
  });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, authUser.userId));
  res.status(201).json(formatFeedback(fb, user?.name ?? null, null));
});

router.get("/feedbacks/:id", requireAuth, async (req, res): Promise<void> => {
  const authUser = getUser(req)!;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [row] = await db
    .select({ feedback: feedbacksTable, userName: usersTable.name, projectName: projectsTable.name })
    .from(feedbacksTable)
    .leftJoin(usersTable, eq(feedbacksTable.userId, usersTable.id))
    .leftJoin(projectsTable, eq(feedbacksTable.projectId, projectsTable.id))
    .where(eq(feedbacksTable.id, id));

  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (authUser.role !== "admin" && row.feedback.userId !== authUser.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  res.json(formatFeedback(row.feedback, row.userName, row.projectName));
});

router.patch("/feedbacks/:id", requireAuth, async (req, res): Promise<void> => {
  const authUser = getUser(req)!;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = UpdateFeedbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(feedbacksTable).where(eq(feedbacksTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (authUser.role !== "admin" && existing.userId !== authUser.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { content, projectId, scores, summary, status } = parsed.data;

  const updateData: Partial<typeof feedbacksTable.$inferInsert> = {};
  if (content !== undefined) updateData.content = content;
  if (projectId !== undefined) updateData.projectId = projectId ?? null;
  if (summary !== undefined) updateData.summary = summary ?? null;
  if (status !== undefined) updateData.status = status;
  if (scores !== undefined) {
    updateData.scoreQuality = scores?.quality ?? null;
    updateData.scoreTimeliness = scores?.timeliness ?? null;
    updateData.scoreCommunication = scores?.communication ?? null;
    updateData.scoreExpertise = scores?.expertise ?? null;
    updateData.scoreOverall = scores?.overall ?? null;
    if (!status) updateData.status = "processed";
  }

  const [fb] = await db.update(feedbacksTable).set(updateData).where(eq(feedbacksTable.id, id)).returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, fb.userId));
  let projectName: string | null = null;
  if (fb.projectId) {
    const [p] = await db.select().from(projectsTable).where(eq(projectsTable.id, fb.projectId));
    projectName = p?.name ?? null;
  }

  res.json(formatFeedback(fb, user?.name ?? null, projectName));
});

router.delete("/feedbacks/:id", requireAuth, async (req, res): Promise<void> => {
  const authUser = getUser(req)!;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [existing] = await db.select().from(feedbacksTable).where(eq(feedbacksTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (authUser.role !== "admin" && existing.userId !== authUser.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.delete(feedbacksTable).where(eq(feedbacksTable.id, id));
  res.sendStatus(204);
});

export default router;
