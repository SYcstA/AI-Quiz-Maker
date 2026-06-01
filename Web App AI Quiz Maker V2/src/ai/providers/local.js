/**
 * Local AI Provider
 * 
 * Connects to LM Studio, Ollama, or any OpenAI-compatible local server.
 * Reuses the OpenAI-compatible chat completions format.
 * No API key required since it's running on localhost.
 */

import { generateQuiz as openAIGenerateQuiz } from './openai.js';

/**
 * Generate a quiz using a local LLM server
 * @param {string} material - Markdown study material
 * @param {object} options - { difficulty, questionCount, model }
 * @param {object} providerConfig - { endpoint, model }
 * @returns {Promise<object>} Quiz data
 */
export async function generateQuiz(material, options = {}, providerConfig) {
  // The local provider uses the OpenAI-compatible format without requiring an API key
  const localConfig = {
    ...providerConfig,
    apiKey: providerConfig.apiKey || '',  // Local servers don't need a key
    model: options.model || providerConfig.model || 'local-model',
  };

  // If no specific model is set, don't force one — let the local server use its default
  if (!localConfig.model && providerConfig.endpoint) {
    // Try to detect model from the local server
    try {
      const modelsRes = await fetch(`${providerConfig.endpoint.replace(/\/+$/, '')}/models`, {
        signal: AbortSignal.timeout(2000),
      });
      if (modelsRes.ok) {
        const modelsData = await modelsRes.json();
        const firstModel = modelsData?.data?.[0]?.id || modelsData?.[0]?.id;
        if (firstModel) {
          localConfig.model = firstModel;
        }
      }
    } catch {
      // If we can't detect, use a generic model name
      localConfig.model = 'local-model';
    }
  }

  // Delegate to the OpenAI provider (same chat completions format)
  return openAIGenerateQuiz(material, options, localConfig);
}

export default { generateQuiz };