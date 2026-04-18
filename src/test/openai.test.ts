/**
 * Unit tests for src/services/openai.ts
 *
 * All fetch calls are intercepted via vi.stubGlobal so no real network
 * traffic is generated.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  chatWithCoach,
  evaluateStudentWork,
  friendlyAIError,
  SimContext,
  EvalRequest,
  aiCircuit,
} from "../services/openai";

// ── Helpers ──────────────────────────────────────────────────────────────────

const mockContext: SimContext = {
  labTitle: "Natural Selection Lab",
  discipline: "Life Science",
  topic: "Biological Evolution",
  subTopic: "Natural Selection",
  environment: "forest",
  predation: "medium",
  foodAvailability: "medium",
  mutationRate: 5,
  generation: 3,
  populationSize: 45,
  preyCount: 38,
  predatorCount: 7,
  survivalRate: 0.8,
  avgSpeed: 5.1,
  avgCamouflage: 5.3,
  avgSize: 4.9,
};

const mockEvalRequest: EvalRequest = {
  labTitle: "Natural Selection Lab",
  discipline: "Life Science",
  topic: "Biological Evolution",
  subTopic: "Natural Selection",
  partTitle: "Part 1",
  setup: ["Set habitat to forest"],
  observations: ["What do you observe?"],
  evidence: ["Record population counts"],
  predictions: ["What will happen next?"],
  studentResponses: {
    "observations-0":
      "The rabbit population decreased by 10 over 3 generations.",
    "evidence-0": "Population dropped from 50 to 40.",
    "predictions-0": "Rabbits with better camouflage will survive.",
  },
};

/** Build a minimal fetch mock that returns the given body / status. */
function makeFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
    json: async () => body,
  } as Response);
}

/** OpenAI-style response wrapper. */
const openAIReply = (content: string) => ({
  choices: [{ message: { content } }],
});

// ── friendlyAIError ───────────────────────────────────────────────────────────

describe("friendlyAIError()", () => {
  it("returns the error message for an Error instance", () => {
    expect(friendlyAIError(new Error("something broke"))).toBe(
      "something broke",
    );
  });

  it("returns a generic string for non-Error values", () => {
    expect(friendlyAIError("raw string")).toContain("Something went wrong");
    expect(friendlyAIError(null)).toContain("Something went wrong");
    expect(friendlyAIError(42)).toContain("Something went wrong");
  });
});

// ── chatWithCoach ─────────────────────────────────────────────────────────────

describe("chatWithCoach()", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    aiCircuit.reset();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("returns the assistant reply on a successful response", async () => {
    vi.stubGlobal(
      "fetch",
      makeFetch(openAIReply("Great question about natural selection!")),
    );

    const reply = await chatWithCoach("What is happening?", mockContext);
    expect(reply).toBe("Great question about natural selection!");
  });

  it("falls back to data.content if choices is absent", async () => {
    vi.stubGlobal("fetch", makeFetch({ content: "Fallback content reply" }));
    const reply = await chatWithCoach("question", mockContext);
    expect(reply).toBe("Fallback content reply");
  });

  it("includes prior history messages in the request body", async () => {
    const mockFetch = makeFetch(openAIReply("ok"));
    vi.stubGlobal("fetch", mockFetch);

    await chatWithCoach("follow up", mockContext, [
      { role: "assistant", content: "previous reply" },
    ]);

    const body = JSON.parse(
      (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
    );
    const roles = body.messages.map((m: { role: string }) => m.role);
    expect(roles).toContain("system");
    expect(roles).toContain("assistant");
    expect(roles).toContain("user");
  });

  it("throws a user-friendly timeout message when the request is aborted", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockRejectedValue(
          Object.assign(new Error("aborted"), { name: "AbortError" }),
        ),
    );

    await expect(chatWithCoach("question", mockContext)).rejects.toThrow(
      /timed out/i,
    );
  });

  it("throws a connection message on generic network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(chatWithCoach("question", mockContext)).rejects.toThrow(
      /unable to reach/i,
    );
  });

  it("throws a rate-limit message on HTTP 429", async () => {
    vi.stubGlobal("fetch", makeFetch({ error: "rate limited" }, 429));

    await expect(chatWithCoach("question", mockContext)).rejects.toThrow(
      /busy right now/i,
    );
  });

  it("throws a configuration message on HTTP 401", async () => {
    vi.stubGlobal("fetch", makeFetch({ error: "unauthorized" }, 401));

    await expect(chatWithCoach("question", mockContext)).rejects.toThrow(
      /not configured/i,
    );
  });

  it("throws a configuration message on HTTP 403", async () => {
    vi.stubGlobal("fetch", makeFetch({ error: "forbidden" }, 403));

    await expect(chatWithCoach("question", mockContext)).rejects.toThrow(
      /not configured/i,
    );
  });

  it("throws a service unavailable message on HTTP 500", async () => {
    vi.stubGlobal("fetch", makeFetch({ error: "server error" }, 500));

    await expect(chatWithCoach("question", mockContext)).rejects.toThrow(
      /temporarily unavailable/i,
    );
  });

  it("throws a generic AI Coach error on other HTTP errors", async () => {
    vi.stubGlobal("fetch", makeFetch("Not found", 404));

    await expect(chatWithCoach("question", mockContext)).rejects.toThrow(
      /ai coach error \(404\)/i,
    );
  });
});

