# AI Interview Coach 🚀

> An intelligent, end-to-end AI interview preparation platform personalized to your resume, target role, and industry.

---

## 🌟 Overview

**AI Interview Coach** is a state-of-the-art web application designed to help job candidates master technical coding, behavioral STAR responses, and quantitative aptitude under real interview conditions.

Unlike static platforms with generic question banks, **AI Interview Coach** constructs a dynamic, personalized interview journey:
- **Behavioral Rounds**: Dynamically generated live by Google Gemini based on the candidate's uploaded resume, target position, and industry.
- **Technical Rounds**: Role-tailored Data Structures & Algorithms coding challenges evaluated by Gemini AI across 4 programming languages with real-time Big-O complexity analysis.
- **Aptitude Rounds**: Shuffled quantitative math, pattern deduction, and logical reasoning multiple-choice drills with instant AI solution explanations.
- **Executive Performance Dossier**: Comprehensive analytics tracking readiness scores, practice streaks, accuracy metrics, STAR component breakdown, and a personalized 30-Day AI Preparation Roadmap.

---

## 🛠️ Tech Stack

### **Frontend**
- **Core Framework**: React (Vite) + JavaScript / JSX
- **Styling**: Vanilla CSS + TailwindCSS + Custom Neobrutalist / Retro Design System
- **Icons & Micro-animations**: Lucide React + Framer Motion
- **Code Editor**: `@monaco-editor/react` (Monaco Code Editor supporting JavaScript, Python, Java, and C++)
- **Data Visualization**: Recharts (radar charts, category breakdown, progress metrics)
- **Authentication & State**: Supabase Auth JS SDK + JWT Bearer token state management

### **Backend**
- **API Framework**: FastAPI (Python 3.10+) + Uvicorn
- **AI Engine**: Google Gemini API (`google-genai` SDK using `gemini-3.7-flash` / `gemini-flash-latest`)
- **Database & Storage**: Supabase Postgres Database + Supabase Storage (for resume PDFs)
- **Document Processing**: PyMuPDF (`fitz`) for PDF text extraction & structured parsing

---

## 🚀 Key Features

### 💻 1. Technical Coding Round
- **Configurable Practice Length**: Choose **5, 10, 15, or 20 questions**.
- **Difficulty-Based Countdown Timers**:
  - **Easy**: 10 Minutes
  - **Medium**: 25 Minutes
  - **Hard**: 45 Minutes
- **Multi-Language Monaco Editor**: Built-in starter templates for **JavaScript**, **Python**, **Java**, and **C++**.
- **In-Browser Code Runner**: Instant local execution sandbox for JavaScript code solutions.
- **Deep Gemini AI Evaluation**: Assesses source code for syntax, logic correctness, edge cases, time complexity ($O(N)$), space complexity ($O(1)$), bugs, and recommendations.
- **Single Verdict Badges**: Clear evaluation results (`ACCEPTED ✅`, `INCORRECT / FAILED ❌`, `PARTIALLY CORRECT ⚠️`).
- **AI Step-by-Step Explanation**: On-demand optimal algorithmic code solution and detailed walkthrough.

### 🎭 2. Resume-Driven Behavioral Round
- **Personalized Context**: Gemini parses candidate resumes to generate context-aware questions matched to their target role.
- **STAR Framework Evaluation**: Evaluates answers across **Situation**, **Task**, **Action**, and **Result** with per-component numerical sub-scores.
- **Feedback & Exemplar Walkthrough**: AI suggestions on how to quantify business impact.

### 🧠 3. Quantitative Aptitude Round
- **Configurable Sets**: Choose **10, 20, 30, or 50 questions**.
- **Instant AI Explanations**: One-click detailed math solution breakdowns generated live by Gemini.
- **Option Verification**: Multi-choice selection with zero answer-key leakage on the UI.

