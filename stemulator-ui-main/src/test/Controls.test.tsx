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

  // ─── Environment buttons ─────────────────────────────────────────────────────────────────

  it("renders all three environment options", () => {
    render(
      <Controls
        state={baseState}
        onRunGeneration={onRunGeneration}
        onReset={onReset}
        onUpdateSettings={onUpdate}
      />,
    );
    expect(screen.getByText("Forest")).toBeInTheDocument();
    expect(screen.getByText("Desert")).toBeInTheDocument();
    expect(screen.getByText("Arctic")).toBeInTheDocument();
  });

  it("calls onUpdateSettings with desert environment when Desert is clicked", () => {
    render(
      <Controls
        state={baseState}
        onRunGeneration={onRunGeneration}
        onReset={onReset}
        onUpdateSettings={onUpdate}
      />,
    );
    fireEvent.click(screen.getByText("Desert"));
    expect(onUpdate).toHaveBeenCalledWith({ environment: "desert" });
  });

  it("calls onUpdateSettings with arctic environment when Arctic is clicked", () => {
    render(
      <Controls
        state={baseState}
        onRunGeneration={onRunGeneration}
        onReset={onReset}
        onUpdateSettings={onUpdate}
      />,
    );
    fireEvent.click(screen.getByText("Arctic"));
    expect(onUpdate).toHaveBeenCalledWith({ environment: "arctic" });
  });

  it("calls onUpdateSettings with forest environment when Forest is clicked", () => {
    render(
      <Controls
        state={{ ...baseState, environment: "desert" }}
        onRunGeneration={onRunGeneration}
        onReset={onReset}
        onUpdateSettings={onUpdate}
      />,
    );
    fireEvent.click(screen.getByText("Forest"));
    expect(onUpdate).toHaveBeenCalledWith({ environment: "forest" });
  });

  // ─── Predation buttons ────────────────────────────────────────────────────────────────

  it("renders all three predation levels", () => {
    render(
      <Controls
        state={baseState}
        onRunGeneration={onRunGeneration}
        onReset={onReset}
        onUpdateSettings={onUpdate}
      />,
    );
    expect(screen.getByText("Few")).toBeInTheDocument();
    expect(screen.getByText("Some")).toBeInTheDocument();
    expect(screen.getByText("Many")).toBeInTheDocument();
  });

  it("calls onUpdateSettings with predation high when Many is clicked", () => {
    render(
      <Controls
        state={baseState}
        onRunGeneration={onRunGeneration}
        onReset={onReset}
        onUpdateSettings={onUpdate}
      />,
    );
    fireEvent.click(screen.getByText("Many"));
    expect(onUpdate).toHaveBeenCalledWith({ predation: "high" });
  });

  it("calls onUpdateSettings with predation low when Few is clicked", () => {
    render(
      <Controls
        state={baseState}
        onRunGeneration={onRunGeneration}
        onReset={onReset}
        onUpdateSettings={onUpdate}
      />,
    );
    fireEvent.click(screen.getByText("Few"));
    expect(onUpdate).toHaveBeenCalledWith({ predation: "low" });
  });

  // ─── Food availability buttons ─────────────────────────────────────────────────────

  it("renders all three food availability levels", () => {
    render(
      <Controls
        state={baseState}
        onRunGeneration={onRunGeneration}
        onReset={onReset}
        onUpdateSettings={onUpdate}
      />,
    );
    expect(screen.getByText("Scarce")).toBeInTheDocument();
    expect(screen.getByText("Normal")).toBeInTheDocument();
    expect(screen.getByText("Abundant")).toBeInTheDocument();
  });

  it("calls onUpdateSettings with foodAvailability high when Abundant is clicked", () => {
    render(
      <Controls
        state={baseState}
        onRunGeneration={onRunGeneration}
        onReset={onReset}
        onUpdateSettings={onUpdate}
      />,
    );
    fireEvent.click(screen.getByText("Abundant"));
    expect(onUpdate).toHaveBeenCalledWith({ foodAvailability: "high" });
  });

  it("calls onUpdateSettings with foodAvailability low when Scarce is clicked", () => {
    render(
      <Controls
        state={baseState}
        onRunGeneration={onRunGeneration}
        onReset={onReset}
        onUpdateSettings={onUpdate}
      />,
    );
    fireEvent.click(screen.getByText("Scarce"));
    expect(onUpdate).toHaveBeenCalledWith({ foodAvailability: "low" });
  });

  // ─── Mutation rate slider ─────────────────────────────────────────────────────────

  it("displays 0% when mutationRate is 0", () => {
    render(
      <Controls
        state={{ ...baseState, mutationRate: 0 }}
        onRunGeneration={onRunGeneration}
        onReset={onReset}
        onUpdateSettings={onUpdate}
      />,
    );
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("displays 100% when mutationRate is 10", () => {
    render(
      <Controls
        state={{ ...baseState, mutationRate: 10 }}
        onRunGeneration={onRunGeneration}
        onReset={onReset}
        onUpdateSettings={onUpdate}
      />,
    );
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("calls onUpdateSettings with new mutationRate when slider changes", () => {
    render(
      <Controls
        state={baseState}
        onRunGeneration={onRunGeneration}
        onReset={onReset}
        onUpdateSettings={onUpdate}
      />,
    );
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "8" } });
    expect(onUpdate).toHaveBeenCalledWith({ mutationRate: 8 });
  });

  // ─── Population summary ──────────────────────────────────────────────────────────

  it("displays prey and predator counts from organism list", () => {
    const organisms = [
      ...Array.from({ length: 10 }, (_, i) => ({
        id: i,
        x: 0,
        y: 0,
        speed: 5,
        camouflage: 5,
        size: 5,
        alive: true,
        role: "prey" as const,
      })),
      ...Array.from({ length: 3 }, (_, i) => ({
        id: 100 + i,
        x: 0,
        y: 0,
        speed: 5,
        camouflage: 5,
        size: 5,
        alive: true,
        role: "predator" as const,
      })),
    ];
    render(
      <Controls
        state={{ ...baseState, organisms }}
        onRunGeneration={onRunGeneration}
        onReset={onReset}
        onUpdateSettings={onUpdate}
      />,
    );
    expect(screen.getByText("10")).toBeInTheDocument(); // prey count
    expect(screen.getByText("3")).toBeInTheDocument(); // predator count
  });

  it("does not count dead organisms in prey or predator totals", () => {
    const organisms = [
      {
        id: 1,
        x: 0,
        y: 0,
        speed: 5,
        camouflage: 5,
        size: 5,
        alive: true,
        role: "prey" as const,
      },
      {
        id: 2,
        x: 0,
        y: 0,
        speed: 5,
        camouflage: 5,
        size: 5,
        alive: false,
        role: "prey" as const,
      },
      {
        id: 3,
        x: 0,
        y: 0,
        speed: 5,
        camouflage: 5,
        size: 5,
        alive: true,
        role: "predator" as const,
      },
    ];
    render(
      <Controls
        state={{ ...baseState, organisms }}
        onRunGeneration={onRunGeneration}
        onReset={onReset}
        onUpdateSettings={onUpdate}
      />,
    );
    // Only 1 alive prey and 1 alive predator
    const counts = screen.getAllByText("1");
    expect(counts.length).toBeGreaterThanOrEqual(2);
  });
});