// ── evaluateStudentWork ───────────────────────────────────────────────────────

describe("evaluateStudentWork()", () => {
  beforeEach(() => aiCircuit.reset());
  afterEach(() => vi.unstubAllGlobals());

  const validEvalJson = JSON.stringify({
    overallScore: 78,
    feedback: "Good work overall.",
    strengths: ["Detailed observations"],
    areasForImprovement: ["Use more numbers"],
    guidance: "Try adjusting mutation rate.",
  });

  it("returns a parsed EvalResult on a clean JSON response", async () => {
    vi.stubGlobal("fetch", makeFetch(openAIReply(validEvalJson)));

    const result = await evaluateStudentWork(mockEvalRequest);
    expect(result.overallScore).toBe(78);
    expect(result.feedback).toBe("Good work overall.");
    expect(result.strengths).toContain("Detailed observations");
    expect(result.areasForImprovement).toContain("Use more numbers");
    expect(result.guidance).toBe("Try adjusting mutation rate.");
  });

  it("strips markdown fences before parsing JSON", async () => {
    const fenced = `\`\`\`json\n${validEvalJson}\n\`\`\``;
    vi.stubGlobal("fetch", makeFetch(openAIReply(fenced)));

    const result = await evaluateStudentWork(mockEvalRequest);
    expect(result.overallScore).toBe(78);
  });

  it("clamps overallScore to 0–100", async () => {
    const clamped = JSON.stringify({
      overallScore: 150,
      feedback: "Too high.",
      strengths: [],
      areasForImprovement: [],
      guidance: ".",
    });
    vi.stubGlobal("fetch", makeFetch(openAIReply(clamped)));

    const result = await evaluateStudentWork(mockEvalRequest);
    expect(result.overallScore).toBe(100);
  });

  it("clamps overallScore below 0 to 0", async () => {
    const clamped = JSON.stringify({
      overallScore: -20,
      feedback: "Too low.",
      strengths: [],
      areasForImprovement: [],
      guidance: ".",
    });
    vi.stubGlobal("fetch", makeFetch(openAIReply(clamped)));

    const result = await evaluateStudentWork(mockEvalRequest);
    expect(result.overallScore).toBe(0);
  });

  it("returns a safe fallback when response is not valid JSON", async () => {
    vi.stubGlobal("fetch", makeFetch(openAIReply("This is not JSON at all.")));

    const result = await evaluateStudentWork(mockEvalRequest);
    // Should not throw; overallScore must be a number
    expect(typeof result.overallScore).toBe("number");
    expect(result.feedback).toBeTruthy();
    // feedback must NOT contain a raw API error prefix
    expect(result.feedback).not.toMatch(/^AI Coach/i);
  });

  it("returns safe fallback when response contains an error string", async () => {
    vi.stubGlobal(
      "fetch",
      makeFetch(openAIReply("AI Coach error (500): Internal Server Error")),
    );

    const result = await evaluateStudentWork(mockEvalRequest);
    expect(result.feedback).not.toMatch(/^AI Coach error/i);
  });

  it("propagates errors thrown by callChat (e.g. 429)", async () => {
    vi.stubGlobal("fetch", makeFetch({}, 429));

    await expect(evaluateStudentWork(mockEvalRequest)).rejects.toThrow(
      /busy right now/i,
    );
  });
});
