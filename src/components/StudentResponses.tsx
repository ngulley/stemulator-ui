import React, { useState } from "react";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import { LabPart } from "../types";

interface StudentResponsesProps {
  part: LabPart;
  onSubmit: (responses: Record<string, string>) => void;
  isSubmitting?: boolean;
}

const StudentResponses: React.FC<StudentResponsesProps> = ({
  part,
  onSubmit,
  isSubmitting = false,
}) => {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (questionId: string, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = () => {
    if (Object.keys(responses).length === part.observations.length) {
      onSubmit(responses);
      setSubmitted(true);
    }
  };

  const answeredCount = Object.keys(responses).filter(
    (key) => responses[key].trim().length > 0,
  ).length;
  const totalQuestions = part.observations.length;
  const isComplete = answeredCount === totalQuestions;

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-900 text-sm">
              Observation Questions
            </h4>
            <p className="text-xs text-amber-800 mt-1">
              Answer all questions to proceed. Your responses will be evaluated
              by the AI Coach.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {part.observations.map((question, idx) => (
          <div
            key={idx}
            className="border border-slate-200 rounded-lg p-4 bg-white hover:border-slate-300 transition-colors"
          >
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              <span className="text-amber-600 font-bold">Q{idx + 1}.</span>{" "}
              {question}
            </label>
            <textarea
              value={responses[`obs-${idx}`] || ""}
              onChange={(e) => handleInputChange(`obs-${idx}`, e.target.value)}
              placeholder="Enter your observation here..."
              disabled={submitted}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-slate-50 disabled:text-slate-600"
              rows={3}
            />
            {responses[`obs-${idx}`] && (
              <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                Answered
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <div className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{answeredCount}</span>{" "}
          of{" "}
          <span className="font-semibold text-slate-900">{totalQuestions}</span>{" "}
          questions answered
        </div>
        <button
          onClick={handleSubmit}
          disabled={!isComplete || isSubmitting || submitted}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold text-sm hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
          {submitted ? "Submitted for Review" : "Submit Observations"}
        </button>
      </div>
    </div>
  );
};

export default StudentResponses;
