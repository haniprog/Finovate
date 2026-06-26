<?php
/**
 * Database Configuration File
 * Centralized database connection setup
 * Uses environment variables for security
 */

// Database credentials
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_NAME', getenv('DB_NAME') ?: 'finovate_db');
define('DB_PORT', getenv('DB_PORT') ?: 3306);

// Application constants
define('APP_NAME', 'Finovate');
define('APP_VERSION', '1.0.0');
define('APP_DEBUG', getenv('APP_DEBUG') ?: false);

// CORS headers for API
define('ALLOWED_ORIGINS', ['http://localhost:8080', 'http://localhost:3000', 'https://localhost']);

/**
 * Enable CORS for API requests
 */
function enableCORS() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate');
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

/**
 * Handle errors with proper logging and response
 */
function handleError($message, $code = 500) {
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'message' => $message,
        'code' => $code
    ]);
    exit();
}

/**
 * Sanitize input to prevent XSS
 */
function sanitizeInput($input) {
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}
?>
