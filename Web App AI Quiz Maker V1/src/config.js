// Configuration - Centralized settings
// NEVER hardcode secrets here - use environment variables!

export const CONFIG = {
  // Backend API URL (use env variable in production)
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'https://quiz.soosvaldo.my.id/api/generate-quiz.php',
  
  // Rate limiting configuration
  RATE_LIMIT_MAX: 10,
  RATE_LIMIT_WINDOW_MS: 3 * 60 * 1000, // 3 minutes
  
  // Session settings
  SESSION_MAX_AGE_MS: 1 * 60 * 60 * 1000, // 1 hour
  
  // File upload limits
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  ALLOWED_EXTENSIONS: ['.pdf', '.docx'],
  
  // Quiz generation defaults
  DEFAULT_QUESTIONS: 5,
  MIN_QUESTIONS: 1,
  MAX_QUESTIONS: 30,
  
  // Character limits
  MIN_CHARS_FOR_GENERATION: 50,
  MAX_CHARS_DISPLAYED: 50,
};

// Environment-aware configuration loader
export const loadConfig = () => {
  try {
    // Try to load from environment variables first (production)
    if (import.meta.env.VITE_BACKEND_URL) {
      console.log('Using Vite environment variable for backend URL');
      return;
    }
    
    // Fallback: use default or config.ini
    fetch('/config.ini')
      .then(res => res.text())
      .then(txt => {
        const m = txt.match(/BACKEND_URL\s*=\s*"([^"]+)"/);
        if (m) {
          CONFIG.BACKEND_URL = m[1];
          console.log('Loaded backend URL from config.ini');
        }
      })
      .catch(() => {
        // Silently use default
      });
  } catch (error) {
    console.warn('Config load error:', error);
  }
};

// Initialize config on module load
loadConfig();