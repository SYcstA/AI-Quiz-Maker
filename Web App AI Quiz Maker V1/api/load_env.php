<?php
/**
 * AI Quiz Maker - .env File Loader
 * Parses .env file from project root and sets environment variables.
 * Safe to include from any PHP file that needs .env values.
 */

function loadEnvFile() {
    static $loaded = false;
    if ($loaded) {
        return; // Only load once per request
    }

    $envPath = __DIR__ . '/../.env';
    if (!file_exists($envPath)) {
        return;
    }

    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        // Skip comments
        if (strpos($line, '#') === 0) {
            continue;
        }
        // Parse KEY="VALUE" or KEY=VALUE
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            // Remove surrounding quotes if present
            if ((strpos($value, '"') === 0 && substr($value, -1) === '"') ||
                (strpos($value, "'") === 0 && substr($value, -1) === "'")) {
                $value = substr($value, 1, -1);
            }
            // Set as environment variable
            putenv("$key=$value");
            $_ENV[$key] = $value;
        }
    }

    $loaded = true;
}