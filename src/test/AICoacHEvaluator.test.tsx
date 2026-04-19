import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AICoacHEvaluator from "../components/AICoacHEvaluator";
import {
  ScienceLab,
  SimulationState,
  LabPart,
  SimStateSnapshot,
} from "../types";

// ── Mock all network calls so no real API is hit ──────────────────────────────
vi.mock("../services/api", () => ({
  getGuidance: vi.fn().mockResolvedValue({ guidance: "Mock backend guidance" }),
}));

vi.mock("../services/openai", () => ({
  evaluateStudentWork: vi.fn().mockResolvedValue({
    overallScore: 85,
    feedback: "Great observations on population dynamics.",
    strengths: ["Good use of data", "Clear reasoning"],
    areasForImprovement: ["Add more specific numbers"],
    guidance: "Try adjusting the mutation rate next.",
  }),
  friendlyAIError: vi.fn((err: unknown) =>
    err instanceof Error
      ? err.message
      : "Something went wrong with the AI Coach. Please try again.",
  ),
}));

vi.mock("lucide-react", () => ({
  Brain: () => null,
  CheckCircle2: () => null,
  AlertCircle: () => null,
  Lightbulb: () => null,
  ArrowRight: () => null,
  Sparkles: () => null,
  RotateCcw: () => null,
}));

const mockPart: LabPart = {
  partId: 1,
  title: "Introduction to Natural Selection",
  setup: ["Set habitat to Desert", "Set wolves to Few"],
  observations: ["What is the initial population?"],
  evidence: ["Record population data in CSV"],
  predictions: ["How will rabbits change?"],
};

const mockLab: ScienceLab = {
  _id: "lab-001",
  labId: "lab-001",
  title: "Natural Selection Lab",
  discipline: "Life Science",
  topic: "Biological Evolution",
  subTopic: "Natural Selection",
  description: "A natural selection simulation lab.",
  difficulty: "Intermediate",
  learningGoals: {
    bigIdea: "Organisms with advantageous traits survive and reproduce.",
    objectives: ["Describe natural selection", "Analyze population data"],
    successCriteria: ["Explain trait changes across generations"],
  },
  labParts: [mockPart],
};

const mockSimState: SimulationState = {
  generation: 5,
  organisms: [],
  environment: "forest",
  predation: "medium",
  foodAvailability: "medium",
  mutationRate: 5,
  populationHistory: [50, 48, 45, 43, 41],
  traitDistribution: { speed: [], camouflage: [], size: [] },
  survivalRate: 0.8,
  actions: [],
};

const mockSimHistory: SimStateSnapshot[] = [
  {
    generation: 0,
    environment: "forest",
    predation: "medium",
    foodAvailability: "medium",
    mutationRate: 5,
    totalPopulation: 50,
    preyCount: 42,
    predatorCount: 8,
    survivalRate: 1.0,
    avgSpeed: 5.0,
    avgCamouflage: 5.0,
    avgSize: 5.0,
    actions: ["Lab part loaded"],
  },
  {
    generation: 5,
    environment: "forest",
    predation: "medium",
    foodAvailability: "medium",
    mutationRate: 5,
    totalPopulation: 41,
    preyCount: 34,
    predatorCount: 7,
    survivalRate: 0.8,
    avgSpeed: 5.4,
    avgCamouflage: 5.6,
    avgSize: 4.8,
    actions: ["Run generation 5"],
  },
];

