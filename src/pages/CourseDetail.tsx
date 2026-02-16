import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, FlaskConical } from "lucide-react";
import PageShell from "../components/PageShell";
import { mockCourses } from "../data";

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const course = mockCourses.find((c) => c.id === id);
  const [activeTab, setActiveTab] = useState<"modules" | "labs">("modules");
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  if (!course) return <div>Course not found</div>;

  return (
    <PageShell>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-1/4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              {course.title}
            </h2>
            <p className="text-slate-600 mb-6">{course.description}</p>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-4">
              <button
                onClick={() => setActiveTab("modules")}
                className={`flex-1 px-3 py-2 text-sm font-medium ${
                  activeTab === "modules"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Modules
              </button>
              <button
                onClick={() => setActiveTab("labs")}
                className={`flex-1 px-3 py-2 text-sm font-medium ${
                  activeTab === "labs"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Labs
              </button>
            </div>

            {/* Content */}
            {activeTab === "modules" ? (
              <div className="space-y-2">
                {course.modules.map((module: import("../types").Module) => (
                  <button
                    key={module.id}
                    onClick={() => setSelectedModule(module.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                      selectedModule === module.id
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {module.title}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {course.labs.map((lab: import("../types").ScienceLab) => (
                  <Link
                    key={lab._id}
                    to={`/labs/${lab._id}`}
                    className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md"
                  >
                    {lab.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <div className="lg:w-3/4">
          {activeTab === "modules" && selectedModule ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              {(() => {
                const module = course.modules.find(
                  (m: import("../types").Module) => m.id === selectedModule,
                );
                return module ? (
                  <>
                    <h3 className="text-2xl font-semibold text-slate-900 mb-4">
                      {module.title}
                    </h3>
                    <p className="text-slate-600 mb-6">{module.description}</p>
                    <h4 className="text-lg font-medium text-slate-900 mb-4">
                      Lessons
                    </h4>
                    <ul className="space-y-2">
                      {module.lessons.map((lesson: string, idx: number) => (
                        <li
                          key={idx}
                          className="flex items-center text-slate-700"
                        >
                          <ChevronRight className="h-4 w-4 mr-2 text-blue-600" />
                          {lesson}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null;
              })()}
            </div>
          ) : activeTab === "labs" ? (
            <div className="space-y-6">
              {course.labs.map((lab: import("../types").ScienceLab) => (
                <div
                  key={lab._id}
                  className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col"
                >
                  <div className="flex items-center mb-4">
                    <FlaskConical className="h-6 w-6 text-blue-600 mr-2 flex-shrink-0" />
                    <h3 className="text-lg font-medium text-slate-900">
                      {lab.title}
                    </h3>
                  </div>
                  <p className="text-slate-600 mb-4 flex-1">
                    {lab.description}
                  </p>
                  <span className="text-sm text-slate-500 mb-4 block">
                    {lab.topic} • {lab.subTopic}
                  </span>
                  <Link
                    to={`/labs/${lab._id}`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 text-center"
                  >
                    Launch Lab
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                Welcome to {course.title}
              </h3>
              <p className="text-slate-600">
                Select a module from the sidebar to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default CourseDetail;
