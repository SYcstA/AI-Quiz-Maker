// ============================================
// AI Quiz Maker - Main Application Entry Point
// ============================================
import './style.css'
import { initGoogleAuth } from './auth/google-auth.js'
import { initQuizApp } from './quiz/app.js'
import { initUIComponents, initializeComponents } from './ui/components.js'
import { createAPI } from './api/client.js'

/**
 * Initialize the entire application
 */
async function initializeApp() {
  console.log('🚀 Initializing AI Quiz Maker...')

  try {
    // Create API client instance
    const api = createAPI()

    // Initialize UI components and attach all necessary event listeners
    initUIComponents()
    initializeComponents()

    // Initialize Google Authentication
    await initGoogleAuth(api)

    // Initialize quiz application
    await initQuizApp(api)

    console.log('✅ Application initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize app:', error)
    showErrorMessage(error.message)
  }
}

/**
 * Show error message to user
 */
function showErrorMessage(message) {
  const statusArea = document.getElementById('statusArea')
  if (statusArea) {
    statusArea.classList.remove('hidden')
    statusArea.innerHTML = `
      <div class="text-center text-red-600 dark:text-red-400">
        <p>⚠️ ${message}</p>
        <button onclick="location.reload()" class="mt-2 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700">
          Reload Application
        </button>
      </div>
    `
  }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Starting AI Quiz Maker...')
  initializeApp()
})

export { initializeApp }