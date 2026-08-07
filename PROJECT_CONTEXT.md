# AI Interview Coach / InterviewOS — Current Project Context

This document reflects the current state of the project as of 2026-08-07. It summarizes the work implemented so far, the app structure, and the remaining gaps.

---

## 1. Product Summary

AI Interview Coach is a polished frontend-first mock interview experience designed to feel like a real interview preparation platform. The product is positioned as an MVP with a retro computer aesthetic and a guided flow through:

- landing and onboarding
- profile creation
- dashboard and progress tracking
- technical, behavioral, and aptitude practice rounds
- a full performance report

The UI branding currently uses the name InterviewOS, while the repository remains under the AI Interview Coach project name.

---

## 2. What Has Been Implemented So Far

### Frontend experience
- landing page with a CRT-style hero experience
- scroll-driven storytelling sequence
- floppy-disk interaction that opens an auth experience
- create interview form with profile inputs and resume upload UI
- dashboard with readiness score, streak, history, and practice round entry points
- technical round experience with a coding editor, local runner, and submit state
- behavioral round experience with a simulated AI interviewer and STAR-style feedback
- aptitude round experience with a question navigator, countdown timer, scratchpad, and explanation panel
- full report page with score comparison and highlight sections
- route-based navigation across all major screens

### Initial integration work
- Supabase client configured in the frontend using environment variables
- frontend environment file created for Supabase connection settings

### Current reality
The app is currently a strong frontend prototype with mostly local/demo data and simulated interactions. It is not yet connected to a real backend or live AI pipeline.

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
- Supabase JS client

### Backend
- Backend folder exists and is prepared for future API work
- Current backend state is minimal: only environment example scaffolding is present

### Planned backend services
- FastAPI (Python)
- Supabase database/auth/storage
- OpenAI API for resume parsing and AI-generated feedback
- PyMuPDF for PDF resume extraction

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
        │   ├── ReviewsSection.jsx
        │   └── ScrollSequenceScreen.jsx
        └── pages/
            ├── AptitudeRound.jsx
            ├── BehavioralRound.jsx
            ├── CreateInterview.jsx
            ├── Dashboard.jsx
            ├── FullReport.jsx
            ├── LandingPage.jsx
            ├── Settings.jsx
            └── TechnicalRound.jsx
```

---

## 5. App Architecture

### Entry points
- frontend/src/main.jsx mounts the app into the DOM
- frontend/src/App.jsx defines the routing structure

### Current routes
- / → LandingPage
- /create-interview → CreateInterview
- /dashboard → Dashboard
- /settings → Settings
- /full-report → FullReport
- /technical-round → TechnicalRound
- /behavioral-round → BehavioralRound
- /aptitude-round → AptitudeRound

### Data flow pattern
- the app is driven mainly by local React state
- profile info is passed between pages using React Router state
- the UI simulates round completion, scoring, and feedback
- no production backend persistence is wired up yet

---

## 6. Page-by-Page Notes

### Landing page
- built as an immersive intro experience with retro styling
- uses Framer Motion for scroll-based visual transitions
- includes interactive sections for product explanation, features, reviews, and footer

### Create Interview page
- collects full name, target position, industry, and resume file input
- simulates interview setup generation and then navigates to the dashboard
- passes profile information to later screens via router state

### Dashboard page
- serves as the main hub after profile creation
- shows readiness score, rounds history, and improvement areas
- includes a practice-round modal that routes the user to the appropriate mock interview page

### Technical Round page
- presents coding problems with starter code and a local JavaScript runner
- allows the user to edit code, run it locally, and submit a solution
- uses mock feedback rather than a real judge or backend service

### Behavioral Round page
- simulates an AI interviewer behaviour with questions and feedback
- includes a microphone-style input button and a STAR-method feedback card
- currently functions as a UI simulation only

### Aptitude Round page
- shows reasoning and estimation questions with explanation and scratchpad support
- includes a countdown timer and navigation between questions

### Full Report page
- summarizes practice round performance in a report-style layout
- uses Recharts to render a score comparison chart
- currently relies on state passed from the dashboard or local fallback data

### Settings page
- route exists and is wired into navigation
- currently serves as a placeholder/unfinished screen compared to the rest of the app

---

## 7. Reusable UI Components

### AuthScreen
- handles the sign-up/login experience shown through the floppy-disk interaction

### CRTMonitor
- creates the retro screen container and monitor frame

### ScrollSequenceScreen
- drives the animated scrolling sequence inside the hero experience

### FloppyDiskModal
- provides the disk insertion interaction and auth entry point

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

### Implemented well
- end-to-end frontend flow for the mock interview experience
- polished visual UI and screen transitions
- route-based app structure
- Supabase email/password auth flow with signup/login

### Still pending
- real backend API implementation beyond Supabase auth
- resume upload parsing and storage
- true AI question generation and scoring
- persistence of interview state in a database
- completion of the settings page and deeper report logic

### Summary
The project is currently best described as a high-fidelity frontend prototype with a strong UX foundation and a clear path toward backend integration.

- screen glow and vignette
- flicker animation
- turn-on animation
- custom scrollbar styling for the CRT screen

The style system is intentionally expressive and should be preserved when building new features.

---

## 10. Current State of Data and Persistence

At the moment, the app does not have a real persistent backend connection.

### Current static/demo data patterns
- Dashboard uses hardcoded rounds and feedback
- Behavioral questions are local constants inside the page component
- Aptitude questions are local constants inside the page component
- Create Interview uses local form state and simulated success
- Auth screen uses Supabase auth calls from `frontend/src/services/authservice.js` and navigates on successful signup/login

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
