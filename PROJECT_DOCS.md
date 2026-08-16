# AI Interview Coach — Project Documentation & Team Guide

> Comprehensive technical documentation, architecture reference, team setup guide, API contracts, database schema, and test suite verification for **AI Interview Coach (InterviewOS)**.

---

## 📋 Table of Contents
1. [Team Setup & Quick Start](#-team-setup--quick-start)
2. [Environment Configuration](#-environment-configuration)
3. [System Architecture & Data Flow](#-system-architecture--data-flow)
4. [Database Schema & Storage Configuration](#-database-schema--storage-configuration)
5. [API Contracts & Endpoints](#-api-contracts--endpoints)
6. [AI Engine & Evaluation Services](#-ai-engine--evaluation-services)
7. [Automated Verification & Test Suites](#-automated-verification--test-suites)
8. [Audit & Verification Scorecard](#-audit--verification-scorecard)

---

## ⚡ Team Setup & Quick Start

### Prerequisites
- **Git**: Latest version
- **Node.js**: `v18+`
- **Python**: `v3.10+` (with `venv` module)
- **Supabase Account**: Hosted Postgres Database & Storage
- **Google Gemini API Key**: Free tier or paid plan key from Google AI Studio

### Step-by-Step Setup

1. **Clone Repository & Switch to Branch**:
   ```bash
   git clone https://github.com/kartik1280/ai-interview-coach.git
   cd ai-interview-coach
   git switch develop
   ```

2. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   npm run dev
   ```
   *Frontend dev server will start at:* **`http://localhost:5173`**

3. **FastAPI Backend Setup**:
   ```bash
   cd ../backend
   python -m venv venv

   # On Windows:
   .\venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate

   pip install -r requirements.txt
   cp .env.example .env
   uvicorn app.main:app --reload --port 8000 --host 127.0.0.1
   ```
   *FastAPI Backend will start at:* **`http://localhost:8000`** *(Swagger docs: `http://localhost:8000/docs`)*

4. **Node.js AI Voice Assistant Server (Optional for Voice Rounds)**:
   ```bash
   # Inside backend/ directory
   npm install
   npm start
   ```
   *Voice Agent WebSocket Server will start at:* **`ws://localhost:3000`** (or `ws://localhost:5050`)

---

## 🔑 Environment Configuration

### **`frontend/.env`**
```ini
# Supabase Configuration (Public-Safe client keys)
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-public-anon-key

# API Base Connection
VITE_API_BASE_URL=http://localhost:8000
```

### **`backend/.env`**
```ini
# Supabase Configuration (Server-only service role)
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Gemini API Key (Primary AI Engine)
GEMINI_API_KEY=your-google-gemini-api-key

# Optional Voice & Provider Keys
GROQ_API_KEY=your-groq-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL

# Server Configuration
PORT=3000
```

---

## 🏗️ System Architecture & Data Flow

### End-to-End Data Workflow
```
User Interaction in Browser (React UI)
        ↓
Frontend API Call via Axios / Fetch with Bearer JWT Token
        ↓
FastAPI Backend (Authentication Verification & Authorization Guard)
        ↓
Database Query / Storage Operations on Supabase (Postgres + Storage)
        ↓
AI Processing Layer (Google Gemini API via google-genai SDK)
        ↓
Structured JSON Payload Returned to Frontend
        ↓
UI State Update & Local Storage Synchronization
```

---

## 🗄️ Database Schema & Storage Configuration

### Supabase Storage Bucket
- **`resumes`**: Stores uploaded PDF candidate resumes with public/authenticated read & write policies.

### Postgres Tables

| Table | Primary Key | Description & Key Columns |
|---|---|---|
| `users` | `id` (UUID) | Account details, email verification, created timestamp |
| `profiles` | `id` (UUID) | `full_name`, `target_position`, `industry`, `resume_id`, `created_at` |
| `resumes` | `id` (UUID) | `user_id`, `filename`, `storage_path`, `extracted_text`, `skills` (JSONB) |
| `rounds` | `id` (UUID) | `user_id`, `round_type` (`technical`/`behavioral`/`aptitude`), `status` (`in_progress`/`completed`), `score` |
| `questions` | `id` (UUID) | `round_id`, `question_text` |
| `answers` | `id` (UUID) | `question_id`, `answer_text`, `score` (Float), `feedback` (Text), `analysis_details` (JSONB) |
| `technical_questions` | `id` (UUID) | `position`, `question`, `difficulty`, `starter_code` |
| `aptitude_questions` | `id` (UUID) | `question`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_option`, `explanation` |

---

## 🔌 API Contracts & Endpoints

| Endpoint | Method | Auth Required | Description |
|---|:---:|:---:|---|
| `GET /` | `GET` | No | Health check endpoint |
| `POST /auth/signup` | `POST` | No | Register new candidate account |
| `POST /auth/login` | `POST` | No | Authenticate user and return profile status |
| `GET /auth/verify` | `GET` | Yes | Validate Bearer JWT token |
| `POST /resume/upload` | `POST` | Yes | Upload PDF resume, extract text via PyMuPDF, parse skills |
| `DELETE /resume/{id}` | `DELETE` | Yes | Delete stored resume PDF & database record |
| `POST /interview/create` | `POST` | Yes | Save candidate onboarding profile and target role |
| `GET /dashboard` | `GET` | Yes | Retrieve readiness score, practice streak, and recent history |
| `POST /round/start` | `POST` | Yes | Initialize Technical, Behavioral, or Aptitude practice round |
| `POST /round/{id}/answer` | `POST` | Yes | Submit solution, evaluate via Gemini AI, and save score |
| `POST /round/{id}/finish` | `POST` | Yes | Finalize round session and compute summary stats |
| `GET /round/{id}/question/{qid}/explanation` | `POST` | Yes | Generate live Gemini AI step-by-step question breakdown |
| `GET /report/latest` | `GET` | Yes | Fetch comprehensive Executive AI Performance Report |
| `GET /profile` | `GET` | Yes | Retrieve settings profile details |
| `PUT /profile` | `PUT` | Yes | Update settings profile details |

---

## 🤖 AI Engine & Evaluation Services

### 1. Google Gemini AI Engine
- **SDK**: `google-genai` using structured JSON mode (`response_mime_type="application/json"`).
- **Supported Models & Fallback Chain**:
  1. `gemini-3.7-flash` (Primary production model)
  2. `gemini-flash-latest` (Secondary fallback)
  3. `gemini-3.5-flash-lite` (Tertiary fallback)

### 2. Technical Code Evaluator (`grade_technical_solution`)
Evaluates candidate code across JavaScript, Python, Java, and C++ returning:
- **Verdict**: `ACCEPTED ✅`, `INCORRECT / FAILED ❌`, or `PARTIALLY CORRECT ⚠️`
- **Score**: `0.0 – 10.0`
- **Syntax Check**: Pass/Fail
- **Algorithmic Logic Analysis**
- **Bug Detection & Edge Cases**
- **Asymptotic Complexity**: $O(N)$ Time & $O(1)$ Space complexity

### 3. Behavioral STAR Evaluator (`grade_behavioral_response`)
Evaluates behavioral interview answers against candidate resume context returning sub-scores for:
- **Situation**: Context & setting setup
- **Task**: Responsibilities & challenge definition
- **Action**: Concrete actions taken by the candidate
- **Result**: Quantified business impact & outcomes

### 4. Canonical Analytics Service (`analytics_service.py`)
Single source of truth for Dashboard and Full Report metrics:
- Calculates portfolio readiness score on a normalized 10-point scale.
- Aggregates practice streaks across consecutive calendar days.
- Caches AI recommendations using a SHA-256 fingerprint of historical evidence.

---

## 🧪 Automated Verification & Test Suites

The backend includes 4 automated test suites to ensure 100% data integrity and zero regressions:

```bash
cd backend
venv\Scripts\activate

# 1. Analytics Integrity Suite (11 Tests)
python analytics_integrity_test.py

# 2. Question Count & Scoring Verification Suite (18 Tests)
python question_count_scoring_suite.py

# 3. Comprehensive Backend Audit Suite (24 Tests)
python full_final_audit_test.py

# 4. End-to-End Backend Integration Suite (28 Tests)
python integration_test.py
```

### Frontend Build Verification:
```bash
cd frontend
npm run build
```

---

## 📊 Audit & Verification Scorecard

| Area | Status | Verification Evidence |
|---|:---:|---|
| FastAPI Backend | **PASS** | Uvicorn running clean on `http://127.0.0.1:8000` |
| Authentication Integration | **PASS** | Bearer JWT token verification via `get_user` dependency |
| Authorization & Security | **PASS** | Strict user context isolation on all queries |
| Technical Round Workflow | **PASS** | Monaco editor, multi-language, Gemini evaluation, single verdict |
| Behavioral Round Workflow | **PASS** | Resume-driven generation, voice mic input, STAR breakdown |
| Aptitude Round Workflow | **PASS** | Shuffled MCQs, zero leakage, on-demand AI explanations |
| Unified Submission | **PASS** | Auto-submit unposted code, completion stats modal |
| Dashboard & Report Dossier | **PASS** | Readiness gauge, recent history filters, 30-Day Roadmap |
| Frontend Production Build | **PASS** | Vite production build built with 0 errors |

---

## 🤝 Contributing

This is a hackathon project built by **Team Delmora**.
