import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/auth";
import { answerAssistantQuestion } from "../lib/openai";

const router: IRouter = Router();

type ChatHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

function sanitizeHistory(input: unknown): ChatHistoryItem[] {
  if (!Array.isArray(input)) return [];

  return input
    .filter((item): item is { role: unknown; content: unknown } => Boolean(item && typeof item === "object"))
    .map((item): ChatHistoryItem => ({
      role: item.role === "assistant" ? "assistant" : "user",
      content: typeof item.content === "string" ? item.content.trim().slice(0, 1000) : "",
    }))
    .filter((item) => item.content.length > 0)
    .slice(-8);
}

router.post("/chat", requireAuth, async (req, res): Promise<void> => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message || message.length > 2000) {
    res.status(400).json({ error: "message is required and must be <= 2000 characters" });
    return;
  }

  const history = sanitizeHistory(req.body?.history);
  const answer = await answerAssistantQuestion(message, history);

  res.json({
    answer,
    usedKnowledgeBase: true,
  });
});

export default router;
