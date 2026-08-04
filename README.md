# AI Interview Coach

> Practice interviews that actually feel like interviews — personalized to your resume, your target role, and your industry.

---

## Overview

AI Interview Coach is a web app that helps job candidates prepare for real interviews through three types of mock practice rounds — **Technical**, **Behavioral**, and **Aptitude** — followed by honest, AI-generated feedback and a growing track record over time.

Instead of a static bank of generic interview questions, the app builds a **personalized interview journey**:
- Behavioral questions are generated live by AI based on the candidate's actual uploaded resume
- Technical and Aptitude rounds pull from a curated question bank matched to the candidate's target role and industry
- Every completed round feeds into a readiness score, a practice streak, and a running list of what to improve next

Built as a hackathon MVP with a focus on shipping a complete, working user journey end to end rather than a large feature set.

---

## Tech Stack

**Frontend**
- React + TypeScript + Vite
- TailwindCSS + shadcn/ui
- Framer Motion (animation)
- React Router (navigation)
- React Hook Form + Zod (forms & validation)
- TanStack Query (data fetching once backend is live)
- Recharts (charts on the full report page)

**Backend**
- FastAPI (Python)
- Supabase — Postgres database, Auth, and File Storage
- OpenAI API — resume parsing, Behavioral question generation, and answer scoring/feedback
- PyMuPDF — extracting text from uploaded resume PDFs

**Deployment**
- Frontend → Vercel
- Backend → Railway / Render
- Database, Auth, Storage → Supabase (hosted)

---

## Setup

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- A Supabase project (free tier is fine)
- An OpenAI API key

### 1. Clone the repo
```bash
git clone https://github.com/<your-org>/ai-interview-coach.git
cd ai-interview-coach
```

### 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env      # add your Supabase URL + anon key
npm run dev
```

### 3. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # add your Supabase service key + OpenAI key
uvicorn main:app --reload
```

### 4. Environment variables

**`frontend/.env`**
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=http://localhost:8000
```

**`backend/.env`**
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

⚠️ Never commit `.env` files — both are already listed in `.gitignore`.

---

## Features

- **Landing page** with a retro-terminal hero and a scroll-driven reveal
- **Auth** — sign up / log in via a floppy-disk "insert to authenticate" interaction
- **Create Interview** — one-time setup: name, target position, industry, resume upload (drag & drop, PDF/DOCX)
- **Dashboard** — readiness score, rounds completed, daily practice streak, per-round-type scores with expandable AI feedback, recent history, and "Areas to Improve"
- **Three practice round types:**
  - **Technical** — 10 curated DSA-style questions per target position, filtered by industry, AI-graded
  - **Behavioral** — AI-generated live questions based on the user's actual resume, AI-graded with a STAR breakdown
  - **Aptitude** — 50 MCQ questions per industry, shuffled into random order each attempt, auto-graded against a fixed answer key
- **Areas to Improve** — shows exactly one suggestion per round type the user has *completed*, never guessing at rounds they haven't attempted
- **Full Report page** — overall readiness, a per-round-type score chart, best/worst-scored answers with feedback, STAR breakdown (if a Behavioral round exists), and expanded improvement notes
- **Streak tracking** — counts consecutive days with at least one completed round

---

## Technical Workflow

**How a request actually flows through the app**, end to end:

```
User action in the browser (React)
        ↓
Frontend calls a FastAPI endpoint
        ↓
Backend reads/writes Supabase (Postgres) as needed
        ↓
For AI-dependent steps (Behavioral questions, scoring, feedback),
backend calls the OpenAI API
        ↓
Backend returns a JSON response in an agreed shape
        ↓
Frontend updates the UI (React state / TanStack Query cache)
```

**Example — starting a Technical round:**
1. User clicks "Start a practice round" → picks "Technical"
2. Frontend calls `POST /round/start` with the user's id and round type
3. Backend looks up the user's `target_position` and `industry` from their profile
4. Backend pulls 10 matching rows from the static `technical_questions` table (no AI call needed here — it's a lookup, not a generation)
5. Backend creates a new row in `rounds` and one row per question in `questions`
6. Response returns the question list to the frontend, which renders the mock interview screen

**Example — completing a Behavioral round:**
1. Backend generates questions live via OpenAI, using the parsed resume + target position + industry as context
2. Each answer the user submits is sent to OpenAI for scoring + feedback + a STAR breakdown
3. Once all questions are answered, the round is marked `completed` with an overall score
4. Dashboard stats (readiness, streak, recent history, areas to improve) are recalculated from the updated `rounds` table on next load — nothing is cached or precomputed

**Build strategy:** backend endpoints are built first against **hardcoded fake data** matching the agreed response shape, so frontend work is never blocked waiting on real AI logic. Real OpenAI calls are wired in afterward without changing what the frontend receives.

---

## Database Schema

| Table | Purpose |
|---|---|
| `users` | Account info |
| `profiles` | Target position, industry, resume link — created on Create Interview submission |
| `resumes` | Uploaded file, extracted text, AI-parsed skills |
| `rounds` | One row per practice session (type, status, score) |
| `questions` | Questions belonging to a specific round |
| `answers` | User's answers, scores, and feedback |
| `technical_questions` | Static bank of DSA questions per position/industry |
| `aptitude_questions` | Static bank of MCQ questions per industry |

---

## API Endpoints

| Endpoint | Purpose |
|---|---|
| `POST /auth/signup` | Create an account |
| `POST /auth/login` | Log in, returns whether the user already has a profile (for routing) |
| `POST /resume/upload` | Store resume, extract text, parse skills via AI |
| `DELETE /resume/{id}` | Remove an uploaded resume |
| `POST /interview/create` | Save the Create Interview form |
| `GET /dashboard` | Return everything the dashboard needs in one call |
| `POST /round/start` | Start a round (bank lookup or live AI generation, depending on type) |
| `POST /round/{id}/answer` | Submit an answer, get back a score and feedback |
| `GET /report/latest` | Powers the Full Report page |

---

## Project Status

✅ Landing page, Auth screens, Create Interview, Dashboard — designed and prototyped
✅ Database schema and endpoint contracts — finalized
🚧 Backend implementation — in progress (fake-data endpoints first, then real AI wiring)
🚧 Mock Interview screen — not yet designed
🚧 Full Report page — in progress
⬜ Question content — 60 Technical questions + Aptitude bank still need to be written
⬜ Settings page — not started

---

## Contributing

This is a hackathon project built by a Team Delmora.
