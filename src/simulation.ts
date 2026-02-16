import { Organism, SimulationState, ScienceLab, LabSnapshot } from "./types";

export class Simulation {
  private state: SimulationState;

  constructor() {
    this.state = {
      generation: 0,
      organisms: this.initializePopulation(),
      environment: "forest",
      predation: "medium",
      foodAvailability: "medium",
      mutationRate: 5,
      populationHistory: [],
      traitDistribution: { speed: [], camouflage: [], size: [] },
      survivalRate: 0,
      actions: [],
    };
  }

  private initializePopulation(
    count = 50,
    options?: { environment?: string; favorWhiteFur?: boolean },
  ): Organism[] {
    const organisms: Organism[] = [];

    // Initialize prey (85% of population)
    const preyCount = Math.floor(count * 0.85);
    for (let i = 0; i < preyCount; i++) {
      let baseSpeed = Math.random() * 10;
      let baseCamouflage = Math.random() * 10;
      let baseSize = Math.random() * 10;

      if (options?.environment === "desert") {
        baseSpeed = Math.min(10, baseSpeed + Math.random() * 2);
        baseSize = Math.max(0, baseSize - Math.random() * 3);
      } else if (options?.environment === "arctic") {
        baseSize = Math.min(10, baseSize + Math.random() * 3);
      }

      if (options?.favorWhiteFur && options.environment === "arctic") {
        baseCamouflage = Math.max(7, baseCamouflage);
      }

      organisms.push({
        id: i,
        x: Math.random() * 800,
        y: Math.random() * 600,
        speed: Math.max(0, Math.min(10, baseSpeed)),
        camouflage: Math.max(0, Math.min(10, baseCamouflage)),
        size: Math.max(0, Math.min(10, baseSize)),
        alive: true,
        role: "prey",
      });
    }

    // Initialize predators (15% of population)
    const predatorCount = count - preyCount;
    for (let i = 0; i < predatorCount; i++) {
      organisms.push({
        id: preyCount + i,
        x: Math.random() * 800,
        y: Math.random() * 600,
        speed: Math.random() * 10,
        camouflage: Math.random() * 10,
        size: Math.random() * 10,
        alive: true,
        role: "predator",
      });
    }

    return organisms;
  }

  getState(): SimulationState {
    return { ...this.state };
  }

  updateSettings(
    settings: Partial<
      Pick<
        SimulationState,
        "environment" | "predation" | "foodAvailability" | "mutationRate"
      >
    >,
  ) {
    Object.assign(this.state, settings);
    this.state.actions.push(`Settings updated: ${JSON.stringify(settings)}`);
  }

  applyScienceLab(lab: ScienceLab, partId?: number) {
    const parts = partId
      ? lab.labParts.filter((p) => p.partId === partId)
      : lab.labParts;

    const combinedSettings: Partial<
      Pick<
        SimulationState,
        "environment" | "predation" | "foodAvailability" | "mutationRate"
      >
    > = {};
    let favorWhiteFur = false;

    parts.forEach((part) => {
      part.setup.forEach((line) => {
        const text = line.toLowerCase();
        if (text.includes("desert")) combinedSettings.environment = "desert";
        if (
          text.includes("snow") ||
          text.includes("snowy") ||
          text.includes("arctic")
        )
          combinedSettings.environment = "arctic";
        if (text.includes("rocky")) combinedSettings.environment = "desert";
        if (text.includes("mix of fur") || text.includes("fur colors")) {
          // keep default mixed population
        }
        if (
          text.includes("wolves") ||
          text.includes("predator") ||
          text.includes("introduce wolves")
        ) {
          combinedSettings.predation = "high";
        }
        if (text.includes("food availability") && text.includes("tough")) {
          combinedSettings.foodAvailability = "low";
        }
        if (text.includes("tough food"))
          combinedSettings.foodAvailability = "low";
        if (text.includes("mutat")) combinedSettings.mutationRate = 8;
        if (text.includes("white fur")) favorWhiteFur = true;
        if (
          text.includes("observe the population changes over 10 generations") &&
          !combinedSettings.mutationRate
        ) {
          // keep mutation rate as-is unless mutations are specified
        }
      });
    });

    // Apply reasonable defaults if not specified
    if (!combinedSettings.environment)
      combinedSettings.environment = this.state.environment;
    if (!combinedSettings.predation)
      combinedSettings.predation = this.state.predation;
    if (!combinedSettings.foodAvailability)
      combinedSettings.foodAvailability = this.state.foodAvailability;
    if (!combinedSettings.mutationRate && combinedSettings.mutationRate !== 0)
      combinedSettings.mutationRate = this.state.mutationRate;

    // Update state settings
    this.updateSettings(combinedSettings);

    // Reinitialize population to reflect environment / favored traits
    this.state.organisms = this.initializePopulation(50, {
      environment: combinedSettings.environment,
      favorWhiteFur,
    });

    this.state.populationHistory = [];
    this.state.actions.push(`Applied lab ${lab._id} part ${partId ?? "all"}`);
  }

