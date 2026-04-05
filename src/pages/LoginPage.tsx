import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { Eye, EyeOff } from "lucide-react";
import { HOME_ROUTE, LOGIN_ROUTE } from "../constants";
import {
  clearSession,
  getSession,
  GoogleCredentialPayload,
  registerUser,
  setGoogleSession,
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
        color:
          PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        left: Math.random() * 100,
        duration: 8 + Math.random() * 14,
        delay: Math.random() * 10,
      })),
    [count],
  );
}

/** Password strength: 0 = empty, 1 = weak, 2 = fair, 3 = strong */
function passwordStrength(pw: string): 0 | 1 | 2 | 3 {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 3) as 0 | 1 | 2 | 3;
}

const STRENGTH_LABEL = ["", "Weak", "Fair", "Strong"];
const STRENGTH_COLOR = ["", "#ef4444", "#f59e0b", "#10b981"];

/** App entry at `/`. After sign-up or log-in, navigates to `HOME_ROUTE`. */
const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const particles = useParticles(18);
  const [, setSessionTick] = useState(0);
  const session = getSession();

  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginShowPw, setLoginShowPw] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Sign-up form state
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suShowPw, setSuShowPw] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const suStrength = passwordStrength(suPassword);

  // ---- modal controls ----
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

  const goHome = useCallback(
    () => navigate(HOME_ROUTE, { replace: true }),
    [navigate],
  );

  const handleSignOut = useCallback(() => {
    clearSession();
    setSessionTick((n) => n + 1);
    navigate(LOGIN_ROUTE, { replace: true });
  }, [navigate]);

  // ---- Google OAuth ----
  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      // tokenResponse.access_token for implicit flow — fetch user info
      fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      })
        .then((r) => r.json())
        .then((info) => {
          const user = setGoogleSession({
            sub: info.sub,
            name: info.name,
            email: info.email,
            picture: info.picture,
            iat: 0,
            exp: 0,
          });
          setSession(user);
          goHome();
        })
        .catch(() => setLoginError("Google sign-in failed. Please try again."));
    },
    onError: () => setLoginError("Google sign-in was cancelled or failed."),
  });

  /** Handles credential response from Google One-Tap (JWT credential path). */
  const handleGoogleCredential = useCallback(
    (credential: string) => {
      try {
        const payload = jwtDecode<GoogleCredentialPayload>(credential);
        const user = setGoogleSession(payload);
        setSession(user);
        goHome();
      } catch {
        setLoginError("Could not verify Google credentials. Please try again.");
      }
    },
    [goHome],
  );
  // Keep handleGoogleCredential in scope (used in future One-Tap integration)
  void handleGoogleCredential;

  // ---- local auth ----
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoading(true);
    try {
      const result = await tryLogin(loginEmail, loginPassword);
      if (!result.ok) {
        setLoginError(result.error);
        return;
      }
      setSession(result.user);
      goHome();
    } catch {
      setLoginError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    if (suStrength < 2) {
      setSignupError(
        "Please choose a stronger password (mix letters, numbers, or symbols).",
      );
      return;
    }
    setLoading(true);
    try {
      const result = await registerUser({
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
    } catch {
      setSignupError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
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
      {/* Floating particles */}
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

      {/* Nav — logo only + contextual CTA */}
      <nav>
        <Link
          to="/"
          className="nav-logo"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          STEMulator
        </Link>

        <div className="nav-actions">
          {session ? (
            <button
              type="button"
              className="btn-signout-nav"
              onClick={handleSignOut}
            >
              Sign out
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn-outline-nav"
                onClick={openLogin}
              >
                Log In
              </button>
              <button
                type="button"
                className="btn-create-nav"
                onClick={openSignup}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="logo-center">
          <div className="logo-text">STEMulator</div>
        </div>
        <p className="tagline">
          Explore physics, chemistry, and biology through hands-on simulations
          and AI-guided courses.
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

      {/* ── Login Modal ── */}
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
          <button
            type="button"
            className="close-btn"
            aria-label="Close"
            onClick={closeLogin}
          >
            ×
          </button>
          <h2 id="loginpage-login-title">Welcome back</h2>
          <p>Log in to continue your learning journey.</p>

          {/* Google Sign-In */}
          <button
            type="button"
            className="btn-google"
            onClick={() => googleLogin()}
            disabled={loading}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="divider">
            <span>or</span>
          </div>

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
            <div className="input-password-wrap">
              <input
                id="login-password"
                type={loginShowPw ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-pw"
                aria-label={loginShowPw ? "Hide password" : "Show password"}
                onClick={() => setLoginShowPw((v) => !v)}
                tabIndex={-1}
              >
                {loginShowPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {loginError ? <p className="error-msg">{loginError}</p> : null}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Signing in…" : "Log In"}
            </button>
          </form>

          <div className="switch-link">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              className="link-like"
              onClick={switchToSignup}
            >
              Sign up
            </button>
          </div>
        </div>
      </div>

      {/* ── Sign-Up Modal ── */}
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
          <button
            type="button"
            className="close-btn"
            aria-label="Close"
            onClick={closeSignup}
          >
            ×
          </button>
          <h2 id="loginpage-signup-title">Create your account</h2>
          <p>Join thousands of learners exploring STEM.</p>

          {/* Google Sign-Up */}
          <button
            type="button"
            className="btn-google"
            onClick={() => googleLogin()}
            disabled={loading}
          >
            <GoogleIcon />
            Sign up with Google
          </button>

          <div className="divider">
            <span>or</span>
          </div>

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
            <div className="input-password-wrap">
              <input
                id="su-password"
                type={suShowPw ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                value={suPassword}
                onChange={(e) => setSuPassword(e.target.value)}
                required
                minLength={4}
              />
              <button
                type="button"
                className="toggle-pw"
                aria-label={suShowPw ? "Hide password" : "Show password"}
                onClick={() => setSuShowPw((v) => !v)}
                tabIndex={-1}
              >
                {suShowPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Password strength bar */}
            {suPassword.length > 0 && (
              <div className="strength-wrap">
                <div className="strength-bar">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className="strength-segment"
                      style={{
                        background:
                          suStrength >= level
                            ? STRENGTH_COLOR[suStrength]
                            : "#e5e7eb",
                      }}
                    />
                  ))}
                </div>
                <span
                  className="strength-label"
                  style={{ color: STRENGTH_COLOR[suStrength] }}
                >
                  {STRENGTH_LABEL[suStrength]}
                </span>
              </div>
            )}

            {signupError ? <p className="error-msg">{signupError}</p> : null}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Creating account…" : "Create Account"}
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

/** Inline Google "G" SVG icon — avoids external image dependency. */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.705A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.705V4.963H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.037l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.963L3.964 7.295C4.672 5.168 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

export default LoginPage;
