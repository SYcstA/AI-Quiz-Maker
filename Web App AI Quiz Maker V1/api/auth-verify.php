<?php
/**
AI Quiz Maker - Auth Verification API
 * Validates user's Google ID token and returns profile information
 */

// ============================================
// SECURITY: Strict Mode & Error Handling
// ============================================

// Enable strict error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', '0'); // Don't show errors to users

// Set maximum execution time and memory limit
set_time_limit(300); // 5 minutes for large file processing
ini_set('memory_limit', '256M');

// ============================================
// SECURITY: Strict HTTP Headers & CORS Configuration
// ============================================

// Set strict HTTP security headers
header('X-Content-Type-Options: nosniff'); // Prevent MIME type sniffing
header('X-Frame-Options: DENY'); // Prevent clickjacking
header('X-XSS-Protection: 1; mode=block'); // Enable XSS filter
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: geolocation=(), microphone=(), camera=()'); // Restrict browser features

// CORS - Restrict to specific origin (replace with your domain)
$allowedOrigin = getenv('CORS_ORIGIN') ?: 'https://quiz.soosvaldo.my.id';
header("Access-Control-Allow-Origin: $allowedOrigin");
header('Access-Control-Allow-Methods: GET, POST, OPTIONS'); // Allow POST for file uploads
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token, X-Requested-With');

// Pre-flight cache for 1 hour
header('Access-Control-Max-Age: 3600');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204); // No content for pre-flight
    exit();
}

// ============================================
// AUTH VERIFICATION: Validate Google ID Token
// ============================================

/**
 * Verify Google ID token using the public JWT verification endpoint
 */
function verifyGoogleIdToken($idToken, $clientID) {
    // Build verification URL
    $verifyUrl = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($idToken);
    
    // Initialize cURL session
    $ch = curl_init($verifyUrl);
    
    // Configure cURL options for token info endpoint
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'User-Agent: AI-Quiz-Maker/1.0'
        ],
        CURLOPT_TIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => true
    ]);
    
    // Execute request
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    // Check for cURL errors BEFORE closing
    $curlError = curl_error($ch);
    $curlErrno = curl_errno($ch);
    curl_close($ch);
    
    if ($curlErrno !== 0) {
        throw new Exception("cURL error during token verification: " . $curlError);
    }
    
    // Parse response
    $tokenInfo = json_decode($response, true);
    
    // Check for errors
    if ($httpCode !== 200 || !isset($tokenInfo['email'])) {
        throw new Exception("Token verification failed. HTTP Code: {$httpCode}");
    }
    
    return $tokenInfo;
}

/**
 * Get user profile from verified token info
 */
function getUserProfile($tokenInfo) {
    return [
        'user_id' => $tokenInfo['sub'] ?? null,
        'email' => $tokenInfo['email'] ?? null,
        'name' => $tokenInfo['name'] ?? null,
        'picture' => $tokenInfo['picture'] ?? null,
        'verified_email' => isset($tokenInfo['email_verified']) ? (bool)$tokenInfo['email_verified'] : false
    ];
}

// ============================================
// Main Application Logic
// ============================================

// Extract Bearer token from Authorization header
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

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
    http_response_code(400);
    echo json_encode([
        'error' => 'Invalid ID Token format.',
        'details' => 'Token length must be between 100 and 5000 characters.'
    ]);
    exit();
}

// Get client ID from environment or config file
$clientID = getenv('GOOGLE_CLIENT_ID');

if (!$clientID) {
    $configPath = __DIR__ . '/../config.ini';
    if (file_exists($configPath)) {
        try {
            $iniConfig = parse_ini_file($configPath, true);
            if (isset($iniConfig['secrets']['GOOGLE_CLIENT_ID'])) {
                $clientID = $iniConfig['secrets']['GOOGLE_CLIENT_ID'];
            }
        } catch (Exception $e) {
            // Silently fail to load config.ini
        }
    }
}

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

// Generate unique request ID for debugging
$requestId = bin2hex(random_bytes(8));

try {
    // Verify the token with Google's verification endpoint
    $tokenInfo = verifyGoogleIdToken($idToken, $clientID);
    
    // Get user profile from verified token
    $userProfile = getUserProfile($tokenInfo);
    
    // Return successful response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Token verified successfully.',
        'data' => [
            'profile' => $userProfile,
            'client_id' => $clientID,
            'verified_at' => date('c')
        ],
        'request_id' => $requestId
    ]);
    
} catch (Exception $e) {
    // Log error with request ID for debugging
    $logMessage = "[AuthVerify] Request {$requestId}: Token verification failed - " . $e->getMessage();
    error_log($logMessage);
    
    http_response_code(401);
    echo json_encode([
        'error' => 'Token Verification Failed',
        'message' => 'The provided Google ID token is invalid or has expired.',
        'details' => $e->getMessage(),
        'request_id' => $requestId
    ]);
}

exit();
?>