/**
 * AI Quiz Maker - Main Quiz Application Logic
 * Handles quiz generation, rendering, scoring, and user interactions
 */

import { parseMaterial, generateQuestions, validateQuiz, renderQuiz, calculateScore } from './generator.js'
import { createLoadingSpinner, showToast, createCharacterCounter, createDifficultySelector, createDropZone, createStatusArea } from '../ui/components.js'
import { checkAuth, signOut } from '../auth/google-auth.js'

// ============================================
// Application State
// ============================================
const AppState = {
  material: '',
  difficulty: 'medium',
  numQuestions: 5,
  quizData: null,
  isGenerating: false,
  userAnswers: [],
  score: 0,
}

// ============================================
// DOM Element Cache
// ============================================
const Elements = {
  materiInput: document.getElementById('materi'),
  charCount: document.getElementById('charCount'),
  difficultyGroup: document.getElementById('difficultyGroup'),
  jumlahSoal: document.getElementById('jumlahSoal'),
  generateButton: document.getElementById('generateButton'),
  resetButton: document.getElementById('resetButton'),
  quizContainer: document.getElementById('quizContainer'),
  scoreArea: document.getElementById('scoreArea'),
  scoreValue: document.getElementById('scoreValue'),
  scoreTotal: document.getElementById('scoreTotal'),
  copyResultsBtn: document.getElementById('copyResults'),
  backButton: document.getElementById('backButton'),
  regenerateButton: document.getElementById('regenerateButton'),
  resetButton2: document.getElementById('resetButton2'),
  inputScreen: document.getElementById('inputScreen'),
  quizScreen: document.getElementById('quizScreen'),
  statusArea: document.getElementById('statusArea'),
  loadingOverlay: document.getElementById('loadingOverlay'),
  loadingBar: document.getElementById('loadingBar'),
  loadingPercent: document.getElementById('loadingPercent'),
}

// ============================================
// Event Listeners Setup
// ============================================
function setupEventListeners() {
  // Material input with character counter
  if (Elements.materiInput) {
    Elements.materiInput.addEventListener('input', handleMaterialChange)
    Elements.materiInput.addEventListener('paste', () => setTimeout(() => handleMaterialChange(), 100))
  }

  // Difficulty selection
  if (Elements.difficultyGroup) {
    Elements.difficultyGroup.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => selectDifficulty(btn.id.replace('diff', '')))
    })
  }

  // Question number input validation
  if (Elements.jumlahSoal) {
    Elements.jumlahSoal.addEventListener('input', validateQuestionCount)
    Elements.jumlahSoal.addEventListener('change', validateQuestionCount)
  }

  // Generate quiz button
  if (Elements.generateButton) {
    Elements.generateButton.addEventListener('click', handleGenerateQuiz)
  }

  // Reset functionality
  if (Elements.resetButton) {
    Elements.resetButton.addEventListener('click', resetAll)
  }

  // Quiz screen controls
  if (Elements.backButton) {
    Elements.backButton.addEventListener('click', () => showInputScreen())
  }

  if (Elements.regenerateButton) {
    Elements.regenerateButton.addEventListener('click', openRegenerateModal)
  }

  if (Elements.resetButton2) {
    Elements.resetButton2.addEventListener('click', resetQuiz)
  }

  // Copy results button
  if (Elements.copyResultsBtn) {
    Elements.copyResultsBtn.addEventListener('click', copyResultsToClipboard)
  }

  // Tab switching between text and file input
  setupTabSwitching()
}

// ============================================
// Core Quiz Functions
// ============================================

/**
 * Handle material input changes
 */
function handleMaterialChange() {
  const value = Elements.materiInput?.value || ''
  
  if (!Elements.charCount) return

  // Parse and validate material
  const parsed = parseMaterial(value)
  AppState.material = parsed.cleaned

  // Update character counter with color coding
  if (parsed.isValid && parsed.characterCount >= 50) {
    Elements.charCount.className = 'text-green-600'
    Elements.charCount.textContent = `${parsed.remaining} / ${Elements.jumlahSoal?.value || 30}`
  } else if (parsed.characterCount < 50) {
    Elements.charCount.className = 'text-red-600 font-bold'
    Elements.charCount.textContent = `Need at least 50 characters (${parsed.remaining} remaining)`
  } else {
    Elements.charCount.className = 'text-yellow-600'
    Elements.charCount.textContent = `${parsed.remaining} / ${Elements.jumlahSoal?.value || 30}`
  }
}

