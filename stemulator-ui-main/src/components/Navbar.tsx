import React from "react";
import { Link } from "react-router-dom";
import { Microscope } from "lucide-react";

const Navbar: React.FC = () => {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Microscope className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-slate-900">
                STEMulator
              </span>
            </Link>
          </div>
          <div className="hidden md:flex space-x-8">
            <Link
              to="/"
              className="text-slate-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Home
            </Link>
            <Link
              to="/courses"
              className="text-slate-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Courses
            </Link>
            <Link
              to="/labs"
              className="text-slate-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Labs
            </Link>
            <Link
              to="/about"
              className="text-slate-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              About
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Search..."
              className="hidden sm:block px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
              Create Course
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
