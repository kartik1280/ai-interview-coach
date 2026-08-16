# Team Setup and Run Guide — AI Interview Coach (InterviewOS)

This guide provides the definitive steps to clone, configure, start, and test the AI Interview Coach project locally from a fresh environment.

---

## ⚡ Quick Start

1. **Clone & Switch Branch:**
   ```bash
   git clone https://github.com/kartik1280/ai-interview-coach.git
   cd ai-interview-coach
   git switch develop
   ```

2. **Configure Frontend Environment:**
   Create [`frontend/.env`](file:///c:/Users/ayesh/OneDrive/Desktop/ai-interview/frontend/.env):
   ```ini
   VITE_SUPABASE_URL=https://fiyyiepsdiutloqvonpz.supabase.co
   VITE_SUPABASE_ANON_KEY=<public_anon_key>
   VITE_API_BASE_URL=http://localhost:8000
   ```

3. **Configure Backend Environment:**
   Create [`backend/.env`](file:///c:/Users/ayesh/OneDrive/Desktop/ai-interview/backend/.env):
   ```ini
   SUPABASE_URL=https://fiyyiepsdiutloqvonpz.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<obtain_from_project_owner>

   # Gemini API Key (Primary AI Provider for Evaluation, Explanations & Analytics)
   GEMINI_API_KEY=<obtain_from_project_owner>

   # Optional Providers (Groq & ElevenLabs)
   GROQ_API_KEY=<obtain_from_project_owner>
   ELEVENLABS_API_KEY=<obtain_from_project_owner>
   ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL

   # Server Configuration
   PORT=3000
   ```

4. **Install & Run Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Frontend dev server will start at:* **`http://localhost:5173`**

5. **Install & Run FastAPI Backend:**
   ```bash
   cd ../backend
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000 --host 127.0.0.1
   ```
   *FastAPI Backend will start at:* **`http://localhost:8000`** *(Swagger: `http://localhost:8000/docs`)*

6. **Install & Run Voice Agent Node Server (Optional for Voice Rounds):**
   ```bash
   # In a new terminal inside backend/
   npm install
   npm run dev
   ```
   *Voice Agent WebSocket Server will start at:* **`ws://localhost:5001`**

---

## 1. Git Setup & Branching Strategy

To get started, clone the repository, check out the `develop` branch, and fetch the latest changes:

```bash
git clone https://github.com/kartik1280/ai-interview-coach.git
cd ai-interview-coach
git switch develop
git pull origin develop
```

### Development Workflow
Teammates must **never** commit or push changes directly to the `develop` branch. Always branch off of `develop` for any new feature or bug fix:

```bash
git switch -c feature/<feature-name>
```

---

## 2. Required Software

Ensure you have the following installed on your machine:

- **Git:** Latest version
- **Node.js:** version `v18+` (Recommended)
- **npm:** version `v9+`
- **Python:** version `3.10+` (Recommended)
- **pip:** version `v22+`
- **Virtual Environment:** `venv` module (built-in with Python)

---

## 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install all dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   By default, the React UI runs on: **`http://localhost:5173`**

---

## 4. Frontend Environment Variables

Create a file named `.env` in the [`frontend/`](file:///c:/Users/ayesh/OneDrive/Desktop/ai-interview/frontend) directory.

> [!IMPORTANT]
> **Security Rule:** Never put private Supabase `service-role` keys or private API keys in the frontend `.env`. These keys are public-facing once compiled.

```ini
# Supabase Configuration (Public-Safe client keys)
VITE_SUPABASE_URL=https://fiyyiepsdiutloqvonpz.supabase.co
VITE_SUPABASE_ANON_KEY=<public_anon_key_from_dashboard>

# API Connection
VITE_API_BASE_URL=http://localhost:8000
```

---

## 5. Backend Setup (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Create environment
   python -m venv venv
   
   # Activate (Windows PowerShell)
   venv\Scripts\activate
   
   # Activate (macOS/Linux)
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the backend API server:
   ```bash
   uvicorn app.main:app --reload --port 8000 --host 127.0.0.1
   ```

- **Backend Base URL:** `http://localhost:8000`
- **Swagger Documentation:** `http://localhost:8000/docs`
- **ReDocs Documentation:** `http://localhost:8000/redoc`

---

## 6. Backend Environment Variables

Create a file named `.env` in the [`backend/`](file:///c:/Users/ayesh/OneDrive/Desktop/ai-interview/backend) directory based on [`backend/.env.example`](file:///c:/Users/ayesh/OneDrive/Desktop/ai-interview/backend/.env.example).

### `.env` File Template:
```ini
# Supabase Configuration
SUPABASE_URL=https://fiyyiepsdiutloqvonpz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<obtain_from_project_owner>

# Gemini API Key (Primary AI Provider)
GEMINI_API_KEY=<obtain_from_project_owner>

# Groq API Key (Optional)
GROQ_API_KEY=<obtain_from_project_owner>

# Voice Provider (ElevenLabs)
ELEVENLABS_API_KEY=<obtain_from_project_owner>
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL

# Server Configuration
PORT=3000
```

### Environment Variables Details:
- **`SUPABASE_SERVICE_ROLE_KEY` (PRIVATE / SERVER-ONLY):** Needed by FastAPI dependency injection (`get_admin_client`) to perform storage bucket modifications and admin actions.
- **`GEMINI_API_KEY` (PRIVATE / SERVER-ONLY):** Primary AI provider for technical code evaluation, aptitude question explanations, and historical analytics.
- **`GROQ_API_KEY` & `ELEVENLABS_API_KEY` (PRIVATE / SERVER-ONLY):** Optional providers for voice/audio synthesis.

---

## 7. Supabase Database & Storage Configuration

This project connects to a **shared, hosted Supabase instance**. Do not create a separate local/personal project unless instructed.

### Storage Bucket:
- A Supabase storage bucket named **`resumes`** must exist. The bucket must be configured with access permissions that allow authenticated uploads.

### Database Tables:
The application expects the following Postgres tables in the schema:

1. **`profiles`**
   - Columns: `id` (UUID, primary key), `full_name` (Text), `target_position` (Text), `industry` (Text), `resume_id` (UUID, optional), `created_at` (Timestamp).
2. **`resumes`**
   - Columns: `id` (UUID, primary key), `user_id` (UUID), `filename` (Text), `file_size` (Integer), `storage_path` (Text), `extracted_text` (Text), `skills` (JSONB), `created_at` (Timestamp).
3. **`rounds`**
   - Columns: `id` (UUID, primary key), `user_id` (UUID), `round_type` (Text: technical, behavioral, aptitude), `status` (Text: in_progress, completed), `score` (Float, optional), `created_at` (Timestamp).
4. **`questions`**
   - Columns: `id` (UUID, primary key), `round_id` (UUID, foreign key to rounds), `question_text` (Text).
5. **`answers`**
   - Columns: `id` (UUID, primary key), `question_id` (UUID, foreign key to questions), `answer_text` (Text), `score` (Float), `feedback` (Text), `created_at` (Timestamp).
6. **`technical_questions`** (Static Bank)
   - Columns: `id` (UUID, primary key), `position` (Text), `question` (Text), `difficulty` (Text: easy, medium, hard), `starter_code` (Text, optional).
7. **`aptitude_questions`** (Static Bank)
   - Columns: `id` (UUID, primary key), `question` (Text), `option_a` (Text), `option_b` (Text), `option_c` (Text), `option_d` (Text), `correct_option` (Text: A, B, C, or D), `explanation` (Text).

---

## 8. AI Architecture & Core Features

### 1. Google Gemini AI Engine
The backend integrates Google Gemini via the official `google-genai` SDK using structured JSON generation mode (`response_mime_type="application/json"`).
- **Supported Models & Fallback Chain:**
  1. `gemini-3.5-flash-lite` (Default fast production model)
  2. `gemini-3.5-flash` (Secondary fallback)
  3. `gemini-3.6-flash` (Tertiary fallback)

### 2. Aptitude Round & AI Explanations
- **Question Bank:** EXACTLY 50 questions served per round.
- **Global Timer:** Single 15-minute (900s) countdown for all 50 questions.
- **Auto-Grading:** Instant scoring out of 50 based on answer keys.
- **AI Explanation:** Users can click **"Check Explanation"** on any question to trigger `POST /round/{roundId}/question/{questionId}/explanation`. Gemini generates an in-depth breakdown covering step-by-step logic, why the correct answer is right, and common pitfalls.

### 3. Technical Round & AI Code Evaluation
- **Role-Specific Questions:** Dynamically selected based on candidate's target position (`Frontend`, `Backend`, `Fullstack`, `Data Scientist`, etc.).
- **Per-Question Timers:** Easy (10 min), Medium (25 min), Hard (45 min).
- **Structured Code Evaluation:** Triggered via `POST /round/{roundId}/answer`. Gemini returns a comprehensive JSON analysis:
  - Verdict (`CORRECT ANSWER ✅` or `INCORRECT ANSWER ❌`)
  - Score (`0-10`)
  - Syntax check (Pass/Fail)
  - Algorithmic logic analysis
  - Bug detection & actionable suggestions
  - Edge cases test coverage
  - Asymptotic complexity ($O(N)$ Time & $O(1)$ Space)
  - Concrete optimization ideas

### 4. Canonical Analytics Service (Dashboard & Full Report)
[`backend/app/services/analytics_service.py`](file:///c:/Users/ayesh/OneDrive/Desktop/ai-interview/backend/app/services/analytics_service.py) serves as the single source of truth for both `GET /dashboard` and `GET /report/latest`:
- **Attempt Condition:** Counts strictly `rounds.status == 'completed'`.
- **Category Scoring:**
  - Technical: Average score 0-10 & historical score trend.
  - Behavioral: Average score 0-10 & STAR breakdown (Situation, Task, Action, Result).
  - Aptitude: Average score out of 50 & accuracy percentage.
- **Recent History:** Chronological list of completed attempts.
- **Deterministic AI Caching:** Invalidation is based on a SHA-256 fingerprint of the user's historical evidence dictionary. Score updates instantly invalidate cached recommendations.

---

## 9. Running All Services

To run the complete local stack:

### Terminal 1: FastAPI Python Backend
```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000 --host 127.0.0.1
```

### Terminal 2: React UI Frontend
```bash
cd frontend
npm run dev
```

### Terminal 3: WebSocket Voice Server (Node.js — Optional)
```bash
cd backend
npm start
```

---

## 10. Automated Testing & Verification Suites

Before opening pull requests, always run the full automated verification suite:

### 1. Analytics Integrity Suite (11 Tests)
Verifies single source of truth aggregation, multi-category scoring, STAR breakdown, zero-attempt handling, user isolation, and cache fingerprint invalidation:
```bash
cd backend
venv\Scripts\activate
python analytics_integrity_test.py
```
*Expected:* `Ran 11 tests in ... OK`

### 2. Backend Integration Suite (28 Tests)
Verifies live Supabase authentication, JWT verification, profile CRUD, and complete round lifecycles (Technical, Behavioral, Aptitude):
```bash
cd backend
venv\Scripts\activate
python integration_test.py
```
*Expected:* `Total: 28 | PASSED: 28 | FAILED: 0 | Overall: PASS`

### 3. Comprehensive Backend Audit Suite (24 Tests)
Validates cross-user security isolation, input validation, resume PDF parsing, and real-time Gemini AI scoring:
```bash
cd backend
venv\Scripts\activate
python full_final_audit_test.py
```
*Expected:* `Total Tests: 24 | PASSED: 24 | FAILED: 0 | VERDICT: COMPLETE (PASS)`

### 4. Frontend Production Build
Verifies that all React components, icons, and API integrations compile without errors:
```bash
cd ../frontend
npm run build
```
*Expected:* `✓ built in ...` with `0` errors.

---

## 11. Troubleshooting

### 1. Backend server won't start:
- Ensure Python version is `3.10+` and virtual environment is activated.
- Confirm your `backend/.env` file exists and has `GEMINI_API_KEY` and `SUPABASE_URL`.
- If port `8000` is in use: `uvicorn app.main:app --port 8080 --reload`.

### 2. Frontend won't start:
- Verify that Node version is `v18+`. Run `node -v` to check.
- Delete `node_modules` and run `npm install` again.

### 3. 401 Unauthorized errors on API calls:
- Confirm that your Supabase JWT session exists.
- Ensure `VITE_API_BASE_URL` in `frontend/.env` maps to the FastAPI server (`http://localhost:8000`).

### 4. Gemini AI Explanations or Evaluations returning fallback:
- Verify `GEMINI_API_KEY` is present in `backend/.env`.
- Ensure the API key has active quota for Gemini models (`gemini-3.5-flash-lite`, `gemini-3.5-flash`).

---

## 12. New Teammate Checklist

- [ ] Clone repository & switch to `develop`
- [ ] Install Node dependencies (`npm install` inside `frontend/`)
- [ ] Configure frontend `.env` (`VITE_API_BASE_URL=http://localhost:8000`)
- [ ] Create Python virtual environment (`python -m venv venv` inside `backend/`)
- [ ] Activate environment and install dependencies (`pip install -r requirements.txt`)
- [ ] Configure backend `.env` (`GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] Start FastAPI backend (`uvicorn app.main:app --reload --port 8000 --host 127.0.0.1`)
- [ ] Start React frontend (`npm run dev`)
- [ ] Run `python analytics_integrity_test.py` (11/11 passed)
- [ ] Run `python integration_test.py` (28/28 passed)
- [ ] Run `python full_final_audit_test.py` (24/24 passed)
- [ ] Run `npm run build` inside `frontend/` (0 errors)
