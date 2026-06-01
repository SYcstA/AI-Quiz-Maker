# 🧠 AI Quiz Maker

> Transform your study material into interactive quizzes instantly using AI.

> **🔗 Live Demo:** [https://quiz.soosvaldo.my.id/](https://quiz.soosvaldo.my.id/) *(Note: demo instance may be unstable/outdated)*
>
> **⚠️ No Database** — Aplikasi ini **100% tanpa database**. Semua data tetap lokal di komputer pengguna. Tidak ada data yang dikirim atau disimpan di server manapun selain AI API calls.

AI Quiz Maker is a powerful web application that generates customized quizzes from any text or document (PDF/DOCX). Perfect for students, educators, and self-learners who want to test their knowledge efficiently.

## ✨ Key Features

### 🎯 Core Functionality
- **AI-Powered Quiz Generation** — Paste text or upload PDF/DOCX files, and let Google Gemini AI create a complete quiz with multiple-choice questions, answer rationales, and scoring.
- **Multiple Input Methods** — Type or paste material directly, or upload files up to 10MB (PDF & DOCX supported).
- **Customizable Difficulty** — Choose between Easy, Normal, or Hard difficulty levels to match your learning stage.
- **Flexible Question Count** — Quick-select [5, 10, 15, 20] questions or set a custom number (max 30).

### 🔐 Authentication & Security
- **Google OAuth 2.0** — Secure login with your Google account.
- **Session Management** — Auto-expiry after 1 hour of inactivity.
- **Rate Limiting** — 10 requests per 3 minutes to prevent abuse.
- **18+ Content Filter** — Built-in adult content detection.

### 🎨 User Experience
- **Interactive Tutorial** — 5-step walkthrough for first-time users (30-day cookie expiry).
- **Confirmation Modals** — Prevent accidental data loss with stylish confirmation dialogs.
- **Dark Mode** — Toggle between light and dark themes.
- **Responsive Design** — Works perfectly on desktop, tablet, and mobile.
- **Confetti Animation** — Celebrate perfect scores with confetti effects.

### 📥 Export & Sharing
- **Download Results** — Export quiz results as a formatted `.txt` file.
- **Regenerate** — Create new quizzes from the same material with different settings.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **Frontend** | Vanilla JavaScript, HTML5, CSS3 |
| **Styling** | Tailwind CSS (CDN) |
| **Build Tool** | Vite |
| **Backend** | PHP 7.4+ |
| **AI API** | Google Gemini API |
| **Auth** | Google OAuth 2.0 (Identity Services) |
| **File Parsing** | pdf.js, mammoth.js |
| **Icons** | Font Awesome 6 |
| **Animations** | Canvas Confetti |

## 🚀 Getting Started

### Prerequisites

- **Node.js** v16+ and npm (for local development with Vite)
- **PHP** 7.4+ with cURL enabled (for backend API)
- **Web Server** Apache/Nginx or PHP built-in server
- **Google Cloud Account** (for OAuth credentials & Gemini API key)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SYcstA/AI-Quiz-Maker.git
   cd AI-Quiz-Maker
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and replace the placeholder values with your actual credentials:

   ```env
   GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
   GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
   GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"
   AI_MODEL="gemini-1.5-flash"
   ```

4. **Get your API credentials**

   **Google Gemini API Key:**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Click "Create API Key" and copy your key

   **Google OAuth 2.0 Credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Navigate to APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Set Application Type to "Web Application"
   - Add authorized JavaScript origins (e.g., `http://localhost:5173`)
   - Copy the Client ID and Client Secret

5. **Run the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

6. **(Optional) Start PHP backend**
   ```bash
   php -S localhost:8000
   ```

### Production Deployment

1. Build the frontend:
   ```bash
   npm run build
   ```
2. Deploy the `dist/` folder along with the `api/` directory to your web server.
3. Ensure the `.env` file is properly configured on your server.
4. Set the `CORS_ORIGIN` environment variable to your domain.

## 📂 Project Structure

```
AI-Quiz-Maker/
├── api/                  # PHP backend
│   ├── config.php        # Configuration endpoint
│   ├── generate-quiz.php # Quiz generation endpoint
│   ├── auth-verify.php   # Google token verification
│   ├── debug.php         # Debug dashboard
│   └── load_env.php      # .env file parser
├── public/               # Static assets
│   ├── assets/           # Images, icons
│   └── fonts/            # Custom fonts
├── src/                  # Frontend source
│   ├── main.js           # Entry point
│   ├── style.css         # Global styles
│   ├── auth/             # Authentication logic
│   ├── api/              # API client
│   ├── quiz/             # Quiz rendering
│   ├── ui/               # UI components
│   └── utils/            # Utilities
├── index.html            # Main HTML file
├── main.js               # Main application logic
├── .env.example          # Environment template
└── package.json          # Dependencies
```

## 🔮 Coming Soon

- **🔄 BYOM (Bring Your Own Model)** — Choose from multiple AI providers (OpenAI, Claude, etc.)
- **📱 Offline Support** — Generate quizzes without internet connection using on-device AI
- **📊 Analytics Dashboard** — Track your learning progress over time
- **🌍 Multi-language Support** — Generate quizzes in different languages
- **📝 Edit Quiz** — Manually review and edit generated questions before answering
- **🏆 Leaderboards** — Compare scores with friends and classmates

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Google Gemini API](https://ai.google.dev/) for powering quiz generation
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first styling
- [pdf.js](https://mozilla.github.io/pdf.js/) and [Mammoth.js](https://github.com/mwilliamson/mammoth.js) for document parsing
- [Font Awesome](https://fontawesome.com/) for beautiful icons

---

<p align="center">
  Made with ❤️ for learners everywhere
</p>