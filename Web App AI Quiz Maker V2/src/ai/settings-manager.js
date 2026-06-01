/**
 * AI Provider Settings Manager
 * 
 * Reads/writes user AI provider configuration to localStorage.
 * Storage key: 'quizmaker_ai_settings'
 */

const STORAGE_KEY = 'quizmaker_ai_settings';

/**
 * Default settings (uses the bundled Gemini API key)
 */
const DEFAULTS = {
  activeProvider: 'default',
  customProviders: {},
  localEndpoint: '',
  localModel: '',
  defaultModel: 'gemini-3-flash-preview',
};

/**
 * Predefined model options per provider for the dropdown
 */
export const PROVIDER_MODEL_OPTIONS = {
  openai: [
    { value: '__custom__', label: 'Custom (Type your own)...' },
    { value: 'gpt-4o', label: 'gpt-4o' },
    { value: 'gpt-4o-mini', label: 'gpt-4o-mini' },
    { value: 'o1-preview', label: 'o1-preview' },
    { value: 'o1-mini', label: 'o1-mini' },
    { value: 'deepseek-chat', label: 'deepseek-chat' },
    { value: 'deepseek-reasoner', label: 'deepseek-reasoner' },
  ],
  gemini: [
    { value: '__custom__', label: 'Custom (Type your own)...' },
    { value: 'gemini-3-flash-preview', label: 'gemini-3-flash-preview' },
    { value: 'gemini-2.5-flash', label: 'gemini-2.5-flash' },
    { value: 'gemini-2.0-flash', label: 'gemini-2.0-flash' },
    { value: 'gemini-2.0-flash-lite-preview', label: 'gemini-2.0-flash-lite-preview' },
    { value: 'gemini-2.0-pro-exp', label: 'gemini-2.0-pro-exp' },
    { value: 'gemini-1.5-pro', label: 'gemini-1.5-pro' },
    { value: 'gemini-1.5-flash', label: 'gemini-1.5-flash' },
    { value: 'gemini-1.5-flash-8b', label: 'gemini-1.5-flash-8b' },
  ],
  anthropic: [
    { value: '__custom__', label: 'Custom (Type your own)...' },
    { value: 'claude-3-5-sonnet-latest', label: 'claude-3-5-sonnet-latest' },
    { value: 'claude-3-5-haiku-latest', label: 'claude-3-5-haiku-latest' },
    { value: 'claude-3-opus-latest', label: 'claude-3-opus-latest' },
  ],
};

/**
 * Convert a raw HTTP status code to a human-readable error message
 * @param {number} status - HTTP status code
 * @param {string} providerId - provider identifier for context
 * @returns {string} Human-readable error message
 */
export function httpStatusToMessage(status, providerId = '') {
  const isLocal = providerId === 'local';
  if (status === 401 || status === 403) {
    return isLocal
      ? 'Authentication failed. Check if your local server requires an API key.'
      : 'Invalid API Key. Please check your credentials in Settings.';
  }
  if (status === 404) {
    return 'Model or endpoint not found. Please verify your settings.';
  }
  if (status === 429) {
    return 'Rate limit exceeded. Please try again later.';
  }
  if (status >= 500) {
    return 'The AI server encountered an error. Please try again later.';
  }
  return `Request failed (status ${status}). Please check your endpoint or network.`;
}

/**
 * Available provider definitions (for display in the settings UI)
 */
