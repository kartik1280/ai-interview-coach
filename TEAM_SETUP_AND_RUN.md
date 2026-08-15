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
   OPENAI_API_KEY=<obtain_from_project_owner>
   PORT=5001
   GROQ_API_KEY=<obtain_from_project_owner>
   ELEVENLABS_API_KEY=<obtain_from_project_owner>
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
   uvicorn app.main:app --reload
   ```
   *FastAPI Backend will start at:* **`http://localhost:8000`** *(Swagger: `http://localhost:8000/docs`)*

6. **Install & Run Voice Agent Node Server (Optional but recommended for voice rounds):**
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

Ensure you have the following installed on your machine. Version specifications are aligned with requirements:

- **Git:** Latest version
- **Node.js:** version `v18+` (Recommended) — *Version is not pinned in package.json*
- **npm:** version `v9+`
- **Python:** version `3.10+` (Recommended) — *Version is not pinned in requirements.txt*
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
> **Security Rule:** Never put private Supabase `service-role` keys or private OpenAI API keys in the frontend `.env`. These keys are public-facing once compiled.

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
   uvicorn app.main:app --reload
   ```

- **Backend Base URL:** `http://localhost:8000`
- **Swagger Documentation:** `http://localhost:8000/docs`
- **ReDocs Documentation:** `http://localhost:8000/redoc`

---

## 6. Backend Environment Variables

