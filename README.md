# 🧬 STEMulator

An AI-guided virtual STEM lab platform with interactive courses and real-time Natural Selection simulations. Built with React, TypeScript, and Vite.

> **Backend API repo:** [github.com/ngulley/stemulator-api](https://github.com/ngulley/stemulator-api)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start (Frontend Only)](#quick-start-frontend-only)
- [Full Stack Setup (Frontend + Backend)](#full-stack-setup-frontend--backend)
- [Project Structure](#project-structure)
- [Application Workflow](#application-workflow)
- [Pages & Routes](#pages--routes)
- [API Integration](#api-integration)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
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

---

## Tech Stack

| Layer          | Technology       | Version |
| -------------- | ---------------- | ------- |
| **Framework**  | React            | 18.2    |
| **Language**   | TypeScript       | 5.2+    |
| **Build Tool** | Vite             | 5.0+    |
| **Styling**    | Tailwind CSS     | 3.4     |
| **Routing**    | React Router     | 7.13    |
| **Charts**     | Recharts         | 2.12    |
| **Icons**      | Lucide React     | 0.563   |
| **Canvas**     | HTML5 Canvas API | —       |

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

# 3. Start development server
npm run dev

# 4. Open in browser
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
└────────┬─────────┘          └───────────────┘          └───────────┘
         │
         │  VITE_OPENAI_API_KEY
         ▼
  ┌──────────────┐
  │  OpenAI API  │  ← AI Science Coach (chat + evaluation)
  │  gpt-4o-mini │  ← Called directly from frontend
  └──────────────┘
         │
  Falls back to:
  • Backend /guides endpoint (if available)
  • Local heuristic evaluation (always available)
```

---

## Project Structure

```
STEMulator/
├── index.html                  # HTML entry point
├── package.json                # Dependencies and scripts
├── vite.config.ts              # Vite config with API proxy
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS (Tailwind plugin)
├── eslint.config.js            # ESLint rules
├── .env.example                # Environment variable template
├── .gitignore                  # Git ignore rules
│
├── src/
│   ├── main.tsx                # App entry point (React root)
│   ├── App.tsx                 # Router with all routes
│   ├── index.css               # Global styles + Tailwind directives
│   ├── types.ts                # TypeScript interfaces (Organism, SimulationState, ScienceLab, etc.)
│   ├── data.ts                 # Mock data (labs, courses) for offline mode
│   ├── simulation.ts           # Simulation engine (population dynamics, survival, reproduction)
│   │
│   ├── services/
│   │   ├── api.ts              # Backend API service (getLabs, getLab, getGuidance, createLab)
│   │   └── openai.ts           # OpenAI integration (chatWithCoach, evaluateStudentWork)
│   │
│   ├── components/
│   │   ├── Navbar.tsx          # Top navigation bar
│   │   ├── PageShell.tsx       # Page layout wrapper (navbar + content)
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
│       ├── Home.tsx            # Landing page (/)
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

| Route          | Page          | Component          | Description                                             |
| -------------- | ------------- | ------------------ | ------------------------------------------------------- |
| `/`            | Home          | `Home.tsx`         | Landing page with hero, subject explorer, featured labs |
| `/labs`        | Labs          | `Labs.tsx`         | All available labs with discipline filter tabs          |
| `/labs/:labId` | Lab Player    | `LabDetail.tsx`    | Full simulation environment with controls and analysis  |
| `/courses`     | Courses       | `Courses.tsx`      | Course cards for Physics and Chemistry                  |
| `/courses/:id` | Course Detail | `CourseDetail.tsx` | Course modules, lessons, and associated labs            |

---

## API Integration

### Endpoints Used

| Method | Endpoint                                          | Used By         | Purpose          |
| ------ | ------------------------------------------------- | --------------- | ---------------- |
| `GET`  | `/stemulator/v1/labs`                             | Labs page       | Fetch all labs   |
| `GET`  | `/stemulator/v1/labs/{labId}`                     | Lab Detail page | Fetch single lab |
| `POST` | `/stemulator/v1/guides/lab/{labId}/part/{partId}` | AI Coach        | Get AI feedback  |
| `POST` | `/stemulator/v1/labs`                             | (Future)        | Create new lab   |

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

## Environment Variables

Copy `.env.example` to `.env` and configure as needed:

```bash
cp .env.example .env
```

| Variable              | Default                | Description                                                                                                               |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`        | _(empty — uses proxy)_ | Backend API URL. Leave blank for local dev with Vite proxy. Set to full URL for production.                               |
| `VITE_OPENAI_API_KEY` | _(empty)_              | OpenAI API key for the AI Science Coach. Get one at [platform.openai.com/api-keys](https://platform.openai.com/api-keys). |

**Local development:** Leave `VITE_API_URL` empty. The Vite proxy in `vite.config.ts` forwards `/stemulator/*` requests to `localhost:8080`.

**Production:** Set `VITE_API_URL=https://your-api-server.com/stemulator/v1`.

### AI Science Coach Setup

The AI Coach uses **GPT-4o-mini** via the OpenAI API. To enable it:

```bash
# 1. Get an API key from https://platform.openai.com/api-keys
# 2. Add it to your .env file
echo 'VITE_OPENAI_API_KEY=sk-your-key-here' >> .env

# 3. Restart the dev server (Vite picks up .env changes on restart)
npm run dev
```

**Without the key:** The AI Feedback tab shows a "not configured" notice, and the student evaluator falls back to local heuristic scoring.

**With the key:** Students can:

- Chat with the AI Coach about their simulation in real time
- Use quick actions: "Explain what's happening", "Why did this happen?", "What should I try next?"
- Receive GPT-powered evaluation of their lab observations with scores, strengths, and guidance

**Cost:** GPT-4o-mini is very affordable (~$0.15 per 1M input tokens). A typical student session uses a few cents.

> ⚠️ **Security note:** The API key is stored in `.env` (gitignored) and exposed to the browser via `VITE_` prefix. For production, consider proxying OpenAI calls through your backend instead.

---

## Available Scripts

| Command           | Description                                  |
| ----------------- | -------------------------------------------- |
| `npm install`     | Install all dependencies                     |
| `npm run dev`     | Start Vite dev server on port 5173           |
| `npm run build`   | Type-check with TSC and build for production |
| `npm run preview` | Preview the production build locally         |
| `npm run lint`    | Run ESLint on all TypeScript files           |

---

## Troubleshooting

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

### AI Coach shows "Not Configured"

1. Make sure `VITE_OPENAI_API_KEY` is set in your `.env` file (not `.env.example`)
2. The key must start with `sk-` to be recognized
3. Restart the dev server after editing `.env` — Vite doesn't hot-reload env changes
4. Check the browser console for OpenAI API errors (401 = invalid key, 429 = rate limit)

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
