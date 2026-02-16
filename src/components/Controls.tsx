import React from "react";
import { Play, RotateCcw, TreePine, Sun, Snowflake, Dna } from "lucide-react";
import { SimulationState } from "../types";

interface ControlsProps {
  state: SimulationState;
  onUpdateSettings: (
    settings: Partial<
      Pick<
        SimulationState,
        "environment" | "predation" | "foodAvailability" | "mutationRate"
      >
    >,
  ) => void;
  onRunGeneration: () => void;
  onReset: () => void;
}

const envOptions: {
  value: SimulationState["environment"];
  label: string;
  icon: React.ReactNode;
  emoji: string;
}[] = [
  {
    value: "forest",
    label: "Forest",
    icon: <TreePine className="w-3.5 h-3.5" />,
    emoji: "🌲",
  },
  {
    value: "desert",
    label: "Savanna",
    icon: <Sun className="w-3.5 h-3.5" />,
    emoji: "🏜️",
  },
  {
    value: "arctic",
    label: "Arctic",
    icon: <Snowflake className="w-3.5 h-3.5" />,
    emoji: "❄️",
  },
];

const predationLevels: {
  value: SimulationState["predation"];
  label: string;
  emoji: string;
  description: string;
}[] = [
  { value: "low", label: "Few", emoji: "🐺", description: "1–2 wolves" },
  {
    value: "medium",
    label: "Some",
    emoji: "🐺🐺",
    description: "3–5 wolves",
  },
  {
    value: "high",
    label: "Many",
    emoji: "🐺🐺🐺",
    description: "6+ wolves",
  },
];

const foodLevels: {
  value: SimulationState["foodAvailability"];
  label: string;
  emoji: string;
  description: string;
}[] = [
  { value: "low", label: "Scarce", emoji: "🥀", description: "Tough food" },
  {
    value: "medium",
    label: "Normal",
    emoji: "🌿",
    description: "Mixed plants",
  },
  {
    value: "high",
    label: "Abundant",
    emoji: "🌾",
    description: "Lush vegetation",
  },
];

const Controls: React.FC<ControlsProps> = ({
  state,
  onUpdateSettings,
  onRunGeneration,
  onReset,
}) => {
  const preyCount = state.organisms.filter(
    (o) => o.alive && o.role !== "predator",
  ).length;
  const predatorCount = state.organisms.filter(
    (o) => o.alive && o.role === "predator",
  ).length;

  return (
    <div className="space-y-4 text-sm">
      {/* Population summary */}
      <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
        <div className="flex items-center gap-1.5">
          <span className="text-base">🐇</span>
          <span className="font-bold text-slate-700">{preyCount}</span>
        </div>
        <div className="text-slate-300">|</div>
        <div className="flex items-center gap-1.5">
          <span className="text-base">🐺</span>
          <span className="font-bold text-slate-700">{predatorCount}</span>
        </div>
      </div>

      {/* Environment */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          Habitat
        </label>
        <div className="grid grid-cols-3 gap-1">
          {envOptions.map((env) => (
            <button
              key={env.value}
              onClick={() => onUpdateSettings({ environment: env.value })}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                state.environment === env.value
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span className="text-sm">{env.emoji}</span>
              <span>{env.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Predation (Wolves) */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          Wolves 🐺
        </label>
        <div className="grid grid-cols-3 gap-1">
          {predationLevels.map((level) => (
            <button
              key={level.value}
              onClick={() => onUpdateSettings({ predation: level.value })}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                state.predation === level.value
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span className="text-[10px]">{level.emoji}</span>
              <span>{level.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Food Availability */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          Food Supply 🌿
        </label>
        <div className="grid grid-cols-3 gap-1">
          {foodLevels.map((level) => (
            <button
              key={level.value}
              onClick={() =>
                onUpdateSettings({ foodAvailability: level.value })
              }
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                state.foodAvailability === level.value
                  ? "bg-green-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span className="text-sm">{level.emoji}</span>
              <span>{level.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mutation Rate */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          <Dna className="w-3.5 h-3.5" />
          Mutation Rate
          <span className="ml-auto text-blue-600 normal-case font-bold">
            {state.mutationRate * 10}%
          </span>
        </label>
        <input
          type="range"
          min="0"
          max="10"
          value={state.mutationRate}
          onChange={(e) =>
            onUpdateSettings({ mutationRate: parseInt(e.target.value) })
          }
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
          <span>Stable</span>
          <span>High variation</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onRunGeneration}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg font-semibold text-xs hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Play className="w-3.5 h-3.5" />
          Next Generation
        </button>
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs hover:bg-slate-300 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Controls;