  runGeneration() {
    this.state.generation++;
    this.survive();
    this.reproduce();
    this.updateStats();
    this.state.actions.push(
      `Gen ${this.state.generation}: ${this.state.organisms.filter((o) => o.alive).length} alive`,
    );
  }

  private survive() {
    // --- Predation pressure on prey ---
    // Higher predation → more prey die, but traits help
    const predationPressure = { low: 0.08, medium: 0.18, high: 0.3 }[
      this.state.predation
    ];
    // Food scarcity penalty
    const foodPenalty = { low: 0.15, medium: 0.05, high: 0.0 }[
      this.state.foodAvailability
    ];
    // Environment-specific trait bonuses
    const envBonus = {
      forest: { speed: 0, camouflage: 3, size: 0 },
      desert: { speed: 2, camouflage: 0, size: -1 },
      arctic: { speed: 0, camouflage: 1, size: 2 },
    }[this.state.environment];

    const prey = this.state.organisms.filter(
      (o) => o.alive && o.role !== "predator",
    );
    const predators = this.state.organisms.filter(
      (o) => o.alive && o.role === "predator",
    );

    // ── Prey survival ──
    prey.forEach((org) => {
      // Base survival is high (rabbits are good at surviving when unmolested)
      let survivalProb = 0.75;

      // Traits help: each trait (0-10) mapped into a bonus
      const effectiveSpeed = org.speed + envBonus.speed;
      const effectiveCamo = org.camouflage + envBonus.camouflage;
      const effectiveSize = org.size + envBonus.size;

      survivalProb += effectiveSpeed * 0.015; // fast → harder to catch
      survivalProb += effectiveCamo * 0.02; // camo → harder to find
      survivalProb += effectiveSize * 0.008; // bigger → slightly tougher

      // Penalties
      survivalProb -= predationPressure; // wolves eat rabbits
      survivalProb -= foodPenalty; // starvation

      survivalProb = Math.max(0.05, Math.min(0.95, survivalProb));
      org.alive = Math.random() < survivalProb;
    });

    // ── Predator survival ──
    // Wolves need prey to eat — if prey is scarce, wolves starve
    const preyAlive = prey.filter((o) => o.alive).length;
    const preyRatio = prey.length > 0 ? preyAlive / prey.length : 0;

    predators.forEach((org) => {
      // Wolves survive well when there are lots of rabbits
      let survivalProb = 0.4 + preyRatio * 0.45;

      // Food availability helps predators indirectly (more plants → more prey)
      survivalProb += { low: -0.05, medium: 0.0, high: 0.05 }[
        this.state.foodAvailability
      ];

      survivalProb = Math.max(0.1, Math.min(0.9, survivalProb));
      org.alive = Math.random() < survivalProb;
    });
  }

