import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BookOpen } from "lucide-react";
import PageShell from "../components/PageShell";
import { mockCourses } from "../data";

const Courses: React.FC = () => {
  const [searchParams] = useSearchParams();
  const subjectFilter = searchParams.get("subject");

  const filteredCourses = subjectFilter
    ? mockCourses.filter((course) => course.subject === subjectFilter)
    : mockCourses;

  return (
    <PageShell>
      <h1 className="text-4xl font-bold text-slate-900 mb-12">Courses</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCourses.map((course) => (
          <div
            key={course.id}
            className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col"
          >
            <div className="flex items-center mb-5">
              <BookOpen className="h-7 w-7 text-blue-600 mr-3 flex-shrink-0" />
              <h3 className="text-lg font-semibold text-slate-900">
                {course.title}
              </h3>
            </div>
            <p className="text-slate-600 text-base mb-4 flex-1">
              {course.description}
            </p>
            <span className="text-sm text-slate-500 font-medium mb-4 block">
              {course.subject}
            </span>
            <Link
              to={`/courses/${course.id}`}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 text-center"
            >
              View Course
            </Link>
          </div>
        ))}
      </div>
    </PageShell>
  );
};

export default Courses;
