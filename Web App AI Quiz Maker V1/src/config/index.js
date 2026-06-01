/**
 * @fileoverview Centralized configuration module for AI Quiz Maker.
 * Stores constants and environment variables to eliminate magic numbers.
 */

// --- Application Constants ---
export const AppConfig = {
    APP_NAME: 'AI Quiz Maker',
    VERSION: '1.0.0',
};

// --- Limits & Defaults ---
export const LimitConfig = {
    MAX_CHARACTERS: 500, // Max characters for input material
    MIN_CHARACTERS: 50,  // Minimum required characters for quiz generation
    DEFAULT_QUESTIONS: 5,
    MAX_QUESTIONS: 30,
};

// --- API & Auth Constants ---
export const ApiConfig = {
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
    GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '777857705349-536tuaj5iadns0r1h01kkpu9pdausinn.apps.googleusercontent.com',
    // Note: API keys should ideally be loaded from a secure backend service, not client config.
};

// --- Rate Limiting Constants ---
export const RateLimitConfig = {
    WINDOW_MS: 60000, // 1 minute window
    MAX_REQUESTS: 100,
};