export const ALL_PROVIDER_DEFINITIONS = [
  {
    id: 'default',
    name: 'Default AI (Free)',
    description: 'Uses the built-in Gemini API key. Works out-of-the-box.',
    icon: 'fa-solid fa-rocket',
    requiresKey: false,
    requiresEndpoint: false,
    builtInKey: true,
    defaultModel: 'gemini-3-flash-preview',
    hideModel: true,
    webOnly: true, // Only shown in web mode
  },
  {
    id: 'openai',
    name: 'OpenAI-Compatible',
    description: 'Use any OpenAI-compatible API (OpenAI, DeepSeek, Groq, Together AI, etc.).',
    icon: 'fa-solid fa-robot',
    requiresKey: true,
    requiresEndpoint: false,
    builtInKey: false,
    defaultModel: 'gpt-4o-mini',
    defaultEndpoint: 'https://api.openai.com/v1',
    keyLabel: 'OpenAI API Key',
    keyPlaceholder: 'sk-...',
    modelOptions: 'openai',
  },
  {
    id: 'gemini',
    name: 'Gemini (Custom Key)',
    description: 'Use your own Google Gemini API key.',
    icon: 'fa-solid fa-brain',
    requiresKey: true,
    requiresEndpoint: false,
    builtInKey: false,
    defaultModel: 'gemini-3-flash-preview',
    keyLabel: 'Gemini API Key',
    keyPlaceholder: 'AIza...',
    modelOptions: 'gemini',
  },
  {
    id: 'anthropic',
    name: 'Anthropic-Compatible',
    description: 'Use any Anthropic-compatible API (Claude, etc.).',
    icon: 'fa-solid fa-message',
    requiresKey: true,
    requiresEndpoint: false,
    builtInKey: false,
    defaultModel: 'claude-3-haiku-20240307',
    defaultEndpoint: 'https://api.anthropic.com/v1',
    keyLabel: 'Anthropic API Key',
    keyPlaceholder: 'sk-ant-...',
    modelOptions: 'anthropic',
  },
  {
    id: 'local',
    name: 'Local AI (Offline)',
    description: 'Connect to LM Studio, Ollama, or any OpenAI-compatible local server.',
    icon: 'fa-solid fa-microchip',
    requiresKey: false,
    requiresEndpoint: true,
    builtInKey: false,
    defaultModel: '',
    defaultEndpoint: 'http://localhost:1234/v1',
    keyLabel: '',
    keyPlaceholder: '',
    desktopOnly: true, // Only shown in desktop mode
  },
];

/**
 * Get provider definitions filtered by current app mode
 * @param {'web'|'desktop'|'auto'} mode - 'auto' checks VITE_APP_MODE
 * @returns {Array}
 */
export function getFilteredProviders(mode) {
  let actualMode = mode;
  if (mode === 'auto' || !mode) {
    actualMode = import.meta.env.VITE_APP_MODE || 'web';
  }
  if (actualMode === 'desktop') {
    // Desktop mode: exclude webOnly providers (Default AI)
    return ALL_PROVIDER_DEFINITIONS.filter(p => !p.webOnly);
  }
  // Web mode: exclude desktopOnly providers (Local AI)
  return ALL_PROVIDER_DEFINITIONS.filter(p => !p.desktopOnly);
}

// Auto-detect mode at module load time
export const PROVIDER_DEFINITIONS = getFilteredProviders('auto');

/**
 * Load settings from localStorage
 * @returns {object}
 */
export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULTS, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load AI settings:', e);
  }
  return { ...DEFAULTS };
}

/**
 * Save settings to localStorage
 * @param {object} settings
 */
export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch (e) {
    console.error('Failed to save AI settings:', e);
    return false;
  }
}

/**
 * Get the active provider configuration
 * @returns {{ providerId: string, config: object }}
 */
