# AI Interview Coach / InterviewOS — Current Project Context

This document reflects the current state of the project as of 2026-08-08. It captures the implemented frontend experience, the current architecture, and the remaining gaps that still need to be built out.

---

## 1. Product Summary

AI Interview Coach is a frontend-first mock interview experience designed to feel like a polished prep platform for job seekers. The experience is centered around a retro-computing visual language and a guided path through:

- landing and onboarding
- profile setup
- dashboard and progress tracking
- technical, behavioral, and aptitude practice rounds
- a full performance report

The UI branding currently uses the name InterviewOS, while the repository remains under the AI Interview Coach project name.

---

## 2. What Is Implemented Right Now

### Frontend experience
- immersive landing page with a CRT-style hero section and animated scroll storytelling
- floppy-disk entry interaction that opens an auth experience
- create-interview form with full name, target position, industry, and resume upload UI
- dashboard with readiness score, day streak, round history, and practice round entry points
- technical round with a Monaco-based coding editor, local execution runner, timer, and submission state
- behavioral round with a simulated AI interviewer, answer input, microphone-style interaction, and STAR-style feedback UI
- aptitude round with timed questions, a scratchpad, explanation panel, and auto-submit behavior on timeout
- full report page with score comparison, highlights, STAR breakdown support, and PDF export
- route-based navigation across the main app flow

### Authentication and routing
- Supabase authentication is wired into the frontend for sign up, sign in, and sign out
- protected routes guard the main interview screens and redirect unauthenticated users to the landing page
- the app currently uses client-side routing with React Router and state passed between screens

### Current reality
The app is best described as a high-fidelity frontend prototype with advanced UI polish and simulated interactions. It is not yet fully connected to a production backend, real AI question generation, or persistent interview state.

---

## 3. Current Tech Stack

### Frontend
- React
- Vite
- React Router DOM
- Tailwind CSS
- Framer Motion
- Lucide React
- Recharts
- Monaco Editor via @monaco-editor/react
- html2canvas + jsPDF for report export
- Supabase JS client

### Backend
- Backend folder exists and is prepared for future API work
- Current backend state is minimal: only environment scaffolding is present

### Planned backend services
- FastAPI (Python)
- Supabase Postgres/Auth/Storage
- OpenAI API for resume parsing, question generation, and scoring feedback
- PyMuPDF for extracting text from uploaded resumes

---

## 4. Project Structure

```text
ai-interview-coach/
├── PROJECT_CONTEXT.md
├── README.md
├── backend/
│   ├── .env.example
│   └── .gitkeep
└── frontend/
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── README.md
    ├── tailwind.config.js
    ├── vite.config.js
    ├── public/
    │   └── assets/
    └── src/
        ├── App.jsx
        ├── index.css
        ├── main.jsx
        ├── components/
        │   ├── AuthScreen.jsx
        │   ├── CRTMonitor.jsx
        │   ├── FeaturesSection.jsx
        │   ├── FloppyDiskModal.jsx
        │   ├── Footer.jsx
        │   ├── HowItWorksSection.jsx
        │   ├── Navbar.jsx
        │   ├── ProtectedRoute.jsx
        │   ├── ReviewsSection.jsx
        │   └── ScrollSequenceScreen.jsx
        ├── lib/
        │   └── supabase.js
        ├── pages/
        │   ├── AptitudeRound.jsx
        │   ├── BehavioralRound.jsx
        │   ├── CreateInterview.jsx
        │   ├── Dashboard.jsx
        │   ├── FullReport.jsx
        │   ├── LandingPage.jsx
        │   ├── Settings.jsx
        │   └── TechnicalRound.jsx
        └── services/
            └── authservice.js
```

---

## 5. Current App Architecture

### Entry points
- frontend/src/main.jsx mounts the React app into the DOM
- frontend/src/App.jsx defines the main route configuration

### Current routes
- / → LandingPage
- /create-interview → CreateInterview
- /dashboard → Dashboard
- /settings → Settings
- /full-report → FullReport
- /technical-round → TechnicalRound
- /behavioral-round → BehavioralRound
- /aptitude-round → AptitudeRound

### Authentication flow
- ProtectedRoute checks the Supabase session on mount and on auth state changes
- unauthenticated users are redirected to the landing page
- authenticated users can access the interview flow

### Data flow pattern
- the app is mainly driven by local React state and router state
- profile details are passed through navigation state from Create Interview to Dashboard and Report screens
- round screens currently use local demo content rather than persisted backend data

---

## 6. Page-by-Page Notes

### Landing page
- built as an immersive intro experience with a retro-terminal aesthetic
- includes scroll-driven storytelling, feature sections, reviews, and the footer
- uses animated transitions and a branded CRT-style presentation

### Create Interview page
- collects full name, target role, industry, and a resume upload
- simulates the setup of a personalized interview environment
- redirects to the dashboard after a short success state

### Dashboard page
- acts as the main hub after profile creation
- shows readiness score, round history, streak, and a modal for selecting a practice round
- uses locally mocked round data and feedback cards

### Technical Round page
- presents coding problems with starter code and a local JavaScript execution runner
- supports switching problems, changing languages, running code, and submitting solutions
- uses a local timer and simulated feedback rather than a real judge

### Behavioral Round page
- simulates an AI interviewer experience with a question-by-question flow
- includes textarea input and a microphone-style interaction for voice-style demo behavior
- shows a STAR-method feedback card after analysis

### Aptitude Round page
- includes timed reasoning and estimation questions
- provides a scratchpad and explanation panel
- auto-submits and reveals explanations when the timer expires

### Full Report page
- summarizes performance across practice rounds
- includes a bar chart, best/worst answer highlights, and optional STAR breakdown data
- supports PDF export using html2canvas and jsPDF

