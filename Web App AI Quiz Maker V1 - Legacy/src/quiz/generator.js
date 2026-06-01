/**
 * AI Quiz Generator Module
 * Handles quiz creation, validation, and rendering
 */

import { debounce } from '../utils/debounce.js';

/**
 * Quiz configuration defaults
 */
const DEFAULTS = {
  difficulty: 'medium', // easy, medium, hard
  numQuestions: 5,
  maxCharacters: 500,
};

/**
 * Parse and validate input material
 */
export function parseMaterial(material) {
  if (!material || typeof material !== 'string') {
    return { error: 'No valid material provided' };
  }

  // Clean and normalize text
  const cleaned = material
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .trim()
    .substring(0, DEFAULTS.maxCharacters); // Enforce limit

  return {
    original: material,
    cleaned,
    characterCount: cleaned.length,
    isValid: cleaned.length > 0 && cleaned.length <= DEFAULTS.maxCharacters,
  };
}

/**
 * Generate quiz questions (mock implementation)
 */
export function generateQuestions(material, options = {}) {
  const { difficulty = 'medium', numQuestions = 5 } = options;

  // In production, this would call the AI API
  console.log('Generating quiz with:', { material: material.substring(0, 100), difficulty, numQuestions });

  return {
    success: true,
    questions: generateMockQuestions(material, difficulty, numQuestions),
    metadata: {
      generatedAt: new Date().toISOString(),
      difficulty,
      numQuestions,
    },
  };
}

/**
 * Generate mock quiz questions (replace with real AI calls)
 */
function generateMockQuestions(material, difficulty, count) {
  const topics = ['Mathematics', 'Science', 'History', 'Literature'];
  
  return Array.from({ length: Math.min(count, 5) }, (_, i) => ({
    id: `q${i + 1}`,
    question: `Based on the material about ${topics[i % topics.length]}, what is a key concept?`,
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: i % 4,
    explanation: 'This would contain AI-generated explanation.',
    difficulty,
  }));
}

/**
 * Validate quiz before submission
 */
export function validateQuiz(quiz) {
  if (!quiz.questions || !Array.isArray(quiz.questions)) {
    return { valid: false, error: 'Invalid quiz structure' };
  }

  const requiredFields = ['id', 'question', 'options'];
  const invalidQuestions = quiz.questions.filter(q => 
    !requiredFields.every(field => q[field] !== undefined)
  );

  if (invalidQuestions.length > 0) {
    return { valid: false, error: `Found ${invalidQuestions.length} incomplete questions` };
  }

  return { valid: true };
}

/**
 * Render quiz to DOM
 */
export function renderQuiz(quiz) {
  const container = safeQuerySelector('#quizContainer');
  if (!container || !quiz.questions.length) return;

  // Clear existing content
  container.innerHTML = '';

  quiz.questions.forEach((q, index) => {
    const questionEl = createQuestionElement(q, index);
    container.appendChild(questionEl);
  });
}

/**
 * Create individual question element
 */
function createQuestionElement(question, index) {
  const el = document.createElement('div');
  el.className = 'quiz-question bg-gray-50 dark:bg-slate-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600';
  
  // Question text
  const qText = document.createElement('h3');
  qText.className = 'text-lg font-semibold mb-4';
  qText.textContent = `${index + 1}. ${question.question}`;
  el.appendChild(qText);

  // Options container
  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'space-y-2';

  question.options.forEach((option, optIndex) => {
    const label = document.createElement('label');
    label.className = 'flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition';
    
    // Radio input
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = `question-${index}`;
    radio.value = optIndex.toString();
    label.appendChild(radio);

    // Option text
    const span = document.createElement('span');
    span.className = 'flex-1';
    span.textContent = option;
    label.appendChild(span);

    optionsContainer.appendChild(label);
  });

  el.appendChild(optionsContainer);
  return el;
}

/**
 * Calculate quiz score
 */
export function calculateScore(quiz, answers) {
  if (!answers || !Array.isArray(answers)) return { score: 0, total: 0 };

  let correct = 0;
  answers.forEach((answer, index) => {
    const question = quiz.questions[index];
    if (question && answer.toString() === question.correctAnswer.toString()) {
      correct++;
    }
  });

  return { score: correct, total: quiz.questions.length };
}

export default { parseMaterial, generateQuestions, validateQuiz, renderQuiz, calculateScore };