### 📊 4. Unified Scoring & Performance Dossier
- **Auto-Submit Integrity**: Automatically batch-posts un-submitted candidate solutions prior to final submission.
- **Completion Modal**: Displays Attempted, Correct, Wrong, Accuracy %, Average Score, and "Review Solutions" navigation.
- **Portfolio Readiness Score**: Weighted readiness score calculated on a normalized 10-point scale.
- **Full AI Report Dossier**:
  - Overall Readiness Gauge & Category Performance Metrics
  - Diagnostic Strengths & Growth Areas
  - STAR Communication Matrix
  - 30-Day Interview Preparation Roadmap
  - Categorized Recent Practice Session History

---

## 📦 Installation & Local Setup

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **Python**: `v3.10` or higher
- **Supabase Account**: Hosted Postgres Database & Auth
- **Google Gemini API Key**: Free tier or paid plan key from Google AI Studio

### 1. Clone the Repository
```bash
git clone https://github.com/kartik1280/ai-interview-coach.git
cd ai-interview-coach
```

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### 3. Backend Setup
```bash
cd backend
python -m venv venv

# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

---

## 🔑 Environment Configuration

### **`frontend/.env`**
```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=http://localhost:8000
```

### **`backend/.env`**
```env
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GEMINI_API_KEY=your-google-gemini-api-key
```

---

## 🗄️ Database Schema

| Table | Description |
|---|---|
| `users` | Candidate authentication credentials and account metadata |
| `profiles` | Target position, industry, experience level, and resume URLs |
| `resumes` | Uploaded resume files, extracted raw text, and parsed skills |
| `rounds` | Individual practice session records (type, difficulty, status, score) |
| `questions` | Questions linked to specific practice rounds |
| `answers` | User submitted answers, source code, scores, feedback, and AI analyses |
| `technical_questions` | Master bank of role and industry DSA problems |
| `aptitude_questions` | Master bank of quantitative and logical multiple-choice questions |

---

## 🔌 Core API Endpoints

| Endpoint | Method | Description |
|---|:---:|---|
| `/auth/signup` | `POST` | Register a new candidate account |
| `/auth/login` | `POST` | Authenticate user and return profile status |
| `/resume/upload` | `POST` | Upload PDF resume, extract text, and parse background via Gemini |
| `/interview/create` | `POST` | Create or update candidate interview configuration profile |
| `/dashboard` | `GET` | Retrieve readiness score, practice streak, and recent history |
| `/round/start` | `POST` | Initialize practice round (Technical, Behavioral, or Aptitude) |
| `/round/{id}/answer` | `POST` | Submit solution, evaluate via Gemini AI, and save score |
| `/round/{id}/finish` | `POST` | Finalize round session and compute summary stats |
| `/report/latest` | `GET` | Fetch comprehensive Executive AI Performance Report |

---

## 🧪 Automated Verification & Test Suites

The codebase includes exhaustive automated test suites in the `backend/` directory:

```bash
cd backend

# Run Analytics Integrity & Gemini Fallback Suite
.\venv\Scripts\python.exe analytics_integrity_test.py

# Run Full End-to-End System Audit Suite
.\venv\Scripts\python.exe full_final_audit_test.py

# Run Question Count & Scoring Verification Suite
.\venv\Scripts\python.exe question_count_scoring_suite.py
```

---

## 📌 Status

- ✅ **Authentication & Authorization**: Supabase Auth + JWT Verification
- ✅ **Resume Parsing & Setup**: PDF Parsing + Role Target Configuration
- ✅ **Technical Practice Round**: Multi-language Monaco Editor + Gemini Evaluation + In-browser JS execution
- ✅ **Behavioral Practice Round**: STAR Framework Breakdown + Live Resume Question Generation
- ✅ **Aptitude Practice Round**: MCQ Drills + Live AI Explanations
- ✅ **Dashboard & Executive Dossier**: Readiness Score + Recent History Filters + 30-Day Roadmap
- ✅ **Test Coverage & Verification**: 100% Passing Automated Test Suites

---

## 🤝 Contributing

This is a hackathon project built by Team Delmora.
