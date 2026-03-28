import React from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { SimulationState } from "../types";

interface ResultsProps {
  state: SimulationState;
}

const avg = (arr: number[]) =>
  arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

const Results: React.FC<ResultsProps> = ({ state }) => {
  const preyAlive = state.organisms.filter(
    (o) => o.alive && o.role !== "predator",
  );
  const predatorsAlive = state.organisms.filter(
    (o) => o.alive && o.role === "predator",
  );
  const totalAlive = preyAlive.length + predatorsAlive.length;

  // Population over generations
  const populationData = state.populationHistory.map((pop, idx) => ({
    gen: idx + 1,
    population: pop,
  }));

  // Trait averages
  const speedAvg = avg(state.traitDistribution.speed);
  const camoAvg = avg(state.traitDistribution.camouflage);
  const sizeAvg = avg(state.traitDistribution.size);

  const traitData = [
    { trait: "🦵 Speed", value: +speedAvg.toFixed(1), fill: "#ef4444" },
    { trait: "🎨 Camo", value: +camoAvg.toFixed(1), fill: "#22c55e" },
    { trait: "📏 Size", value: +sizeAvg.toFixed(1), fill: "#3b82f6" },
  ];

  // If no generations have been run yet
  if (state.generation === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
        <span className="text-3xl">📊</span>
        <p className="font-medium">Run a generation to see analysis</p>
        <p className="text-xs">
          Click{" "}
          <span className="font-semibold text-blue-500">Next Generation</span>{" "}
          in the controls panel
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Stats Row ── */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-blue-50 rounded-lg px-3 py-2 text-center">
          <div className="text-lg font-bold text-blue-700">
            {state.generation}
          </div>
          <div className="text-[10px] text-blue-500 font-medium uppercase">
            Generation
          </div>
        </div>
        <div className="bg-green-50 rounded-lg px-3 py-2 text-center">
          <div className="text-lg font-bold text-green-700">
            {preyAlive.length}
          </div>
          <div className="text-[10px] text-green-500 font-medium uppercase">
            🐇 Rabbits
          </div>
        </div>
        <div className="bg-red-50 rounded-lg px-3 py-2 text-center">
          <div className="text-lg font-bold text-red-700">
            {predatorsAlive.length}
          </div>
          <div className="text-[10px] text-red-500 font-medium uppercase">
            🐺 Wolves
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg px-3 py-2 text-center">
          <div className="text-lg font-bold text-purple-700">{totalAlive}</div>
          <div className="text-[10px] text-purple-500 font-medium uppercase">
            Total Pop
          </div>
        </div>
      </div>

      {/* ── Population Chart ── */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Population Over Generations
        </h3>
        <div className="bg-slate-50 rounded-lg p-2" style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={populationData}>
              <defs>
                <linearGradient id="popGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="gen"
                tick={{ fontSize: 10 }}
                label={{
                  value: "Generation",
                  position: "insideBottom",
                  offset: -2,
                  style: { fontSize: 10 },
                }}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                }}
              />
              <Area
                type="monotone"
                dataKey="population"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#popGrad)"
                name="Total Population"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Trait Distribution ── */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Average Rabbit Traits
        </h3>
        <div className="bg-slate-50 rounded-lg p-2" style={{ height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={traitData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="trait" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                }}
                formatter={(v: number) => [v.toFixed(1), "Avg"]}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {traitData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Trait Trend Insight ── */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
        <span className="font-bold">🔬 Insight: </span>
        {speedAvg > camoAvg && speedAvg > sizeAvg
          ? "Speed is the dominant trait — rabbits are evolving to outrun wolves."
          : camoAvg > speedAvg && camoAvg > sizeAvg
            ? "Camouflage is the dominant trait — rabbits are evolving to hide from wolves."
            : sizeAvg > speedAvg && sizeAvg > camoAvg
              ? "Size is the dominant trait — larger rabbits are surviving better."
              : "Traits are evenly distributed — no single trait is dominant yet."}
      </div>
    </div>
  );
};

export default Results;
