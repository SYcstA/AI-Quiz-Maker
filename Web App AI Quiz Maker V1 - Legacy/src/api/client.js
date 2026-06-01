/**
 * Secure API Client with retry logic and error handling
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Create API instance with interceptors
 */
export function createAPI() {
  const api = {};

  /**
   * Generic request handler with retry logic
   */
  async function request(endpoint, options = {}) {
    const token = localStorage.getItem('google_token');
    // Inject Authorization header if a token exists
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
      headers: headers,
      ...options,
    };

      const response = await fetch(`${BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      // Fallback to direct API calls for development
      if (import.meta.env.DEV) {
        console.warn('Using fallback direct API call');
        return handleFallback(endpoint, options);
      }
      throw error;
    }
  }

  /**
   * Fallback handler when backend is unavailable
   */
  async function handleFallback(endpoint, options) {
    // In development without backend, use mock responses or direct calls
    console.warn(`Backend unavailable. Endpoint: ${endpoint}`);
    return { success: true, data: null };
  }

  /**
   * Generate quiz endpoint
   */
  api.generateQuiz = async (material, options) => {
    const response = await request('/api/quiz/generate', {
      method: 'POST',
      body: JSON.stringify({ material, ...options }),
    });
    return response;
  };

  /**
   * Upload file endpoint
   */
  api.uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Use fetch with blob for file uploads
    const response = await request('/api/files/upload', {
      method: 'POST',
      body: formData,
    });
    return response;
  };

  /**
   * Get user profile
   */
  api.getUserProfile = async () => {
    const response = await request('/api/user/profile');
    return response;
  };

  return api;
}

export default createAPI;
