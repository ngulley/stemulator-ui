import React, { useState } from "react";
import {
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Play,
  Eye,
  ClipboardList,
  Lightbulb,
  Send,
} from "lucide-react";
import {
  LabPart,
  ScienceLab,
  SimulationState,
  SimStateSnapshot,
} from "../types";
import AICoacHEvaluator from "./AICoacHEvaluator";

interface LabContentPanelProps {
  part: LabPart;
  partNumber: number;
  totalParts: number;
  lab: ScienceLab;
  simState: SimulationState;
  simHistory: SimStateSnapshot[];
  onNextPart?: () => void;
}

type StepId = "setup" | "observations" | "evidence" | "predictions";

const STEPS: {
  id: StepId;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  placeholder: string;
  description: string;
  hasInput: boolean;
  colorClasses: { bg: string; border: string; accent: string; ring: string };
}[] = [
  {
    id: "setup",
    label: "Setup",
    shortLabel: "Setup",
    icon: <Play className="w-3.5 h-3.5" />,
    placeholder: "",
    description: "Follow these steps to configure your simulation",
    hasInput: false,
    colorClasses: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      accent: "text-blue-700",
      ring: "focus:ring-blue-400",
    },
  },
  {
    id: "observations",
    label: "Observations",
    shortLabel: "Observe",
    icon: <Eye className="w-3.5 h-3.5" />,
    placeholder: "Describe what you observe…",
    description: "Run generations and record what you see in the simulation",
    hasInput: true,
    colorClasses: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      accent: "text-amber-700",
      ring: "focus:ring-amber-400",
    },
  },
  {
    id: "evidence",
    label: "Evidence",
    shortLabel: "Evidence",
    icon: <ClipboardList className="w-3.5 h-3.5" />,
    placeholder: "Enter your data or evidence…",
    description: "Collect measurable data to support your findings",
    hasInput: true,
    colorClasses: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      accent: "text-purple-700",
      ring: "focus:ring-purple-400",
    },
  },
  {
    id: "predictions",
    label: "Predictions",
    shortLabel: "Predict",
    icon: <Lightbulb className="w-3.5 h-3.5" />,
    placeholder: "Write your prediction…",
    description: "Based on your evidence, predict what will happen next",
    hasInput: true,
    colorClasses: {
      bg: "bg-green-50",
      border: "border-green-200",
      accent: "text-green-700",
      ring: "focus:ring-green-400",
    },
  },
];

const getItems = (part: LabPart, id: StepId): string[] => {
  switch (id) {
    case "setup":
      return part.setup;
    case "observations":
      return part.observations;
    case "evidence":
      return part.evidence;
    case "predictions":
      return part.predictions;
  }
};

