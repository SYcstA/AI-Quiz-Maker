/**
 * OpenAI-Compatible Provider
 * 
 * Works with OpenAI API, and any OpenAI-compatible local server
 * (LM Studio, Ollama, etc.) via the /v1/chat/completions endpoint.
 */

import { httpStatusToMessage } from '../settings-manager.js';

/**
 * Build the prompt for quiz generation
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

Response format (valid JSON only):
{
  "questions": [
    {
      "questionNumber": 1,
      "question": "Question text here?",
      "answerOptions": [
        { "text": "Option A", "isCorrect": false, "rationale": "..." },
        { "text": "Option B", "isCorrect": true, "rationale": "..." },
        { "text": "Option C", "isCorrect": false, "rationale": "..." },
        { "text": "Option D", "isCorrect": false, "rationale": "..." }
      ]
    }
  ]
}`;
}

/**
 * Generate a quiz using an OpenAI-compatible API
 * @param {string} material - Markdown study material
 * @param {object} options - { difficulty, questionCount, model }
 * @param {object} providerConfig - { apiKey, endpoint, model }
 * @returns {Promise<object>} Quiz data
 */
export async function generateQuiz(material, options = {}, providerConfig) {
  const model = options.model || providerConfig.model || 'gpt-4o-mini';
  const apiKey = providerConfig.apiKey;
  const endpoint = (providerConfig.endpoint || 'https://api.openai.com/v1').replace(/\/+$/, '');

  if (!apiKey && !endpoint.includes('localhost') && !endpoint.includes('127.0.0.1')) {
    throw new Error('API key is required for this provider. Add it in Settings.');
  }

  const prompt = buildPrompt(material, options);

  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(
    `${endpoint}/chat/completions`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a quiz generation AI that outputs only valid JSON. Never include markdown code fences or any text outside the JSON object.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 8192,
        response_format: { type: 'json_object' },
      }),
    }
  );

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const readableMsg = httpStatusToMessage(response.status, 'openai');
    const apiMsg = errBody?.error?.message;
    throw new Error(readableMsg + (apiMsg ? ` (${apiMsg})` : ''));
  }

  const data = await response.json();
  const rawContent = data?.choices?.[0]?.message?.content;

  if (!rawContent) {
    throw new Error('The API returned an empty response. The model may have been blocked.');
  }

  // Parse the JSON response
  let cleanJson = rawContent;
  const fenceMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleanJson = fenceMatch[1];
  }

  let quizData;
  try {
    quizData = JSON.parse(cleanJson.trim());
  } catch (e) {
    throw new Error(`Failed to parse AI response as JSON: ${e.message}`);
  }

  // Handle nested responses (some providers wrap it differently)
  if (quizData.questions) {
    // Standard format
  } else if (Array.isArray(quizData)) {
    quizData = { questions: quizData };
  } else {
    // Search for any array property that could be questions
    const arrayKey = Object.keys(quizData).find(k => Array.isArray(quizData[k]) && quizData[k].length > 0 && quizData[k][0].question);
    if (arrayKey) {
      quizData = { questions: quizData[arrayKey] };
    } else {
      throw new Error('Response does not contain a valid questions array.');
    }
  }

  // Validate and normalize questions
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
      provider: 'openai-compatible',
      model,
    },
  };
}

export default { generateQuiz };