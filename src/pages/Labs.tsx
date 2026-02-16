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
  const [topicFilter, setTopicFilter] = useState<string>("All");
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

  const topics = ["All", ...Array.from(new Set(labs.map((lab) => lab.topic)))];
  const difficulties = ["All", "Beginner", "Intermediate", "Advanced"];

  const filteredLabs = labs.filter((lab) => {
    return (
      (topicFilter === "All" || lab.topic === topicFilter) &&
      (difficultyFilter === "All" || lab.difficulty === difficultyFilter)
    );
  });

  return (
    <PageShell>
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Filters */}
        <aside className="lg:w-1/4">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 sticky top-20">
            <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
              <Filter className="h-6 w-6 mr-3" />
              Filters
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-base font-medium text-slate-700 mb-3">
                  Topic
                </label>
                <select
                  value={topicFilter}
                  onChange={(e) => setTopicFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                >
                  {topics.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
              </div>
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
                  <span className="text-sm text-slate-500 mb-4 block">
                    {lab.topic} • {lab.subTopic}
                  </span>
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
