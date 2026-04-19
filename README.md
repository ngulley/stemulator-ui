# 🧬 STEMulator

An AI-guided virtual STEM lab platform with interactive courses and real-time Natural Selection simulations. Built with React, TypeScript, and Vite.

> **Backend API repo:** [github.com/ngulley/stemulator-api](https://github.com/ngulley/stemulator-api)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start (Frontend Only)](#quick-start-frontend-only)
- [Full Stack Setup (Frontend + Backend)](#full-stack-setup-frontend-backend)
- [Project Structure](#project-structure)
- [Application Workflow](#application-workflow)
- [Pages & Routes](#pages-routes)
- [Authentication](#authentication)
- [API Integration](#api-integration)
- [Resilience & Observability](#resilience--observability)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Features

| Feature                            | Description                                                              |
| ---------------------------------- | ------------------------------------------------------------------------ |
| 🏠 **Home Page**                   | Hero section, subject explorer, featured labs                            |
| 📚 **Courses**                     | Browse Physics & Chemistry courses with modules and lessons              |
| 🧪 **Labs**                        | Interactive lab listing with discipline filtering and deduplication      |
| 🐇 **Natural Selection Simulator** | Canvas-based rabbit/wolf simulation with real-time trait evolution       |
| 🎮 **Lab Controls**                | Visual habitat, predation, food supply, and mutation rate selectors      |
| 📊 **Analysis Dashboard**          | Population charts, trait distribution graphs, and AI-generated insights  |
| 🤖 **AI Science Coach**            | GPT-4o-mini powered chat + structured evaluation of student observations |
| 📝 **Student Workflow**            | 4-step process: Setup → Observe → Evidence → Predict                     |
| 🎨 **Canvas Rendering**            | Animated rabbits and wolves with environment-adaptive fur colors         |
| 📱 **Responsive Design**           | Clean Tailwind CSS design system                                         |
| 🛡️ **Resilience**                  | Retry with back-off, circuit breakers, timeouts on all API calls         |
| 📡 **Observability**               | Structured logging, health-check polling, session TTL                    |

---

## Tech Stack

| Layer          | Technology                       | Version    |
| -------------- | -------------------------------- | ---------- |
| **Framework**  | React                            | 18.2       |
| **Language**   | TypeScript                       | 5.2+       |
| **Build Tool** | Vite                             | 5.0+       |
| **Styling**    | Tailwind CSS                     | 3.4        |
| **Routing**    | React Router                     | 7.13       |
| **Auth**       | @react-oauth/google + jwt-decode | 0.13 / 4.0 |
| **Charts**     | Recharts                         | 2.12       |
| **Icons**      | Lucide React                     | 0.563      |
| **Canvas**     | HTML5 Canvas API                 | —          |

---

## Prerequisites

Before you begin, make sure you have the following installed:

| Tool        | Version              | Check Command   | Install                             |
| ----------- | -------------------- | --------------- | ----------------------------------- |
| **Node.js** | 18+ (20 recommended) | `node -v`       | [nodejs.org](https://nodejs.org/)   |
| **npm**     | 9+                   | `npm -v`        | Comes with Node.js                  |
| **Git**     | Any recent           | `git --version` | [git-scm.com](https://git-scm.com/) |

**Optional** (for full-stack mode):

| Tool         | Version              | Purpose             |
| ------------ | -------------------- | ------------------- |
| **Java JDK** | 17+                  | Spring Boot backend |
| **Docker**   | Any recent           | MongoDB container   |
| **Maven**    | 3.9+ (or use `mvnw`) | Build backend       |

---

## Quick Start (Frontend Only)

The frontend works **standalone** with built-in mock data. No backend needed.

```bash
# 1. Clone the repository
git clone https://github.com/ngulley/stemulator-ui.git
cd stemulator-ui

# 2. Install dependencies
npm install

# 3. Create your local environment file
cp .env.example .env
# Optional: add your VITE_GOOGLE_CLIENT_ID to .env to enable Google Sign-In
# The app loads and local email/password auth works without it.

# 4. Start development server
npm run dev

# 5. Open in browser
#    → http://localhost:5173
```

That's it! The app runs with mock lab data (Natural Selection, Physics, Chemistry labs) so you can explore the full UI and simulation without any backend.

---

## Full Stack Setup (Frontend + Backend)

To connect to the Spring Boot API for real lab data and AI guidance:

### Step 1 — Start MongoDB

```bash
# Using Docker (recommended)
docker run -d \
  --name stemulator-mongo \
  -p 27017:27017 \
  mongo:7

# Verify it's running
docker ps | grep stemulator-mongo
```

### Step 2 — Start the Backend API

```bash
# Clone the backend repo
git clone https://github.com/ngulley/stemulator-api.git
cd stemulator-api

# Build and run (uses Maven wrapper — no Maven install needed)
./mvnw spring-boot:run

# Backend starts on http://localhost:8080
# Verify with:
curl http://localhost:8080/stemulator/v1/labs
```

### Step 3 — Start the Frontend

```bash
# In a separate terminal, go to the STEMulator directory
cd STEMulator
npm install
npm run dev

# Frontend starts on http://localhost:5173
# The Vite proxy automatically forwards /stemulator/* to localhost:8080
```

### Step 4 — Verify End-to-End

```bash
# This should return lab data from MongoDB through the Vite proxy
curl http://localhost:5173/stemulator/v1/labs
```

Open [http://localhost:5173](http://localhost:5173) — navigate to **Labs** and you should see labs loaded from the backend database.

### Architecture Diagram

```
┌──────────────────┐          ┌───────────────┐          ┌───────────┐
│  React Frontend  │──proxy──▶│  Spring Boot  │────────▶│  MongoDB  │
│  localhost:5173  │          │  :8080        │          │  :27017   │
│                  │          │               │          │           │
│  Vite Dev Server │          │  /stemulator  │          │  labs     │
│  Tailwind CSS    │          │  /v1/labs     │          │  collection│
│  React Router    │          │  /v1/guides   │          │           │
└──────────────────┘          │  /v1/chat/*   │          └───────────┘
                              └──────┬────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │  OpenAI API  │  ← API key stays on server
                              │  (LLM)      │  ← Never exposed to browser
                              └──────────────┘

  Frontend falls back to local heuristic evaluation
  if the backend is unavailable.
```

---

## Project Structure

```
stemulator-ui/
├── index.html                  # HTML entry point
├── package.json                # Dependencies and scripts
├── vite.config.ts              # Vite config with API proxy
├── vite-plugin-chat-proxy.ts   # Dev-server plugin: proxies /chat/completions → backend or OpenAI
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS (Tailwind plugin)
├── eslint.config.js            # ESLint rules
├── .env.example                # Environment variable template (copy to .env)
├── .gitignore                  # Git ignore rules (.env is excluded)
│
├── src/
│   ├── main.tsx                # App entry point — mounts GoogleOAuthProvider + React root
│   ├── App.tsx                 # Router with public + protected routes
│   ├── index.css               # Global styles + Tailwind directives
│   ├── types.ts                # TypeScript interfaces (Organism, SimulationState, ScienceLab, etc.)
│   ├── data.ts                 # Mock data (labs, courses) for offline mode
│   ├── simulation.ts           # Simulation engine (population dynamics, survival, reproduction)
│   │
│   ├── services/
│   │   ├── api.ts              # Backend API service (getLabs, getLab, getGuidance, createLab)
│   │   ├── openai.ts           # AI Coach service (proxied through backend /chat/completions)
│   │   └── localUsers.ts       # Auth layer: local email/password + Google OAuth, localStorage sessions
│   │
│   ├── components/
│   │   ├── Navbar.tsx          # Top navigation bar (shows avatar/initials when logged in)
│   │   ├── PageShell.tsx       # Page layout wrapper (navbar + content)
│   │   ├── PrivateRoute.tsx    # Route guard — redirects to / if no active session
│   │   ├── Canvas.tsx          # HTML5 Canvas — renders rabbits, wolves, environments
│   │   ├── Controls.tsx        # Lab controls — habitat, wolves, food, mutation rate
│   │   ├── Results.tsx         # Analysis dashboard — population chart, trait bars, insights
│   │   ├── LabContentPanel.tsx # Lab workflow panel — setup, observations, evidence, predictions
│   │   ├── AIPanel.tsx         # AI Science Coach chat (OpenAI-powered Q&A)
│   │   ├── AICoacHEvaluator.tsx# AI Coach evaluator (OpenAI → backend → local fallback)
│   │   ├── LabSidebar.tsx      # Lab info sidebar
│   │   ├── LabWorkflow.tsx     # Lab workflow component
│   │   └── StudentResponses.tsx# Student response forms
│   │
│   └── pages/
│       ├── LoginPage.tsx       # Login/signup landing (/) — Google OAuth + local auth
│       ├── Home.tsx            # Home page (/home) — hero, subjects, featured labs
│       ├── Labs.tsx            # Lab listing (/labs)
│       ├── LabDetail.tsx       # Lab player (/labs/:labId) — simulation + controls + analysis
│       ├── Courses.tsx         # Course listing (/courses)
│       └── CourseDetail.tsx    # Course detail (/courses/:id)
│
├── .github/
│   └── copilot-instructions.md # Copilot agent instructions
│
└── .vscode/
    └── tasks.json              # VS Code task: npm run dev
```

---

## Application Workflow

### Student Journey

```
1. BROWSE                    2. SELECT                   3. SIMULATE
┌──────────────┐            ┌──────────────┐            ┌──────────────────────────┐
│  Home Page   │───────────▶│  Labs Page   │───────────▶│  Lab Detail Page         │
│              │            │              │            │                          │
│  • Hero      │            │  • Filter by │            │  ┌────────┬───────────┐  │
│  • Subjects  │            │    discipline│            │  │Workflow│ Canvas    │  │
│  • Featured  │            │  • Lab cards │            │  │Panel   │ + Animals │  │
│    Labs      │            │  • Launch    │            │  │        │           │  │
└──────────────┘            └──────────────┘            │  │ Setup  │ Controls  │  │
                                                        │  │ Observe│ Habitat   │  │
                                                        │  │ Record │ Wolves    │  │
                                                        │  │ Predict│ Food      │  │
                                                        │  │        │ Mutation  │  │
                                                        │  ├────────┴───────────┤  │
                                                        │  │  Analysis / AI     │  │
                                                        │  │  Feedback          │  │
                                                        │  └────────────────────┘  │
                                                        └──────────────────────────┘
```

### Simulation Loop

```
  ┌─────────────────────────────────────────────────────────┐
  │                     GENERATION LOOP                      │
  │                                                         │
  │  1. SURVIVE — Each organism rolls for survival          │
  │     • Base probability: 75%                             │
  │     • Speed bonus: +1.5% per point                      │
  │     • Camouflage bonus: +2% per point                   │
  │     • Size bonus: +0.8% per point                       │
  │     • Predation penalty: -8% (low) to -30% (high)      │
  │     • Food penalty: 0% (abundant) to -15% (scarce)     │
  │     • Environment modifiers (forest→camo, arctic→size)  │
  │                                                         │
  │  2. REPRODUCE — Survivors breed                         │
  │     • Rabbits: 1-3 offspring (more when population low) │
  │     • Wolves: 1 pup per 2 survivors                    │
  │     • Traits inherited with mutation variance           │
  │     • Population caps: 120 prey, 25 predators           │
  │                                                         │
  │  3. STATS — Update charts and analysis                  │
  │     • Population history (area chart)                   │
  │     • Trait averages (bar chart)                        │
  │     • Dominant trait insight                            │
  │                                                         │
  │                  ┌──────────────┐                       │
  │                  │ Next Gen ▶   │ ← Click to advance    │
  │                  └──────────────┘                       │
  └─────────────────────────────────────────────────────────┘
```

### 4-Step Lab Workflow

Each lab part follows a guided inquiry process:

| Step | Section          | What Students Do                                         |
| ---- | ---------------- | -------------------------------------------------------- |
| 1    | **Setup**        | Read the experimental conditions (read-only)             |
| 2    | **Observations** | Answer observation questions based on simulation results |
| 3    | **Evidence**     | Record quantitative data and measurements                |
| 4    | **Predictions**  | Hypothesize what will happen under different conditions  |

Students type their responses into text fields, then click **Submit for Feedback** to receive AI-guided evaluation.

---

## Pages & Routes

| Route          | Access    | Component          | Description                                            |
| -------------- | --------- | ------------------ | ------------------------------------------------------ |
| `/`            | Public    | `LoginPage.tsx`    | Login / sign-up landing — Google OAuth + local auth    |
| `/home`        | Protected | `Home.tsx`         | Home page with hero, subject explorer, featured labs   |
| `/labs`        | Protected | `Labs.tsx`         | All available labs with discipline filter tabs         |
| `/labs/:labId` | Protected | `LabDetail.tsx`    | Full simulation environment with controls and analysis |
| `/courses`     | Protected | `Courses.tsx`      | Course cards for Physics and Chemistry                 |
| `/courses/:id` | Protected | `CourseDetail.tsx` | Course modules, lessons, and associated labs           |
| `/about`       | Protected | _(placeholder)_    | About page (not yet implemented)                       |

**Protected** routes require an active session and are wrapped in `PrivateRoute`, which redirects unauthenticated users to `/`.

---

## Authentication

STEMulator uses a **frontend-only demo auth layer** backed by `localStorage` (`src/services/localUsers.ts`). Two providers are supported:

| Provider   | How it works                                                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Local**  | Email + password. Password is SHA-256 hashed client-side before storage (demo only — not production-safe).                                                 |
| **Google** | OAuth 2.0 via `@react-oauth/google`. User info is fetched from Google's userinfo endpoint and persisted in localStorage. Requires `VITE_GOOGLE_CLIENT_ID`. |

### Auth Flow

```
User visits /
  └── LoginPage renders (public route)
        ├── Google Sign-In button → useGoogleLogin() → fetch userinfo → setGoogleSession()
        └── Email/Password form  → tryLogin() / registerUser()     → setSession()
              ↓ (either path)
        Session stored in localStorage
              ↓
        Navigate to /home  ← PrivateRoute allows access
```

### Session Persistence

Sessions survive page refresh (stored in `localStorage` under `stemulator_session`). To sign out, the **Navbar** calls `clearSession()` which removes the key and redirects back to `/`.

> ⚠️ **Production note:** This layer is for demonstration only. A production build must validate Google tokens server-side (Spring Security + Google token introspection) and replace SHA-256 with bcrypt/Argon2 on the backend.

---

## API Integration

### Endpoints Used

| Method | Endpoint                          | Used By         | Purpose                                                                   |
| ------ |-----------------------------------| --------------- |---------------------------------------------------------------------------|
| `GET`  | `/stemulator/v1/labs`             | Labs page       | Fetch all labs                                                            |
| `GET`  | `/stemulator/v1/labs/{labId}`     | Lab Detail page | Fetch single lab                                                          |
| `POST` | `/stemulator/v1/student_eval`     | AI Coach        | Evaluates the student's lab setup, observations, evidence and predictions |
| `POST` | `/stemulator/v1/chat/completions` | AI Coach        | Facilitates preset and open-ended conversation with the LLM               |
| `POST` | `/stemulator/v1/labs`             | (Future)        | Create new lab                                                            |

### Proxy Configuration

All API requests go through the Vite dev server proxy to avoid CORS:

```
Browser → localhost:5173/stemulator/v1/labs
                ↓ (Vite proxy)
         → localhost:8080/stemulator/v1/labs
                ↓ (Spring Boot)
         → MongoDB query → JSON response
```

### Fallback Behavior

```
API available?
  ├── YES → Use real data from backend
  └── NO  → Use mock data from src/data.ts
              └── Show "Using offline data" indicator
```

---

## Resilience & Observability

### Resilience Patterns

All external API calls are protected by three composable patterns defined in `src/services/resilience.ts`:

| Pattern                             | Description                                                                                                           | Config                                                  |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **Retry with exponential back-off** | Transient failures (5xx, 429, network errors) are retried up to N times with exponentially increasing delay + jitter  | Labs: 3 attempts / AI Coach: 2                          |
| **Circuit breaker**                 | After consecutive failures the circuit opens and fails fast, preventing request pile-up. Recovers via HALF_OPEN probe | Labs: 5 failures / 30 s cooldown; AI: 3 failures / 60 s |
| **Timeout**                         | Every fetch is wrapped in an `AbortController`-based deadline                                                         | Labs: 15 s, Guidance: 30 s, AI Coach: 30 s              |

```
resilientFetch(url, init, opts)
  └─ Circuit Breaker
       └─ Retry (exponential back-off + jitter)
            └─ Timeout (AbortController)
                 └─ fetch()
```

**Graceful degradation:** When the backend is unreachable, lab pages silently fall back to mock data from `src/data.ts`. The AI Coach shows a user-friendly error message. No raw infrastructure status is ever exposed to students.

### Observability

| Capability             | Implementation                | Details                                                                           |
| ---------------------- | ----------------------------- | --------------------------------------------------------------------------------- |
| **Structured logging** | `src/services/logger.ts`      | Levelled output (DEBUG/INFO/WARN/ERROR) with timestamps and JSON metadata         |
| **Health checks**      | `src/services/healthCheck.ts` | Polls Labs API + AI Coach every 60 s; reports latency, HTTP status, circuit state |
| **Error aggregation**  | `logger.getRecentErrors()`    | Rolling buffer of last 50 ERROR entries; subscribable for telemetry sinks         |
| **Circuit state**      | `registerCircuitBreaker()`    | Breaker states are exposed to the health-check system for unified reporting       |

In development, all logs go to the browser console. In production, the `defaultTransport` function in `logger.ts` can be swapped for a remote collector (CloudWatch, Datadog, etc.).

### Security Hardening

- **Input validation:** `labId` and other URL parameters are validated against `[a-zA-Z0-9_-]+` before interpolation
- **Session TTL:** Sessions expire after 24 hours; stale sessions are auto-cleared from localStorage
- **CSP header:** `Content-Security-Policy` meta tag restricts script, style, image, and connect sources
- **No console leaks:** All `console.log/warn/error` calls replaced with the structured logger
- **Google OAuth hardened:** `response.ok` validated before parsing userinfo JSON

---

## Environment Variables

Copy `.env.example` to `.env` and configure as needed:

```bash
cp .env.example .env
```

| Variable                | Default                | Description                                                                                                                                           |
| ----------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`          | _(empty — uses proxy)_ | Backend API URL. Leave blank for local dev with Vite proxy. Set to full URL for production.                                                           |
| `VITE_GOOGLE_CLIENT_ID` | _(required)_           | Google OAuth 2.0 client ID. Without it, Google Sign-In buttons appear but do nothing (app still loads). See below.                                    |
| `OPENAI_API_KEY`        | _(optional)_           | **Server-only** (no `VITE_` prefix — never sent to browser). Direct OpenAI fallback used by `vite-plugin-chat-proxy` when the backend is unavailable. |

**Local development:** Leave `VITE_API_URL` empty. The Vite proxy in `vite.config.ts` forwards `/stemulator/*` requests to `localhost:8080`.

**Production:** Set `VITE_API_URL=https://your-api-server.com/stemulator/v1`.

### Setting up VITE_GOOGLE_CLIENT_ID

1. Open [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Click **Create Credentials** → **OAuth client ID** → Application type: **Web application**.
3. Under **Authorised JavaScript origins** add `http://localhost:5173` (and your production URL).
4. Copy the generated client ID (format: `‹numbers›-‹hash›.apps.googleusercontent.com`).
5. Add it to your `.env` file:

```bash
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

> **Note:** `.env` is git-ignored. Every developer needs their own copy. The app will still load without this variable — Google Sign-In will simply not work.

### AI Science Coach

The AI Coach is powered by LLM calls that are **proxied through the backend** at `POST /stemulator/v1/chat/completions` and `POST /stemulator/v1/student_eval`. The OpenAI API key is configured on the backend — no API key is needed on the frontend.

The frontend sends chat messages to the backend, which forwards them to the LLM and returns the response. This keeps the API key secure on the server and never exposed to the browser.

**When the backend is available:** Students can:

- Chat with the AI Coach about their simulation in real time
- Use quick actions: "Explain what's happening", "Why did this happen?", "What should I try next?"
- Receive LLM-powered evaluation of their lab observations with scores, strengths, and guidance

**When the backend is unavailable:** The student evaluator returns an error.

---

## Available Scripts

| Command                 | Description                                  |
| ----------------------- | -------------------------------------------- |
| `npm install`           | Install all dependencies                     |
| `npm run dev`           | Start Vite dev server on port 5173           |
| `npm run build`         | Type-check with TSC and build for production |
| `npm run preview`       | Preview the production build locally         |
| `npm run lint`          | Run ESLint on all TypeScript files           |
| `npm test`              | Run all unit tests (single pass)             |
| `npm run test:watch`    | Run tests in watch mode (re-runs on save)    |
| `npm run test:coverage` | Run tests and generate V8 coverage report    |

---

## Testing

The frontend uses [Vitest](https://vitest.dev/) with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) and [happy-dom](https://github.com/capricorn86/happy-dom) as the DOM environment.

```bash
# Run all tests
npm test

# Watch mode (re-runs on file save)
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Results (44 / 44 passing)

| File                        | Suite              | Tests                                                                                                                                                                           | Status |
| --------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| `simulation.test.ts`        | Initial State      | Starts at gen 0 · ~50 organisms · ~85% prey/15% predators · forest env · medium predation & food · mutationRate 5 · all organisms alive · traits in 0–10                        | ✅ 8/8 |
| `simulation.test.ts`        | `runGeneration()`  | Increments by 1 · cumulative increments · logs action per gen · records population history · prey cap ≤120 · predator cap ≤25 · predator floor (medium) · offspring traits 0–10 | ✅ 8/8 |
| `simulation.test.ts`        | `updateSettings()` | Updates environment · predation · foodAvailability · mutationRate · logs action · partial update preserves unrelated fields                                                     | ✅ 6/6 |
| `simulation.test.ts`        | `reset()`          | Generation → 0 · clears population history · clears actions log · env → forest · reinitializes organisms                                                                        | ✅ 5/5 |
| `simulation.test.ts`        | `getLabSnapshot()` | Returns environment · parameters · alive population count · ≤10 last actions                                                                                                    | ✅ 4/4 |
| `simulation.test.ts`        | Selection Pressure | High predation reduces prey more than low predation over 10 gens (5-trial average)                                                                                              | ✅ 1/1 |
| `Controls.test.tsx`         | Controls           | Renders Next Generation button · Reset button · fires `onRunGeneration` · fires `onReset` · displays mutation rate %                                                            | ✅ 5/5 |
| `AICoacHEvaluator.test.tsx` | AICoacHEvaluator   | Submit prompt when no responses · loading state on mount · score displayed · feedback text · strengths · areas for improvement · Next Part button at ≥60                        | ✅ 7/7 |

### Test Coverage Summary

| Source File                           | Covered                                                                                           | Not Covered                                        |
| ------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `src/simulation.ts`                   | `constructor`, `runGeneration()`, `updateSettings()`, `reset()`, `getLabSnapshot()`, `getState()` | `applyScienceLab()`                                |
| `src/components/Controls.tsx`         | Button rendering, `onRunGeneration`, `onReset`, mutation rate display                             | Habitat/predation/food toggle buttons              |
| `src/components/AICoacHEvaluator.tsx` | Null-state prompt, loading, score, feedback, strengths, improvements, pass threshold              | Local offline fallback path                        |
| `src/services/api.ts`                 | `getGuidance()` call path (mocked)                                                                | `getLabs`, `getLab`, `createLab`, `checkApiHealth` |
| `src/services/openai.ts`              | `evaluateStudentWork()` call path (mocked)                                                        | `chatWithCoach`                                    |
| `src/types.ts`                        | All interfaces validated via TS compilation                                                       | N/A (no runtime logic)                             |
| `src/components/AIPanel.tsx`          | —                                                                                                 | Error bubble on failed chat                        |
| `src/pages/Labs.tsx`                  | —                                                                                                 | Offline banner on `getLabs` failure                |
| `src/pages/LabDetail.tsx`             | —                                                                                                 | Lab loading, part navigation                       |

---

## Troubleshooting

### App loads a blank page after a fresh pull

The most common cause is a missing `.env` file (it is git-ignored and not committed).

```bash
# 1. Create your .env from the example
cp .env.example .env

# 2. Fill in VITE_GOOGLE_CLIENT_ID (see Environment Variables section above)
#    Leave it empty if you don't need Google Sign-In — the app will still load.

# 3. Restart the dev server
npm run dev
```

If the page is still blank, open the browser DevTools console and look for errors.

### Frontend won't start

```bash
# Make sure you're using Node 18+
node -v  # Should be v18.x or v20.x

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### TypeScript errors

```bash
# Run type-check to see all errors
npx tsc --noEmit
```

### Labs page shows mock data instead of backend data

1. Verify MongoDB is running: `docker ps | grep mongo`
2. Verify the backend is running: `curl http://localhost:8080/stemulator/v1/labs`
3. Check the Vite proxy is working: `curl http://localhost:5173/stemulator/v1/labs`
4. Check browser console for fetch errors

### "Lab not found" when clicking Launch

This was a known issue caused by the backend using `labId` while the frontend expects `_id`. It's been fixed with the `normalizeLab()` function in `src/services/api.ts`. If you still see it:

```bash
# Check what the API returns
curl -s http://localhost:8080/stemulator/v1/labs | python3 -m json.tool | head -20
# Look for "labId" vs "_id" in the response
```

### AI Coach not responding

1. Make sure the backend is running: `curl http://localhost:8080/stemulator/v1/labs`
2. Test the chat endpoint directly:
   ```bash
   curl -s -X POST http://localhost:8080/stemulator/v1/chat/completions \
     -H 'Content-Type: application/json' \
     -d '{"messages":[{"role":"user","content":"Hello"}]}'
   ```
3. Check the backend logs for OpenAI API errors (the API key is configured server-side)
4. If the backend is down, the evaluator falls back to local heuristic scoring

### Canvas is blank

- Make sure the simulation has been initialized. Click **Next Generation** to start.
- Check browser console for Canvas API errors.

### Charts not rendering

- Run `npm ls recharts` to verify Recharts is installed.
- Clear browser cache and reload.

### Port conflicts

```bash
# Check what's using port 5173
lsof -i :5173

# Check what's using port 8080
lsof -i :8080

# Kill a process on a port
kill -9 $(lsof -ti :5173)
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m "feat: add my feature"`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

This project is for educational purposes as part of the Regis University STEM education initiative.
