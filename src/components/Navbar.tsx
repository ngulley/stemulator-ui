import React, { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Microscope, LogOut } from "lucide-react";
import { clearSession, getSession } from "../services/localUsers";
import { HOME_ROUTE, LOGIN_ROUTE } from "../constants";

/** Returns the first letter of each word in a name, up to 2 characters. */
function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const session = getSession();

  const handleSignOut = useCallback(() => {
    clearSession();
    navigate(LOGIN_ROUTE, { replace: true });
  }, [navigate]);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to={HOME_ROUTE} className="flex items-center space-x-2">
              <Microscope className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-slate-900">
                STEMulator
              </span>
            </Link>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex space-x-8">
            <Link
              to={HOME_ROUTE}
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

          {/* Right side: search + user */}
          <div className="flex items-center space-x-3">
            <input
              type="text"
              placeholder="Search..."
              className="hidden sm:block px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {session ? (
              <div className="flex items-center space-x-2">
                {/* Avatar: Google photo if available, otherwise initials */}
                {session.picture ? (
                  <img
                    src={session.picture}
                    alt={session.fullName}
                    title={session.fullName}
                    className="h-8 w-8 rounded-full object-cover border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold select-none"
                    title={session.fullName}
                    aria-label={`Signed in as ${session.fullName}`}
                  >
                    {getInitials(session.fullName)}
                  </div>
                )}

                {/* Name (hidden on small screens) */}
                <span className="hidden lg:block text-sm font-medium text-slate-700 max-w-[120px] truncate">
                  {session.fullName}
                </span>

                {/* Sign-out button */}
                <button
                  onClick={handleSignOut}
                  title="Sign out"
                  aria-label="Sign out"
                  className="flex items-center gap-1 text-slate-500 hover:text-red-600 px-2 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            ) : (
              <Link
                to={LOGIN_ROUTE}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Log In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
