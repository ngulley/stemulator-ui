import React from "react";
import { Link } from "react-router-dom";
import { Play, FlaskConical, Atom } from "lucide-react";
import PageShell from "../components/PageShell";
import { mockCourses, mockLabs } from "../data";

const Home: React.FC = () => {
  const physicsModules =
    mockCourses.find((c) => c.subject === "Physics")?.modules || [];
  const chemistryModules =
    mockCourses.find((c) => c.subject === "Chemistry")?.modules || [];

  return (
    <PageShell>
      {/* Hero Section */}
      <section className="text-center py-24">
        <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6">
          Master STEM with Interactive Learning
        </h1>
        <p className="text-2xl text-slate-600 mb-10 max-w-3xl mx-auto">
          Explore physics, chemistry, and biology through hands-on simulations
          and guided courses.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link
            to="/courses"
            className="bg-blue-600 text-white px-10 py-4 rounded-lg font-medium text-lg hover:bg-blue-700"
          >
            Browse Courses
          </Link>
          <Link
            to="/labs"
            className="border-2 border-slate-300 text-slate-700 px-10 py-4 rounded-lg font-medium text-lg hover:bg-slate-50"
          >
            Open Labs
          </Link>
        </div>
      </section>

      {/* Explore Modules */}
      <section className="py-24">
        <h2 className="text-4xl font-bold text-slate-900 mb-12 text-center">
          Explore Modules
        </h2>
        <div className="grid md:grid-cols-2 gap-10">
          {/* Physics */}
          <div>
            <div className="flex items-center mb-8">
              <Atom className="h-10 w-10 text-blue-600 mr-4" />
              <h3 className="text-3xl font-semibold text-slate-900">Physics</h3>
            </div>
            <div className="space-y-5">
              {physicsModules.map((module: import("../types").Module) => (
                <div
                  key={module.id}
                  className="bg-white p-8 rounded-xl shadow-sm border border-slate-200"
                >
                  <h4 className="text-xl font-medium text-slate-900 mb-3">
                    {module.title}
                  </h4>
                  <p className="text-slate-600 text-lg mb-5">
                    {module.description}
                  </p>
                  <button className="text-blue-600 hover:text-blue-700 font-medium text-lg">
                    View lessons →
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                to="/courses?subject=Physics"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium text-lg hover:bg-blue-700"
              >
                View All Physics Courses
              </Link>
            </div>
          </div>

          {/* Chemistry */}
          <div>
            <div className="flex items-center mb-8">
              <FlaskConical className="h-10 w-10 text-green-600 mr-4" />
              <h3 className="text-3xl font-semibold text-slate-900">
                Chemistry
              </h3>
            </div>
            <div className="space-y-5">
              {chemistryModules.map((module: import("../types").Module) => (
                <div
                  key={module.id}
                  className="bg-white p-8 rounded-xl shadow-sm border border-slate-200"
                >
                  <h4 className="text-xl font-medium text-slate-900 mb-3">
                    {module.title}
                  </h4>
                  <p className="text-slate-600 text-lg mb-5">
                    {module.description}
                  </p>
                  <button className="text-blue-600 hover:text-blue-700 font-medium text-lg">
                    View lessons →
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                to="/courses?subject=Chemistry"
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium text-lg hover:bg-green-700"
              >
                View All Chemistry Courses
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Labs */}
      <section className="py-24">
        <h2 className="text-4xl font-bold text-slate-900 mb-12 text-center">
          Featured Labs
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {mockLabs.slice(0, 3).map((lab) => (
            <div
              key={lab._id}
              className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 flex flex-col"
            >
              <div className="flex items-center mb-5">
                <Play className="h-7 w-7 text-blue-600 mr-3 flex-shrink-0" />
                <h3 className="text-xl font-medium text-slate-900">
                  {lab.title}
                </h3>
              </div>
              <p className="text-slate-600 text-lg mb-4 flex-1">
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
        <div className="text-center mt-12">
          <Link
            to="/labs"
            className="border-2 border-slate-300 text-slate-700 px-8 py-3 rounded-lg font-medium text-lg hover:bg-slate-50"
          >
            View All Labs
          </Link>
        </div>
      </section>
    </PageShell>
  );
};

export default Home;
