# AI Interview Coach / InterviewOS — Full Project Context

This document is a complete handoff summary of the app as it exists right now. It is intended for another AI assistant, teammate, or future contributor to understand what is being built, how it is structured, what is already implemented, and what is still planned.

---

## 1. Product Overview

AI Interview Coach is a web app designed to help job candidates practice interviews in a more realistic and personalized way.

The core idea is:
- users create an interview profile
- the app prepares a personalized mock interview experience
- users go through technical, behavioral, and aptitude rounds
- the app provides feedback and a progress summary

The current UI is a polished prototype and experience-first frontend with a retro CRT / floppy-disk aesthetic. The project is positioned as a hackathon MVP, so the goal is to ship a complete user experience end-to-end rather than build a huge feature set.

### Current product positioning
- Brand name used in UI: InterviewOS
- Project name in repo: AI Interview Coach
- Style: retro 80s/90s computer interface inspired by Macintosh-era CRT screens and floppy disks
- Experience emphasis: immersive onboarding, mock interview flow, feedback visibility

---

## 2. Core Product Goals

The app is meant to help a user:
- prepare for interviews based on their target role and industry
- practice different types of interview rounds
- get feedback that feels like an actual interviewer assessment
- track readiness over time

### Main user journey
1. User lands on the homepage
2. User authenticates or signs up
3. User creates an interview profile with:
   - full name
   - target position
   - industry
   - resume upload
4. User reaches a dashboard
5. User starts mock rounds
6. User views report/progress feedback

---

## 3. Current Implementation Status

### Implemented / visually present
- landing page
- retro CRT-themed hero experience
- auth flow interaction via floppy disk modal
- create interview form
- dashboard screen
- technical round screen
- behavioral round screen
- aptitude round screen
- full report page route
- settings route
- custom retro styling system

### Still planned or incomplete
- real backend integration
- real authentication
- real resume parsing
- real AI-generated behavioral questions
- real AI scoring/feedback
- real persistence in database
- complete question banks for technical and aptitude content
- working settings page content
- full report page dynamically filled from backend data

### Current reality
The app is currently a front-end prototype with mostly local state and simulated interactions. Most of the data shown on the dashboard and rounds is hardcoded or locally mocked.

---

## 4. Tech Stack

### Frontend
- React
- Vite
- React Router DOM
- Tailwind CSS
- Framer Motion
- Lucide React
- Recharts (planned/declared, not heavily used yet)

### Backend (planned)
- FastAPI (Python)
- Supabase
  - Postgres database
  - Auth
  - File storage
- OpenAI API
- PyMuPDF for resume PDF text extraction

### Deployment (planned)
- Frontend: Vercel
- Backend: Railway or Render
- Database/auth/storage: Supabase

---

## 5. Repository Structure

