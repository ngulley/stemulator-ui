/**
 * OpenAI integration for STEMulator AI Coach
 *
 * Provides two capabilities:
 *   1. chatWithCoach()       — Free-form Q&A about the running simulation
 *   2. evaluateStudentWork() — Structured evaluation of student lab observations
 *
 * Uses the OpenAI Chat Completions API directly from the browser.
 * The API key is read from VITE_OPENAI_API_KEY (set in .env).
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as
  | string
  | undefined;
const MODEL = "gpt-4o-mini";
const API_URL = "https://api.openai.com/v1/chat/completions";

export function isOpenAIConfigured(): boolean {
  return !!OPENAI_API_KEY && OPENAI_API_KEY.startsWith("sk-");
}

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

async function callOpenAI(
  messages: ChatMessage[],
  temperature = 0.7,
  maxTokens = 800,
): Promise<string> {
  if (!isOpenAIConfigured()) {
    throw new Error("OpenAI API key is not configured.");
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${body}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
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

  return callOpenAI(messages, 0.7, 600);
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
    content: `You are an AI Science Coach evaluating a student's lab work in the STEMulator platform. You must be encouraging but honest. Evaluate the quality and scientific accuracy of their observations.

You MUST respond with ONLY valid JSON (no markdown fences, no extra text) in this exact schema:
{
  "overallScore": <number 0-100>,
  "feedback": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "areasForImprovement": ["<area 1>", "<area 2>"],
  "guidance": "<1-2 sentence next step recommendation>"
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

  const raw = await callOpenAI([system, user], 0.4, 600);

  // Parse the JSON response (handle markdown code fences if present)
  const cleaned = raw
    .replace(/```json?\n?/g, "")
    .replace(/```/g, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as EvalResult;
    // Clamp score
    parsed.overallScore = Math.max(0, Math.min(100, parsed.overallScore));
    return parsed;
  } catch {
    // If parsing fails, return a reasonable default with the raw text as feedback
    return {
      overallScore: 70,
      feedback: raw,
      strengths: ["Engagement with the simulation"],
      areasForImprovement: ["Try to be more specific in your observations"],
      guidance: "Continue exploring different simulation parameters.",
    };
  }
}
