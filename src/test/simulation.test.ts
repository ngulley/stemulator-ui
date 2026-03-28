import { describe, it, expect, beforeEach } from "vitest";
import { Simulation } from "../simulation";

describe("Simulation", () => {
  let sim: Simulation;

  beforeEach(() => {
    sim = new Simulation();
  });

  // ─── Initial state ───────────────────────────────────────────────────────────

  describe("initial state", () => {
    it("starts at generation 0", () => {
      expect(sim.getState().generation).toBe(0);
    });

    it("initializes with ~50 organisms", () => {
      const { organisms } = sim.getState();
      expect(organisms.length).toBeGreaterThanOrEqual(45);
      expect(organisms.length).toBeLessThanOrEqual(55);
    });

    it("initializes with ~85% prey and ~15% predators", () => {
      const { organisms } = sim.getState();
      const prey = organisms.filter((o) => o.role !== "predator");
      const predators = organisms.filter((o) => o.role === "predator");
      expect(prey.length).toBeGreaterThan(predators.length);
      expect(predators.length).toBeGreaterThan(0);
    });

    it("starts with default forest environment", () => {
      expect(sim.getState().environment).toBe("forest");
    });

    it("starts with medium predation and food", () => {
      const state = sim.getState();
      expect(state.predation).toBe("medium");
      expect(state.foodAvailability).toBe("medium");
    });

    it("starts with mutationRate 5", () => {
      expect(sim.getState().mutationRate).toBe(5);
    });

    it("all organisms start alive", () => {
      const { organisms } = sim.getState();
      expect(organisms.every((o) => o.alive)).toBe(true);
    });

    it("all organisms have traits in range 0–10", () => {
      const { organisms } = sim.getState();
      for (const org of organisms) {
        expect(org.speed).toBeGreaterThanOrEqual(0);
        expect(org.speed).toBeLessThanOrEqual(10);
        expect(org.camouflage).toBeGreaterThanOrEqual(0);
        expect(org.camouflage).toBeLessThanOrEqual(10);
        expect(org.size).toBeGreaterThanOrEqual(0);
        expect(org.size).toBeLessThanOrEqual(10);
      }
    });
  });

  // ─── runGeneration ────────────────────────────────────────────────────────────

  describe("runGeneration()", () => {
    it("increments generation counter by 1", () => {
      sim.runGeneration();
      expect(sim.getState().generation).toBe(1);
    });

    it("increments generation counter cumulatively", () => {
      sim.runGeneration();
      sim.runGeneration();
      sim.runGeneration();
      expect(sim.getState().generation).toBe(3);
    });

    it("logs an action entry for each generation", () => {
      sim.runGeneration();
      sim.runGeneration();
      const actions = sim.getState().actions;
      // Last two entries should mention Gen 1 and Gen 2
      expect(actions.some((a) => a.includes("Gen 1:"))).toBe(true);
      expect(actions.some((a) => a.includes("Gen 2:"))).toBe(true);
    });

    it("records population history after each generation", () => {
      sim.runGeneration();
      expect(sim.getState().populationHistory.length).toBe(1);
      sim.runGeneration();
      expect(sim.getState().populationHistory.length).toBe(2);
    });

    it("prey population stays at or below cap of 120", () => {
      for (let i = 0; i < 20; i++) sim.runGeneration();
      const prey = sim
        .getState()
        .organisms.filter((o) => o.role !== "predator");
      expect(prey.length).toBeLessThanOrEqual(120);
    });

    it("predator population stays at or below cap of 25", () => {
      for (let i = 0; i < 20; i++) sim.runGeneration();
      const preds = sim
        .getState()
        .organisms.filter((o) => o.role === "predator");
      expect(preds.length).toBeLessThanOrEqual(25);
    });

    it("maintains minimum predators based on medium predation setting", () => {
      // Run many generations — predators should never drop below 3 (medium floor)
      for (let i = 0; i < 30; i++) sim.runGeneration();
      const alivePreds = sim
        .getState()
        .organisms.filter((o) => o.role === "predator" && o.alive);
      expect(alivePreds.length).toBeGreaterThanOrEqual(3);
    });

    it("offspring traits stay within 0–10 range after mutation", () => {
      for (let i = 0; i < 5; i++) sim.runGeneration();
      const { organisms } = sim.getState();
      for (const org of organisms) {
        expect(org.speed).toBeGreaterThanOrEqual(0);
        expect(org.speed).toBeLessThanOrEqual(10);
        expect(org.camouflage).toBeGreaterThanOrEqual(0);
        expect(org.camouflage).toBeLessThanOrEqual(10);
        expect(org.size).toBeGreaterThanOrEqual(0);
        expect(org.size).toBeLessThanOrEqual(10);
      }
    });
  });

  // ─── updateSettings ───────────────────────────────────────────────────────────

  describe("updateSettings()", () => {
    it("updates environment", () => {
      sim.updateSettings({ environment: "desert" });
      expect(sim.getState().environment).toBe("desert");
    });

    it("updates predation level", () => {
      sim.updateSettings({ predation: "high" });
      expect(sim.getState().predation).toBe("high");
    });

    it("updates foodAvailability", () => {
      sim.updateSettings({ foodAvailability: "low" });
      expect(sim.getState().foodAvailability).toBe("low");
    });

    it("updates mutationRate", () => {
      sim.updateSettings({ mutationRate: 9 });
      expect(sim.getState().mutationRate).toBe(9);
    });

    it("logs a settings update action", () => {
      sim.updateSettings({ environment: "arctic" });
      const actions = sim.getState().actions;
      expect(actions.some((a) => a.includes("Settings updated"))).toBe(true);
      expect(actions.some((a) => a.includes("arctic"))).toBe(true);
    });

    it("partial update does not overwrite unrelated fields", () => {
      sim.updateSettings({ environment: "arctic" });
      expect(sim.getState().predation).toBe("medium"); // unchanged
      expect(sim.getState().foodAvailability).toBe("medium"); // unchanged
    });
  });

  // ─── reset ────────────────────────────────────────────────────────────────────

  describe("reset()", () => {
    it("resets generation to 0", () => {
      sim.runGeneration();
      sim.runGeneration();
      sim.reset();
      expect(sim.getState().generation).toBe(0);
    });

    it("clears population history", () => {
      sim.runGeneration();
      sim.reset();
      expect(sim.getState().populationHistory).toHaveLength(0);
    });

    it("clears actions log", () => {
      sim.runGeneration();
      sim.reset();
      expect(sim.getState().actions).toHaveLength(0);
    });

    it("resets environment to forest", () => {
      sim.updateSettings({ environment: "arctic" });
      sim.reset();
      expect(sim.getState().environment).toBe("forest");
    });

    it("reinitializes organisms", () => {
      const beforeIds = sim.getState().organisms.map((o) => o.id);
      sim.runGeneration();
      sim.runGeneration();
      sim.reset();
      const afterIds = sim.getState().organisms.map((o) => o.id);
      // After reset, id set is small again (original 50-ish)
      expect(afterIds.length).toBeLessThan(beforeIds.length + 10);
    });
  });

  // ─── getLabSnapshot ───────────────────────────────────────────────────────────

  describe("getLabSnapshot()", () => {
    it("returns current environment", () => {
      sim.updateSettings({ environment: "desert" });
      expect(sim.getLabSnapshot().environment).toBe("desert");
    });

    it("returns current parameters", () => {
      sim.updateSettings({
        predation: "low",
        foodAvailability: "high",
        mutationRate: 2,
      });
      const snap = sim.getLabSnapshot();
      expect(snap.parameters.predation).toBe("low");
      expect(snap.parameters.foodAvailability).toBe("high");
      expect(snap.parameters.mutationRate).toBe(2);
    });

    it("returns current alive population count", () => {
      const snap = sim.getLabSnapshot();
      const aliveCount = sim.getState().organisms.filter((o) => o.alive).length;
      expect(snap.currentPopulation).toBe(aliveCount);
    });

    it("returns at most last 10 actions", () => {
      for (let i = 0; i < 15; i++) sim.runGeneration();
      expect(sim.getLabSnapshot().last10Actions.length).toBeLessThanOrEqual(10);
    });
  });

  // ─── High predation drives selection pressure ─────────────────────────────────

  describe("selection pressure", () => {
    it("high predation reduces prey population more than low predation over 10 gens", () => {
      // Run two sims with same seed behavior — compare averages over many seeds
      // (probabilistic test: use large enough sample)
      const highResults: number[] = [];
      const lowResults: number[] = [];

      for (let trial = 0; trial < 5; trial++) {
        const highSim = new Simulation();
        highSim.updateSettings({ predation: "high", foodAvailability: "high" });
        for (let i = 0; i < 10; i++) highSim.runGeneration();
        const highPrey = highSim
          .getState()
          .organisms.filter((o) => o.role !== "predator").length;
        highResults.push(highPrey);

        const lowSim = new Simulation();
        lowSim.updateSettings({ predation: "low", foodAvailability: "high" });
        for (let i = 0; i < 10; i++) lowSim.runGeneration();
        const lowPrey = lowSim
          .getState()
          .organisms.filter((o) => o.role !== "predator").length;
        lowResults.push(lowPrey);
      }

      const avgHigh = highResults.reduce((a, b) => a + b) / highResults.length;
      const avgLow = lowResults.reduce((a, b) => a + b) / lowResults.length;
      expect(avgHigh).toBeLessThan(avgLow);
    });
  });

  // ─── applyScienceLab ─────────────────────────────────────────────────────────

  describe("applyScienceLab()", () => {
    const makeLab = (setupLines: string[]) => ({
      _id: "test-lab",
      title: "Test Lab",
      discipline: "Life Science",
      topic: "Evolution",
      subTopic: "Natural Selection",
      description: "",
      difficulty: "Intermediate" as const,
      learningGoals: { bigIdea: "", objectives: [], successCriteria: [] },
      labParts: [
        {
          partId: 1,
          title: "Part 1",
          setup: setupLines,
          observations: [],
          evidence: [],
          predictions: [],
        },
      ],
    });

    it("sets environment to desert when setup mentions 'desert'", () => {
      sim.applyScienceLab(makeLab(["Set habitat to desert"]), 1);
      expect(sim.getState().environment).toBe("desert");
    });

    it("sets environment to arctic when setup mentions 'arctic'", () => {
      sim.applyScienceLab(makeLab(["Snowy arctic biome"]), 1);
      expect(sim.getState().environment).toBe("arctic");
    });

    it("sets environment to desert when setup mentions 'rocky'", () => {
      sim.applyScienceLab(makeLab(["Rocky terrain with sparse cover"]), 1);
      expect(sim.getState().environment).toBe("desert");
    });

    it("sets predation to high when setup mentions 'wolves'", () => {
      sim.applyScienceLab(makeLab(["Introduce wolves into the ecosystem"]), 1);
      expect(sim.getState().predation).toBe("high");
    });

    it("sets predation to high when setup mentions 'predator'", () => {
      sim.applyScienceLab(makeLab(["Add predator pressure"]), 1);
      expect(sim.getState().predation).toBe("high");
    });

    it("sets foodAvailability to low when setup mentions 'tough food'", () => {
      sim.applyScienceLab(makeLab(["Tough food conditions apply"]), 1);
      expect(sim.getState().foodAvailability).toBe("low");
    });

    it("sets mutationRate to 8 when setup mentions 'mutat'", () => {
      sim.applyScienceLab(makeLab(["High mutation rate experiment"]), 1);
      expect(sim.getState().mutationRate).toBe(8);
    });

    it("resets populationHistory to empty", () => {
      sim.runGeneration();
      sim.runGeneration();
      sim.applyScienceLab(makeLab(["Desert habitat"]), 1);
      expect(sim.getState().populationHistory).toHaveLength(0);
    });

    it("reinitializes organisms after applying lab", () => {
      const before = sim.getState().organisms.map((o) => o.id);
      // Run some gens to dirty the state, then apply lab
      for (let i = 0; i < 5; i++) sim.runGeneration();
      sim.applyScienceLab(makeLab(["Standard setup"]), 1);
      const after = sim.getState().organisms;
      expect(after.length).toBeGreaterThan(0);
      // Max id after reset should be small again (fresh 50-org init)
      expect(Math.max(...after.map((o) => o.id))).toBeLessThan(60);
      expect(before).toBeDefined(); // suppress unused-var lint
    });

    it("logs an action entry after applying lab", () => {
      sim.applyScienceLab(makeLab(["Setup"]), 1);
      expect(
        sim.getState().actions.some((a) => a.includes("Applied lab")),
      ).toBe(true);
    });
  });

  // ─── Environment trait bias ───────────────────────────────────────────────────

  describe("environment trait bias", () => {
    it("arctic organisms tend to have higher size than desert organisms", () => {
      const avgTrait = (
        environment: "forest" | "desert" | "arctic",
        trait: "size" | "speed" | "camouflage",
      ) => {
        const s = new Simulation();
        s.updateSettings({ environment });
        // Force re-init by applying a trivial lab
        const lab = {
          _id: "t",
          title: "",
          discipline: "",
          topic: "",
          subTopic: "",
          description: "",
          difficulty: "Beginner" as const,
          learningGoals: { bigIdea: "", objectives: [], successCriteria: [] },
          labParts: [
            {
              partId: 1,
              title: "",
              setup: [environment === "arctic" ? "arctic" : environment],
              observations: [],
              evidence: [],
              predictions: [],
            },
          ],
        };
        s.applyScienceLab(lab, 1);
        const prey = s
          .getState()
          .organisms.filter((o) => o.role !== "predator");
        return prey.reduce((sum, o) => sum + o[trait], 0) / prey.length;
      };

      const arcticSize = avgTrait("arctic", "size");
      const desertSize = avgTrait("desert", "size");
      // Arctic biases +size, desert biases -size
      expect(arcticSize).toBeGreaterThan(desertSize);
    });
  });

  // ─── Food scarcity ────────────────────────────────────────────────────────────

  describe("food scarcity", () => {
    it("scarce food results in lower prey population than abundant food over 10 gens", () => {
      const scarcePops: number[] = [];
      const abundantPops: number[] = [];

      for (let trial = 0; trial < 5; trial++) {
        const scarce = new Simulation();
        scarce.updateSettings({ predation: "low", foodAvailability: "low" });
        for (let i = 0; i < 10; i++) scarce.runGeneration();
        scarcePops.push(
          scarce.getState().organisms.filter((o) => o.role !== "predator")
            .length,
        );

        const abundant = new Simulation();
        abundant.updateSettings({ predation: "low", foodAvailability: "high" });
        for (let i = 0; i < 10; i++) abundant.runGeneration();
        abundantPops.push(
          abundant.getState().organisms.filter((o) => o.role !== "predator")
            .length,
        );
      }

      const avgScarce = scarcePops.reduce((a, b) => a + b) / scarcePops.length;
      const avgAbundant =
        abundantPops.reduce((a, b) => a + b) / abundantPops.length;
      expect(avgScarce).toBeLessThan(avgAbundant);
    });
  });

  // ─── getState() immutability ──────────────────────────────────────────────────

  describe("getState() returns a shallow copy", () => {
    it("mutating the returned state does not affect internal state", () => {
      const state = sim.getState();
      const originalGen = state.generation;
      // Attempt to mutate the copy
      (state as { generation: number }).generation = 999;
      expect(sim.getState().generation).toBe(originalGen);
    });
  });

  // ─── survivalRate ─────────────────────────────────────────────────────────────

  describe("survivalRate", () => {
    it("survivalRate is a number between 0 and 1 after running a generation", () => {
      sim.runGeneration();
      const { survivalRate } = sim.getState();
      expect(survivalRate).toBeGreaterThanOrEqual(0);
      expect(survivalRate).toBeLessThanOrEqual(1);
    });

    it("survivalRate under high predation is not higher than under low predation on average", () => {
      const rates: { high: number[]; low: number[] } = { high: [], low: [] };
      for (let trial = 0; trial < 4; trial++) {
        const hi = new Simulation();
        hi.updateSettings({ predation: "high", foodAvailability: "high" });
        for (let i = 0; i < 5; i++) hi.runGeneration();
        rates.high.push(hi.getState().survivalRate);

        const lo = new Simulation();
        lo.updateSettings({ predation: "low", foodAvailability: "high" });
        for (let i = 0; i < 5; i++) lo.runGeneration();
        rates.low.push(lo.getState().survivalRate);
      }
      const avgHigh = rates.high.reduce((a, b) => a + b) / rates.high.length;
      const avgLow = rates.low.reduce((a, b) => a + b) / rates.low.length;
      expect(avgHigh).toBeLessThanOrEqual(avgLow + 0.05); // allow small noise margin
    });
  });
});