```text
ai-interview-coach/
├── README.md
├── package-lock.json
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

## 6. App Architecture

### Frontend entry points
- [frontend/src/main.jsx](frontend/src/main.jsx) mounts the app into the DOM
- [frontend/src/App.jsx](frontend/src/App.jsx) contains all React Router routes

### Routing structure
The app currently uses client-side routing with these paths:
- / → LandingPage
- /create-interview → CreateInterview
- /dashboard → Dashboard
- /settings → Settings
- /full-report → FullReport
- /technical-round → TechnicalRound
- /behavioral-round → BehavioralRound
- /aptitude-round → AptitudeRound

### Current data flow pattern
- The UX is mostly stateful within each page
- Some data is passed between pages through React Router location state
- The app does not yet use a global state manager or live backend data store

---

## 7. Page-by-Page Breakdown

### 7.1 Landing Page
File: [frontend/src/pages/LandingPage.jsx](frontend/src/pages/LandingPage.jsx)

Purpose:
- hero experience for the product
- introduces the app with a retro CRT monitor UI
- includes scroll-driven storytelling and a mock interviewer reveal

Key behavior:
- uses Framer Motion for scroll-based progression
- tracks scroll progress and updates the screen sequence step
- uses a floppy disk interaction to trigger an auth experience
- includes sections below the hero: How it works, Features, Reviews, Footer

Visual identity:
- beige/cream theme
- black text
- red accent
- CRT monitor framing
- animated transitions

### 7.2 Create Interview Page
File: [frontend/src/pages/CreateInterview.jsx](frontend/src/pages/CreateInterview.jsx)

Purpose:
- collect the user’s profile information
- collect target position, industry, and resume upload
- create a personalized interview setup

Current behavior:
- collects full name, target position, industry
- accepts resume upload (file input, UI only)
- simulates generation with a loading state
- redirects to the dashboard after a short delay
- passes profile info via router state

Important note:
- this is a prototype; file upload is not actually parsed yet

### 7.3 Dashboard Page
File: [frontend/src/pages/Dashboard.jsx](frontend/src/pages/Dashboard.jsx)

Purpose:
- serve as the main post-signup hub
- show user summary, readiness score, streak, rounds history, and improvement areas

Current behavior:
- displays the user’s name and target info
- uses local demo round data for technical, behavioral, and aptitude rounds
- shows a readiness score based on the local round list
- shows history entries and improvement insights
- lets the user start a practice round via modal
- routes to the relevant round page

Important note:
- this is hardcoded demo content, not connected to a backend

### 7.4 Technical Round Page
File: [frontend/src/pages/TechnicalRound.jsx](frontend/src/pages/TechnicalRound.jsx)

Purpose:
- simulate technical interview practice for coding problems

Current behavior:
- includes a coding problem selector
- shows a problem description and starter code
- allows the user to edit code in a textarea
- allows the user to run code locally via a safe client-side JavaScript runner
- provides a submit action with a simulated success state

Current implementation details:
- uses local sample problems
- uses a pseudo-runner with console logging
- does not connect to an actual judge or backend endpoint yet

### 7.5 Behavioral Round Page
File: [frontend/src/pages/BehavioralRound.jsx](frontend/src/pages/BehavioralRound.jsx)

Purpose:
- simulate a behavioral interview with AI-like questioning and feedback

Current behavior:
- shows one behavioral question at a time
- allows the user to type or simulate voice input via a microphone button
- includes a feedback button that triggers a short simulated analysis
- shows a STAR-style feedback card with scores

Important note:
- this is a UI simulation rather than a real speech-to-text or AI evaluation pipeline

### 7.6 Aptitude Round Page
File: [frontend/src/pages/AptitudeRound.jsx](frontend/src/pages/AptitudeRound.jsx)

Purpose:
- present aptitude/reasoning questions with a scratchpad and explanation panel

Current behavior:
- displays multiple-choice reasoning questions
- includes a countdown timer
- includes a scratchpad for notes
- allows the user to check an explanation for the current question
- includes navigation between questions

### 7.7 Full Report Page
File: [frontend/src/pages/FullReport.jsx](frontend/src/pages/FullReport.jsx)

Purpose:
- show a more complete progress report beyond the dashboard

Current state:
- route exists
- the page is intended to summarize performance across all rounds
- it is not fully fleshed out in the current source snapshot, so it should be treated as a work-in-progress page

### 7.8 Settings Page
File: [frontend/src/pages/Settings.jsx](frontend/src/pages/Settings.jsx)

Purpose:
- host user preferences/settings

Current state:
- route exists
- implementation is not yet fully developed in the current snapshot

---

## 8. Reusable UI Components

### 8.1 Navbar
File: [frontend/src/components/Navbar.jsx](frontend/src/components/Navbar.jsx)

Purpose:
- sticky top navigation for the landing page
- contains brand, section links, and CTA button

### 8.2 CRTMonitor
File: [frontend/src/components/CRTMonitor.jsx](frontend/src/components/CRTMonitor.jsx)

Purpose:
- creates the retro monitor frame and screen container
- includes the power button, monitor bezel, and disk drive slot
- wraps the child content that appears inside the screen

### 8.3 ScrollSequenceScreen
File: [frontend/src/components/ScrollSequenceScreen.jsx](frontend/src/components/ScrollSequenceScreen.jsx)

Purpose:
- displays the animated intro sequence inside the CRT screen
- reveals copy in a step-based sequence while the user scrolls

### 8.4 AuthScreen
File: [frontend/src/components/AuthScreen.jsx](frontend/src/components/AuthScreen.jsx)

Purpose:
- replaces the landing screen content with an authentication experience when the floppy disk is inserted
- includes sign-up/login form switching
- simulates a boot sequence and navigates to create interview

### 8.5 FloppyDiskModal
File: [frontend/src/components/FloppyDiskModal.jsx](frontend/src/components/FloppyDiskModal.jsx)

Purpose:
- creates the animated 3.5-inch floppy disk interaction
- provides sign-up/login options as if the disk is inserted into the CRT drive slot

### 8.6 HowItWorksSection
File: [frontend/src/components/HowItWorksSection.jsx](frontend/src/components/HowItWorksSection.jsx)

Purpose:
- shows the 3-step product explanation on the landing page

### 8.7 FeaturesSection
File: [frontend/src/components/FeaturesSection.jsx](frontend/src/components/FeaturesSection.jsx)

Purpose:
- showcases core product capabilities

### 8.8 ReviewsSection
File: [frontend/src/components/ReviewsSection.jsx](frontend/src/components/ReviewsSection.jsx)

Purpose:
- displays testimonial cards

### 8.9 Footer
File: [frontend/src/components/Footer.jsx](frontend/src/components/Footer.jsx)

Purpose:
- gives the landing page a closing CTA and branding footer

---

## 9. Styling and Design System

The project uses Tailwind CSS with a custom design language centered around a retro computer aesthetic.

### Major visual design choices
- warm cream background
- black border outlines
- bold serif headlines
- monospace and fragment-style labels
- CRT monitor screen effects
- purple floppy disk accent colors
- red accent color for emphasis

### Tailwind theme highlights
From [frontend/tailwind.config.js](frontend/tailwind.config.js):
- colors include:
  - parker.cream
  - parker.beige
  - parker.red
  - parker.purple
  - parker.yellow
  - parker.black
  - cream variants
  - retro variants
- fonts include:
  - Radio Canada
  - Source Serif 4
  - Fragment Mono

### CSS effects
From [frontend/src/index.css](frontend/src/index.css):
- CRT scanline overlays
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
- Auth screen simulates success and navigates to the next screen

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
6. User submits auth form
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
- simulated auth should be replaced with real auth
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