Create a file named `.env` in the [`backend/`](file:///c:/Users/ayesh/OneDrive/Desktop/ai-interview/backend) directory.

### `.env` File Template:
```ini
# Supabase URL & Admin Credentials
SUPABASE_URL=https://fiyyiepsdiutloqvonpz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<obtain_from_project_owner>

# OpenAI API Key (For resume parsing and AI scoring/feedback templates)
OPENAI_API_KEY=<obtain_from_project_owner>

# Voice Agent Server Settings (WebSocket Voice Service)
PORT=5001
GROQ_API_KEY=<obtain_from_project_owner>
ELEVENLABS_API_KEY=<obtain_from_project_owner>
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
```

### Environment Variables Details:
- **`SUPABASE_SERVICE_ROLE_KEY` (PRIVATE / SERVER-ONLY):** Needed by FastAPI dependency injection (`get_admin_client`) to perform storage bucket modifications and admin actions.
- **`OPENAI_API_KEY` (PRIVATE / SERVER-ONLY):** Used by `ai_service.py` to evaluate technical and behavioral answers.
- **`GROQ_API_KEY` & `ELEVENLABS_API_KEY` (PRIVATE / SERVER-ONLY):** Used by the Node WebSocket voice server (`server.js`) to power the hands-free voice interviewer.

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

## 8. Database Data & Core Product Rules

To satisfy core system constraints, the database tables must be seeded with these constraints:

### Aptitude Round
- **Core Requirement:** EXACTLY 50 questions.
- **Rules:** 
  - The `aptitude_questions` table **must contain at least 50 questions**.
  - If the database contains fewer than 50 questions, starting an aptitude round will fail with `HTTP 400 Bad Request`.
  - Shuffling and question limits are handled dynamically on the backend server.
  - The aptitude round is completely role-independent (retrieves all available questions).

### Technical Round
- **Core Requirement:** Role-specific questions.
- **Rules:**
  - Difficulties mapped: `easy` (600s / 10 mins), `medium` (1500s / 25 mins), `hard` (2700s / 45 mins).

### AI Evaluation & Scaffolding Behavior
- The backend grading logic in [`backend/app/services/ai_service.py`](file:///c:/Users/ayesh/OneDrive/Desktop/ai-interview/backend/app/services/ai_service.py) currently operates in **mock / scaffolding mode**:
  - `grade_technical_solution` grades coding answers programmatically based on string length and iteration keyword detection (e.g., `for`, `while`, `map`, `filter`).
  - `grade_behavioral_response` uses basic heuristics to verify elements of the **STAR** method (Situation, Task, Action, Result) in the user's response text and generates a mock structured scorecard.
  - `grade_aptitude_response` grades multiple-choice options against a fixed answers key (shuffled on round start).
- This programmatic scaffolding behaves identically to real AI models from the client's perspective, ensuring robust contract compliance and 0% crash risk during development.
- **Teammate D (AI/LLM Developer)** can replace these placeholders with real OpenAI API completion prompts using `settings.openai_api_key`.

---

## 9. Running All Services

To run the entire local development stack, open **three terminal sessions**:

### Terminal 1: FastAPI Python Backend
```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Terminal 2: React UI Frontend
```bash
cd frontend
npm run dev
```

### Terminal 3: WebSocket Voice Server (Node.js)
```bash
cd backend
npm start
```
*Note: The React App works seamlessly even if Terminal 3 is offline, but the hands-free voice feature in the Behavioral Round page will display a "Connection error" toast.*

---

## 10. Manual Smoke Test Flows

Validate the core feature flows manually:

### 1. Authentication
- Go to `http://localhost:5173`.
- Click on the floppy disk to authenticate.
- Test Sign Up, Log In, Log Out. Accessing `/dashboard` directly without authentication should redirect to the landing page.

### 2. Onboarding (Create Interview)
- Submit the onboarding form with a full name, target position, and industry.
- Upload a sample PDF resume. Verify the upload completes.
- Verify profile details persist upon dashboard load.

### 3. Technical Round
- Go to Dashboard → Start Technical Round.
- Confirm 10 questions are served and Monaco editor initializes with starter code.
- Verify that Easy questions start with a `10:00` countdown, Medium with `25:00`, and Hard with `45:00`.
- Verify the timer countdown works. Let it hit `00:00` to confirm it triggers automatic submission.

### 4. Behavioral Round
- Go to Dashboard → Start Behavioral Round.
- Confirm 3 questions are served.
- Verify that typing an answer and clicking "Give Feedback" generates a dynamic STAR score breakdown.

### 5. Aptitude Round
- Go to Dashboard → Start Aptitude Round.
- Confirm exactly 50 questions are served, with question numbers `1` to `50` visible in the navigation panel.
- Verify a single 15-minute global timer (900 seconds) is active for the entire round.
- Verify that when the timer expires, it auto-submits.

### 6. Full Report
- Click on "View Full Report" from the Dashboard.
- Confirm that average readiness score, practice streaks, and areas to improve are calculated dynamically from database attempts rather than static placeholders.

---

## 11. Testing and Verification

Run the official automated test suites locally:

### Integration Test
Executes a quick, sequential endpoint verify pipeline against the running API server:
```bash
cd backend
venv\Scripts\activate
python integration_test.py
```

### Full Final Audit Test
Performs deep verification of user security isolation, inputs validation, profile CRUD operations, and exact scoring structures:
```bash
cd backend
venv\Scripts\activate
python full_final_audit_test.py
```

---

## 12. Frontend Production Build

Verify the production build compiles cleanly:

```bash
cd frontend
npm run build
```
A successful output will compile the assets into the `frontend/dist/` directory with `0` linting or bundling errors.

---

## 13. Troubleshooting

### 1. Backend server won't start:
- Ensure Python version is `3.10+` and virtual environment is activated.
- Confirm your `backend/.env` file exists and has correct syntax.
- If port `8000` is in use, start uvicorn on another port: `uvicorn app.main:app --port 8080 --reload`.

### 2. Frontend won't start:
- Verify that Node version is `v18+`. Run `node -v` to check.
- Delete `node_modules` and run `npm install` again.

### 3. 401 Unauthorized errors on API calls:
- Confirm that your Supabase JWT session exists.
- Ensure `VITE_API_BASE_URL` in `frontend/.env` maps exactly to the running FastAPI server (`http://localhost:8000`).
- Ensure the Authorization headers on requests include the correct Bearer prefix.

### 4. Technical or Aptitude rounds fail to load:
- Confirm the `profiles` table contains a position.
- Verify that `aptitude_questions` contains at least 50 rows. If fewer exist, the round endpoint returns `HTTP 400`.

### 5. CORS Errors:
- The FastAPI application is configured with `allow_origins=["*"]`. Under normal development, no CORS errors should occur.

---

## 14. New Teammate Checklist

- [ ] Clone repository
- [ ] Checkout `develop`
- [ ] Pull latest `develop`
- [ ] Install Node dependencies (`npm install` inside `frontend/`)
- [ ] Configure frontend `.env`
- [ ] Create Python virtual environment (`python -m venv venv`)
- [ ] Activate environment and install backend packages (`pip install -r requirements.txt`)
- [ ] Configure backend `.env`
- [ ] Verify Supabase configuration (bucket named `resumes` and schemas exist)
- [ ] Start FastAPI backend (`uvicorn app.main:app --reload`)
- [ ] Start frontend (`npm run dev`)
- [ ] Test login and signup flow
- [ ] Test Create Interview & resume upload
- [ ] Test Dashboard score loading
- [ ] Test Technical Round loading and editor
- [ ] Test Behavioral Round voice/manual answer submitting
- [ ] Test Aptitude Round 50 questions limit and global timer
- [ ] Test Full Report generation
- [ ] Test Settings profile editing
- [ ] Run `python integration_test.py`
- [ ] Run `python full_final_audit_test.py`
- [ ] Run frontend build (`npm run build`)
