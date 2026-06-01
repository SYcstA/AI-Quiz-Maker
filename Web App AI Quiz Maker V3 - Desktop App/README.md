# 🧠 AI Quiz Maker V3 — Desktop App

> **The flagship desktop application.** An Electron-based AI quiz generator that runs natively on Windows, bypasses browser limitations, and supports fully offline AI — no database, no cloud dependency.

## 📌 Purpose in This Monorepo

V3 is the **most advanced version** of AI Quiz Maker. Built on Electron, it takes everything V2 achieved and elevates it to a native desktop experience. It eliminates browser CORS restrictions, enables local file system access for larger file uploads (20MB), supports fully offline AI via LM Studio/Ollama, and can be packaged as a standalone Windows installer. **100% private — all data stays on your machine.**

---

## ✨ Key Features

### 🎯 Core Functionality
| Feature | Description |
|---|---|
| **Multi-Provider AI** | Google Gemini, OpenAI-compatible (OpenAI, DeepSeek, Groq, Together AI, NVIDIA NIM), **Anthropic Claude**, and **Local AI** (LM Studio, Ollama) |
| **Text Input** | Paste study material (min. 50 characters) — up to ~15,000 characters passed to AI |
| **File Upload** | PDF/DOCX up to **20MB** (double V2's limit) — parsed client-side with real-time progress |
| **3 Difficulty Levels** | Easy (recall), Normal (comprehension), Hard (application/analysis) |
| **Dynamic Question Limits** | Up to **50 questions** in desktop mode — bypasses browser API timeout restrictions |
| **Interactive Quiz** | Shuffled options, click-to-answer with instant color-coded feedback and rationale |
| **Live Scoring** | Real-time score counter with confetti animation on perfect score |
| **Regeneration** | Full modal with focus, difficulty, and count controls — reuses source material |

### 📥 Export Options
| Export Type | Format | Description |
|---|---|---|
| **Summary** | `.txt` | Single document with questions + answers combined |
| **Separated** | `.zip` | Two separate files (Questions + Answer Key) — ideal for printing |

### 🖥️ Desktop-Exclusive Advantages
| Advantage | Why It Matters |
|---|---|
| **No CORS Restrictions** | Browser cross-origin restrictions eliminated — all AI API calls work seamlessly |
| **Fully Offline Mode** | Run completely offline with **Local AI** (LM Studio/Ollama) — no internet required |
| **20MB File Limit** | Double the browser's 10MB limit for document uploads |
| **50-Question Maximum** | Bypasses browser timeout limits on long AI API calls |
| **Rate Limiting Disabled** | No artificial request caps — generate as many quizzes as you want |
| **No Google Auth Required** | No sign-in needed — just launch and use |
| **Native Window** | Standalone window with minimize/maximize/close, taskbar integration |
| **DevTools Access** | Built-in Chrome DevTools for debugging (F12) |
| **Portable & Installable** | Packaged as a Windows installer — no browser needed |

### 🎨 User Experience
- **Dark Mode** — Toggle between light and dark themes (persisted in localStorage)
- **Interactive Tutorial** — 5-step guided walkthrough (30-day cookie expiry)
- **Confirmation Modals** — Prevent accidental data loss
- **Toast Notifications** — Non-intrusive feedback for all actions
- **Loading Overlay** — Animated progress bar during generation
- **Drag & Drop** — Full drag-and-drop file upload with visual feedback
- **Responsive Layout** — Scales to any window size

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| **Desktop Shell** | **Electron** v35.1.2 |
| **Frontend** | Vanilla JavaScript (ES Modules), HTML5, CSS3 |
| **Styling** | Tailwind CSS (CDN) |
| **Build Tool** | Vite + electron-builder |
| **AI Providers** | Google Gemini, OpenAI-compatible, Anthropic Claude, Local AI (LM Studio/Ollama) |
| **File Parsing** | PDF.js (PDF), Mammoth.js (DOCX) |
| **Export** | JSZip (ZIP), custom `.txt` formatter |
| **Icons** | Font Awesome 6 |
| **Animation** | Canvas Confetti |
| **Packaging** | electron-builder (NSIS installer) |

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    Electron App                           │
│                                                          │
│  ┌──────────────────────┐   ┌────────────────────────┐  │
│  │   Main Process        │   │   Renderer Process     │  │
│  │   (electron/main.cjs) │◄──┤   (index.html + Vite)  │  │
│  │                       │IPC│                        │  │
│  │  - Window management  │   │  - UI rendering        │  │
│  │  - File dialogs       │   │  - Quiz logic          │  │
│  │  - App lifecycle      │   │  - AI provider calls   │  │
│  │  - Native features    │   │  - File processing     │  │
│  └──────────────────────┘   └────────┬───────────────┘  │
│                                      │                  │
│                            ┌─────────▼───────────┐     │
│                            │   AI Providers       │     │
│                            │   ┌───────────────┐  │     │
│                            │   │ Gemini        │  │     │
│                            │   │ OpenAI        │  │     │
│                            │   │ Anthropic     │  │     │
│                            │   │ Local AI      │  │     │
│                            │   └───────┬───────┘  │     │
│                            └───────────┼──────────┘     │
└────────────────────────────────────────┼────────────────┘
                                         │
                                 ┌───────▼────────┐
                                 │  External APIs  │
                                 │  (via HTTPS)    │
                                 │  Gemini         │
                                 │  OpenAI         │
                                 │  Anthropic      │
                                 │  LM Studio      │
                                 └────────────────┘
```

### Process Architecture
- **Main Process** (`electron/main.cjs`):
  - Creates and manages the BrowserWindow
  - Handles app lifecycle (ready, window-all-closed, activate)
  - Configures window bounds, icon, and title
  - Sets Content-Security-Policy for security
  - Launches dev server URL or loads built files

- **Preload Script** (`electron/preload.cjs`):
  - Exposes limited APIs to renderer via `contextBridge`
  - Provides `electronAPI.isDesktop` flag for runtime mode detection
  - Maintains security by not exposing full Node.js APIs

- **Renderer Process** (Vite-built web app):
  - Same codebase as V2
  - Detects desktop mode via `window.electronAPI?.isDesktop`
  - **Bypasses CORS** — `webSecurity: false` in main process
  - **No rate limiting** — disabled when `env-check.js` detects desktop mode
  - **No Google Auth** — login overlay never shows in desktop mode

## 🤖 AI Provider System

Identical to V2's provider system with a registry pattern:

| Provider | Default Model | Requires Key | Offline? |
|---|---|---|---|
| **Default AI** | `gemini-3-flash-preview` | No (demo key) | No |
| **Gemini** | `gemini-3-flash-preview` | Yes | No |
| **OpenAI** | `gpt-4o-mini` | Yes | No |
| **Anthropic** | `claude-3-5-haiku-latest` | Yes | No |
| **Local AI** | User-configured | No | **Yes ✅** |

### Local AI (LM Studio / Ollama)
- Connect to `http://localhost:1234/v1` (LM Studio) or `http://localhost:11434/v1` (Ollama)
- Click **"Fetch Models"** to auto-discover available models
- Works completely offline — no internet connection required
- No API key needed — runs on your own hardware

## 🖥️ Desktop-Specific Features

### Window Management
- Default size: **1200×800** (centered on screen)
- Custom icon (icon-256.png) for taskbar and title bar
- Resizable, minimizable, maximizable
- DevTools accessible via F12 / Ctrl+Shift+I
- Graceful close handling via `window-all-closed` event

### File System Access
- **20MB file upload limit** (vs 10MB in browser)
- Uses native `<input type="file">` dialog (no security restrictions)
- File content extracted client-side — never leaves the machine

### No CORS
- Electron `webSecurity: false` disables same-origin policy
- All AI API endpoints work without CORS configuration
- No need for proxy servers or backend workarounds

### Privacy Mode
- **Never requires login** — no Google OAuth popup
- **No rate limiting** — generate unlimited quizzes
- **No session expiry** — stays logged in (though there's no login)
- All data stays in `localStorage` and in-memory

## 🤖 How Quiz Generation Works

1. User provides study material (text paste or PDF/DOCX upload)
2. `document-processor.js` extracts text client-side (PDF.js / Mammoth.js)
3. `main.js` validates (≥50 chars) and checks content filter
4. `quiz-generator.js` builds a structured prompt with material + difficulty + count
5. Selected provider's `generate()` function fires the API call
6. In desktop mode: **no rate limit check, no Google auth check**
7. AI returns JSON array of `{ question, options[], correctAnswer, rationale }`
8. Quiz rendered with shuffled options, instant feedback, live scoring
9. Results downloadable as `.txt` (summary) or `.zip` (separated)

## 🚀 Getting Started

### Development
```bash
# Prerequisites: Node.js 16+ and npm

# Enter V3 directory
cd "Web App AI Quiz Maker V3 - Desktop App"

# Install dependencies
npm install

# Run in development mode (Vite dev server + Electron window)
npm run electron:dev
```

### Build Installer
```bash
npm run electron:build
# Output: dist_electron/AI Quiz Maker Setup 1.0.0.exe
```

The installer is a standalone Windows executable. Just run it and follow the setup wizard — no browser, no web server, no PHP required.

### Environment Setup
```bash
cp .env.example .env
# VITE_APP_MODE=desktop
# VITE_GEMINI_API_KEY="your-key-here"
# VITE_DEFAULT_MODEL="gemini-3-flash-preview"
# VITE_MAX_QUESTIONS=30
```

### Using Local AI (Fully Offline)
1. Install [LM Studio](https://lmstudio.ai/) or [Ollama](https://ollama.ai/)
2. Download a model (e.g., Llama 3, Mistral, Phi-3)
3. Start the local inference server
4. In the app, click ⚙️ **Settings** → **Local AI**
5. Enter endpoint (e.g., `http://localhost:1234/v1`)
6. Click **Fetch Models** → select model → **Save**
7. Generate quizzes entirely offline — no internet needed

## 📂 Project Structure

```
Web App AI Quiz Maker V3 - Desktop App/
├── electron/                    # Electron main process
│   ├── main.cjs                 # Main process entry (window, lifecycle, IPC)
│   ├── preload.cjs              # Preload script (contextBridge, security)
│   └── run-dev.cmd              # Development launcher script
├── public/                      # Static assets (icons)
├── src/
│   ├── ai/                      # AI provider system
│   │   ├── provider-registry.js       # Provider registration & lookup
│   │   ├── quiz-generator.js          # Quiz generation orchestration
│   │   ├── settings-manager.js        # Provider settings UI
│   │   └── providers/
│   │       ├── gemini.js              # Google Gemini provider
│   │       ├── openai.js              # OpenAI-compatible provider
│   │       └── local.js               # Local AI (LM Studio/Ollama)
│   ├── utils/
│   │   ├── document-processor.js      # PDF/DOCX text extraction
│   │   └── env-check.js              # Environment detection (web vs desktop)
│   └── style.css                     # Global styles
├── index.html                   # Main HTML (all components + V3 banner)
├── main.js                      # App entry point (bundled by Vite)
├── icon-256.png                 # Application icon (256x256)
├── icon.ico                     # Windows icon resource
├── icon.png                     # Source icon
├── .env.example                 # Environment template
├── package.json                 # Dependencies & scripts
├── vite.config.js               # Vite + Electron configuration
└── tailwind.config.js           # Tailwind configuration
```

## 📦 Packaging & Distribution

### Current Build
- **Installer:** `dist_electron/AI Quiz Maker Setup 1.0.0.exe`
- **Platform:** Windows (NSIS installer)
- **Electron:** v35.1.2
- **Size:** ~80MB (includes Chromium runtime)

### Build Configuration
```json
{
  "appId": "com.osvaldo.quizmaker",
  "productName": "AI Quiz Maker",
  "win": {
    "target": "nsis",
    "icon": "icon-256.png"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true
  }
}
```

## ⚠️ Privacy & Data

**100% private. No database. No telemetry.** All data is:
- **localStorage** — API keys, provider preferences, theme, tutorial progress
- **In-memory** — Quiz state, uploaded file content, scores

**Data is never sent anywhere except:**
- Your chosen **AI Provider API** (study material + prompt) — for quiz generation
- Or **nowhere at all** — if you use Local AI, everything stays on your machine

---

> **Built with ❤️ by So Osvaldo.**
> V3 is the culmination of the AI Quiz Maker journey — from PHP-powered web app to a fully offline, privacy-first desktop application.