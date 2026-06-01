# 🧠 AI Quiz Maker V1 — Legacy

> **The original proof-of-concept.** A web-based quiz generator that uses Google Gemini AI to transform study material into interactive multiple-choice quizzes.

## 📌 Purpose in This Monorepo

V1 represents the **initial concept and MVP** of AI Quiz Maker. It was built to validate the core idea: *paste material, get an instant AI-generated quiz*. While functional, it laid the groundwork for the more advanced V2 and V3 versions.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| **Text Input** | Paste study material (min. 50 characters) as quiz source |
| **File Upload** | Upload PDF/DOCX files up to 10MB — parsed entirely client-side |
| **3 Difficulty Levels** | Easy (recall), Normal (comprehension), Hard (application/analysis) |
| **Flexible Question Count** | Quick-select 5/10/15/20 or custom input (max 30) |
| **AI Quiz Generation** | Material sent to **Google Gemini API** — returns structured JSON with questions, options, correct answer, and rationale |
| **Interactive Quiz UI** | Shuffled options, click-to-answer with instant correct/incorrect feedback and rationale display |
| **Live Score Tracking** | Real-time score counter with confetti animation on perfect score |
| **Export Results** | Download quiz results as a formatted `.txt` file |
| **Regenerate** | Re-create quizzes from the same material with different difficulty/count settings |
| **Dark Mode** | Toggle between light and dark themes |
| **Interactive Tutorial** | 5-step guided walkthrough for first-time users (30-day cookie expiry) |
| **18+ Content Filter** | Built-in detection and blocking of adult content |
| **Rate Limiting** | 10 requests per 3 minutes to prevent API abuse |
| **Session Management** | Auto-logout after 1 hour of inactivity |
| **Google OAuth 2.0 Login** | Secure authentication via Google Identity Services |
| **Responsive Design** | Works on desktop, tablet, and mobile |

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| **Frontend** | Vanilla JavaScript (ES Modules), HTML5, CSS3 |
| **Styling** | Tailwind CSS (CDN) |
| **Build Tool** | Vite (rolldown) |
| **Backend** | PHP 7.4+ (REST API) |
| **AI Engine** | Google Gemini API (`gemini-3-flash-preview`) |
| **Authentication** | Google OAuth 2.0 (Identity Services) |
| **File Parsing** | PDF.js (PDF), Mammoth.js (DOCX) |
| **Icons** | Font Awesome 6 |
| **Animation** | Canvas Confetti |

## 🏗️ Architecture Overview

```
Browser (Frontend)                  Server (PHP Backend)
┌─────────────────────┐            ┌──────────────────────┐
│  index.html         │  HTTP POST │  api/config.php      │
│  main.js            │ ─────────► │  api/generate-quiz.php│
│  src/               │ ◄─────────│  api/auth-verify.php  │
│    main.js          │   JSON     │  api/debug.php        │
│    config.js        │   Response │  api/load_env.php     │
│    api/client.js    │            └──────────────────────┘
│    auth/            │
│    quiz/            │            External APIs
│    ui/              │            ┌──────────────────────┐
│    utils/           │            │  Google Gemini API    │
└─────────────────────┘            │  Google OAuth 2.0     │
                                   └──────────────────────┘
```

### Frontend (Vanilla JS + Vite)
- **Entry point:** `main.js` orchestrates the entire app — renders screens, handles events, coordinates API calls
- **`src/config.js`** — Central configuration (API endpoints, auth settings, feature flags)
- **`src/api/client.js`** — HTTP client for communicating with PHP backend
- **`src/auth/google-auth.js`** — Google OAuth 2.0 integration (login/logout, token management)
- **`src/quiz/app.js`** — Quiz state management and rendering logic
- **`src/quiz/generator.js`** — Parses Gemini JSON response into quiz structure
- **`src/ui/components.js`** — Reusable UI components (modals, toasts, loading overlays, tutorial)
- **`src/utils/*.js`** — Utility modules (CSRF protection, debounce, file upload handler, rate limiter, sanitization, session management)

### Backend (PHP)
- **`api/config.php`** — Returns frontend configuration (CORS origins, API keys, model name)
- **`api/generate-quiz.php`** — Core endpoint: receives material + settings, calls Gemini API, returns formatted quiz JSON
- **`api/auth-verify.php`** — Verifies Google OAuth tokens server-side
- **`api/debug.php`** — Debug dashboard for troubleshooting
- **`api/load_env.php`** — Loads environment variables from `.env` file

## 🔐 Authentication

Google OAuth 2.0 is **required** to use the app. The flow:
1. User clicks "Sign in with Google" button
2. Google Identity Services popup appears
3. On success, the Google ID token is sent to `api/auth-verify.php`
4. Server verifies the token and returns a session token
5. Session expires after **1 hour of inactivity**
6. An auth overlay blocks access when not logged in

## 🤖 How Quiz Generation Works

1. User provides study material (text paste or file upload)
2. File content is extracted client-side (PDF.js or Mammoth.js)
3. Material is sent to the PHP backend via `POST /api/generate-quiz.php`
4. PHP backend crafts a detailed prompt with the material, difficulty, and question count
5. Prompt is sent to **Google Gemini API** (`gemini-3-flash-preview`)
6. Gemini returns a structured JSON array of quiz questions
7. Each question contains: question text, 4 options, correct answer index, and rationale
8. PHP validates and sanitizes the response, then returns it to the frontend
9. Frontend renders the interactive quiz UI with shuffled options

## ⚠️ Privacy & Data

**No database.** All quiz results, settings, and session data stay in:
- **localStorage** — Tutorial progress, theme preference, session tokens
- **In-memory** — Current quiz state, score tracking

Data is only sent to:
- **Google Gemini API** (study material + prompt) — for quiz generation
- **Google OAuth 2.0** (authentication tokens) — for login verification

## 🚀 Getting Started

```bash
# Prerequisites: Node.js 16+, PHP 7.4+, web server

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Gemini API key and Google OAuth credentials

# Start development server (frontend)
npm run dev

# Start PHP backend (separate terminal)
php -S localhost:8000
```

## 📂 Project Structure

```
Web App AI Quiz Maker V1 - Legacy/
├── api/                  # PHP backend
│   ├── config.php        # Configuration endpoint
│   ├── generate-quiz.php # Quiz generation via Gemini
│   ├── auth-verify.php   # Google token verification
│   ├── debug.php         # Debug dashboard
│   └── load_env.php      # .env parser
├── public/               # Static assets
│   ├── assets/
│   └── fonts/
├── src/                  # Frontend source
│   ├── main.js           # App entry point & orchestrator
│   ├── style.css         # Global styles
│   ├── config.js         # App configuration
│   ├── api/client.js     # HTTP client
│   ├── auth/             # Google OAuth
│   ├── quiz/             # Quiz logic (app.js, generator.js)
│   ├── ui/               # UI components
│   └── utils/            # Utilities
├── index.html            # Main HTML
├── main.js               # Vite entry point
├── .env.example          # Environment template
└── package.json          # Dependencies
```

---

> **Note:** V1 is the **legacy** version. For the latest features, multi-provider AI support, and desktop capabilities, check out **V2 (Web App)** and **V3 (Desktop App)**.