/**
 * AI Coach service for STEMulator
 *
 * Provides two capabilities:
 *   1. chatWithCoach() — Free-form Q&A about the running simulation
 *   2. evaluateStudentWork() — Structured evaluation of student lab observations
 *
 * All LLM calls are proxied through the backend at
 *   POST /stemulator/v1/chat/completions
 * so no API key is needed on the frontend.
 */

// ---------------------------------------------------------------------------
// Config — uses the same base URL as the rest of the API layer
// ---------------------------------------------------------------------------

const API_BASE_URL = import.meta.env.VITE_API_URL || "/stemulator/v1";
const CHAT_ENDPOINT = `${API_BASE_URL}/chat/completions`;
// const STUDENT_EVAL_ENDPOINT = `${API_BASE_URL}/guides/eval`;
const STUDENT_EVAL_ENDPOINT = `${API_BASE_URL}/student_eval`;

import { CircuitBreaker } from "./resilience";
import { registerCircuitBreaker } from "./healthCheck";
import { logger } from "./logger";

// ---------------------------------------------------------------------------
// Circuit breaker for the AI Coach service
// ---------------------------------------------------------------------------
export const aiCircuit = new CircuitBreaker({
  name: "ai",
  failureThreshold: 3,
  resetTimeoutMs: 60_000,
});
registerCircuitBreaker("ai", aiCircuit);

/** Maximum ms to wait for a chat response before aborting. */
const TIMEOUT_MS = 30_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SimContext {
  labTitle: string;
  discipline: string;
  topic: string;
  subTopic: string;
  environment: string;
  predation: string;
  foodAvailability: string;
  mutationRate: number;
  generation: number;
  populationSize: number;
  preyCount: number;
  predatorCount: number;
  survivalRate: number;
  avgSpeed: number;
  avgCamouflage: number;
  avgSize: number;
}

export interface EvalRequest {
  labTitle: string;
  discipline: string;
  topic: string;
  subTopic: string;
  partTitle: string;
  setup: string[];
  observations: string[];
  evidence: string[];
  predictions: string[];
  studentResponses: Record<string, string>;
}

export interface EvalResult {
  overallScore: number;
  feedback: string;
  strengths: string[];
  areasForImprovement: string[];
  guidance: string;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function getStudentEval(messages: ChatMessage[]): Promise<EvalResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(STUDENT_EVAL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      signal: controller.signal,
    });
  } catch {
    throw new Error(
        "Failed to retrieve student evaluation results from server. Please try again later. If the problem persists, contact support assistance.",
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`Failed to retrieve student evaluation results from server. Please try again later. If the problem persists, contact support assistance.: ${response.statusText}`);
  }

  return response.json()
}

async function callChat(messages: ChatMessage[]): Promise<string> {
  logger.info("AI Coach request initiated", { messageCount: messages.length });

  return aiCircuit.exec(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
        signal: controller.signal,
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        logger.error("AI Coach request timed out");
        throw new Error("AI Coach timed out. Please try again.");
      }
      logger.error("AI Coach network error", { error: (err as Error).message });
      throw new Error(
        "Unable to reach AI Coach. Check your connection and try again.",
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      if (res.status === 429) {
        logger.warn("AI Coach rate limited (429)");
        throw new Error(
          "AI Coach is busy right now. Please wait a moment and try again.",
        );
      }
      if (res.status === 401 || res.status === 403) {
        logger.error("AI Coach auth error", { status: res.status });
        throw new Error("AI Coach is not configured. Contact your instructor.");
      }
      if (res.status >= 500) {
        logger.error("AI Coach server error", { status: res.status });
        throw new Error("AI Coach service is temporarily unavailable.");
      }
      const body = await res.text();
      logger.error(`AI Coach error (${res.status})`, { body });
      throw new Error(`AI Coach error (${res.status}): ${body}`);
    }

    const data = await res.json();
    logger.info("AI Coach response received");
    // Support both OpenAI-style response and simple { content: "..." } response
    return (
      data.choices?.[0]?.message?.content?.trim() ?? data.content?.trim() ?? ""
    );
  }); // end circuit breaker exec
}

