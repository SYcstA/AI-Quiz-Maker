/**
 * Environment Check Utility
 * 
 * Detects whether the app is running in Web Browser or Electron (Desktop) mode.
 * In web mode, Google auth is required and Local AI is hidden.
 * In desktop mode, no auth, no Default AI, Local AI is available.
 * 
 * Environment variable: VITE_APP_MODE = 'web' | 'desktop'
 * Default: 'web'
 */

/**
 * Get the current app mode
 * @returns {'web' | 'desktop'}
 */
export function getAppMode() {
  const mode = import.meta.env.VITE_APP_MODE || 'web';
  return mode === 'desktop' ? 'desktop' : 'web';
}

/**
 * Check if running in web browser mode
 * @returns {boolean}
 */
export function isWebMode() {
  return getAppMode() === 'web';
}

/**
 * Check if running in desktop (Electron) mode
 * @returns {boolean}
 */
export function isDesktopMode() {
  return getAppMode() === 'desktop';
}

export default {
  getAppMode,
  isWebMode,
  isDesktopMode,
};