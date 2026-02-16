import React, { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Play,
  Eye,
  ClipboardList,
  Lightbulb,
  Send,
} from "lucide-react";
import { LabPart } from "../types";

interface LabContentPanelProps {
  part: LabPart;
  partNumber: number;
  totalParts: number;
  onObservationsSubmit?: (responses: Record<string, string>) => void;
}

type SectionId = "setup" | "observations" | "evidence" | "predictions";

const sectionMeta: Record<
  SectionId,
  {
    label: string;
    icon: React.ReactNode;
    bg: string;
    border: string;
    accent: string;
    hasInput: boolean;
    inputPlaceholder: string;
    description: string;
  }
> = {
  setup: {
    label: "Setup",
    icon: <Play className="w-4 h-4" />,
    bg: "bg-blue-50",
    border: "border-blue-200",
    accent: "text-blue-700",
    hasInput: false,
    inputPlaceholder: "",
    description: "Follow these steps to configure the simulation",
  },
  observations: {
    label: "Observations",
    icon: <Eye className="w-4 h-4" />,
    bg: "bg-amber-50",
    border: "border-amber-200",
    accent: "text-amber-700",
    hasInput: true,
    inputPlaceholder: "Describe what you observe…",
    description: "Record what you see during the simulation",
  },
  evidence: {
    label: "Evidence",
    icon: <ClipboardList className="w-4 h-4" />,
    bg: "bg-purple-50",
    border: "border-purple-200",
    accent: "text-purple-700",
    hasInput: true,
    inputPlaceholder: "Enter your data or evidence…",
    description: "Collect data to support your findings",
  },
  predictions: {
    label: "Predictions",
    icon: <Lightbulb className="w-4 h-4" />,
    bg: "bg-green-50",
    border: "border-green-200",
    accent: "text-green-700",
    hasInput: true,
    inputPlaceholder: "Write your prediction…",
    description: "Predict what will happen next",
  },
};

const SECTION_ORDER: SectionId[] = [
  "setup",
  "observations",
  "evidence",
  "predictions",
];

const LabContentPanel: React.FC<LabContentPanelProps> = ({
  part,
  partNumber,
  totalParts,
  onObservationsSubmit,
}) => {
  const [expandedSections, setExpandedSections] = useState<
    Record<SectionId, boolean>
  >({
    setup: true,
    observations: false,
    evidence: false,
    predictions: false,
  });

  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const toggleSection = (id: SectionId) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleInput = (key: string, value: string) => {
    setResponses((prev) => ({ ...prev, [key]: value }));
  };

  const getItems = (id: SectionId): string[] => {
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

  // Count how many text fields are filled across all input sections
  const inputSections = SECTION_ORDER.filter((s) => sectionMeta[s].hasInput);
  const totalInputs = inputSections.reduce(
    (sum, s) => sum + getItems(s).length,
    0,
  );
  const filledInputs = Object.values(responses).filter(
    (v) => v.trim().length > 0,
  ).length;

  const handleSubmit = () => {
    if (filledInputs >= totalInputs) {
      onObservationsSubmit?.(responses);
      setSubmitted(true);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Part Header */}
      <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 flex-shrink-0">
        <h2 className="text-lg font-bold text-white">{part.title}</h2>
        <p className="text-xs text-slate-400 mt-1">
          Part {partNumber} of {totalParts}
        </p>
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {SECTION_ORDER.map((sectionId) => {
            const meta = sectionMeta[sectionId];
            const items = getItems(sectionId);
            const isOpen = expandedSections[sectionId];

            // Count filled for this section
            const sectionFilled = items.filter(
              (_, idx) => responses[`${sectionId}-${idx}`]?.trim().length > 0,
            ).length;

            return (
              <div
                key={sectionId}
                className={`rounded-lg border ${meta.border} overflow-hidden`}
              >
                {/* Section header — always visible */}
                <button
                  onClick={() => toggleSection(sectionId)}
                  className={`w-full px-4 py-3 flex items-center gap-3 ${meta.bg} hover:brightness-95 transition-all`}
                >
                  <span className={meta.accent}>{meta.icon}</span>
                  <span className={`font-semibold text-sm ${meta.accent}`}>
                    {meta.label}
                  </span>
                  {meta.hasInput ? (
                    <span className="ml-auto text-xs text-slate-500 font-medium">
                      {sectionFilled}/{items.length}
                    </span>
                  ) : (
                    <span className="ml-auto text-xs text-slate-500 font-medium">
                      {items.length} steps
                    </span>
                  )}
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {/* Section body */}
                {isOpen && (
                  <div className="px-4 py-3 space-y-3 bg-white">
                    <p className="text-xs text-slate-500 mb-2">
                      {meta.description}
                    </p>
                    {items.map((item, idx) => {
                      const key = `${sectionId}-${idx}`;
                      const value = responses[key] || "";
                      const isFilled = value.trim().length > 0;

                      return (
                        <div
                          key={idx}
                          className="border border-slate-100 rounded-lg p-3 hover:border-slate-200 transition-colors"
                        >
                          <div className="flex items-start gap-2 mb-1">
                            {isFilled && meta.hasInput && (
                              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            )}
                            <p className="text-sm text-slate-800 leading-relaxed">
                              <span className={`font-bold ${meta.accent}`}>
                                {idx + 1}.
                              </span>{" "}
                              {item}
                            </p>
                          </div>
                          {meta.hasInput && (
                            <textarea
                              value={value}
                              onChange={(e) => handleInput(key, e.target.value)}
                              placeholder={meta.inputPlaceholder}
                              disabled={submitted}
                              rows={2}
                              className="w-full mt-2 px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 resize-none"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit footer */}
      <div className="px-4 py-3 border-t border-slate-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{filledInputs}</span>{" "}
            / {totalInputs} responses
          </span>
          <button
            onClick={handleSubmit}
            disabled={filledInputs < totalInputs || submitted}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitted ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Submitted
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit for Feedback
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabContentPanel;