### Settings page
- route exists and is wired into navigation
- currently serves as a placeholder/unfinished area compared with the rest of the app

---

## 7. Reusable UI Components

### AuthScreen
- used for the sign-in/sign-up experience surfaced through the floppy-disk interaction

### CRTMonitor
- wraps the main retro display experience and visual frame

### ScrollSequenceScreen
- powers the animated scroll-based storytelling sequence on the landing page

### FloppyDiskModal
- handles the disk insertion interaction and auth entry point

### Other shared sections
- Navbar, FeaturesSection, HowItWorksSection, ReviewsSection, Footer

---

## 8. Styling and Design Direction

The visual language is intentionally stylized around a retro computing experience:

- cream/beige background tones
- black outlines and bold serif headlines
- monospace and fragment-style labels
- CRT monitor framing
- floppy-disk-inspired UI accents
- red and purple accent colors

The styling system is implemented with Tailwind CSS and custom utility classes in the frontend.

---

## 9. Current Status and Gaps

### What is working well
- polished end-to-end frontend flow for the mock interview experience
- strong visual UI and animated transitions
- protected authenticated route flow
- Supabase email/password auth flow for signup and login
- multiple interactive round experiences with realistic UI behavior

### Still pending
- real backend API implementation beyond Supabase auth
- resume upload parsing and storage
- real AI question generation and answer scoring
- persistence of interview state in a database
- deeper report logic based on actual round data
- completion of the settings experience
- production-ready data model and API contracts

### Summary
The project is currently a strong frontend prototype with a clear product direction and a realistic path toward backend integration. It is ready for the next phase: replacing mocked behavior with API-backed interview workflows and AI-powered feedback.

---

## 10. Current State of Data and Persistence

At the moment, the app does not have a fully persistent backend connection for interviews or reports.

### Current demo data patterns
- dashboard round cards and feedback are local static arrays
- behavioral questions are local constants in the page component
- aptitude questions are local constants in the page component
- create interview uses local form state and a simulated success transition
- auth uses Supabase auth calls from frontend/src/services/authservice.js

### Important next steps
- build a backend API layer for auth, profile creation, and interview rounds
- connect the frontend to real endpoints rather than relying on router state and local mock arrays
- implement resume parsing and storage
- connect AI-powered question generation and scoring
- introduce backend persistence for rounds, answers, and reports

### Planned persistence model
The README describes a backend schema with these tables:
- users
- profiles
- resumes
- rounds
- questions
- answers
- technical_questions
- aptitude_questions

This is the intended direction once the backend is implemented.

---

## 11. Planned Backend Architecture

The project README describes a backend architecture centered around FastAPI + Supabase + OpenAI.

### Planned backend responsibilities
- user authentication
- profile creation based on interview setup
- resume upload and parsing
- technical question retrieval
- behavioral question generation
- answer scoring and feedback generation
- dashboard/report data aggregation

### Planned API endpoints
- POST /auth/signup
- POST /auth/login
- POST /resume/upload
- DELETE /resume/{id}
- POST /interview/create
- GET /dashboard
- POST /round/start
- POST /round/{id}/answer
- GET /report/latest

### Planned AI behavior
- behavioral questions generated live from resume and profile context
- feedback and scoring generated from the user’s answers
- technical questions retrieved from a curated bank based on role/industry
- aptitude questions selected from an industry-based bank

---

## 12. Current User Experience Flow

### Happy path flow (as implemented now)
1. User opens landing page
2. User clicks “Start preparing”
3. Floppy disk modal appears
4. User chooses sign up or login
5. Auth screen appears inside the CRT monitor
6. User submits auth form and the Supabase auth service signs them in
7. User is navigated to create interview
8. User provides profile info and resume upload
9. User is navigated to dashboard
10. User starts a practice round
11. User is routed to a round experience page
12. User can view feedback and report screens

### Important UX notes
- The app is heavily styled as an experience, not just a utility tool
- The landing page is designed to feel like an interactive retro system booting up
- The app is meant to feel immersive and playful, not minimal or corporate

---

## 13. Important Implementation Notes for Future Work

### Preserve these conventions
- keep the retro CRT / floppy-disk visual language intact
- keep the product feeling polished and experiential
- maintain the “InterviewOS” branding in the UI where possible
- keep route-based navigation simple and predictable

### What should be replaced or connected later
- hardcoded round data should be replaced with backend-driven data
- Supabase auth should be extended with full profile/session persistence and backend routing
- mock AI scoring should be replaced with real AI calls
- uploaded file handling should be replaced with actual parsing and storage

### What is already good
- the page structure is clear
- the component boundaries are reasonable
- the visual language is distinctive and consistent
- the onboarding-to-dashboard flow is believable

---

## 14. Suggested Next Development Priorities

If continuing the project, the most logical next steps are:
1. stand up the backend FastAPI app
2. create the database schema in Supabase
3. implement auth endpoints and profile creation
4. implement resume upload and parsing
5. connect the dashboard to live data
6. implement the round start and answer submission flows
7. replace the static question content with real, structured content
8. wire the full report page to real round history

---

## 15. Short Version for Another AI

This project is a polished frontend prototype for an AI interview coaching app called InterviewOS. It currently has a retro-themed landing experience, auth flow, profile creation, dashboard, and mock interview round pages for technical, behavioral, and aptitude practice. The UI is visually rich and highly branded, but the data is mostly hardcoded and the backend is not yet implemented. The long-term architecture is FastAPI + Supabase + OpenAI, with routes for auth, resume upload, profile creation, dashboard data, round lifecycle, and reporting.

If another AI is continuing this project, the main job is to connect the existing frontend flow to a real backend while preserving the current visual identity and interaction design.
