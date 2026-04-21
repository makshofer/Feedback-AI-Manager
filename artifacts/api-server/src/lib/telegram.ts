import { db, feedbacksTable, usersTable, activityLogTable } from "@workspace/db";
import { analyzeFeedbackText, transcribeAudio } from "./openai";
import { logger } from "./logger";
import { and, eq } from "drizzle-orm";

const TELEGRAM_API_BASE = "https://api.telegram.org";

type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    text?: string;
    voice?: { file_id: string; mime_type?: string };
    from?: { id: number; username?: string; first_name?: string; last_name?: string };
    chat: { id: number };
  };
};

type TelegramGetUpdatesResponse = {
  ok: boolean;
  result: TelegramUpdate[];
};

let pollingOffset = 0;
let pollingHandle: NodeJS.Timeout | null = null;

function getBotToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN ?? null;
}

function buildUrl(method: string): string {
  const token = getBotToken();
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }
  return `${TELEGRAM_API_BASE}/bot${token}/${method}`;
}

async function telegramRequest<T>(method: string, payload: Record<string, unknown>): Promise<T> {
  const response = await fetch(buildUrl(method), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Telegram API ${method} failed: ${response.status} ${text}`);
  }

  return (await response.json()) as T;
}

function extractExecutiveName(rawText?: string): { cleanedText: string; executiveName: string | null } {
  if (!rawText) {
    return { cleanedText: "", executiveName: null };
  }

  const lines = rawText.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) {
    return { cleanedText: "", executiveName: null };
  }

  const firstLine = lines[0] ?? "";
  const matched = firstLine.match(/^(фио|fio|name|имя)\s*[:\-]\s*(.+)$/i);
  if (!matched?.[2]) {
    return { cleanedText: rawText.trim(), executiveName: null };
  }

  return {
    executiveName: matched[2].trim(),
    cleanedText: lines.slice(1).join("\n").trim(),
  };
}

async function resolveUserForTelegramUpdate(update: TelegramUpdate): Promise<number | null> {
  const msg = update.message;
  if (!msg?.from) {
    return null;
  }

  const chatId = msg.from.id;
  const username = `tg-${chatId}`;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existing) {
    return existing.id;
  }

  const displayName = [msg.from.first_name, msg.from.last_name].filter(Boolean).join(" ").trim() || msg.from.username || `Manager ${chatId}`;

  const [created] = await db.insert(usersTable).values({
    username,
    name: displayName,
    passwordHash: "telegram-auth",
    role: "manager",
    isActive: true,
    lastSeenAt: new Date(),
  }).returning();

  return created.id;
}

async function fetchVoiceAsBase64(fileId: string): Promise<{ base64: string; mimeType: string }> {
  type FileResponse = { ok: boolean; result: { file_path: string } };
  const fileResponse = await telegramRequest<FileResponse>("getFile", { file_id: fileId });
  const path = fileResponse.result.file_path;
  const token = getBotToken();
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }
  const voiceUrl = `${TELEGRAM_API_BASE}/file/bot${token}/${path}`;
  const response = await fetch(voiceUrl);
  if (!response.ok) {
    throw new Error(`Failed to download Telegram voice file: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return { base64, mimeType: "audio/ogg" };
}

export async function processTelegramUpdate(update: TelegramUpdate): Promise<void> {
  const message = update.message;
  if (!message) {
    return;
  }

  const userId = await resolveUserForTelegramUpdate(update);
  if (!userId) {
    return;
  }

  let content = message.text?.trim() ?? "";

  if (message.voice?.file_id) {
    const voicePayload = await fetchVoiceAsBase64(message.voice.file_id);
    content = await transcribeAudio(voicePayload.base64, voicePayload.mimeType);
  }

  const { executiveName, cleanedText } = extractExecutiveName(content);
  const normalizedContent = cleanedText || content;

  if (!normalizedContent) {
    await sendTelegramMessage(message.chat.id, "Не удалось распознать содержание обратной связи. Пожалуйста, отправьте текст или голос еще раз.");
    return;
  }

  if (executiveName) {
    await db.update(usersTable).set({ name: executiveName, lastSeenAt: new Date() }).where(eq(usersTable.id, userId));
  }

  const ragContext = await getRecentContextForUser(userId);
  const analysis = await analyzeFeedbackText(normalizedContent, ragContext);

  await db.insert(feedbacksTable).values({
    userId,
    projectId: null,
    content: normalizedContent,
    summary: analysis.summary,
    scoreQuality: analysis.scores.quality,
    scoreTimeliness: analysis.scores.timeliness,
    scoreCommunication: analysis.scores.communication,
    scoreExpertise: analysis.scores.expertise,
    scoreOverall: analysis.scores.overall,
    inputType: message.voice ? "voice" : "text",
    status: "processed",
  });

  await db.insert(activityLogTable).values({
    userId,
    type: "telegram_feedback_created",
    description: "Feedback captured from Telegram bot",
  });

  await sendTelegramMessage(
    message.chat.id,
    "Ваша обратная связь записана, спасибо за уделенное время. Для лучшего анализа начинайте сообщение с 'ФИО: Ваше Имя'.",
  );
}

async function getRecentContextForUser(userId: number): Promise<string> {
  const rows = await db.select({ summary: feedbacksTable.summary, content: feedbacksTable.content })
    .from(feedbacksTable)
    .where(eq(feedbacksTable.userId, userId))
    .limit(3);

  return rows
    .map((row, idx) => `Запись ${idx + 1}: ${row.summary ?? row.content}`)
    .join("\n");
}

export async function sendTelegramMessage(chatId: number, text: string): Promise<void> {
  await telegramRequest("sendMessage", { chat_id: chatId, text });
}

async function pollOnce(): Promise<void> {
  const payload: Record<string, unknown> = {
    timeout: 20,
    allowed_updates: ["message"],
  };
  if (pollingOffset > 0) {
    payload.offset = pollingOffset;
  }

  const updates = await telegramRequest<TelegramGetUpdatesResponse>("getUpdates", payload);
  for (const update of updates.result) {
    pollingOffset = update.update_id + 1;
    try {
      await processTelegramUpdate(update);
    } catch (error) {
      logger.error({ error, updateId: update.update_id }, "Failed to process telegram update");
    }
  }
}

export function startTelegramBotPolling(): void {
  if (!getBotToken()) {
    logger.warn("Telegram bot polling is disabled because TELEGRAM_BOT_TOKEN is not configured");
    return;
  }

  if (pollingHandle) {
    return;
  }

  logger.info("Starting Telegram bot polling");

  const loop = async () => {
    try {
      await pollOnce();
    } catch (error) {
      logger.error({ error }, "Telegram polling error");
    } finally {
      pollingHandle = setTimeout(loop, 1500);
    }
  };

  void loop();
}
