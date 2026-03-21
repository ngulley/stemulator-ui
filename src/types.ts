export interface Organism {
  id: number;
  x: number;
  y: number;
  speed: number; // 0-10
  camouflage: number; // 0-10
  size: number; // 0-10
  alive: boolean;
  role?: "predator" | "prey";
}

export interface SimulationState {
  generation: number;
  organisms: Organism[];
  environment: "forest" | "desert" | "arctic";
  predation: "low" | "medium" | "high";
  foodAvailability: "low" | "medium" | "high";
  mutationRate: number; // 0-10
  populationHistory: number[];
  traitDistribution: { speed: number[]; camouflage: number[]; size: number[] };
  survivalRate: number;
  actions: string[];
}

export interface LabSnapshot {
  environment: string;
  parameters: {
    predation: string;
    foodAvailability: string;
    mutationRate: number;
  };
  currentPopulation: number;
  last10Actions: string[];
}

/**
 * A single snapshot of simulation state at a point in time.
 * Used to build the history array passed to the guidance API.
 * index 0 = initial state when lab part loaded; index length-1 = current state.
 */
export interface SimStateSnapshot {
  generation: number;
  environment: string;
  predation: string;
  foodAvailability: string;
  mutationRate: number;
  totalPopulation: number;
  preyCount: number;
  predatorCount: number;
  survivalRate: number;
  avgSpeed: number;
  avgCamouflage: number;
  avgSize: number;
  /** User-triggered actions that led TO this state (e.g. "Run Generation", settings changes) */
  actions: string[];
  /** Student responses captured at submission time (only present on the final snapshot) */
  studentResponses?: Record<string, string>;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  lessons: string[];
}

export interface Course {
  id: string;
  title: string;
  subject: "Physics" | "Chemistry";
  description: string;
  modules: Module[];
  labs: ScienceLab[];
}

export interface Lab {
  id: string;
  title: string;
  topic: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  description: string;
}
export interface LearningGoals {
  bigIdea: string;
  objectives: string[];
  successCriteria: string[];
}

export interface LabPart {
  partId: number;
  title: string;
  setup: string[];
  observations: string[];
  evidence: string[];
  predictions: string[];
}

export interface ScienceLab {
  _id: string;
  labId?: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  discipline: string;
  topic: string;
  subTopic: string;
  description: string;
  learningGoals: LearningGoals;
  labParts: LabPart[];
  _class?: string;
}
