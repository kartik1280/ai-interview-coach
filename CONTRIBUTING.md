# Contributing to AI Interview Coach (InterviewOS)

First off, thank you for considering contributing to **AI Interview Coach**! Whether you are fixing a bug, adding new practice questions, polishing the retro CRT/document UI, or extending backend API routes, your efforts help build a better interview practice experience for job candidates.

---

## 🚀 Quick Setup & Workflow

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **Package Manager**: `npm` (v9+)
- **Python**: `3.10+` (for backend work)
- **Git**

### 2. Local Installation
```bash
# Fork & Clone repository
git clone https://github.com/kartik1280/ai-interview-coach.git
cd ai-interview-coach

# Frontend Setup
cd frontend
npm install --legacy-peer-deps
cp .env.example .env     # Set your Supabase & API keys
npm run dev

# Backend Setup (in a separate terminal)
cd ../backend
python -m venv venv
# On macOS/Linux: source venv/bin/activate
# On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## 🌿 Branching Strategy & Git Commit Rules

To keep our codebase clean and maintainable, please follow these guidelines:

### Branch Naming Conventions
Create a feature or bugfix branch off `main`:
- `feature/monaco-code-editor`
- `feature/pdf-export-report`
- `fix/auth-redirect-dashboard`
- `docs/updating-readme`

### Commit Message Guidelines
Use descriptive, imperative commit messages:
- `feat(frontend): add Monaco Editor with JS, Python, Java, C++ support`
- `fix(auth): redirect returning logged-in users straight to dashboard`
- `style(ui): update readiness score color tier rules`
- `docs: create CONTRIBUTING.md guide`

---

## 🎨 UI Design System & Aesthetic Directives

When modifying or adding new frontend components, adhere strictly to the **InterviewOS Design Tokens**:

- **Paper Background**: `#FCF5E2` (Warm retro document cream)
- **Primary Accent**: `#C0533F` / `#A83232` (Parker Red / Coral Accent)
- **Borders & Shadows**: `border-2 border-black` with hard offset shadows `shadow-[4px_4px_0px_0px_#000000]` or `shadow-[6px_6px_0px_0px_#000000]`.
- **Score Tier Color Rules**:
  - **Tier 1 ($\ge 8.5$)**: Green `#2F8F6E`
  - **Tier 2 ($7.0\text{--}8.4$)**: Amber `#B8862E`
  - **Tier 3 ($< 7.0$)**: Red `#C0533F`
- **Typography**:
  - Headings: Serif (`font-serif`, `#1A1A1A`)
  - Subtitles & Body: Radio / Sans (`font-radio`, `#55607A`)
  - Terminals & Code: Monospace (`font-mono`, `Fragment Mono`)

---

## ✅ Pull Request (PR) Checklist

Before submitting a Pull Request, please ensure the following steps are complete:

1. [ ] **Verification Build**: Run `npm run build` in the `frontend` folder and ensure it compiles with zero errors.
2. [ ] **No Hidden Errors**: Verify in browser console that no missing keys or React warnings exist.
3. [ ] **Route Security**: If adding a private page, ensure it is wrapped in `<ProtectedRoute>` in `App.jsx`.
4. [ ] **Clean Code**: Remove unused imports, commented-out dead code, and `console.log` statements.
5. [ ] **Documentation**: Update `walkthrough.md` or `README.md` if introducing major workflow changes.

---

## 🔒 Security & Environment Variables

- **Never commit `.env` files** containing live Supabase secret keys or OpenAI API tokens to Git.
- Always use `.env.example` as a template for required environment variables.

---

## 💬 Need Help?

If you have questions or encounter issues while setting up the project:
1. Open an Issue on GitHub detailing the bug or request.
2. Tag team maintainers for review on your Pull Requests.

Happy coding & practicing! 🎓