/**
 * Extract a user-facing error message from an AI-related exception.
 * Since callChat() already throws descriptive messages, this mainly
 * handles unexpected error types.
 */
export function friendlyAIError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Something went wrong with the AI Coach. Please try again.";
}

function buildSimContextBlock(ctx: SimContext): string {
  return `
## Current Simulation State
- **Lab:** ${ctx.labTitle} (${ctx.discipline} → ${ctx.topic} → ${ctx.subTopic})
- **Environment:** ${ctx.environment}
- **Predation level:** ${ctx.predation}
- **Food availability:** ${ctx.foodAvailability}
- **Mutation rate:** ${ctx.mutationRate}/10
- **Generation:** ${ctx.generation}
- **Total population:** ${ctx.populationSize} (🐇 ${ctx.preyCount} prey, 🐺 ${ctx.predatorCount} predators)
- **Survival rate:** ${(ctx.survivalRate * 100).toFixed(0)}%
- **Avg traits → speed:** ${ctx.avgSpeed.toFixed(1)}, **camouflage:** ${ctx.avgCamouflage.toFixed(1)}, **size:** ${ctx.avgSize.toFixed(1)}
`.trim();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Free-form chat with the AI Science Coach.
 *
 * @param question  The student's question (or a quick-action like "Explain")
 * @param context   Current simulation snapshot
 * @param history   Previous messages in this chat session
 */
export async function chatWithCoach(
  question: string,
  context: SimContext,
  history: ChatMessage[] = [],
): Promise<string> {
  const system: ChatMessage = {
    role: "system",
    content: `You are a friendly, encouraging AI Science Coach for a STEM education platform called STEMulator. You are guiding a student through a Natural Selection simulation lab.

Your role:
- Help students understand what's happening in their simulation
- Explain the biology concepts (natural selection, adaptation, survival of the fittest, predator-prey dynamics)
- Ask guiding questions to promote critical thinking rather than giving direct answers
- Relate observations back to real-world ecology
- Keep responses concise (2-4 paragraphs max) and appropriate for high-school / introductory college level
- Use emojis sparingly to keep it engaging 🧬🐇🐺

${buildSimContextBlock(context)}`,
  };

  const messages: ChatMessage[] = [
    system,
    ...history,
    { role: "user", content: question },
  ];

  return callChat(messages);
}

/**
 * Structured evaluation of student lab observations.
 *
 * Returns a parsed EvalResult with score, feedback, strengths, areas, and guidance.
 */
export async function evaluateStudentWork(
  req: EvalRequest,
): Promise<EvalResult> {
  const studentAnswers = Object.entries(req.studentResponses)
    .map(([key, val]) => `- **${key}:** ${val}`)
    .join("\n");

  const system: ChatMessage = {
    role: "system",
    content: `You are an AI Science Coach evaluating a student's lab work on the STEMulator platform. You must be encouraging but honest. Evaluate the quality and scientific accuracy of their setup, observations, evidence and predictions.

You MUST respond with ONLY valid JSON (no markdown fences, no extra text) in this exact schema:
{
  "overallScore": <number 0-100>,
  "feedback": "<2-4 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3 (optional)>"],
  "areasForImprovement": ["<area 1>", "<area 2>", "<area 3 (optional)>"],
  "guidance": "<2-4 sentence next step recommendation>"
}`,
  };

  const user: ChatMessage = {
    role: "user",
    content: `## Lab: ${req.labTitle}
**Discipline:** ${req.discipline} | **Topic:** ${req.topic} → ${req.subTopic}

### Part: ${req.partTitle}

**Setup instructions given:**
${req.setup.map((s) => `- ${s}`).join("\n")}

**Observation prompts:**
${req.observations.map((o) => `- ${o}`).join("\n")}

**Evidence to record:**
${req.evidence.map((e) => `- ${e}`).join("\n")}

**Predictions expected:**
${req.predictions.map((p) => `- ${p}`).join("\n")}

---

### Student's Responses:
${studentAnswers}

---

Evaluate the student's responses for scientific accuracy, depth, and completeness. Return ONLY the JSON object.`,
  };

  const evalResult = await getStudentEval([system,user]);
  console.log("evalResult response from AI Coach:", evalResult);
  return evalResult;

}
