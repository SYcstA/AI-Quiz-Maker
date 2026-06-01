/**
 * Google Authentication Module
 * Handles OAuth 2.0 flow with Google Identity Services
 */

import { safeQuerySelector } from '../utils/debounce.js';

/**
 * Initialize Google Sign-In button
 * @param {Object} api - API client instance for token verification
 */
export function initGoogleAuth(api = null) {
  const googleBtn = safeQuerySelector('#googleSignInBtn');
  
  if (!googleBtn) return;

  // Configure Google Identity Services
  window.google.accounts.id.initialize({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '777857705349-536tuaj5iadns0r1h01kkpu9pdausinn.apps.googleusercontent.com',
    callback: handleGoogleResponse,
    auto_select: false,
  });

  // Render button
  window.google.accounts.id.renderButton(
    googleBtn,
    { theme: 'outline',
      size: 'large',
      width: '250',
      text: 'signin_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      locale: 'en'
    }
  );

  // Request consent screen
  window.google.accounts.id.prompt((notification) => {
    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
      console.log('Google Sign-In prompt not displayed');
    }
  });
}

/**
 * Handle Google OAuth response
 */
function handleGoogleResponse(response) {
  const { credential, error } = response;

  if (error) {
    console.error('Google Auth Error:', error);
    return;
  }

  // Store token securely with expiration tracking
  localStorage.setItem('google_token', credential);
  
  // If API client is available, verify the token server-side
  if (api && credential) {
    // Use the API client's request method for secure server-side token validation
    api.request('/auth/verify-token', {
      method: 'POST',
      body: JSON.stringify({ idToken: credential }),
    })
    .then(tokenInfo => {
      if (tokenInfo && tokenInfo.valid) {
        console.log('✅ Token verified successfully');
      } else {
        console.warn('⚠️ Server verification failed, proceeding with local token');
      }
    })
    .catch(err => {
      console.error('Token verification error:', err);
    });
  }
  
  // Update UI to show logged-in state
  updateAuthUI(true, response.email);
  
  // Dispatch custom event for other modules
  window.dispatchEvent(new CustomEvent('auth:logged_in', {
    detail: { email: response.email }
  }));
}

/**
 * Sign out user
 */
export function signOut() {
  localStorage.removeItem('google_token');
  
  // Clear Google ID state
  window.google.accounts.id.disableAutoSelect();
  
  // Update UI
  updateAuthUI(false);
  
  // Dispatch event
  window.dispatchEvent(new CustomEvent('auth:logged_out'));
}

/**
 * Check if user is authenticated
 */
export function checkAuth() {
    const token = localStorage.getItem('google_token');

    if (!token) return false;

    try {
        const parts = token.split('.');
        if (parts.length !== 3) throw new Error('Invalid JWT format');
        
        // The payload is the second part of the JWT
        const payloadBase64 = parts[1];
        const decoded = JSON.parse(atob(payloadBase64));
        const now = Math.floor(Date.now() / 1000);

        // Check if token has an expiration time (exp claim) and if it's passed
        if (decoded.exp && decoded.exp < now) {
            console.warn('Google Token: Client-side check detected expired token.');
            return false; // Token is expired
        }
        
        // Optional: Check for a refresh token mechanism here if available
        // For now, we assume validity if not explicitly expired client-side.
        return true;

    } catch (e) {
        console.error('Error validating Google token:', e);
        return false; // Treat any parsing or validation error as invalid
    }
}

/**
 * Update authentication UI state
 */
function updateAuthUI(isLoggedIn, email = null) {
  const authArea = safeQuerySelector('#authArea');
  const userEmail = safeQuerySelector('#userEmail');
  const logoutBtn = safeQuerySelector('#logoutBtn');
  
  // Add error handling in case elements don't exist
  if (!authArea) return;
  
  if (!authArea) return;

  if (isLoggedIn && email) {
    authArea.classList.remove('hidden');
    userEmail.textContent = `Signed in as ${email}`;
    userEmail.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');
  } else {
    authArea.classList.add('hidden');
    userEmail.classList.add('hidden');
    logoutBtn.classList.add('hidden');
  }
}

/**
 * Handle logout button click
 */
safeQuerySelector('#logoutBtn', null)?.addEventListener('click', (e) => {
  e.preventDefault();
  
  // Clear any pending API requests to avoid errors
  window.removeEventListener('auth:logged_out', handleLogoutEvent);
  signOut();
});

/**
 * Handle logout event when token is cleared
 */
function handleLogoutEvent(event) {
  const authArea = safeQuerySelector('#authArea');
  if (authArea) {
    // Clear any cached data that might cause issues on next login
    localStorage.removeItem('quiz_session_data');
  }
}

export default { initGoogleSignIn, checkAuth, signOut };
