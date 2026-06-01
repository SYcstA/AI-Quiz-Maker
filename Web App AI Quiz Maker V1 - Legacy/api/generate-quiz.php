<?php
/**
 * AI Quiz Maker - Quiz Generation API
 * Secure endpoint for generating quizzes from study material
 */

// ============================================
// Security Headers & CORS Configuration
// ============================================

// Strict HTTP security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');

// CORS - Restrict to specific origin only
$allowedOrigin = getenv('CORS_ORIGIN') ?: 'https://quiz.soosvaldo.my.id';

// Only set CORS headers if an Origin header matches our allowed origin
if (!empty($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN'] === $allowedOrigin) {
    // Allow credentials for authenticated requests
    header('Access-Control-Allow-Credentials: true');
    header("Access-Control-Allow-Origin: $allowedOrigin");
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    // Vary header is required when using dynamic CORS headers (RFC 6454)
    header('Vary: Origin');
    header('Access-Control-Max-Age: 3600');
}

// Handle preflight OPTIONS requests BEFORE sending any other response
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    // Clear CORS headers for non-allowed methods
    if (!empty($allowedOrigin)) {
        header('Access-Control-Allow-Credentials: true');
        header("Access-Control-Allow-Origin: $allowedOrigin");
        header('Vary: Origin');
    }
    header('Allow: POST');
    http_response_code(405);
    echo json_encode([
        'error' => 'Method Not Allowed',
        'allowed_methods' => ['POST'],
        'message' => 'This endpoint only accepts POST requests'
    ]);
    exit();
}

// ============================================
// Input Validation & Sanitization
// ============================================

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !array_key_exists('materi', $input)) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Invalid request body or missing "materi".',
        'required_fields' => ['materi'],
        'received_fields' => array_keys($input ?? [])
    ]);
    exit();
}

$materi = trim($input['materi']);

// Additional validation: check for null/empty after trimming
if (empty($materi)) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Input material is empty or contains only whitespace.',
        'hint' => 'Please provide at least 50 characters of study material.'
    ]);
    exit();
}

// ============================================
// Authentication: Verify Google ID Token
// ============================================

$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

// Extract Bearer token with case-insensitive matching
if (!preg_match('/^Bearer\s+(.*)$/i', $authHeader, $m)) {
    http_response_code(401);
    echo json_encode([
        'error' => 'Missing or invalid Authorization header.',
        'required_format' => 'Authorization: Bearer <google_id_token>',
        'example' => 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...'
    ]);
    exit();
}

$idToken = trim($m[1]);

// Validate token format (basic length check)
if (strlen($idToken) < 100 || strlen($idToken) > 5000) {
    http_response_code(401);
    echo json_encode([
        'error' => 'Invalid ID Token format.',
        'details' => 'Token length must be between 100 and 5000 characters.'
    ]);
    exit();
}

// Include and load shared .env loader
require_once __DIR__ . '/load_env.php';
loadEnvFile();

$clientID = getenv('GOOGLE_CLIENT_ID');

// Final validation: ensure client ID is properly formatted
if (!$clientID || empty($clientID)) {
    http_response_code(500);
    echo json_encode([
        'error' => 'GOOGLE_CLIENT_ID is not configured.',
        'setup_instructions' => [
            '1. Add your Google Client ID to .env file',
            '2. Or set GOOGLE_CLIENT_ID environment variable on server',
            '3. Or add to config.ini under [secrets] section'
        ]
    ]);
    exit();
}

// ============================================
// API Call with Retry Logic & Enhanced Error Handling
// ============================================

/**
 * Make API call to Gemini for quiz generation with comprehensive error handling
 */