/**
 * Select difficulty level
 */
function selectDifficulty(difficulty) {
  AppState.difficulty = difficulty
  
  // Update UI to show selected difficulty
  Elements.difficultyGroup.querySelectorAll('button').forEach(btn => {
    const btnId = btn.id.replace('diff', '')
    if (btnId === difficulty) {
      btn.classList.add('ring-2', 'ring-blue-500')
    } else {
      btn.classList.remove('ring-2', 'ring-blue-500')
    }
  })

  showToast(`Difficulty set to: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`)
}

/**
 * Validate question count input
 */
function validateQuestionCount() {
  const value = parseInt(Elements.jumlahSoal?.value || '5', 10)
  
  if (value < 1) {
    Elements.jumlahSoal.value = 1
    showToast('Minimum questions: 1', 'warning')
  } else if (value > 30) {
    Elements.jumlahSoal.value = 30
    showToast('Maximum questions: 30', 'warning')
  }
}

/**
 * Handle quiz generation request
 */
async function handleGenerateQuiz() {
  // Validate input before generating
  const validation = validateInput()
  if (!validation.valid) {
    showToast(validation.error, 'error')
    return
  }

  // Show loading state
  showLoading(true)

  try {
    // Call API to generate quiz
    const result = await Elements.generateButton?.dispatchEvent(new CustomEvent('generate:quiz', {
      detail: {
        material: AppState.material,
        difficulty: AppState.difficulty,
        numQuestions: parseInt(Elements.jumlahSoal?.value || '5', 10),
      }
    }))

    if (result.success) {
      // Render the generated quiz
      renderQuizResult(result.quiz)
      
      // Update state
      AppState.quizData = result.quiz
      AppState.userAnswers = []
      AppState.score = 0

      // Show success message
      showToast('✅ Quiz generated successfully!', 'success')
    } else {
      throw new Error(result.error || 'Failed to generate quiz')
    }
  } catch (error) {
    console.error('Quiz generation failed:', error)
    
    // Fallback: show mock quiz for development
    if (import.meta.env.DEV) {
      console.warn('Using fallback mock quiz in development mode')
      renderQuizResult(generateMockQuiz())
      showToast('⚠️ Using mock quiz (API unavailable)', 'warning')
    } else {
      throw error
    }
  } finally {
    showLoading(false)
  }
}

/**
 * Validate input before generation
 */
function validateInput() {
  const material = AppState.material || Elements.materiInput?.value || ''
  
  // Check minimum length
  if (material.length < 50) {
    return {
      valid: false,
      error: `Please provide at least 50 characters of study material (currently: ${material.length} characters)`
    }
  }

  // Check maximum length
  if (material.length > 10000) {
    return {
      valid: false,
      error: 'Study material is too long. Please keep it under 10,000 characters.'
    }
  }

  // Check for potentially malicious content
  const dangerousPatterns = [
    /<script\s/i,
    /javascript\s*:/i,
    /on\w+\s*=/i,
    /data:text/html/i,
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(material)) {
      return {
        valid: false,
        error: 'Study material contains disallowed content. Please remove any HTML or JavaScript code.'
      }
    }
  }

  return { valid: true }
}

/**
 * Render quiz result to DOM
 */
function renderQuizResult(quiz) {
  if (!Elements.quizContainer || !quiz.questions.length) return

  // Clear existing content
  Elements.quizContainer.innerHTML = ''

  // Create quiz header
  const header = document.createElement('div')
  header.className = 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-xl mb-6'
  header.innerHTML = `
    <h2 class="text-2xl font-bold mb-2">Your Quiz</h2>
    <p class="opacity-90">
      Difficulty: <span class="font-semibold">${quiz.metadata?.difficulty || 'medium'}</span> |
      Questions: <span class="font-semibold">${quiz.questions.length}</span>
    </p>
  `
  Elements.quizContainer.appendChild(header)

  // Render each question
  quiz.questions.forEach((question, index) => {
    const qEl = createQuestionElement(question, index + 1)
    Elements.quizContainer.appendChild(qEl)
  })

  // Show score area if quiz has been answered
  updateScoreDisplay()
}

/**
 * Create individual question element
 */
