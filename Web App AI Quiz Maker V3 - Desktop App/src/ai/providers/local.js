/**
 * Local AI Provider
 * 
 * Connects to LM Studio, Ollama, or any OpenAI-compatible local server.
 * Uses strict OpenAI-compatible /v1/chat/completions format.
 * No API key required since it's running on localhost.
 */

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
2. Difficulty level: ${difficulty}.
3. Each question MUST have exactly 4 answer options.
4. Exactly ONE answer per question must be marked as correct.
5. Include a brief rationale for each correct answer.
6. Output ONLY valid JSON — no markdown fences, no extra text.
7. Language: ${language}.

Response format:
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
 * Generate a quiz using a local LLM server (strictly OpenAI-compatible)
 * @param {string} material - Markdown study material
 * @param {object} options - { difficulty, questionCount, model }
 * @param {object} providerConfig - { endpoint, model }
 * @returns {Promise<object>} Quiz data
 */
export async function generateQuiz(material, options = {}, providerConfig) {
  const model = options.model || providerConfig.model || 'local-model';
  const endpoint = (providerConfig.endpoint || 'http://localhost:1234/v1').replace(/\/+$/, '');

  // Strict OpenAI-compatible payload: messages array with role/content
  const prompt = buildPrompt(material, options);

  const payload = {
    model: model,
    messages: [
      { role: 'system', content: 'You are a quiz generation AI that outputs only valid JSON. Never include markdown code fences or any text outside the JSON object.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 8192,
  };

  console.log('Sending Payload:', JSON.stringify(payload, null, 2));

  const response = await fetch(`${endpoint}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error');
    console.error('Local AI Error:', response.status, errText);
    throw new Error(`Local AI server error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawContent = data?.choices?.[0]?.message?.content;

  if (!rawContent) {
    throw new Error('Local AI returned an empty response. Check your model settings.');
  }

  // Strip markdown code fences
  let cleanJson = rawContent;
  const fenceMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) cleanJson = fenceMatch[1];

  let quizData;
  try {
    quizData = JSON.parse(cleanJson.trim());
  } catch (e) {
    throw new Error(`Failed to parse Local AI response as JSON: ${e.message}`);
  }

  // Handle nested responses
  if (!quizData.questions && Array.isArray(quizData)) {
    quizData = { questions: quizData };
  } else if (!quizData.questions) {
    const arrayKey = Object.keys(quizData).find(k => Array.isArray(quizData[k]) && quizData[k].length > 0 && quizData[k][0].question);
    if (arrayKey) quizData = { questions: quizData[arrayKey] };
    else throw new Error('Response does not contain a valid questions array.');
  }

  if (!Array.isArray(quizData.questions) || quizData.questions.length === 0) {
    throw new Error('Local AI response has no questions.');
  }

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
      provider: 'local',
      model,
    },
  };
}

export default { generateQuiz };