const LabContentPanel: React.FC<LabContentPanelProps> = ({
  part,
  partNumber,
  totalParts,
  lab,
  simState,
  simHistory,
  onNextPart,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const getFilledCount = (id: StepId) =>
    getItems(part, id).filter(
      (_, idx) => responses[`${id}-${idx}`]?.trim().length > 0,
    ).length;

  // Setup: always advanceable. Input steps: need ≥1 filled.
  const canAdvance = (stepIdx: number): boolean => {
    if (stepIdx === 0) return true;
    return getFilledCount(STEPS[stepIdx].id) >= 1;
  };

  const handleInput = (key: string, value: string) => {
    setResponses((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleRetry = () => {
    setSubmitted(false);
    setActiveStep(3);
  };

  const nextButtonLabel = [
    "Start Observing →",
    "Save & Record Evidence →",
    "Save & Make Predictions →",
  ];

  // ── Submitted state: show evaluator inline ────────────────────────────
  if (submitted) {
    return (
      <div className="flex flex-col h-full">
        {/* Part Header */}
        <div className="px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 flex-shrink-0">
          <h2 className="text-base font-bold text-white">{part.title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Part {partNumber} of {totalParts} · Evaluation
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <AICoacHEvaluator
            lab={lab}
            part={part}
            studentResponses={responses}
            simState={simState}
            simHistory={simHistory}
            onNextPart={onNextPart}
            onRetry={handleRetry}
          />
        </div>
      </div>
    );
  }

  // ── Wizard state ──────────────────────────────────────────────────────
  const step = STEPS[activeStep];
  const items = getItems(part, step.id);
  const filledCount = step.hasInput ? getFilledCount(step.id) : 0;
  const { bg, border, accent, ring } = step.colorClasses;

  return (
    <div className="flex flex-col h-full">
      {/* Part Header */}
      <div className="px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 flex-shrink-0">
        <h2 className="text-base font-bold text-white">{part.title}</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Part {partNumber} of {totalParts}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 border-b border-slate-200 bg-slate-50 flex-shrink-0">
        {STEPS.map((s, idx) => {
          const isCompleted = idx < activeStep;
          const isCurrent = idx === activeStep;
          const isLocked = idx > activeStep;
          return (
            <React.Fragment key={s.id}>
              <button
                onClick={() => isCompleted && setActiveStep(idx)}
                disabled={isLocked}
                title={isCompleted ? `Back to ${s.label}` : s.label}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 px-1 text-xs font-medium transition-all
                  ${isCurrent ? `${bg} ${accent} border-b-2 ${border.replace("border-", "border-b-")}` : ""}
                  ${isCompleted ? "text-green-700 cursor-pointer hover:bg-green-50" : ""}
                  ${isLocked ? "text-slate-300 cursor-not-allowed" : ""}
                `}
              >
                <span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Circle
                      className={`w-4 h-4 ${isCurrent ? accent : "text-slate-300"}`}
                    />
                  )}
                </span>
                <span className="hidden sm:block">{s.shortLabel}</span>
                <span className="sm:hidden">{idx + 1}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <ChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto">
        <div className={`px-4 pt-4 pb-2 ${bg} border-b ${border}`}>
          <div
            className={`flex items-center gap-2 font-semibold text-sm ${accent} mb-0.5`}
          >
            {step.icon}
            {step.label}
            {step.hasInput && (
              <span className="ml-auto text-xs font-normal text-slate-500">
                {filledCount}/{items.length} answered
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">{step.description}</p>
        </div>

        <div className="p-4 space-y-3">
          {items.map((item, idx) => {
            const key = `${step.id}-${idx}`;
            const value = responses[key] || "";
            const isFilled = value.trim().length > 0;

            if (!step.hasInput) {
              // Setup: numbered checklist
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100"
                >
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                    {idx + 1}
                  </span>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {item}
                  </p>
                </div>
              );
            }

            // Input steps
            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-start gap-2">
                  {isFilled ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <span
                      className={`text-xs font-bold ${accent} mt-0.5 w-4 flex-shrink-0`}
                    >
                      {idx + 1}.
                    </span>
                  )}
                  <p className="text-sm text-slate-800 leading-relaxed">
                    {item}
                  </p>
                </div>
                <textarea
                  value={value}
                  onChange={(e) => handleInput(key, e.target.value)}
                  placeholder={step.placeholder}
                  rows={2}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 resize-none transition-colors ${ring}
                    ${isFilled ? "border-green-300 bg-green-50 focus:border-green-400" : "border-slate-200 focus:border-transparent"}
                  `}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation footer */}
      <div className="px-4 py-3 border-t border-slate-200 bg-white flex-shrink-0 flex items-center justify-between gap-3">
        {activeStep > 0 ? (
          <button
            onClick={() => setActiveStep((s) => s - 1)}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        ) : (
          <span />
        )}

        {activeStep < STEPS.length - 1 ? (
          <button
            onClick={() =>
              canAdvance(activeStep) && setActiveStep((s) => s + 1)
            }
            disabled={!canAdvance(activeStep)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {nextButtonLabel[activeStep]}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canAdvance(activeStep)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
            Submit for Evaluation
          </button>
        )}
      </div>
    </div>
  );
};

export default LabContentPanel;
