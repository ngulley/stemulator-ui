import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AICoacHEvaluator from "../components/AICoacHEvaluator";
import { ScienceLab, SimulationState, LabPart } from "../types";

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
}));

vi.mock("lucide-react", () => ({
  Brain: () => null,
  CheckCircle2: () => null,
  AlertCircle: () => null,
  Lightbulb: () => null,
  ArrowRight: () => null,
  Sparkles: () => null,
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
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/next part/i)).toBeInTheDocument();
    });
  });
});
