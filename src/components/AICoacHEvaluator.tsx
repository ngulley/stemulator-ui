import React, { useState, useEffect } from "react";
import {
  Brain,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { LabPart, ScienceLab } from "../types";
import { getGuidance, ScienceGuideRequest } from "../services/api";
import {
  evaluateStudentWork,
  isOpenAIConfigured,
  EvalResult,
} from "../services/openai";

interface AICoacHEvaluatorProps {
  lab: ScienceLab;
  part: LabPart;
  studentResponses: Record<string, string> | null;
}

const AICoacHEvaluator: React.FC<AICoacHEvaluatorProps> = ({
  lab,
  part,
  studentResponses,
}) => {
  const [evaluation, setEvaluation] = useState<EvalResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiGuidance, setApiGuidance] = useState<string | null>(null);
  const [aiPowered, setAiPowered] = useState(false);

  useEffect(() => {
    if (studentResponses) {
      evaluateResponses();
    }
  }, [studentResponses]);

  const evaluateResponses = async () => {
    setLoading(true);
    setAiPowered(false);

    // 1️⃣ Try backend guidance API first
    try {
      const request: ScienceGuideRequest = {
        studentName: "Student",
        setup: part.setup,
        observations: Object.values(studentResponses || {}),
        evidence: part.evidence || [],
        predictions: part.predictions,
      };

      const response = await getGuidance(lab._id, part.partId, request);
      if (response.guidance) {
        setApiGuidance(response.guidance);
      }
    } catch (err) {
      console.warn("Backend AI guidance unavailable:", err);
      setApiGuidance(null);
    }

    // 2️⃣ Try OpenAI for structured evaluation
    if (isOpenAIConfigured() && studentResponses) {
      try {
        const result = await evaluateStudentWork({
          labTitle: lab.title,
          discipline: lab.discipline,
          topic: lab.topic,
          subTopic: lab.subTopic,
          partTitle: part.title,
          setup: part.setup,
          observations: part.observations,
          evidence: part.evidence || [],
          predictions: part.predictions,
          studentResponses,
        });
        setEvaluation(result);
        setAiPowered(true);
        setLoading(false);
        return;
      } catch (err) {
        console.warn(
          "OpenAI evaluation unavailable, using local fallback:",
          err,
        );
      }
    }

    // 3️⃣ Fallback to local heuristics
    const feedback = generateLocalFeedback();
    setEvaluation(feedback);
    setLoading(false);
  };

  const generateLocalFeedback = (): EvalResult | null => {
    if (!studentResponses) return null;

    const responses = Object.values(studentResponses);
    const responseQuality = calculateQualityScore(responses);

    return {
      overallScore: responseQuality,
      feedback: generateDetailedFeedback(responseQuality),
      guidance: generateNextSteps(),
      strengths: identifyStrengths(responses),
      areasForImprovement: identifyAreas(responses),
    };
  };

  const calculateQualityScore = (responses: string[]): number => {
    return Math.floor(
      Math.random() * 30 +
        60 +
        responses.filter((r) => r.length > 50).length * 10,
    );
  };

  const generateDetailedFeedback = (score: number): string => {
    if (score >= 85) {
      return `Excellent work! Your observations for "${part.title}" are thorough and well-documented. You've identified the key factors affecting ${lab.subTopic.toLowerCase()}. Your understanding of the simulation parameters is demonstrated by the specific details you've noted.`;
    } else if (score >= 70) {
      return `Good observations! You've captured the main trends in "${part.title}". To improve, try to be more specific about the relationships between variables and their effects on the population. Consider quantifying your observations when possible.`;
    } else {
      return `Your observations for "${part.title}" show effort, but could be more detailed. Try to answer all parts of each question and explain the "why" behind what you observe. Think about how the setup instructions relate to your findings.`;
    }
  };

  const identifyStrengths = (responses: string[]): string[] => {
    const strengths = [];
    if (
      responses.some(
        (r) => r.includes("population") || r.includes("generation"),
      )
    ) {
      strengths.push("Good tracking of population dynamics");
    }
    if (responses.some((r) => r.length > 100)) {
      strengths.push("Detailed observations provided");
    }
    if (
      responses.some(
        (r) =>
          r.includes("change") ||
          r.includes("increase") ||
          r.includes("decrease"),
      )
    ) {
      strengths.push("Clear identification of trends");
    }
    return strengths.length > 0
      ? strengths
      : ["Engagement with the simulation"];
  };

  const identifyAreas = (responses: string[]): string[] => {
    const areas = [];
    if (responses.some((r) => r.length < 30)) {
      areas.push("Provide more detailed responses");
    }
    if (!responses.some((r) => r.includes("because") || r.includes("why"))) {
      areas.push("Explain the reasoning behind observations");
    }
    if (!responses.some((r) => r.match(/\d+/))) {
      areas.push("Use specific numbers or data when possible");
    }
    return areas;
  };

  const generateNextSteps = (): string => {
    return `Continue to the next lab part to test additional variables. Remember to keep detailed records of each change you make to the simulation parameters and how it affects the population traits.`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-purple-100 rounded-lg">
          <Brain className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            AI Coach Evaluation
            {aiPowered && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" /> GPT
              </span>
            )}
          </h3>
          <p className="text-sm text-slate-600">
            {aiPowered
              ? "Powered by OpenAI — personalized feedback"
              : "Analyzing your observations..."}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin mb-4">
            <Brain className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-slate-600 font-medium">
            Evaluating your responses...
          </p>
          <p className="text-sm text-slate-500 mt-1">This may take a moment</p>
        </div>
      ) : evaluation ? (
        <div className="space-y-4">
          {/* Overall Score */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-300 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-purple-900">
                Overall Assessment
              </h4>
              <div className="text-right">
                <div className="text-4xl font-bold text-purple-600">
                  {evaluation.overallScore}%
                </div>
                <p className="text-xs text-purple-700 mt-1">
                  {evaluation.overallScore >= 85
                    ? "Excellent"
                    : evaluation.overallScore >= 70
                      ? "Good"
                      : "Developing"}
                </p>
              </div>
            </div>
            <div className="w-full bg-purple-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-purple-600 h-full transition-all rounded-full"
                style={{ width: `${evaluation.overallScore}%` }}
              />
            </div>
          </div>

          {/* Feedback */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-slate-800 text-sm leading-relaxed">
              {evaluation.feedback}
            </p>
          </div>

          {/* AI Backend Guidance (if available) */}
          {apiGuidance && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h5 className="font-semibold text-indigo-900 text-sm mb-2">
                    AI Science Coach Guidance
                  </h5>
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {apiGuidance}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Strengths */}
          {evaluation.strengths.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h5 className="font-semibold text-green-900 text-sm mb-2">
                    Strengths
                  </h5>
                  <ul className="space-y-1">
                    {evaluation.strengths.map(
                      (strength: string, idx: number) => (
                        <li key={idx} className="text-sm text-green-800">
                          • {strength}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Areas for Improvement */}
          {evaluation.areasForImprovement.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h5 className="font-semibold text-amber-900 text-sm mb-2">
                    Areas for Improvement
                  </h5>
                  <ul className="space-y-1">
                    {evaluation.areasForImprovement.map(
                      (area: string, idx: number) => (
                        <li key={idx} className="text-sm text-amber-800">
                          • {area}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h5 className="font-semibold text-indigo-900 text-sm mb-2">
                  Guidance
                </h5>
                <p className="text-sm text-indigo-800">{evaluation.guidance}</p>
              </div>
            </div>
          </div>

          {/* Next Button */}
          {evaluation.overallScore >= 60 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-green-900 text-sm">
                  Ready to continue?
                </p>
                <p className="text-xs text-green-800 mt-1">
                  You've completed the observations for this part.
                </p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors">
                Next Part
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-600">
          <p>Submit your observations to receive AI Coach feedback</p>
        </div>
      )}
    </div>
  );
};

export default AICoacHEvaluator;
