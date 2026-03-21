import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Play, Filter, Loader2, AlertCircle } from "lucide-react";
import PageShell from "../components/PageShell";
import { mockLabs } from "../data";
import { getLabs } from "../services/api";
import { ScienceLab } from "../types";

const Labs: React.FC = () => {
  const [labs, setLabs] = useState<ScienceLab[]>(mockLabs);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disciplineFilter, setDisciplineFilter] = useState<string>("All");
  const [topicFilter, setTopicFilter] = useState<string>("All");
  const [subTopicFilter, setSubTopicFilter] = useState<string>("All");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("All");

  useEffect(() => {
    async function fetchLabs() {
      try {
        const data = await getLabs();
        // Normalize and deduplicate — keep one lab per subTopic
        const seen = new Set<string>();
        const normalizedLabs = data
          .map((lab) => ({
            ...lab,
            title: lab.title || lab.subTopic || lab._id,
            difficulty: lab.difficulty || "Intermediate",
          }))
          .filter((lab) => {
            const key = `${lab.discipline}:${lab.subTopic}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        setLabs(normalizedLabs);
        setError(null);
      } catch (err) {
        console.warn("Failed to fetch from API, using mock data:", err);
        setError("Using offline data - backend unavailable");
        setLabs(mockLabs);
      } finally {
        setLoading(false);
      }
    }
    fetchLabs();
  }, []);

  // Cascading filter option derivation
  const disciplines = [
    "All",
    ...Array.from(new Set(labs.map((lab) => lab.discipline))).sort(),
  ];

  const topics = [
    "All",
    ...Array.from(
      new Set(
        labs
          .filter(
            (lab) =>
              disciplineFilter === "All" || lab.discipline === disciplineFilter,
          )
          .map((lab) => lab.topic),
      ),
    ).sort(),
  ];

  const subTopics = [
    "All",
    ...Array.from(
      new Set(
        labs
          .filter(
            (lab) =>
              (disciplineFilter === "All" ||
                lab.discipline === disciplineFilter) &&
              (topicFilter === "All" || lab.topic === topicFilter),
          )
          .map((lab) => lab.subTopic),
      ),
    ).sort(),
  ];

  const difficulties = ["All", "Beginner", "Intermediate", "Advanced"];

  const handleDisciplineChange = (value: string) => {
    setDisciplineFilter(value);
    setTopicFilter("All");
    setSubTopicFilter("All");
  };

  const handleTopicChange = (value: string) => {
    setTopicFilter(value);
    setSubTopicFilter("All");
  };

  const activeFilterCount = [
    disciplineFilter,
    topicFilter,
    subTopicFilter,
    difficultyFilter,
  ].filter((f) => f !== "All").length;

  const filteredLabs = labs.filter((lab) => {
    return (
      (disciplineFilter === "All" || lab.discipline === disciplineFilter) &&
      (topicFilter === "All" || lab.topic === topicFilter) &&
      (subTopicFilter === "All" || lab.subTopic === subTopicFilter) &&
      (difficultyFilter === "All" || lab.difficulty === difficultyFilter)
    );
  });

  return (
    <PageShell>
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Filters */}
        <aside className="lg:w-1/4">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 sticky top-20">
            <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <Filter className="h-6 w-6" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-auto text-xs font-semibold bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </h3>
            <div className="space-y-6">
              {/* Discipline */}
              <div>
                <label className="block text-base font-medium text-slate-700 mb-3">
                  Discipline
                </label>
                <select
                  value={disciplineFilter}
                  onChange={(e) => handleDisciplineChange(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                >
                  {disciplines.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              {/* Topic */}
              <div>
                <label className="block text-base font-medium text-slate-700 mb-3">
                  Topic
                </label>
                <select
                  value={topicFilter}
                  onChange={(e) => handleTopicChange(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                >
                  {topics.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
              </div>
              {/* Sub Topic */}
              <div>
                <label className="block text-base font-medium text-slate-700 mb-3">
                  Sub Topic
                </label>
                <select
                  value={subTopicFilter}
                  onChange={(e) => setSubTopicFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                >
                  {subTopics.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              {/* Difficulty */}
              <div>
                <label className="block text-base font-medium text-slate-700 mb-3">
                  Difficulty
                </label>
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                >
                  {difficulties.map((diff) => (
                    <option key={diff} value={diff}>
                      {diff}
                    </option>
                  ))}
                </select>
              </div>
              {/* Clear filters */}
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setDisciplineFilter("All");
                    setTopicFilter("All");
                    setSubTopicFilter("All");
                    setDifficultyFilter("All");
                  }}
                  className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Labs Grid */}
        <div className="lg:w-3/4">
          <h1 className="text-4xl font-bold text-slate-900 mb-6">Labs</h1>

          {error && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 text-amber-800">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-slate-600">Loading labs...</span>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredLabs.map((lab) => (
                <div
                  key={lab._id}
                  className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="flex items-center mb-5">
                    <Play className="h-7 w-7 text-blue-600 mr-3 flex-shrink-0" />
                    <h3 className="text-lg font-semibold text-slate-900">
                      {lab.title}
                    </h3>
                  </div>
                  <p className="text-slate-600 text-base mb-4 flex-1">
                    {lab.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      {lab.discipline}
                    </span>
                    <span className="text-xs text-slate-500">{lab.topic}</span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500">
                      {lab.subTopic}
                    </span>
                  </div>
                  <Link
                    to={`/labs/${lab._id}`}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 text-center"
                  >
                    Launch
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default Labs;
