import { Router, type IRouter } from "express";
import { db, projectsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { CreateProjectBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/projects", requireAuth, async (_req, res): Promise<void> => {
  const projects = await db.select().from(projectsTable).orderBy(desc(projectsTable.createdAt));
  res.json(projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    createdAt: p.createdAt.toISOString(),
  })));
});

router.post("/projects", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [project] = await db.insert(projectsTable).values({
    name: parsed.data.name,
    description: parsed.data.description ?? null,
  }).returning();

  res.status(201).json({
    id: project.id,
    name: project.name,
    description: project.description ?? null,
    createdAt: project.createdAt.toISOString(),
  });
});

export default router;