describe("AICoacHEvaluator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows prompt to submit when no responses provided", () => {
    render(
      <AICoacHEvaluator
        lab={mockLab}
        part={mockPart}
        studentResponses={null}
        simState={mockSimState}
        simHistory={mockSimHistory}
      />,
    );
    expect(screen.getByText(/submit your observations/i)).toBeInTheDocument();
  });

  it("shows loading state while evaluating", async () => {
    render(
      <AICoacHEvaluator
        lab={mockLab}
        part={mockPart}
        studentResponses={{ "observations-0": "Brown rabbits survived less." }}
        simState={mockSimState}
        simHistory={mockSimHistory}
      />,
    );
    // Loading spinner should appear immediately
    expect(screen.getByText(/evaluating your responses/i)).toBeInTheDocument();
  });

  it("displays AI evaluation score after responses submitted", async () => {
    render(
      <AICoacHEvaluator
        lab={mockLab}
        part={mockPart}
        studentResponses={{
          "observations-0":
            "The population decreased from 50 to 41 rabbits over 5 generations.",
        }}
        simState={mockSimState}
        simHistory={mockSimHistory}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("85%")).toBeInTheDocument();
    });
  });

  it("displays feedback text from AI evaluation", async () => {
    render(
      <AICoacHEvaluator
        lab={mockLab}
        part={mockPart}
        studentResponses={{ "observations-0": "Population dynamics observed." }}
        simState={mockSimState}
        simHistory={mockSimHistory}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/great observations on population dynamics/i),
      ).toBeInTheDocument();
    });
  });

  it("displays strengths from evaluation", async () => {
    render(
      <AICoacHEvaluator
        lab={mockLab}
        part={mockPart}
        studentResponses={{ "observations-0": "Some observation text here." }}
        simState={mockSimState}
        simHistory={mockSimHistory}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/good use of data/i)).toBeInTheDocument();
    });
  });

  it("displays areas for improvement from evaluation", async () => {
    render(
      <AICoacHEvaluator
        lab={mockLab}
        part={mockPart}
        studentResponses={{ "observations-0": "Some observation text here." }}
        simState={mockSimState}
        simHistory={mockSimHistory}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/add more specific numbers/i),
      ).toBeInTheDocument();
    });
  });

  it("shows Next Part button when score >= 60", async () => {
    render(
      <AICoacHEvaluator
        lab={mockLab}
        part={mockPart}
        studentResponses={{ "observations-0": "Good answer here." }}
        simState={mockSimState}
        simHistory={mockSimHistory}
        onNextPart={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/next part/i)).toBeInTheDocument();
    });
  });

  // ─── Low-score path ─────────────────────────────────────────────────────────────

  it("shows Revise & Retry button when score < 60 and onRetry is provided", async () => {
    const { evaluateStudentWork } = await import("../services/openai");
    vi.mocked(evaluateStudentWork).mockResolvedValueOnce({
      overallScore: 45,
      feedback: "Needs more detail.",
      strengths: [],
      areasForImprovement: ["Be more specific"],
      guidance: "Try again.",
    });

    const onRetry = vi.fn();
    render(
      <AICoacHEvaluator
        lab={mockLab}
        part={mockPart}
        studentResponses={{ "observations-0": "Short answer." }}
        simState={mockSimState}
        simHistory={mockSimHistory}
        onRetry={onRetry}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/revise & retry/i)).toBeInTheDocument();
    });
  });

  it("calls onRetry when Revise & Retry is clicked", async () => {
    const { evaluateStudentWork } = await import("../services/openai");
    vi.mocked(evaluateStudentWork).mockResolvedValueOnce({
      overallScore: 40,
      feedback: "Insufficient.",
      strengths: [],
      areasForImprovement: ["More depth needed"],
      guidance: "Revisit observations.",
    });

    const onRetry = vi.fn();
    render(
      <AICoacHEvaluator
        lab={mockLab}
        part={mockPart}
        studentResponses={{ "observations-0": "Minimal answer." }}
        simState={mockSimState}
        simHistory={mockSimHistory}
        onRetry={onRetry}
      />,
    );

    await waitFor(() => screen.getByText(/revise & retry/i));
    await userEvent.click(screen.getByText(/revise & retry/i));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("does not show Next Part button when score < 60", async () => {
    const { evaluateStudentWork } = await import("../services/openai");
    vi.mocked(evaluateStudentWork).mockResolvedValueOnce({
      overallScore: 55,
      feedback: "Incomplete work.",
      strengths: [],
      areasForImprovement: ["Add more detail"],
      guidance: "Try again.",
    });

    render(
      <AICoacHEvaluator
        lab={mockLab}
        part={mockPart}
        studentResponses={{ "observations-0": "Too brief." }}
        simState={mockSimState}
        simHistory={mockSimHistory}
        onRetry={vi.fn()}
      />,
    );

    await waitFor(() => screen.getByText(/revise & retry/i));
    expect(screen.queryByText(/next part/i)).not.toBeInTheDocument();
  });

  // ─── Fallback banner when AI unavailable ──────────────────────────────────────

  // it("shows fallback banner and Retry with AI button when evaluateStudentWork fails", async () => {
  //   const { evaluateStudentWork } = await import("../services/openai");
  //   vi.mocked(evaluateStudentWork).mockRejectedValueOnce(
  //     new Error(
  //       "AI Coach is busy right now. Please wait a moment and try again.",
  //     ),
  //   );
  //
  //   render(
  //     <AICoacHEvaluator
  //       lab={mockLab}
  //       part={mockPart}
  //       studentResponses={{ "observations-0": "Some answer." }}
  //       simState={mockSimState}
  //       simHistory={mockSimHistory}
  //     />,
  //   );
  //
  //   await waitFor(() => {
  //     expect(
  //       screen.getByText(/ai evaluation unavailable/i),
  //     ).toBeInTheDocument();
  //     expect(screen.getByText(/retry with ai/i)).toBeInTheDocument();
  //   });
  // });

  // it("still shows an estimated score when evaluateStudentWork fails", async () => {
  //   const { evaluateStudentWork } = await import("../services/openai");
  //   vi.mocked(evaluateStudentWork).mockRejectedValueOnce(
  //     new Error("Network error"),
  //   );
  //
  //   render(
  //     <AICoacHEvaluator
  //       lab={mockLab}
  //       part={mockPart}
  //       studentResponses={{ "observations-0": "An observation." }}
  //       simState={mockSimState}
  //       simHistory={mockSimHistory}
  //     />,
  //   );

    // Local fallback score rendered as a % string between 0–100
  //   await waitFor(() => {
  //     const percentEl = screen.getByText(/%$/);
  //     const score = parseInt(percentEl.textContent ?? "0");
  //     expect(score).toBeGreaterThanOrEqual(0);
  //     expect(score).toBeLessThanOrEqual(100);
  //   });
  // });

  // ─── Backend guidance panel ───────────────────────────────────────────────────

  // it("renders backend guidance text when getGuidance succeeds", async () => {
  //   render(
  //     <AICoacHEvaluator
  //       lab={mockLab}
  //       part={mockPart}
  //       studentResponses={{ "observations-0": "My detailed answer." }}
  //       simState={mockSimState}
  //       simHistory={mockSimHistory}
  //     />,
  //   );
  //
  //   await waitFor(() => {
  //     expect(screen.getByText(/mock backend guidance/i)).toBeInTheDocument();
  //   });
  // });

  it("still renders evaluation when getGuidance fails", async () => {
    const { getGuidance } = await import("../services/api");
    vi.mocked(getGuidance).mockRejectedValueOnce(new Error("Backend down"));

    render(
      <AICoacHEvaluator
        lab={mockLab}
        part={mockPart}
        studentResponses={{ "observations-0": "My answer here." }}
        simState={mockSimState}
        simHistory={mockSimHistory}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("85%")).toBeInTheDocument();
    });
  });

  // ─── simHistory integration ────────────────────────────────────────────────────

  it("renders correctly with empty simHistory (no snapshot fallback)", async () => {
    render(
      <AICoacHEvaluator
        lab={mockLab}
        part={mockPart}
        studentResponses={{ "observations-0": "Observation." }}
        simState={mockSimState}
        simHistory={[]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("85%")).toBeInTheDocument();
    });
  });
});
