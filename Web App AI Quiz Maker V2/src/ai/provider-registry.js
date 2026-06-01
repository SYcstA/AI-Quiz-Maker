/**
 * AI Provider Registry
 * 
 * Maps provider IDs to their implementation modules.
 * Centralized lookup for the quiz generator.
 */

import { generateQuiz as geminiGenerate } from './providers/gemini.js';
import { generateQuiz as openaiGenerate } from './providers/openai.js';
import { generateQuiz as localGenerate } from './providers/local.js';

/**
 * Registry mapping provider IDs to their generate function
 */
const PROVIDER_MAP = {
  default: geminiGenerate,   // Default Gemini (bundled key)
  gemini: geminiGenerate,    // Custom Gemini key
  openai: openaiGenerate,    // OpenAI / ChatGPT
  anthropic: openaiGenerate, // Anthropic Claude (uses OpenAI-compatible wrapper)
  local: localGenerate,      // Local AI (LM Studio, Ollama)
};

/**
 * Get the generate function for a provider
 * @param {string} providerId
 * @returns {Function}
 */
export function getProviderGenerator(providerId) {
  const generator = PROVIDER_MAP[providerId];
  if (!generator) {
    throw new Error(`Unknown AI provider: ${providerId}. Available: ${Object.keys(PROVIDER_MAP).join(', ')}`);
  }
  return generator;
}

/**
 * List all registered provider IDs
 * @returns {string[]}
 */
export function listProviders() {
  return Object.keys(PROVIDER_MAP);
}

export default {
  getProviderGenerator,
  listProviders,
};