export function getActiveProviderConfig() {
  const settings = loadSettings();
  const providerId = settings.activeProvider;

  if (providerId === 'default') {
    return {
      providerId: 'default',
      config: {
        model: 'gemini-3-flash-preview',
        apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta',
        description: 'Default AI (free, built-in key)',
      },
    };
  }

  if (providerId === 'local') {
    return {
      providerId: 'local',
      config: {
        model: settings.localModel || '',
        apiKey: '',
        endpoint: settings.localEndpoint || PROVIDER_DEFINITIONS.find(p => p.id === 'local').defaultEndpoint,
        description: `Local AI @ ${settings.localEndpoint || 'localhost'}`,
      },
    };
  }

  const providerDef = PROVIDER_DEFINITIONS.find(p => p.id === providerId);
  const customData = (settings.customProviders && settings.customProviders[providerId]) || {};

  const FALLBACK_ENDPOINTS = {
    gemini: 'https://generativelanguage.googleapis.com/v1beta',
    openai: 'https://api.openai.com/v1',
    anthropic: 'https://api.anthropic.com/v1',
  };

  return {
    providerId,
    config: {
      model: customData.model || (providerDef ? providerDef.defaultModel : ''),
      apiKey: customData.apiKey || '',
      endpoint: customData.endpoint || (providerDef ? (providerDef.defaultEndpoint || FALLBACK_ENDPOINTS[providerId] || '') : ''),
      description: providerDef ? providerDef.name : providerId,
    },
  };
}

/**
 * Test a provider connection by making a lightweight API call.
 * For Gemini: uses simple GET /models?key={apiKey} (no payload required).
 * For Default AI: same as Gemini, using the bundled VITE_GEMINI_API_KEY.
 * For OpenAI/Anthropic: uses their respective auth headers.
 * For Local: fetches /v1/models.
 * @param {string} providerId
 * @param {object} config
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function testProviderConnection(providerId, config) {
  try {
    const endpoint = config.endpoint?.replace(/\/+$/, '');
    const headers = { 'Content-Type': 'application/json' };

    if (providerId === 'local' && config.endpoint) {
      const res = await fetch(`${endpoint}/models`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        const modelCount = data?.data?.length || 0;
        return { success: true, message: `Connected! ${modelCount} model(s) available.` };
      }
      return { success: false, message: httpStatusToMessage(res.status, 'local') };
    }

    if (providerId === 'default') {
      // Default AI: validate bundled key by listing models (simple GET)
      const url = `${endpoint}/models?key=${config.apiKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) return { success: true, message: 'Default AI is working!' };
      const err = await res.json().catch(() => ({}));
      return { success: false, message: err.error?.message || httpStatusToMessage(res.status, 'gemini') };
    }

    if (providerId === 'gemini') {
      // Gemini custom key: validate by listing models (simple GET)
      const url = `${endpoint}/models?key=${config.apiKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) return { success: true, message: 'API key is valid!' };
      const err = await res.json().catch(() => ({}));
      return { success: false, message: err.error?.message || httpStatusToMessage(res.status, 'gemini') };
    }

    if (providerId === 'openai') {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
      const res = await fetch(`${endpoint}/models`, { headers, signal: AbortSignal.timeout(5000) });
      if (res.ok) return { success: true, message: 'API key is valid!' };
      return { success: false, message: httpStatusToMessage(res.status, providerId) };
    }

    if (providerId === 'anthropic') {
      headers['x-api-key'] = config.apiKey;
      headers['anthropic-version'] = '2023-06-01';
      const res = await fetch(`${endpoint}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model: config.model || 'claude-3-haiku-20240307', max_tokens: 1, messages: [{ role: 'user', content: 'Hi' }] }),
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) return { success: true, message: 'API key is valid!' };
      return { success: false, message: httpStatusToMessage(res.status, providerId) };
    }

    return { success: false, message: 'Unknown provider.' };
  } catch (e) {
    if (e.name === 'TimeoutError' || e.name === 'AbortError') {
      return { success: false, message: 'Connection timed out. Please check your endpoint or network.' };
    }
    if (e.message.includes('fetch') || e.message.includes('NetworkError')) {
      return { success: false, message: 'Cannot reach the AI server. Check your internet connection or local server settings.' };
    }
    return { success: false, message: `Failed to connect to the AI provider: ${e.message}` };
  }
}

export default {
  loadSettings,
  saveSettings,
  getActiveProviderConfig,
  testProviderConnection,
  PROVIDER_DEFINITIONS,
  PROVIDER_MODEL_OPTIONS,
  httpStatusToMessage,
};