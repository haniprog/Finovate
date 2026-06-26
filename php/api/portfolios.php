<?php
/**
 * Portfolios API Endpoint
 * Handles all portfolio CRUD operations
 */

// Enable error reporting for development
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Import required files
require_once '../config/db.php';
require_once '../classes/Database.php';
require_once '../classes/Validation.php';
require_once '../classes/Portfolio.php';

// Enable CORS
enableCORS();

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Get JSON input
$input = json_decode(file_get_contents("php://input"), true);

// Initialize response
$response = [
    'success' => false,
    'message' => 'Unknown error',
    'data' => null
];

try {
    // Instantiate Portfolio class
    $portfolio = new Portfolio();

    // Route based on request method
    switch ($method) {
        case 'POST':
            // CREATE operation: create a new portfolio record
            if (empty($input) || !isset($input['action'])) {
                $response = [
                    'success' => false,
                    'message' => 'Missing action or data'
                ];
                break;
            }

            if ($input['action'] === 'create') {
                $result = $portfolio->create($input);
                $response = $result;
            } else {
                $response = [
                    'success' => false,
                    'message' => 'Invalid action'
                ];
            }
            break;

        case 'GET':
            // READ operation: fetch portfolios (single or list) or summary
            if (!isset($_GET['user_id'])) {
                $response = [
                    'success' => false,
                    'message' => 'Missing user_id'
                ];
                break;
            }

            $userId = intval($_GET['user_id']);

            if (isset($_GET['id'])) {
                // Get single portfolio
                $portfolioId = intval($_GET['id']);
                $result = $portfolio->readById($portfolioId);
                $response = $result;
            } else if (isset($_GET['summary'])) {
                // Get portfolio summary
                $result = $portfolio->getSummary($userId);
                $response = $result;
            } else {
                // Get all portfolios for user
                $result = $portfolio->read($userId);
                $response = $result;
            }
            break;

        case 'PUT':
            // UPDATE operation: modify an existing portfolio
            if (empty($input) || !isset($input['id'])) {
                $response = [
                    'success' => false,
                    'message' => 'Missing portfolio ID'
                ];
                break;
            }

            $portfolioId = intval($input['id']);
            $result = $portfolio->update($portfolioId, $input);
            $response = $result;
            break;

        case 'DELETE':
            // DELETE operation: remove a portfolio record
            if (!isset($_GET['id'])) {
                $response = [
                    'success' => false,
                    'message' => 'Missing portfolio ID'
                ];
                break;
            }

            $portfolioId = intval($_GET['id']);
            $result = $portfolio->delete($portfolioId);
            $response = $result;
            break;

        default:
            $response = [
                'success' => false,
                'message' => 'Invalid request method'
            ];
            break;
    }

} catch (Exception $e) {
    http_response_code(500);
    $response = [
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ];
}

// Return JSON response
http_response_code($response['success'] ? 200 : 400);
echo json_encode($response);
?>
