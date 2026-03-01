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
});
