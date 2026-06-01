<?php
/**
 * AI Quiz Maker - Debug Dashboard
 * Cek status environment variables dan file .env
 */
header('Content-Type: application/json');

// Include .env loader
require_once __DIR__ . '/load_env.php';
loadEnvFile();

$result = [
    'env_file_exists' => file_exists(__DIR__ . '/../.env'),
    'env_file_path' => realpath(__DIR__ . '/../.env'),
    'env_file_readable' => is_readable(__DIR__ . '/../.env'),
    'env_vars' => [
        'GOOGLE_CLIENT_ID' => getenv('GOOGLE_CLIENT_ID') ? substr(getenv('GOOGLE_CLIENT_ID'), 0, 10) . '...' : null,
        'GEMINI_API_KEY' => getenv('GEMINI_API_KEY') ? substr(getenv('GEMINI_API_KEY'), 0, 8) . '...' : null,
        'AI_MODEL' => getenv('AI_MODEL') ?: null,
    ],
    'server' => [
        'php_version' => phpversion(),
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown',
    ]
];

echo json_encode($result, JSON_PRETTY_PRINT);