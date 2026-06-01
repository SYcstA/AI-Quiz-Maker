# 🧠 AI Quiz Maker V2 — Web App

> **The enhanced web application.** A zero-backend, multi-provider AI quiz generator that transforms study material into interactive multiple-choice quizzes — entirely in your browser.

> 🔗 **Live Demo:** [https://quiz.soosvaldo.my.id/](https://quiz.soosvaldo.my.id/)

## 📌 Purpose in This Monorepo

V2 represents the **major evolution** from V1. It eliminates the PHP backend dependency, introduces a **pluggable multi-provider AI system** (Gemini, OpenAI, Anthropic, Local AI), adds advanced export options (ZIP), and implements a polished UI with dark mode, tutorials, and real-time feedback. All data stays local — **no database, no server-side storage**.

---

## ✨ Key Features

### 🎯 Core Functionality
| Feature | Description |
|---|---|
| **Multi-Provider AI** | Choose from **Google Gemini**, **OpenAI-compatible** (OpenAI, DeepSeek, Groq, Together AI, NVIDIA NIM), **Anthropic Claude**, or **Local AI** (LM Studio, Ollama) |
| **Text Input** | Paste study material (min. 50 characters) as quiz source |
| **File Upload** | Upload PDF/DOCX files up to 10MB — parsed entirely client-side with progress |
| **3 Difficulty Levels** | Easy, Normal, Hard — affects AI prompt complexity |
| **Dynamic Question Limits** | Up to **30 questions** (default) or up to **50 questions** when using your own API key or Local AI |
| **Interactive Quiz Display** | Shuffled options, click-to-answer with instant color-coded feedback and rationale display |
| **Live Score Tracking** | Real-time score counter with confetti animation on perfect score |
| **Regeneration** | Modal with focus (all topics / improvement areas), difficulty, and count controls — reuses source material |

### 📥 Export Options
| Export Type | Format | Description |
|---|---|---|
| **Summary** | `.txt` | Single document with questions + answers combined |
| **Separated** | `.zip` | Two separate files (Questions + Answer Key) — ideal for printing test papers |

### 🎨 User Experience
- **Dark Mode** — Toggle between light and dark themes (persisted in localStorage)
- **Interactive Tutorial** — 5-step guided walkthrough for first-time users (30-day cookie expiry)
- **Confirmation Modals** — Prevent accidental data loss on reset/back actions
- **Toast Notifications** — Non-intrusive feedback for all actions
- **Loading Overlay** — Animated progress bar during quiz generation
- **Drag & Drop** — Drag-and-drop file upload zone with visual feedback
- **Responsive Design** — Works on desktop, tablet, and mobile

### 🔐 Authentication & Security
- **Google OAuth 2.0** — Secure login with Google account (web mode only)
- **Session Management** — Auto-expiry after 1 hour of inactivity
- **Rate Limiting** — 10 requests per 3 minutes (configurable, disabled in desktop mode)
- **18+ Content Filter** — Built-in adult content detection and blocking

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| **Frontend** | Vanilla JavaScript (ES Modules), HTML5, CSS3 |
| **Styling** | Tailwind CSS (CDN via `cdn.tailwindcss.com`) |
| **Build Tool** | Vite |
| **AI Providers** | Google Gemini, OpenAI-compatible, Anthropic Claude, Local AI (LM Studio, Ollama) |
| **Authentication** | Google OAuth 2.0 (Identity Services) |
| **File Parsing** | PDF.js (PDF), Mammoth.js (DOCX) |
| **Export** | JSZip (ZIP generation), custom `.txt` formatter |
| **Icons** | Font Awesome 6 |
| **Animation** | Canvas Confetti |
| **Runtime** | Browser (no Node.js server, no PHP) |

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (100% Client-Side)            │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ main.js      │  │ src/ai/      │  │ src/utils/    │  │
│  │ (Orchestrator)│  │ provider-   │  │ document-    │  │
│  │              │  │ registry.js  │  │ processor.js │  │
│  │ index.html   │  │ quiz-       │  │ env-check.js  │  │
│  │ (UI Layout)  │  │ generator.js│  │               │  │
│  └─────────────┘  │ settings-    │  └───────────────┘  │
│                    │ manager.js   │                     │
│                    └──────┬───────┘                     │
│                           │                             │
│                    ┌──────▼───────┐                     │
│                    │  AI Providers │                     │
│                    │  ┌─────────┐  │                     │
│                    │  │ Gemini  │  │                     │
│                    │  ├─────────┤  │                     │
│                    │  │ OpenAI  │  │                     │
│                    │  ├─────────┤  │                     │
│                    │  │ Anthropic│ │                     │
│                    │  ├─────────┤  │                     │
│                    │  │ Local AI│  │                     │
│                    │  └─────────┘  │                     │
│                    └──────┬───────┘                     │
│                           │                             │
└───────────────────────────┼─────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │  External APIs │
                    │  (Direct HTTP) │
                    │  Gemini        │
                    │  OpenAI        │
                    │  Anthropic     │
                    │  LM Studio     │
                    └────────────────┘
```

### Key Architecture Decisions
- **Zero Backend** — No PHP, no Node.js server. The browser communicates directly with AI APIs
- **Client-Side File Processing** — PDF.js and Mammoth.js run entirely in the browser — files never leave the user's machine
- **Provider Abstraction** — All AI providers implement a common interface (`async generate(prompt, apiKey, model)`), making it trivial to add new providers
- **localStorage Persistence** — API keys, provider preferences, theme settings, and tutorial progress are stored in localStorage

## 🤖 AI Provider System

The provider system uses a **registry pattern** (`src/ai/provider-registry.js`):

### Built-in Providers
| Provider | Source | Requires API Key | Default Model |
|---|---|---|---|
| **Default AI** | Hardcoded Gemini key | No (uses built-in demo key) | `gemini-3-flash-preview` |
| **Gemini** | Google AI Studio | Yes | `gemini-3-flash-preview` |
| **OpenAI** | OpenAI / DeepSeek / Groq / Together / NVIDIA | Yes | `gpt-4o-mini` |
| **Anthropic** | Anthropic Console | Yes | `claude-3-5-haiku-latest` |
| **Local AI** | LM Studio / Ollama (localhost) | No (free, local) | User-configured |

### Each Provider Exposes
- `name` — Display name
- `id` — Unique identifier
- `description` — Short description
- `models` — Array of supported model names
- `defaultModel` — Default model selection
- `requiresKey` — Whether an API key is mandatory
- `hasEndpoint` — Whether a custom endpoint URL can be configured
- `generate(prompt, apiKey, model, endpoint)` — The generation function

### Settings Manager (`src/ai/settings-manager.js`)
- Handles saving/loading provider preferences from localStorage
- Manages API key visibility toggle
- Supports "Test Connection" to validate API keys before saving
- Dynamically shows/hides configuration fields based on selected provider

## 🤖 How Quiz Generation Works

1. **Input Collection** — User pastes text or uploads PDF/DOCX (extracted by PDF.js/Mammoth.js)
2. **Validation** — Material must be ≥ 50 characters; rate limiter checked (web mode); content filter scanned
3. **Prompt Construction** — `quiz-generator.js` builds a structured prompt containing the material, difficulty level, and requested question count
4. **Provider Selection** — User's chosen provider is loaded from localStorage via `provider-registry.js`
5. **API Call** — `provider.generate(prompt, apiKey, model, endpoint)` fires a direct HTTP request to the AI API
6. **Response Parsing** — AI returns JSON with `{ question, options[], correctAnswer, rationale }` for each question
7. **Quiz Rendering** — Questions displayed one at a time with shuffled options; instant feedback on selection
8. **Scoring** — Live score tracked; confetti on perfect score; results downloadable as `.txt` or `.zip`

## 🔐 Authentication (Web Mode Only)

Google OAuth 2.0 is **optional** in V2 (required in V1). The app works in two modes:
- **Web Mode** — Requires Google login. Uses PHP backend for auth verification. Rate limiting active (10 req/3 min). Session expires after 1 hour
- **Desktop/Electron Mode** — No authentication required. Rate limiting disabled. CORS bypassed via Electron's web security settings

## ⚠️ Privacy & Data

**No database. No server-side storage.** All data is:
- **localStorage** — API keys, provider preferences, theme, tutorial progress, auth tokens
- **In-memory** — Current quiz state, score, uploaded file content

Data is only sent to:
- **Selected AI Provider API** (study material + prompt) — for quiz generation
- **Google OAuth 2.0** — for login (web mode only)

## 🚀 Getting Started

```bash
# Prerequisites: Node.js 16+ and npm

# Clone and enter V2
cd "Web App AI Quiz Maker V2"

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your preferred AI provider API keys

# Start development server
npm run dev
```

### Using Your Own AI Provider
1. Click the ⚙️ **Settings** button (top-right)
2. Select your preferred AI provider (Gemini, OpenAI, Anthropic, or Local AI)
3. Enter your **API key** (or skip for Local AI)
4. Select a **model** from the dropdown
5. Click **Test Connection** to verify
6. Click **Save Settings**

### Using Local AI (Fully Offline)
1. Install [LM Studio](https://lmstudio.ai/) or [Ollama](https://ollama.ai/)
2. Start the local server (LM Studio: port 1234; Ollama: port 11434)
3. In V2 Settings, select **Local AI** and enter the endpoint URL (e.g., `http://localhost:1234/v1`)
4. Click **Fetch Models** to auto-detect available models
5. Select a model and save

## 📂 Project Structure

```
Web App AI Quiz Maker V2/
├── public/                  # Static assets (icons)
├── src/
│   ├── ai/                  # AI provider system
│   │   ├── provider-registry.js   # Provider registration & lookup
│   │   ├── quiz-generator.js      # Quiz generation orchestration
│   │   ├── settings-manager.js    # Provider settings UI & persistence
│   │   └── providers/
│   │       ├── gemini.js          # Google Gemini provider
│   │       ├── openai.js          # OpenAI-compatible provider
│   │       └── local.js           # Local AI provider (LM Studio/Ollama)
│   ├── utils/
│   │   ├── document-processor.js  # PDF/DOCX text extraction
│   │   └── env-check.js          # Environment & mode detection
│   └── style.css                 # Global styles
├── index.html               # Main HTML (all components, modals, overlays)
├── main.js                  # App entry point (2300+ lines)
├── .env.example             # Environment template
├── package.json             # Dependencies & scripts
├── vite.config.js           # Vite configuration
└── tailwind.config.js       # Tailwind configuration
```

---

> **Next:** For offline desktop capabilities (CORS bypass, file system access, native installer), check out **V3 (Desktop App)**.