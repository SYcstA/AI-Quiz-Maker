# 🧠 AI Quiz Maker (Monorepo)

> Transform your study material into interactive quizzes instantly using AI.

> 🔗 **Live Demo (V2 Web App):** [https://quiz.soosvaldo.my.id/](https://quiz.soosvaldo.my.id/)  
> *Note: This live link runs the V2 Web App, while V3 is the standalone Desktop application available for download in the Releases tab.*

> ⚠️ **Privacy First:** 100% database-free. All data remains local.

## 🚀 The Architecture Evolution

```
📦 AI Quiz Maker (Monorepo)
├── 📂 Web App AI Quiz Maker V1 - Legacy    # The original concept
├── 📂 Web App AI Quiz Maker V2             # Modernized web application
└── 📂 Web App AI Quiz Maker V3 - Desktop App  # The Flagship Desktop App
```

### V1 (Legacy)
The initial concept built with vanilla HTML/JS and a PHP backend.

### V2 (Web App)
Modernized web application (React/Vite). Features Google Auth, Cloud AI Providers (Gemini, OpenAI, NVIDIA NIM), and modern UI/UX.

### V3 (Desktop App — The Flagship)
An **Electron-based desktop application**. Bypasses browser CORS limitations, runs completely offline using **Local AI** (via LM Studio), operates in **Privacy-First** mode, and supports **Bring Your Own Key (BYOK)**.

## ✨ Key Features (Across V2 & V3)

- **Dynamic AI Selection** — Choose between Cloud APIs (NVIDIA, Gemini, OpenAI, Anthropic) or Offline Local LLMs.
- **Smart Document Parsing** — Upload PDF/DOCX files and extract text instantly.
- **Advanced Export Options** — Download combined summaries or separated ZIP files.
- **Dynamic Question Limits** — Auto-adjusts max limits based on the selected AI provider.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **React** | Frontend framework |
| **Vite** | Build tool |
| **Electron** | Desktop application shell (V3) |
| **Tailwind CSS** | Utility-first styling |
| **Lucide Icons** | Icon library |
| **JSZip** | Client-side ZIP generation |

## 🚀 Getting Started

### Prerequisites
- **Node.js** v16+ and npm

### Clone the Repository
```bash
git clone https://github.com/SYcstA/AI-Quiz-Maker.git
cd AI-Quiz-Maker
```

### Run V2 (Web App)
```bash
cd "Web App AI Quiz Maker V2"
npm install
npm run dev
```

### Run V3 (Desktop App)
```bash
cd "Web App AI Quiz Maker V3 - Desktop App"
npm install
npm run electron:dev
```

### Build V3 Installer
```bash
cd "Web App AI Quiz Maker V3 - Desktop App"
npm run electron:build
```

### Environment Setup
```bash
cp .env.example .env
# Edit .env with your API keys
```

## 🤝 Author

Created by **So Osvaldo**.