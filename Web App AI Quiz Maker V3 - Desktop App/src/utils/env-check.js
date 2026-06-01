/**
 * Environment Check Utility
 * 
 * Simplified for Desktop-only app. Always returns 'desktop' mode.
 * No web browser mode, no Google auth, no Default AI.
 * User must provide their own API keys or use Local AI.
 */

export function getAppMode() {
  return 'desktop';
}

export function isWebMode() {
  return false;
}

export function isDesktopMode() {
  return true;
}

export default {
  getAppMode,
  isWebMode,
  isDesktopMode,
};