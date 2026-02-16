import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Home,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Circle,
} from "lucide-react";
import PageShell from "../components/PageShell";
import Canvas from "../components/Canvas";
import Controls from "../components/Controls";
import Results from "../components/Results";
import AIPanel from "../components/AIPanel";
import LabContentPanel from "../components/LabContentPanel";
import AICoacHEvaluator from "../components/AICoacHEvaluator";
import { Simulation } from "../simulation";
import { SimulationState, LabSnapshot, ScienceLab } from "../types";
import { mockLabs } from "../data";
import { getLab } from "../services/api";

const LabDetail: React.FC = () => {
  const { labId } = useParams<{ labId: string }>();
  const [lab, setLab] = useState<ScienceLab | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [sim] = useState(() => new Simulation());
  const [state, setState] = useState<SimulationState>(sim.getState());
  const [activeTab, setActiveTab] = useState<"results" | "ai">("results");
  const [currentPartIdx, setCurrentPartIdx] = useState(0);
  const [studentResponses, setStudentResponses] = useState<Record<
    string,
    string
  > | null>(null);

  // Fetch lab data from API with fallback to mock
  useEffect(() => {
    async function fetchLab() {
      if (!labId) return;
      setLoading(true);
      try {
        const data = await getLab(labId);
        if (data) {
          setLab({
            ...data,
            title: data.title || data.subTopic || data._id,
            difficulty: data.difficulty || "Intermediate",
          });
        } else {
          const mockLab = mockLabs.find((l) => l._id === labId);
          setLab(mockLab || null);
        }
      } catch (err) {
        console.warn("Failed to fetch from API, using mock data:", err);
        const mockLab = mockLabs.find((l) => l._id === labId);
        setLab(mockLab || null);
      } finally {
        setLoading(false);
      }
    }
    fetchLab();
  }, [labId]);

  useEffect(() => {
    if (lab && lab.labParts[currentPartIdx]) {
      sim.applyScienceLab(lab, lab.labParts[currentPartIdx].partId);
      setState(sim.getState());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPartIdx, lab]);

  useEffect(() => {
    const interval = setInterval(() => {
      setState(sim.getState());
    }, 100);
    return () => clearInterval(interval);
  }, [sim]);

  const handleUpdateSettings = (
    settings: Partial<
      Pick<
        SimulationState,
        "environment" | "predation" | "foodAvailability" | "mutationRate"
      >
    >,
  ) => {
    sim.updateSettings(settings);
    setState(sim.getState());
  };

  const handleRunGeneration = () => {
    sim.runGeneration();
    setState(sim.getState());
  };

  const handleReset = () => {
    sim.reset();
    if (lab && lab.labParts[currentPartIdx]) {
      sim.applyScienceLab(lab, lab.labParts[currentPartIdx].partId);
      setState(sim.getState());
    }
  };

  const handleSendSnapshot = (snapshot: LabSnapshot) => {
    console.log("Sending snapshot:", snapshot);
  };

  const handleObservationsSubmit = (responses: Record<string, string>) => {
    setStudentResponses(responses);
    setActiveTab("ai");
  };

  const goToPart = (idx: number) => {
    if (lab && idx >= 0 && idx < lab.labParts.length) {
      setCurrentPartIdx(idx);
      setStudentResponses(null);
      setActiveTab("results");
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
          <p className="text-slate-600">Loading lab...</p>
        </div>
      </PageShell>
    );
  }

  if (!lab) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Lab not found
          </h2>
          <p className="text-slate-600 mb-6">
            The lab you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            to="/labs"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Labs
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* ── Top Bar ── */}
      <header className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link
            to="/"
            className="text-slate-500 hover:text-blue-600 transition-colors"
          >
            <Home className="w-4 h-4" />
          </Link>
          <span className="text-slate-300">/</span>
          <Link
            to="/labs"
            className="text-slate-500 hover:text-blue-600 transition-colors"
          >
            Labs
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-slate-900 truncate max-w-[200px]">
            {lab.title}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
            {lab.discipline}
          </span>
          <span className="text-slate-500">
            Gen{" "}
            <span className="font-bold text-blue-600">{state.generation}</span>
          </span>
          <span className="text-slate-500">
            Pop{" "}
            <span className="font-bold text-green-600">
              {state.organisms.length}
            </span>
          </span>
          <span className="text-slate-500">
            Survival{" "}
            <span className="font-bold text-purple-600">
              {(state.survivalRate * 100).toFixed(0)}%
            </span>
          </span>
        </div>
      </header>

      {/* ── Part Stepper ── */}
      <nav className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => goToPart(currentPartIdx - 1)}
          disabled={currentPartIdx === 0}
          className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-slate-600" />
        </button>

        <div className="flex-1 flex items-center gap-1 overflow-x-auto">
          {lab.labParts.map((part, idx) => {
            const isCurrent = idx === currentPartIdx;
            const isCompleted = idx < currentPartIdx;

            return (
              <button
                key={idx}
                onClick={() => goToPart(idx)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  isCurrent
                    ? "bg-blue-600 text-white shadow-sm"
                    : isCompleted
                      ? "bg-green-50 text-green-700 hover:bg-green-100"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Circle className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{part.title}</span>
                <span className="sm:hidden">Part {idx + 1}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => goToPart(currentPartIdx + 1)}
          disabled={currentPartIdx === lab.labParts.length - 1}
          className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-slate-600" />
        </button>
      </nav>

      {/* ── Main Content ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column — Lab Workflow */}
        <div className="w-[420px] flex-shrink-0 border-r border-slate-200 flex flex-col overflow-hidden bg-white">
          <LabContentPanel
            part={lab.labParts[currentPartIdx]}
            partNumber={currentPartIdx + 1}
            totalParts={lab.labParts.length}
            onObservationsSubmit={handleObservationsSubmit}
          />
        </div>

        {/* Right Column — Simulation */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Top row: Canvas + Controls side by side */}
          <div className="flex-[1.6] flex gap-3 p-3 overflow-hidden min-h-0">
            {/* Canvas */}
            <div className="flex-1 flex flex-col min-h-0 bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
                <h2 className="font-bold text-slate-900 text-sm">
                  🌍 Live Ecosystem
                </h2>
                <div className="flex gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span>🐇</span>
                    <span className="text-slate-500">Rabbits (prey)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>🐺</span>
                    <span className="text-slate-500">Wolves (predator)</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <Canvas
                  organisms={state.organisms}
                  environment={state.environment}
                />
              </div>
            </div>

            {/* Controls panel */}
            <div className="w-[280px] flex-shrink-0 bg-white border border-slate-200 rounded-lg flex flex-col overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 flex-shrink-0">
                <h2 className="font-bold text-slate-900 text-sm">
                  🧪 Lab Controls
                </h2>
              </div>
              <div className="flex-1 p-3 overflow-y-auto">
                <Controls
                  state={state}
                  onUpdateSettings={handleUpdateSettings}
                  onRunGeneration={handleRunGeneration}
                  onReset={handleReset}
                />
              </div>
            </div>
          </div>

          {/* Bottom row: Analysis / Feedback (full width) */}
          <div className="flex-1 flex px-3 pb-3 overflow-hidden min-h-0">
            <div className="flex-1 bg-white border border-slate-200 rounded-lg flex flex-col overflow-hidden min-w-0">
              <div className="flex border-b border-slate-200 bg-slate-50 flex-shrink-0">
                <button
                  onClick={() => setActiveTab("results")}
                  className={`flex-1 px-3 py-2 text-sm font-semibold transition-colors ${
                    activeTab === "results"
                      ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  📊 Analysis
                </button>
                <button
                  onClick={() => setActiveTab("ai")}
                  className={`flex-1 px-3 py-2 text-sm font-semibold transition-colors ${
                    activeTab === "ai"
                      ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  🤖 AI Feedback
                </button>
              </div>
              <div className="flex-1 p-3 text-sm overflow-y-auto">
                {activeTab === "results" ? (
                  <Results state={state} />
                ) : studentResponses ? (
                  <AICoacHEvaluator
                    lab={lab}
                    part={lab.labParts[currentPartIdx]}
                    studentResponses={studentResponses}
                  />
                ) : (
                  <AIPanel
                    onSendSnapshot={handleSendSnapshot}
                    snapshot={sim.getLabSnapshot()}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabDetail;