function createQuestionElement(question, number) {
  const el = document.createElement('div')
  el.className = 'quiz-question bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm'

  // Question text with number
  const qText = document.createElement('h3')
  qText.className = 'text-lg font-semibold mb-4 flex items-start gap-3'
  qText.innerHTML = `
    <span class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold">
      ${number}
    </span>
    <span>${question.question}</span>
  `
  el.appendChild(qText)

  // Options container
  const optionsContainer = document.createElement('div')
  optionsContainer.className = 'space-y-2'

  question.answerOptions.forEach((option, optIndex) => {
    const label = document.createElement('label')
    label.className = 'flex items-center space-x-3 p-4 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition border border-transparent hover:border-blue-200 dark:hover:border-blue-800'

    // Radio input for selection
    const radio = document.createElement('input')
    radio.type = 'radio'
    radio.name = `question-${number}`
    radio.value = optIndex.toString()
    radio.className = 'w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded'

    // Option text with letter label
    const span = document.createElement('span')
    span.className = 'flex-1'
    span.innerHTML = `
      <span class="font-semibold mr-2">${String.fromCharCode(65 + optIndex)}.</span>
      ${option.text}
    `

    // Add click handler for immediate feedback
    label.addEventListener('click', (event) => handleOptionClick(optIndex, question, event))

    label.appendChild(radio)
    label.appendChild(span)
    optionsContainer.appendChild(label)
  })

  el.appendChild(optionsContainer)
  return el
}

/**
 * Handle option selection with feedback
 */
function handleOptionClick(selectedIndex, question, event) {
  // Get the options container from the parent element
  const labelsContainer = event?.currentTarget?.closest('.space-y-2')
  if (!labelsContainer) return

  // Check if already answered
  const existingAnswer = AppState.userAnswers?.find(a => a.questionNumber === question.questionNumber)
  if (existingAnswer) return

  // Store answer
  AppState.userAnswers.push({
    questionNumber: question.questionNumber,
    selectedOption: selectedIndex,
    isCorrect: question.answerOptions[selectedIndex].isCorrect,
    rationale: question.answerOptions[selectedIndex].rationale,
  })

  // Show all correct answers and disable further selection
  const labels = labelsContainer.querySelectorAll('label')
  labels.forEach((label, index) => {
    const isCorrect = question.answerOptions[index].isCorrect
    label.style.pointerEvents = 'none'
    
    if (index === selectedIndex && !isCorrect) {
      label.classList.add('ring-2', 'ring-red-500', 'bg-red-50', 'dark:bg-red-900/30')
    }
    if (isCorrect) {
      label.classList.add('ring-2', 'ring-green-500', 'bg-green-50', 'dark:bg-green-900/30')
    }
  })

  // Update score display
  updateScoreDisplay()
}

/**
 * Update score display
 */
function updateScoreDisplay() {
  if (!Elements.scoreArea || !AppState.quizData) return

  const answered = AppState.userAnswers?.length || 0
  const correct = AppState.userAnswers.filter(a => a.isCorrect).length
  
  Elements.scoreArea.classList.remove('hidden')
  Elements.scoreValue.textContent = `${correct}/${answered}`
  Elements.scoreTotal.textContent = AppState.quizData.questions.length
}

/**
 * Copy results to clipboard
 */
function copyResultsToClipboard() {
  if (!AppState.quizData || !Elements.copyResultsBtn) return

  const quizText = generateQuizSummary()

  navigator.clipboard.writeText(quizText).then(() => {
    showToast('📋 Quiz results copied to clipboard!', 'success')
    Elements.copyResultsBtn.classList.add('hidden')
  }).catch(err => {
    console.error('Failed to copy:', err)
    showToast('Failed to copy results', 'error')
  })
}

/**
 * Generate quiz summary for clipboard
 */
function generateQuizSummary() {
  const correct = AppState.userAnswers.filter(a => a.isCorrect).length
  const total = AppState.quizData.questions.length
  
  return `
=== AI Quiz Maker Results ===
Difficulty: ${AppState.difficulty}
Questions Answered: ${total}
Score: ${correct}/${total} (${Math.round((correct/total)*100)}%)

Answers:
${AppState.userAnswers.map(a => 
  `${a.questionNumber}. Q${a.questionNumber}: "${getQuestionText(a.questionNumber)}"
   Your answer: Option ${String.fromCharCode(65 + a.selectedOption)}
   Correct: ${a.isCorrect ? '✅' : '❌'}
`).join('\n')}

Generated on: ${new Date().toLocaleString()}
  `.trim()
}

