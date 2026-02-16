import React, { useState } from "react";
import {
  BookOpen,
  Beaker,
  Brain,
  CheckCircle2,
  Circle,
  ChevronDown,
} from "lucide-react";
import { LabPart } from "../types";

interface LabSidebarProps {
  lab: {
    title: string;
    discipline: string;
    topic: string;
    subTopic: string;
    description: string;
    learningGoals: {
      bigIdea: string;
      objectives: string[];
      successCriteria: string[];
    };
    labParts: LabPart[];
  };
  currentPartIdx: number;
  onPartChange: (idx: number) => void;
}

const LabSidebar: React.FC<LabSidebarProps> = ({
  lab,
  currentPartIdx,
  onPartChange,
}) => {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    overview: true,
    learning: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-b from-slate-50 to-white">
      {/* Lab Title */}
      <div className="px-4 py-6 border-b border-slate-200 bg-white">
        <h1 className="text-xl font-bold text-slate-900 mb-1">{lab.title}</h1>
        <p className="text-xs text-slate-600">
          {lab.discipline} • {lab.topic}
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Overview Section */}
        <div className="border-b border-slate-200">
          <button
            onClick={() => toggleSection("overview")}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-slate-900 text-sm">
                Overview
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-600 transition-transform ${expandedSections.overview ? "rotate-180" : ""}`}
            />
          </button>
          {expandedSections.overview && (
            <div className="px-4 py-3 bg-blue-50 border-t border-slate-200 text-sm space-y-2">
              <p className="text-slate-700 font-medium">Big Idea:</p>
              <p className="text-slate-600 text-xs leading-relaxed">
                {lab.learningGoals.bigIdea}
              </p>
            </div>
          )}
        </div>

        {/* Learning Goals Section */}
        <div className="border-b border-slate-200">
          <button
            onClick={() => toggleSection("learning")}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-600" />
              <span className="font-semibold text-slate-900 text-sm">
                Learning Goals
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-600 transition-transform ${expandedSections.learning ? "rotate-180" : ""}`}
            />
          </button>
          {expandedSections.learning && (
            <div className="px-4 py-3 bg-purple-50 border-t border-slate-200 text-xs space-y-2">
              <div>
                <p className="font-semibold text-slate-700 mb-2">Objectives:</p>
                <ul className="space-y-1">
                  {lab.learningGoals.objectives.map((obj, idx) => (
                    <li key={idx} className="text-slate-600 flex gap-2">
                      <span className="text-purple-600 font-bold">•</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Lab Parts Navigation */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Beaker className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-900 text-sm">
              Lab Parts
            </span>
            <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              {currentPartIdx + 1}/{lab.labParts.length}
            </span>
          </div>
          <div className="space-y-2">
            {lab.labParts.map((part, idx) => (
              <button
                key={idx}
                onClick={() => onPartChange(idx)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg transition-all text-left ${
                  idx === currentPartIdx
                    ? "bg-blue-600 text-white shadow-md"
                    : idx < currentPartIdx
                      ? "bg-green-100 text-green-900 hover:bg-green-200"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <div className="pt-1">
                  {idx < currentPartIdx ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 flex-shrink-0" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{part.title}</p>
                  <p
                    className={`text-xs mt-0.5 ${
                      idx === currentPartIdx
                        ? "text-blue-100"
                        : "text-slate-600"
                    }`}
                  >
                    Part {idx + 1}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-4 border-t border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700">Progress</span>
          <span className="text-xs font-bold text-blue-600">
            {Math.round(((currentPartIdx + 1) / lab.labParts.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all rounded-full"
            style={{
              width: `${((currentPartIdx + 1) / lab.labParts.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default LabSidebar;
