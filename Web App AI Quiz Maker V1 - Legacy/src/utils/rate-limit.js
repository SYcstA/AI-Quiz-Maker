// Rate Limiting Utilities
// Implements both client-side (for UX) and server-side ready patterns

const RATE_LIMIT_KEY = 'rl:';

/**
 * Client-side rate limiting with proper cleanup
 */
export const createRateLimiter = ({ maxRequests, windowMs } = {}) => {
  const MAX = maxRequests || 10;
  const WINDOW = windowMs || (3 * 60 * 1000); // Default: 10 req / 3 min
  
  return {
    /**
     * Check if request is allowed and record it
     */
    checkAndRecord: () => {
      const userId = getCurrentUserId();
      const key = `${RATE_LIMIT_KEY}${userId}`;
      const now = Date.now();
      
      try {
        let timestamps = [];
        
        // Get existing timestamps
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            timestamps = JSON.parse(stored).filter(ts => now - ts < WINDOW);
          } catch {
            timestamps = [];
          }
        }
        
        // Check limit
        if (timestamps.length >= MAX) {
          const oldest = Math.min(...timestamps);
          const resetTime = oldest + WINDOW;
          return { allowed: false, retryAfter: resetTime - now };
        }
        
        // Record this request
        timestamps.push(now);
        localStorage.setItem(key, JSON.stringify(timestamps));
        
        return { allowed: true };
      } catch {
        // If storage fails, allow but log warning
        console.warn('Rate limiter storage failed');
        return { allowed: true };
      }
    },
    
    /**
     * Get remaining requests in current window
     */
    getRemaining: () => {
      const result = this.checkAndRecord();
      if (!result.allowed) return 0;
      
      const userId = getCurrentUserId();
      const key = `${RATE_LIMIT_KEY}${userId}`;
      const stored = localStorage.getItem(key);
      
      try {
        return (JSON.parse(stored || '[]').filter(ts => Date.now() - ts < WINDOW).length || 0);
      } catch {
        return MAX;
      }
    },
    
    /**
     * Reset rate limit (called on logout)
     */
    reset: () => {
      const userId = getCurrentUserId();
      if (!userId) return;
      
      try {
        localStorage.removeItem(`${RATE_LIMIT_KEY}${userId}`);
      } catch {}
    },
  };
};

/**
 * Get current user ID for rate limiting key
 */
export const getCurrentUserId = () => {
  // Prefer Google OAuth sub, fall back to session ID or anonymous
  try {
    if (window.google && window.google.accounts?.id?.getAccountInfo) {
      return window.google.accounts.id.getAccountInfo().then(info => info?.response?.sub).catch(() => null);
    }
  } catch {}
  
  // Fall back to session token or anonymous
  const session = sessionStorage.getItem('session_id');
  if (session) return session;
  
  // Generate anonymous ID if needed
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Server-side rate limiting headers to send back to client
 */
export const getRateLimitHeaders = (remaining, resetTime) => {
  return {
    'X-RateLimit-Limit': String(Math.ceil((Date.now() - resetTime) / WINDOW) * MAX),
    'X-RateLimit-Remaining': String(remaining || MAX),
    'X-RateLimit-Reset': String(resetTime / 1000), // Unix timestamp
  };
};