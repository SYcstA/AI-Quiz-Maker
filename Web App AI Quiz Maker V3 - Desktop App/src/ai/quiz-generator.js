/**
 * Unified Quiz Generator
 * 
 * Entry point for AI quiz generation.
 * Reads the active provider from settings and delegates to the correct provider.
 */

import { getActiveProviderConfig } from './settings-manager.js';
import { getProviderGenerator } from './provider-registry.js';

const QUIZ_GENERATION_TIMEOUT_MS = 60000; // 60 seconds max

/**
 * Generate a quiz using the active AI provider
 * @param {string} material - Markdown study material
 * @param {object} options - { difficulty, questionCount, model, language }
 * @returns {Promise<{ success: boolean, quiz?: object, error?: string }>}
 */
export async function generateQuiz(material, options = {}) {
  if (!material || material.trim().length < 50) {
    return { success: false, error: 'Study material must be at least 50 characters long.' };
  }

  // Truncate very long material to avoid token limits
  const MAX_CHARS = 15000;
  const truncatedMaterial = material.length > MAX_CHARS
    ? material.substring(0, MAX_CHARS) + '\n\n[Note: Material was truncated due to length]'
    : material;

  let providerConfig;
  try {
    providerConfig = getActiveProviderConfig();
  } catch (e) {
    return { success: false, error: `Settings error: ${e.message}` };
  }

  const generator = getProviderGenerator(providerConfig.providerId);

  // Create an abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), QUIZ_GENERATION_TIMEOUT_MS);

  try {
    const quizData = await generator(truncatedMaterial, {
      difficulty: options.difficulty || 'medium',
      questionCount: options.questionCount || 5,
      model: options.model || providerConfig.config.model,
      language: options.language || 'english',
    }, providerConfig.config);

    clearTimeout(timeoutId);

    return {
      success: true,
      quiz: quizData,
      provider: providerConfig.providerId,
    };
  } catch (e) {
    clearTimeout(timeoutId);

    if (e.name === 'AbortError') {
      return { success: false, error: 'Quiz generation timed out. The AI took too long to respond. Try fewer questions or a simpler model.' };
    }

    // Enhance error messages for common issues
    let userMessage = e.message;
    if (e.message.includes('401') || e.message.includes('Unauthorized') || e.message.includes('API key')) {
      userMessage = 'Invalid API key. Please check your settings and ensure the API key is correct.';
    } else if (e.message.includes('429') || e.message.includes('Too Many Requests') || e.message.includes('rate limit')) {
      userMessage = 'Rate limit exceeded. Please wait a moment before generating another quiz.';
    } else if (e.message.includes('quota') || e.message.includes('billing') || e.message.includes('insufficient')) {
      userMessage = 'API quota exceeded. Check your billing or try a different provider.';
    } else if (e.message.includes('fetch') || e.message.includes('NetworkError') || e.message.includes('Failed to fetch')) {
      userMessage = 'Cannot reach the AI server. Check your internet connection or local server settings.';
    }

    return {
      success: false,
      error: userMessage,
      rawError: e.message,
    };
  }
}

export default { generateQuiz };