import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Controls from "../components/Controls";
import { SimulationState } from "../types";

// Mock lucide-react icons to avoid SVG rendering issues in jsdom
vi.mock("lucide-react", () => ({
  Play: () => null,
  RotateCcw: () => null,
  TreePine: () => null,
  Sun: () => null,
  Snowflake: () => null,
  Dna: () => null,
}));

const baseState: SimulationState = {
  generation: 0,
  organisms: [],
  environment: "forest",
  predation: "medium",
  foodAvailability: "medium",
  mutationRate: 5,
  populationHistory: [],
  traitDistribution: { speed: [], camouflage: [], size: [] },
  survivalRate: 0,
  actions: [],
};

describe("Controls", () => {
  const onRunGeneration = vi.fn();
  const onReset = vi.fn();
  const onUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Next Generation button", () => {
    render(
      <Controls
        state={baseState}
        onRunGeneration={onRunGeneration}
        onReset={onReset}
        onUpdateSettings={onUpdate}
      />,
    );
    expect(screen.getByText(/next generation/i)).toBeInTheDocument();
  });

  it("renders Reset button", () => {
    render(
      <Controls
        state={baseState}
        onRunGeneration={onRunGeneration}
        onReset={onReset}
        onUpdateSettings={onUpdate}
      />,
    );
    expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
  });

  it("calls onRunGeneration when Next Generation is clicked", () => {
    render(
      <Controls
        state={baseState}
        onRunGeneration={onRunGeneration}
        onReset={onReset}
        onUpdateSettings={onUpdate}
      />,
    );
    fireEvent.click(screen.getByText(/next generation/i));
    expect(onRunGeneration).toHaveBeenCalledTimes(1);
  });

  it("calls onReset when Reset is clicked", () => {
    render(
      <Controls
        state={baseState}
        onRunGeneration={onRunGeneration}
        onReset={onReset}
        onUpdateSettings={onUpdate}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /reset/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("displays mutation rate as a percentage", () => {
    render(
      <Controls
        state={baseState}
        onRunGeneration={onRunGeneration}
        onReset={onReset}
        onUpdateSettings={onUpdate}
      />,
    );
    // mutationRate=5 is displayed as 50%
    expect(screen.getByText("50%")).toBeInTheDocument();
  });
});
