import { Router, type IRouter } from "express";
import { processTelegramUpdate } from "../lib/telegram";

const router: IRouter = Router();

router.post("/telegram/webhook", async (req, res): Promise<void> => {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && req.headers["x-telegram-bot-api-secret-token"] !== secret) {
    res.status(401).json({ error: "Invalid Telegram webhook secret" });
    return;
  }

  await processTelegramUpdate(req.body);
  res.json({ ok: true });
});

router.get("/telegram/status", (_req, res) => {
  res.json({
    enabled: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    mode: process.env.TELEGRAM_WEBHOOK_URL ? "webhook" : "polling",
    botName: "@Managers_Feedback_AI_bot",
  });
});

export default router;
