/**
 * Gemini AI Provider
 * 
 * Direct browser-to-Gemini API calls (no PHP backend needed).
 * Uses Google's native API key authentication: ?key={apiKey} (NOT Bearer token).
 * Supports both bundled default key and user-provided custom keys.
 */

import { PROVIDER_DEFINITIONS, httpStatusToMessage } from '../settings-manager.js';

/**
 * Build the prompt for Gemini quiz generation
 */
function buildPrompt(material, options) {
  const { difficulty = 'medium', questionCount = 5, language = 'english' } = options;

  return `You are a quiz generation AI. Based on the following study material, create a quiz.

STUDY MATERIAL (Markdown format):
${material}

INSTRUCTIONS:
1. Generate exactly ${questionCount} multiple-choice questions based on the material.
2. Difficulty level: ${difficulty} (easy = recall, medium = comprehension, hard = application/analysis).
3. Each question MUST have exactly 4 answer options.
4. Exactly ONE answer per question must be marked as correct.
5. Include a brief rationale/explanation for each correct answer.
6. Output ONLY valid JSON — no markdown fences, no extra text.
7. Language: ${language}.

Response format:
{
  "questions": [
    {
      "questionNumber": 1,
      "question": "Question text here?",
      "answerOptions": [
        { "text": "Option A", "isCorrect": false, "rationale": "Why this is wrong" },
        { "text": "Option B", "isCorrect": true, "rationale": "Why this is correct" },
        { "text": "Option C", "isCorrect": false, "rationale": "Why this is wrong" },
        { "text": "Option D", "isCorrect": false, "rationale": "Why this is wrong" }
      ]
    }
  ],
  "metadata": {
    "difficulty": "${difficulty}",
    "questionCount": ${questionCount},
    "generatedAt": "${new Date().toISOString()}"
  }
}`;
}

/**
 * Generate a quiz using Google Gemini API
 * @param {string} material - Markdown study material
 * @param {object} options - { difficulty, questionCount, model }
 * @param {object} providerConfig - { apiKey, endpoint, model }
 * @returns {Promise<object>} Quiz data
 */
export async function generateQuiz(material, options = {}, providerConfig) {
  const model = options.model || providerConfig.model || 'gemini-3-flash-preview';
  const apiKey = providerConfig.apiKey;
  const endpoint = (providerConfig.endpoint || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/+$/, '');

  if (!apiKey) {
    throw new Error('Gemini API key is missing. Use the default key or provide your own in Settings.');
  }

  const prompt = buildPrompt(material, options);

  // Correct Google Gemini API format: /v1beta/models/{model}:generateContent?key={apiKey}
  // Native API key auth via query parameter, NOT Bearer token
  const response = await fetch(
    `${endpoint}/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          response_mime_type: 'application/json',
        },
      }),
    }
  );

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    // Use human-readable error message from httpStatusToMessage, fall back to API error body
    const readableMsg = httpStatusToMessage(response.status, 'gemini');
    const apiMsg = errBody?.error?.message;
    throw new Error(readableMsg + (apiMsg ? ` (${apiMsg})` : ''));
  }

  const data = await response.json();

  // Extract the raw text from the response
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('The AI returned an empty response. The model may have been blocked or the prompt was rejected.');
  }

  // Strip any markdown code fences that Gemini might include
  let cleanJson = rawText;
  const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleanJson = fenceMatch[1];
  }

  // Parse the JSON
  let quizData;
  try {
    quizData = JSON.parse(cleanJson.trim());
  } catch (e) {
    throw new Error(`Failed to parse AI response as JSON: ${e.message}`);
  }

  // Validate structure
  if (!quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
    throw new Error('AI response has no questions. Try with different material or settings.');
  }

  // Ensure each question has exactly the fields we need
  quizData.questions = quizData.questions
    .filter(q => q.question && Array.isArray(q.answerOptions) && q.answerOptions.length >= 2)
    .map((q, i) => ({
      questionNumber: i + 1,
      question: q.question,
      answerOptions: q.answerOptions.slice(0, 4).map(o => ({
        text: o.text || 'Option',
        isCorrect: !!o.isCorrect,
        rationale: o.rationale || '',
      })),
    }));

  if (quizData.questions.length === 0) {
    throw new Error('No valid questions could be extracted from the response.');
  }

  return {
    questions: quizData.questions,
    metadata: {
      difficulty: options.difficulty || 'medium',
      questionCount: quizData.questions.length,
      generatedAt: new Date().toISOString(),
      provider: 'gemini',
      model,
    },
  };
}

export default { generateQuiz };