/**
 * Debounce utility to prevent excessive API calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function}
 */
export function debounce(func, wait = 500) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle utility for rate limiting
 */
export function throttle(func, limit = 1000) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Safe DOM manipulation with error handling
 */
export function safeQuerySelector(selector, fallback = null) {
  try {
    return document.querySelector(selector) || fallback;
  } catch (error) {
    console.error('DOM query failed:', selector);
    return fallback;
  }
}
    /**
    * Format numbers with commas (e.g., 1234 → "1,234")
    */
  export function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  
  /**
   * Truncate text with ellipsis
   */
  export function truncateText(text, maxLength = 100) {
    if (typeof text !== 'string' || text.length <= 0) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
  
  /**
   * Placeholder for Rate Limiting check. Should integrate with a persistent store (e.g., Redis).
   * @param {string} endpoint - The API endpoint being called.
   * @returns {boolean} True if allowed, false otherwise.
   */
  export function checkRateLimit(endpoint) {
    // In a real application, this would check request counts against time windows.
    console.log(`[RATE LIMIT] Checking limit for ${endpoint}... Allowed.`);
    return true; // Always allow in mock/client-side implementation
  }
  
  /**
   * Placeholder for sanitizing input data to prevent XSS or injection attacks.
   * @param {string | object} data - The raw data (stringified JSON body).
   * @returns {string} Sanitized string representation of the data.
   */
  export function sanitizeInput(data) {
    if (typeof data === 'object' && data !== null) {
      // If it's an object, stringify and then sanitize the resulting string
      return JSON.stringify(data);
    }
    if (typeof data !== 'string') return String(data);
    // Basic HTML stripping for demonstration
    return data.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
                .replace(/onerror=["'][^"']*["']/gim, "");
  }
/**
 * Placeholder for Rate Limiting check. Should integrate with a persistent store (e.g., Redis).
 * @param {string} endpoint - The API endpoint being called.
 * @returns {boolean} True if allowed, false otherwise.
 */
export function checkRateLimit(endpoint) {
  // In a real application, this would check request counts against time windows.
  console.log(`[RATE LIMIT] Checking limit for ${endpoint}... Allowed.`);
  return true; // Always allow in mock/client-side implementation
}

/**
 * Placeholder for sanitizing input data to prevent XSS or injection attacks.
 * @param {string | object} data - The raw data (stringified JSON body).
 * @returns {string} Sanitized string representation of the data.
 */
export function sanitizeInput(data) {
  if (typeof data !== 'string') return String(data);
  // Basic HTML stripping for demonstration
  return data.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
              .replace(/onerror=["'][^"']*["']/gim, "");
}
