import React, { useState } from "react";
import { ChevronRight, ChevronLeft, CheckCircle2, Circle } from "lucide-react";
import { LabPart } from "../types";

interface LabWorkflowProps {
  labParts: LabPart[];
  currentPartIdx: number;
  onPartChange: (idx: number) => void;
}

const LabWorkflow: React.FC<LabWorkflowProps> = ({
  labParts,
  currentPartIdx,
  onPartChange,
}) => {
  const currentPart = labParts[currentPartIdx];
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "setup",
  );

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Lab Progress</h3>
          <span className="text-sm font-medium text-blue-600">
            Part {currentPartIdx + 1} of {labParts.length}
          </span>
        </div>
        <div className="flex gap-2">
          {labParts.map((_, idx) => (
            <button
              key={idx}
              onClick={() => onPartChange(idx)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                idx === currentPartIdx
                  ? "bg-blue-600 text-white"
                  : idx < currentPartIdx
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {idx < currentPartIdx ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Circle className="w-4 h-4" />
              )}
              <span className="text-xs md:text-sm font-medium">
                Part {idx + 1}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Current Lab Part */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 text-white">
          <h2 className="text-2xl font-bold mb-2">{currentPart.title}</h2>
          <p className="text-blue-100">
            Part {currentPartIdx + 1} of {labParts.length}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Setup Section */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() =>
                setExpandedSection(expandedSection === "setup" ? null : "setup")
              }
              className="w-full px-4 py-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
            >
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                  1
                </span>
                Setup Instructions
              </h3>
              <ChevronRight
                className={`w-5 h-5 transition-transform ${
                  expandedSection === "setup" ? "rotate-90" : ""
                }`}
              />
            </button>
            {expandedSection === "setup" && (
              <div className="p-4 border-t border-slate-200">
                <ol className="space-y-3">
                  {currentPart.setup.map((step, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="font-semibold text-slate-400 min-w-fit">
                        {idx + 1}.
                      </span>
                      <span className="text-slate-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* Observations Section */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() =>
                setExpandedSection(
                  expandedSection === "observations" ? null : "observations",
                )
              }
              className="w-full px-4 py-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
            >
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-yellow-600 text-white text-xs flex items-center justify-center">
                  2
                </span>
                Observations
              </h3>
              <ChevronRight
                className={`w-5 h-5 transition-transform ${
                  expandedSection === "observations" ? "rotate-90" : ""
                }`}
              />
            </button>
            {expandedSection === "observations" && (
              <div className="p-4 border-t border-slate-200 bg-yellow-50">
                <p className="text-sm text-slate-600 mb-3 font-medium">
                  Answer the following questions while running the simulation:
                </p>
                <ul className="space-y-3">
                  {currentPart.observations.map((observation, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="text-yellow-600 font-bold">
                        Q{idx + 1}.
                      </span>
                      <span className="text-slate-700">{observation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Evidence Section */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() =>
                setExpandedSection(
                  expandedSection === "evidence" ? null : "evidence",
                )
              }
              className="w-full px-4 py-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
            >
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center">
                  3
                </span>
                Evidence
              </h3>
              <ChevronRight
                className={`w-5 h-5 transition-transform ${
                  expandedSection === "evidence" ? "rotate-90" : ""
                }`}
              />
            </button>
            {expandedSection === "evidence" && (
              <div className="p-4 border-t border-slate-200 bg-purple-50">
                <p className="text-sm text-slate-600 mb-3 font-medium">
                  Record the following data during the simulation:
                </p>
                <ul className="space-y-3">
                  {currentPart.evidence.map((item, idx) => (
                    <li key={idx} className="flex gap-3">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded border-slate-300 text-purple-600"
                      />
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Predictions Section */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() =>
                setExpandedSection(
                  expandedSection === "predictions" ? null : "predictions",
                )
              }
              className="w-full px-4 py-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
            >
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center">
                  4
                </span>
                Predictions & Analysis
              </h3>
              <ChevronRight
                className={`w-5 h-5 transition-transform ${
                  expandedSection === "predictions" ? "rotate-90" : ""
                }`}
              />
            </button>
            {expandedSection === "predictions" && (
              <div className="p-4 border-t border-slate-200 bg-green-50">
                <p className="text-sm text-slate-600 mb-3 font-medium">
                  Make predictions based on your observations:
                </p>
                <ul className="space-y-3">
                  {currentPart.predictions.map((prediction, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="text-green-600 font-bold">
                        P{idx + 1}.
                      </span>
                      <span className="text-slate-700">{prediction}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between">
          <button
            onClick={() => onPartChange(currentPartIdx - 1)}
            disabled={currentPartIdx === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous Part
          </button>
          <button
            onClick={() => onPartChange(currentPartIdx + 1)}
            disabled={currentPartIdx === labParts.length - 1}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next Part
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabWorkflow;
