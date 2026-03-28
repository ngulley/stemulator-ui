import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HOME_ROUTE, LOGIN_ROUTE } from "../constants";
import {
  clearSession,
  getSession,
  registerUser,
  setSession,
  tryLogin,
} from "../services/localUsers";
import "./loginLanding.css";

const PARTICLE_COLORS = ["#3b6ef5", "#7c3aed", "#06b6d4", "#10b981"];

type ParticleSpec = {
  id: number;
  size: number;
  color: string;
  left: number;
  duration: number;
  delay: number;
};

function useParticles(count: number): ParticleSpec[] {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        size: 6 + Math.random() * 18,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        left: Math.random() * 100,
        duration: 8 + Math.random() * 14,
        delay: Math.random() * 10,
      })),
    [count],
  );
}

/** App entry at `/`. After sign up or log in, navigates to `HOME_ROUTE` (Home page). */
const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const particles = useParticles(18);
  const [, setSessionTick] = useState(0);
  const session = getSession();

  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [signupError, setSignupError] = useState<string | null>(null);

  const openLogin = useCallback(() => {
    setLoginError(null);
    setLoginOpen(true);
  }, []);

  const openSignup = useCallback(() => {
    setSignupError(null);
    setSignupOpen(true);
  }, []);

  const closeLogin = useCallback(() => {
    setLoginOpen(false);
    setLoginError(null);
  }, []);

  const closeSignup = useCallback(() => {
    setSignupOpen(false);
    setSignupError(null);
  }, []);

  const goHome = useCallback(() => {
    navigate(HOME_ROUTE, { replace: true });
  }, [navigate]);

  const handleSignOut = useCallback(() => {
    clearSession();
    setSessionTick((n) => n + 1);
    navigate(LOGIN_ROUTE, { replace: true });
  }, [navigate]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const result = tryLogin(loginEmail, loginPassword);
    if (!result.ok) {
      setLoginError(result.error);
      return;
    }
    setSession(result.user);
    goHome();
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    const result = registerUser({
      fullName: suName,
      email: suEmail,
      password: suPassword,
    });
    if (!result.ok) {
      setSignupError(result.error);
      return;
    }
    setSession(result.user);
    goHome();
  };

  const switchToSignup = () => {
    closeLogin();
    window.setTimeout(() => openSignup(), 150);
  };

  const switchToLogin = () => {
    closeSignup();
    window.setTimeout(() => openLogin(), 150);
  };

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        closeLogin();
        closeSignup();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeLogin, closeSignup]);

  return (
    <div className="login-landing">
      <div className="particles" aria-hidden>
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={{
              width: p.size,
              height: p.size,
              background: p.color,
              left: `${p.left}%`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      <nav>
        <Link to="/" className="nav-logo" style={{ textDecoration: "none", color: "inherit" }}>
          STEMulator
        </Link>
        <input className="nav-search" type="search" placeholder="Search..." aria-label="Search" />
        <div className="nav-actions">
          {session ? (
            <button type="button" className="btn-signout-nav" onClick={handleSignOut}>
              Sign out
            </button>
          ) : null}
          <button type="button" className="btn-create-nav" onClick={openSignup}>
            Create Course
          </button>
        </div>
      </nav>

      <section className="hero">
        <div className="logo-center">
          <div className="logo-text">
            <span className="stem">STEM</span>
            <span className="ulator">ulator</span>
          </div>
        </div>

        <p className="tagline">
          Explore physics, chemistry, and biology through hands-on simulations and
          AI guided courses.
        </p>

        <div className="btn-group">
          <button type="button" className="btn-primary" onClick={openLogin}>
            Log In
          </button>
          <button type="button" className="btn-secondary" onClick={openSignup}>
            Create New Account
          </button>
        </div>
      </section>

      <div
        className={`modal-overlay${loginOpen ? " active" : ""}`}
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeLogin();
        }}
      >
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="loginpage-login-title"
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" className="close-btn" aria-label="Close" onClick={closeLogin}>
            ×
          </button>
          <h2 id="loginpage-login-title">Welcome back</h2>
          <p>Log in to continue your learning journey.</p>
          <form onSubmit={handleLoginSubmit}>
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
            />
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
            {loginError ? <p className="error-msg">{loginError}</p> : null}
            <button type="submit" className="btn-primary">
              Log In
            </button>
          </form>
          <div className="switch-link">
            Don&apos;t have an account?{" "}
            <button type="button" className="link-like" onClick={switchToSignup}>
              Sign up
            </button>
          </div>
        </div>
      </div>

      <div
        className={`modal-overlay${signupOpen ? " active" : ""}`}
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeSignup();
        }}
      >
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="loginpage-signup-title"
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" className="close-btn" aria-label="Close" onClick={closeSignup}>
            ×
          </button>
          <h2 id="loginpage-signup-title">Create your account</h2>
          <p>Join thousands of learners exploring STEM.</p>
          <form onSubmit={handleSignupSubmit}>
            <label htmlFor="su-name">Full Name</label>
            <input
              id="su-name"
              type="text"
              placeholder="Jane Smith"
              autoComplete="name"
              value={suName}
              onChange={(e) => setSuName(e.target.value)}
              required
            />
            <label htmlFor="su-email">Email</label>
            <input
              id="su-email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={suEmail}
              onChange={(e) => setSuEmail(e.target.value)}
              required
            />
            <label htmlFor="su-password">Password</label>
            <input
              id="su-password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              value={suPassword}
              onChange={(e) => setSuPassword(e.target.value)}
              required
              minLength={4}
            />
            {signupError ? <p className="error-msg">{signupError}</p> : null}
            <button type="submit" className="btn-primary">
              Create New Account
            </button>
          </form>
          <div className="switch-link">
            Already have an account?{" "}
            <button type="button" className="link-like" onClick={switchToLogin}>
              Log in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