function getQuestionText(questionNumber) {
  return AppState.quizData.questions.find(q => q.questionNumber === questionNumber)?.question || `Question ${questionNumber}`
}

/**
 * Show/hide input vs quiz screens
 */
function showInputScreen() {
  Elements.inputScreen?.classList.remove('hidden')
  Elements.quizScreen?.classList.add('hidden')
  AppState.quizData = null
  AppState.userAnswers = []
  updateScoreDisplay()
}

function showQuizScreen() {
  Elements.inputScreen?.classList.add('hidden')
  Elements.quizScreen?.classList.remove('hidden')
}

/**
 * Reset all quiz state
 */
function resetAll() {
  // Clear material input
  if (Elements.materiInput) {
    Elements.materiInput.value = ''
    AppState.material = ''
  }

  // Reset difficulty to medium
  selectDifficulty('medium')

  // Reset question count
  if (Elements.jumlahSoal) {
    Elements.jumlahSoal.value = '5'
  }

  // Clear quiz container
  if (Elements.quizContainer) {
    Elements.quizContainer.innerHTML = ''
  }

  // Hide score area
  if (Elements.scoreArea) {
    Elements.scoreArea.classList.add('hidden')
  }

  // Show input screen
  showInputScreen()

  showToast('🔄 All settings reset to defaults', 'info')
}

/**
 * Reset current quiz only
 */
function resetQuiz() {
  AppState.quizData = null
  AppState.userAnswers = []
  AppState.score = 0
  updateScoreDisplay()
  Elements.quizContainer.innerHTML = ''
  
  if (Elements.copyResultsBtn) {
    Elements.copyResultsBtn.classList.add('hidden')
  }

  showToast('🔄 Quiz reset - start over', 'info')
}

/**
 * Show loading state with progress
 */
function showLoading(show, message = 'Processing...') {
  if (!Elements.loadingOverlay) return

  if (show) {
    Elements.loadingOverlay.classList.remove('hidden')
    Elements.loadingBar.style.width = '0%'
    Elements.loadingPercent.textContent = '0%'
  } else {
    Elements.loadingOverlay.classList.add('hidden')
  }
}

/**
 * Simulate progress bar animation (for better UX)
 */
function animateLoadingProgress() {
  let width = 0
  const interval = setInterval(() => {
    if (!Elements.loadingBar) return clearInterval(interval)

    width += Math.random() * 15
    if (width >= 100) {
      width = 100
      clearInterval(interval)
    }

    Elements.loadingBar.style.width = `${width}%`
    Elements.loadingPercent.textContent = `${Math.min(100, Math.floor(width))}%`
  }, 200)
}

/**
 * Generate mock quiz for development fallback
 */
function generateMockQuiz() {
  return {
    questions: [
      {
        questionNumber: 1,
        question: 'What is the capital of France?',
        answerOptions: [
          { text: 'London', isCorrect: false, rationale: 'London is the capital of United Kingdom.' },
          { text: 'Paris', isCorrect: true, rationale: 'Paris is the capital and most populous city of France.' },
          { text: 'Berlin', isCorrect: false, rationale: 'Berlin is the capital of Germany.' },
          { text: 'Madrid', isCorrect: false, rationale: 'Madrid is the capital of Spain.' },
        ],
      },
      {
        questionNumber: 2,
        question: 'Which planet is known as the Red Planet?',
        answerOptions: [
          { text: 'Venus', isCorrect: false, rationale: 'Venus appears bright yellow-white from Earth.' },
          { text: 'Mars', isCorrect: true, rationale: 'Mars has a reddish appearance due to iron oxide on its surface.' },
          { text: 'Jupiter', isCorrect: false, rationale: 'Jupiter is the largest planet with a Great Red Spot storm.' },
          { text: 'Saturn', isCorrect: false, rationale: 'Saturn is famous for its prominent ring system.' },
        ],
      },
    ],
    metadata: {
      difficulty: 'easy',
      generatedAt: new Date().toISOString(),
    },
  }
}

// ============================================
// Export Application Interface
// ============================================
export const QuizApp = {
  state: AppState,
  
  // Public methods for external use
  generateQuiz: handleGenerateQuiz,
  reset: resetAll,
  getState: () => ({ ...AppState }),
  setState: (partial) => Object.assign(AppState, partial),
}

export default QuizApp