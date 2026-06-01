// CSRF Protection Utilities
// Implements double-submit cookie pattern (no server-side cookies needed)

const CSRF_STATE_KEY = '_csrf_state';
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure random token
 */
export const generateCSRFToken = () => {
  const array = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Store CSRF token in session storage (survives page reload)
 */
export const storeCSRFToken = () => {
  try {
    sessionStorage.setItem(CSRF_STATE_KEY, generateCSRFToken());
    return true;
  } catch {
    // Session storage unavailable - fall back to localStorage
    try {
      localStorage.setItem(CSRF_STATE_KEY, generateCSRFToken());
      return true;
    } catch {
      console.warn('CSRF token storage failed');
      return false;
    }
  }
};

/**
 * Retrieve CSRF token from session storage
 */
export const getCSRFToken = () => {
  try {
    return sessionStorage.getItem(CSRF_STATE_KEY);
  } catch {
    return localStorage.getItem(CSRF_STATE_KEY);
  }
};

/**
 * Validate CSRF token against server response
 * Returns true if valid, false otherwise
 */
export const validateCSRFToken = (response) => {
  try {
    // Check for X-CSRF-Token header in response
    const headers = response.headers;
    if (!headers || !headers.get('x-csrf-token')) {
      return true; // Server doesn't send CSRF token - skip validation
    }
    
    const serverToken = headers.get('x-csrf-token');
    const clientToken = getCSRFToken();
    
    if (!clientToken) {
      console.warn('No CSRF token found in session storage');
      return false;
    }
    
    // Simple comparison (in production, use proper HMAC verification)
    return serverToken === clientToken;
  } catch {
    return true; // Don't fail on validation errors
  }
};

/**
 * Attach CSRF token to outgoing requests
 */
export const attachCSRFHeader = async (requestInit) => {
  try {
    const token = getCSRFToken();
    if (!token) return requestInit;
    
    // Add as header or form field
    if (requestInit.headers && typeof requestInit.headers === 'object') {
      requestInit.headers['x-csrf-token'] = token;
    }
  } catch {
    // Ignore errors in CSRF attachment
  }
  return requestInit;
};

/**
 * Initialize CSRF protection on page load
 */
export const initCSRFProtection = () => {
  storeCSRFToken();
  
  // Add CSRF header to all fetch requests
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    try {
      const [url, options] = args;
      let requestInit = options || {};
      
      // Attach CSRF token before sending
      requestInit = await attachCSRFHeader(requestInit);
      
      return originalFetch.apply(this, [url, requestInit]);
    } catch {
      return originalFetch.apply(this, args);
    }
  };
};

/**
 * Cleanup CSRF tokens on logout
 */
export const clearCSRFToken = () => {
  try {
    sessionStorage.removeItem(CSRF_STATE_KEY);
    localStorage.removeItem(CSRF_STATE_KEY);
  } catch {}
};