function makeApiCall($idToken, $materi) {
    // Use environment variable or throw exception if not configured (no fallback default)
    $geminiApiKey = getenv('GEMINI_API_KEY');
    
    if (!$geminiApiKey || empty(trim($geminiApiKey))) {
        throw new Exception("GEMINI_API_KEY is not configured. Please set the environment variable.");
    }
    
    // Sanitize API key to prevent log injection (preserve letters, numbers, underscores, hyphens, and dots)
    $sanitizedKey = preg_replace('/[^A-Za-z0-9_.-]/', '', $geminiApiKey);
    // Bersihin tanda kutip atau spasi yang nyangkut dari .env
    $modelName = trim(getenv('AI_MODEL'), "\"\' \t\n\r\0\x0B");

    // Kalau kosong, otomatis fallback ke kuli yang ada di list lu
    if (empty($modelName)) {
        $modelName = 'gemini-3-flash-preview'; 
    }

    $baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/{$modelName}:generateContent";
    
    // Build the prompt for quiz generation
    $prompt = "Generate a quiz based on this study material:

$materi

Provide the quiz in JSON format (no markdown) with the following structure:
{
  \"title\": \"Quiz Title\",
  \"questions\": [
    {
      \"question\": \"Question text here\",
      \"answerOptions\": [
        { \"text\": \"Option A\", \"isCorrect\": false, \"rationale\": \"Explanation why A is wrong\" },
        { \"text\": \"Option B\", \"isCorrect\": true, \"rationale\": \"Explanation why B is correct\" },
        { \"text\": \"Option C\", \"isCorrect\": false, \"rationale\": \"Explanation why C is wrong\" },
        { \"text\": \"Option D\", \"isCorrect\": false, \"rationale\": \"Explanation why D is wrong\" }
      ]
    }
  ]
}"
;

    // Build API request URL with parameters
    $url = $baseUrl . '?key=' . urlencode($sanitizedKey);
    
    // Prepare headers for the request (Gemini only needs API key via URL, not Bearer token)
    $headers = [
        'Content-Type: application/json',
        'User-Agent: AI-Quiz-Maker/1.0'
    ];

    // Initialize cURL session with error checking
    if (!$ch = curl_init($url)) {
        throw new Exception("Failed to initialize cURL session.");
    }
    
    // Configure cURL options
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode([
            'contents' => [
                ['parts' => [['text' => $prompt]]]
            ],
            'generationConfig' => [
                'response_mime_type' => 'application/json'
            ]
        ]),
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => true
    ]);

    // Execute request and get response
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    // Check for cURL errors
    if (curl_errno($ch) !== 0) {
        curl_close($ch);
        throw new Exception("cURL error: " . curl_error($ch));
    }
    
    // Close cURL session
    curl_close($ch);

    // Check for API errors
    if ($httpCode !== 200) {
        throw new Exception("API Error (HTTP {$httpCode}): " . $response);
    }

    // Parse and validate response
    $responseData = json_decode($response, true);
    
    if (!isset($responseData['candidates']) || !is_array($responseData['candidates'])) {
        throw new Exception("Invalid API response format.");
    }

    return $responseData['candidates'][0]['content']['parts'][0]['text'];
}

// Generate unique request ID for debugging
$requestId = bin2hex(random_bytes(8));

$maxRetries = 3;
$retryAfter = 1000; // Base delay in milliseconds

for ($attempt = 0; $attempt < $maxRetries; $attempt++) {
    try {
        // Attempt to generate the quiz using the Gemini API
        $quizRawText = makeApiCall($idToken, $materi);

        // Strip Markdown code block if present (Gemini sometimes wraps JSON in ```json ... ```)
        $cleanJson = trim($quizRawText);
        if (preg_match('/^```(?:json)?\s*([\s\S]+?)\s*```$/', $cleanJson, $m)) {
            $cleanJson = trim($m[1]);
        }

        // Parse the JSON string returned by Gemini into an array
        $quizData = json_decode($cleanJson, true);

        // Extract questions array from Gemini response
        // Gemini returns { title, questions: [...] } — frontend expects { questions: [...] }
        $questions = [];
        if (isset($quizData['questions']) && is_array($quizData['questions'])) {
            $questions = $quizData['questions'];
        } elseif (is_array($quizData)) {
            // Fallback: use the whole response if no 'questions' key
            $questions = $quizData;
        }

        if (!empty($questions)) {
            echo json_encode([
                'success' => true,
                'message' => 'Quiz generated successfully.',
                'questions' => $questions
            ]);
            exit();
        } else {
             // Handle API call returning non-array/empty data structure
             throw new Exception("API returned invalid or empty quiz data. Raw: " . substr($quizRawText, 0, 200));
        }

    } catch (Exception $e) {
        $errorMessage = $e->getMessage();
        
        // Log error with request ID for debugging (in production, send to logging service)
        error_log("[QuizMaker] Request {$requestId} - Attempt " . ($attempt + 1) . "/{$maxRetries}: " . $errorMessage);
        
        if ($attempt < $maxRetries - 1) {
            // Wait before retrying (convert milliseconds to microseconds for usleep)
            usleep($retryAfter * 1000); // usleep expects microseconds
            continue; // Go to next iteration
        } else {
            // Max retries reached, return failure with request ID for debugging
            http_response_code(503);
            echo json_encode([
                'error' => 'Service Unavailable',
                'message' => 'Failed to generate quiz after multiple attempts. Please try again later.',
                'details' => $errorMessage,
                'request_id' => $requestId
            ]);
            exit();
        }
    }
}

// If the loop finishes without returning (shouldn't happen if logic is correct, but good practice)
http_response_code(500);
echo json_encode([
    'error' => 'Internal Server Error',
    'message' => 'An unexpected error occurred during quiz generation.',
    'request_id' => $requestId
]);