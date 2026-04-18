import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const feedbacksTable = pgTable("feedbacks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  projectId: integer("project_id"),
  content: text("content").notNull(),
  summary: text("summary"),
  scoreQuality: real("score_quality"),
  scoreTimeliness: real("score_timeliness"),
  scoreCommunication: real("score_communication"),
  scoreExpertise: real("score_expertise"),
  scoreOverall: real("score_overall"),
  inputType: text("input_type").notNull().default("text"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFeedbackSchema = createInsertSchema(feedbacksTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedbacksTable.$inferSelect;