  private reproduce() {
    const survivors = this.state.organisms.filter((o) => o.alive);
    const survivingPrey = survivors.filter((o) => o.role !== "predator");
    const survivingPredators = survivors.filter((o) => o.role === "predator");
    const newOrganisms: Organism[] = [...survivors];
    const mutation = this.state.mutationRate / 10; // 0-1 scale

    const mutate = (val: number) =>
      Math.max(0, Math.min(10, val + (Math.random() - 0.5) * mutation * 3));

    // ── Prey reproduction ──
    // Rabbits breed quickly — each survivor can produce 1-3 offspring
    // But cap total population to avoid runaway growth
    const maxPrey = 120;
    const preyOffspringRate =
      survivingPrey.length < 10
        ? 3
        : survivingPrey.length < maxPrey * 0.5
          ? 2
          : 1;

    for (const parent of survivingPrey) {
      if (newOrganisms.filter((o) => o.role !== "predator").length >= maxPrey)
        break;
      for (let c = 0; c < preyOffspringRate; c++) {
        if (newOrganisms.filter((o) => o.role !== "predator").length >= maxPrey)
          break;
        newOrganisms.push({
          id: this.state.organisms.length + newOrganisms.length,
          x: Math.random() * 780 + 10,
          y: Math.random() * 570 + 15,
          speed: mutate(parent.speed),
          camouflage: mutate(parent.camouflage),
          size: mutate(parent.size),
          alive: true,
          role: "prey",
        });
      }
    }

    // ── Predator reproduction ──
    // Wolves breed slowly — about 1 offspring per 2 survivors
    // But always maintain at least 2 predators so the sim stays interesting
    const maxPredators = 25;
    for (let i = 0; i < survivingPredators.length; i += 2) {
      const parent = survivingPredators[i];
      if (
        newOrganisms.filter((o) => o.role === "predator").length >= maxPredators
      )
        break;
      newOrganisms.push({
        id: this.state.organisms.length + newOrganisms.length,
        x: Math.random() * 780 + 10,
        y: Math.random() * 570 + 15,
        speed: mutate(parent.speed),
        camouflage: mutate(parent.camouflage),
        size: mutate(parent.size),
        alive: true,
        role: "predator",
      });
    }

    // Ensure minimum predator count based on predation setting
    const minPredators = { low: 1, medium: 3, high: 5 }[this.state.predation];
    const currentPredators = newOrganisms.filter(
      (o) => o.role === "predator",
    ).length;
    if (currentPredators < minPredators) {
      for (let i = currentPredators; i < minPredators; i++) {
        newOrganisms.push({
          id: this.state.organisms.length + newOrganisms.length,
          x: Math.random() * 780 + 10,
          y: Math.random() * 570 + 15,
          speed: 4 + Math.random() * 4,
          camouflage: 3 + Math.random() * 4,
          size: 5 + Math.random() * 4,
          alive: true,
          role: "predator",
        });
      }
    }

    this.state.organisms = newOrganisms;
  }

  private updateStats() {
    const alive = this.state.organisms.filter((o) => o.alive);
    const aliveCount = alive.length;
    const preyAlive = alive.filter((o) => o.role !== "predator");

    this.state.populationHistory.push(aliveCount);
    this.state.survivalRate =
      aliveCount > 0 ? preyAlive.length / aliveCount : 0;

    // Trait distribution — only prey (their traits are what evolve)
    this.state.traitDistribution = {
      speed: preyAlive.map((o) => o.speed),
      camouflage: preyAlive.map((o) => o.camouflage),
      size: preyAlive.map((o) => o.size),
    };
  }

  reset() {
    this.state = {
      generation: 0,
      organisms: this.initializePopulation(),
      environment: "forest",
      predation: "medium",
      foodAvailability: "medium",
      mutationRate: 5,
      populationHistory: [],
      traitDistribution: { speed: [], camouflage: [], size: [] },
      survivalRate: 0,
      actions: [],
    };
  }

  getLabSnapshot(): LabSnapshot {
    return {
      environment: this.state.environment,
      parameters: {
        predation: this.state.predation,
        foodAvailability: this.state.foodAvailability,
        mutationRate: this.state.mutationRate,
      },
      currentPopulation: this.state.organisms.filter((o) => o.alive).length,
      last10Actions: this.state.actions.slice(-10),
    };
  }
}
