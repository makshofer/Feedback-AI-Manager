import OpenAI from "openai";
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

export async function analyzeFeedbackText(content: string, ragContext?: string): Promise<AnalysisResult> {
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
