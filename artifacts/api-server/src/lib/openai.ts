import OpenAI from "openai";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { logger } from "./logger";

let client: OpenAI | null = null;

function getClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

interface FeedbackScores {
  quality: number | null;
  timeliness: number | null;
  communication: number | null;
  expertise: number | null;
  overall: number | null;
}

export interface AnalysisResult {
  scores: FeedbackScores;
  summary: string;
}

interface FeedbackExample {
  id: string;
  feedbackText: string;
  interpretation: string;
  scores: {
    quality: number;
    timeliness: number;
    communication: number;
    expertise: number;
    overall: number;
  };
  recommendations: string[];
}

let cachedExamples: FeedbackExample[] | null = null;

async function loadFeedbackExamples(): Promise<FeedbackExample[]> {
  if (cachedExamples) {
    return cachedExamples;
  }

  try {
    const dataPath = resolve(process.cwd(), "data/feedback_examples.json");
    const raw = await readFile(dataPath, "utf-8");
    const parsed = JSON.parse(raw) as FeedbackExample[];
    cachedExamples = parsed;
    return parsed;
  } catch (err) {
    logger.error({ err }, "Failed to load feedback examples");
    return [];
  }
}

function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function pickRelevantExamples(query: string, examples: FeedbackExample[], limit = 3): FeedbackExample[] {
  const queryTokens = new Set(normalize(query));

  const ranked = examples
    .map((example) => {
      const text = `${example.feedbackText} ${example.interpretation} ${example.recommendations.join(" ")}`;
      const tokens = normalize(text);
      const overlap = tokens.reduce((score, token) => score + (queryTokens.has(token) ? 1 : 0), 0);
      return { example, score: overlap };
    })
    .sort((a, b) => b.score - a.score);

  const withOverlap = ranked.filter((entry) => entry.score > 0);
  const selected = withOverlap.length > 0 ? withOverlap : ranked;

  return selected.slice(0, limit).map((entry) => entry.example);
}

export async function analyzeFeedbackText(content: string): Promise<AnalysisResult> {
  const ai = getClient();
  if (!ai) {
    logger.warn("OpenAI API key not set, returning mock scores");
    return {
      scores: { quality: null, timeliness: null, communication: null, expertise: null, overall: null },
      summary: "AI analysis not available (API key not configured)",
    };
  }

  const prompt = `You are an AI assistant that analyzes executive feedback about project performance.
Analyze the following feedback and provide:
1. Scores from 1 to 10 for each criterion
2. A concise summary (2-3 sentences)

Criteria:
- quality: Quality of project deliverables
- timeliness: Meeting deadlines and schedules
- communication: Clarity and frequency of communication
- expertise: Technical and domain expertise shown
- overall: Overall satisfaction (CSAT)

Relevant historical context from the same manager (RAG): "${ragContext ?? "No context"}"

Feedback: "${content}"

Respond ONLY with valid JSON in this exact format:
{
  "scores": {
    "quality": <number 1-10 or null if cannot assess>,
    "timeliness": <number 1-10 or null if cannot assess>,
    "communication": <number 1-10 or null if cannot assess>,
    "expertise": <number 1-10 or null if cannot assess>,
    "overall": <number 1-10 or null if cannot assess>
  },
  "summary": "<concise summary>"
}`;

  try {
    const response = await ai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const text = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(text) as AnalysisResult;
    return parsed;
  } catch (err) {
    logger.error({ err }, "OpenAI analysis failed");
    return {
      scores: { quality: null, timeliness: null, communication: null, expertise: null, overall: null },
      summary: "Analysis failed",
    };
  }
}

export async function transcribeAudio(audioBase64: string, mimeType?: string): Promise<string> {
  const ai = getClient();
  if (!ai) {
    logger.warn("OpenAI API key not set, cannot transcribe");
    return "Audio transcription not available (API key not configured)";
  }

  try {
    const buffer = Buffer.from(audioBase64, "base64");
    const blob = new Blob([buffer], { type: mimeType ?? "audio/webm" });
    const file = new File([blob], "audio.webm", { type: mimeType ?? "audio/webm" });

    const transcription = await ai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "ru",
    });
    return transcription.text;
  } catch (err) {
    logger.error({ err }, "OpenAI transcription failed");
    throw new Error("Transcription failed");
  }
}

export async function answerAssistantQuestion(
  question: string,
  history: Array<{ role: "user" | "assistant"; content: string }> = [],
): Promise<string> {
  const examples = await loadFeedbackExamples();
  const relevantExamples = pickRelevantExamples(question, examples, 3);

  const recentHistory = history
    .slice(-6)
    .map((entry, index) => `${index + 1}. ${entry.role === "user" ? "Пользователь" : "Ассистент"}: ${entry.content}`)
    .join("\n");

  const contextBlock = relevantExamples.length
    ? relevantExamples
        .map((example, index) => {
          return [
            `Пример ${index + 1}:`,
            `Фидбек: ${example.feedbackText}`,
            `Интерпретация: ${example.interpretation}`,
            `Оценки: quality=${example.scores.quality}, timeliness=${example.scores.timeliness}, communication=${example.scores.communication}, expertise=${example.scores.expertise}, overall=${example.scores.overall}`,
            `Рекомендации: ${example.recommendations.join(" ")}`,
          ].join("\n");
        })
        .join("\n\n")
    : "Релевантные примеры не найдены.";

  const fallbackResponse = [
    "Я не могу обратиться к LLM сейчас, но вот базовая интерпретация:",
    "- CSAT 1-2: критическая зона, требуется срочный разбор причин и план исправления.",
    "- CSAT 3: нейтральная зона, есть риски неудовлетворенности; соберите уточняющий фидбек и определите 1-2 улучшения.",
    "- CSAT 4-5: положительная зона; зафиксируйте удачные практики и масштабируйте их.",
    "Используйте конкретные критерии (качество, сроки, коммуникация, экспертиза) и отслеживайте динамику по периодам.",
  ].join("\n");

  const ai = getClient();
  if (!ai) {
    logger.warn("OpenAI API key not set, assistant returns fallback response");
    return fallbackResponse;
  }

  const systemPrompt = `Ты AI-ассистент системы Feedback AI Manager. Отвечай на русском языке, структурировано и практично.
Твоя задача: помогать пользователям интерпретировать CSAT и работать с системой сбора обратной связи.`;

  const userPrompt = [
    "Вопрос пользователя:",
    question,
    "",
    recentHistory ? "Краткая история диалога:" : "",
    recentHistory,
    recentHistory ? "" : "",
    "Релевантные примеры из базы знаний:",
    contextBlock,
    "",
    "Сформируй ответ в 2-4 абзацах и, где уместно, добавь короткий список практических шагов.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await ai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content?.trim() || fallbackResponse;
  } catch (err) {
    logger.error({ err }, "OpenAI assistant response failed");
    return fallbackResponse;
  }
}
