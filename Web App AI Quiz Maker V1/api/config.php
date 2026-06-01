<?php
/**
 * AI Quiz Maker - Secure Configuration API
 * Returns Google Client ID for OAuth initialization with full security hardening
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
// CSRF Token Generation & Validation
// ============================================

/**
 * Generate a cryptographically secure CSRF token
 */
function generateCSRFToken() {
    return bin2hex(random_bytes(32)); // 64-character hex string
}

/**
 * Validate CSRF token from request
 */
function validateCSRFToken(string $requestToken) {
    if (empty($_SESSION['csrf_token'])) {
        return false; // No token stored yet
    }
    
    // Use constant-time comparison to prevent timing attacks
    return hash_equals($_SESSION['csrf_token'], $requestToken);
}

/**
 * Initialize CSRF token for this session
 */
function initCSRFToken() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = generateCSRFToken();
    }
}

// ============================================
// Server-Side Rate Limiting
// ============================================

/**
 * Check if request is within rate limit
 */
function checkRateLimit($userId = null, $maxRequests = 10, $windowSeconds = 180) {
    global $rate_limit_key;
    
    // Generate user-specific key (anonymous if no userId)
    $key = $rate_limit_key . ($userId ?: 'anonymous_' . md5($_SERVER['REMOTE_ADDR'] . time()));
    
    // Get Redis connection or use file-based storage as fallback
    $storage = getRateLimitStorage();
    
    // Clean old entries outside window
    $now = time();
    if ($storage) {
        $storage->zRemRangeByScore($key, 0, $now - $windowSeconds);
    }
    
    // Count requests in current window
    $count = 0;
    if ($storage) {
        $count = $storage->zCount($key, $now - $windowSeconds, $now);
    } else {
        // Fallback: file-based rate limiting (less efficient)
        $file = RATE_LIMIT_FILE . $key . '.json';
        if (file_exists($file)) {
            $timestamps = json_decode(file_get_contents($file), true) ?: [];
            $count = count(array_filter($timestamps, fn($ts) => $now - $ts < $windowSeconds));
        }
    }
    
    // Check if limit exceeded
    if ($count >= $maxRequests) {
        return [
            'allowed' => false,
            'retry_after' => max(1, $windowSeconds - ($now % $windowSeconds)),
            'remaining' => 0
        ];
    }
    
    // Record this request
    if ($storage) {
        $storage->zAdd($key, $now);
    } else {
        // Fallback: file-based recording
        $file = RATE_LIMIT_FILE . $key . '.json';
        $timestamps = json_decode(file_exists($file) ? file_get_contents($file) : '[]', true) ?: [];
        $timestamps[] = $now;
        sort($timestamps);
        // Keep only recent timestamps
        $timestamps = array_slice($timestamps, 0, 1000); // Limit to prevent bloat
        file_put_contents($file, json_encode($timestamps));
    }
    
    return [
        'allowed' => true,
        'retry_after' => 0,
        'remaining' => max(0, $maxRequests - $count - 1)
    ];
}

/**
 * Get rate limit storage (Redis or file-based fallback)
 */
function getRateLimitStorage() {
    // Check for Redis extension and environment variable first
    if (extension_loaded('redis') && getenv('REDIS_HOST')) {
        $host = getenv('REDIS_HOST');
        $port = getenv('REDIS_PORT') ?: 6379;
        $password = getenv('REDIS_PASSWORD');

        if (!class_exists('Redis')) {
            return null; // Redis extension not available
        }
        if (!extension_loaded('redis')) {
            return null; // Redis extension not available
        }
        $redis = new Redis();
        try {
            // Attempt connection with a reasonable timeout
            if ($redis->connect($host, $port, $timeout = 1)) {
                if ($password) {
                    // If password is set, attempt authentication
                    if (!$redis->auth($password)) {
                        throw new Exception("Redis Authentication Failed.");
                    }
                }
                return $redis; // Connection successful and authorized
            } else {
                error_log("Redis connection failed: Could not physically connect to {$host}:{$port}");
                return null;
            }
        } catch (Exception $e) {
             // Log any exception during the attempt
            error_log("Redis connection critical error in getRateLimitStorage(): " . $e->getMessage());
            return null;
        }
    }

    // Fallback: no storage available or failed to connect/misconfigured environment
    return null;
}

/**
 * Get rate limit file path
 */
define('RATE_LIMIT_FILE', sys_get_temp_dir() . '/quizmaker_rate_limit/');

// ============================================
// Secure Session Configuration
// ============================================

/**
 * Configure secure session settings
 */
function configureSecureSessions() {
    // Enable HttpOnly cookies (prevents JavaScript access)
    ini_set('session.cookie_httponly', '1');
    
    // Enable Secure flag (only over HTTPS)
    if (!empty($_SERVER['HTTPS'])) {
        ini_set('session.cookie_secure', '1');
    }
    
    // Set SameSite to Strict or Lax
    ini_set('session.cookie_samesite', 'Lax');
    
    // Session lifetime (matches frontend session age)
    ini_set('session.gc_maxlifetime', 3600); // 1 hour
    
    // Regenerate session ID on each request to prevent fixation
    if (empty($_SESSION['csrf_token'])) {
        session_regenerate_id(true);
    }
}

// ============================================
// Main Application Logic
// ============================================

/**
 * Initialize secure session for this request
 */
function initSecureSession() {
    // Start session if not already started
    if (session_status() === PHP_SESSION_NONE) {
        // Configure secure session settings BEFORE starting session
        configureSecureSessions();
        
        session_start();
        
        // Initialize CSRF token
        initCSRFToken();
    }
}

/**
 * Check rate limit for configuration endpoint
 */
function checkConfigRateLimit() {
    return checkRateLimit(
        $_SESSION['user_id'] ?? null,
        100, // Higher limit for config endpoint
        60 // 1 minute window
    );
}

// ============================================
// Load .env file (fallback if getenv returns null)
// ============================================

// Include shared .env loader
require_once __DIR__ . '/load_env.php';

// Always load .env to ensure all environment variables are available
loadEnvFile();

// ============================================
// Return Configuration
// ============================================

// Initialize secure session for this request
initSecureSession();

// Check rate limit (return 429 if exceeded)
$rateLimit = checkConfigRateLimit();
if (!$rateLimit['allowed']) {
    http_response_code(429); // Too Many Requests
    header('Retry-After: ' . $rateLimit['retry_after']);
    echo json_encode([
        'error' => 'Rate limit exceeded',
        'retry_after' => $rateLimit['retry_after'],
        'message' => 'Please wait before making another request'
    ]);
    exit();
}

// Return configuration with CSRF token for POST requests
header('Content-Type: application/json');

// Include CSRF token in response headers for validation
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('X-CSRF-Token: ' . $_SESSION['csrf_token']);
}

// Get client ID from environment (or .env file loaded above)
$googleClientId = getenv('GOOGLE_CLIENT_ID') ?: null;

// Return client ID (frontend will show error if null)
echo json_encode([
    'google_client_id' => $googleClientId,
    'loaded_from' => $googleClientId ? 'env_file' : 'not_found',
    'timestamp' => date('c'),
    'csrf_token' => $_SESSION['csrf_token'] ?? null // Include for POST requests
]);

exit();
?>