<?php
/**
 * Budgets API Endpoint
 * Handles all budget CRUD operations
 */

// Enable error reporting for development
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Import required files
require_once '../config/db.php';
require_once '../classes/Database.php';
require_once '../classes/Validation.php';
require_once '../classes/Budget.php';

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
    // Instantiate Budget class
    $budget = new Budget();

    // Route based on request method
    switch ($method) {
        case 'POST':
            // CREATE operation: create a new budget record
            if (empty($input) || !isset($input['action'])) {
                $response = [
                    'success' => false,
                    'message' => 'Missing action or data'
                ];
                break;
            }

            if ($input['action'] === 'create') {
                $result = $budget->create($input);
                $response = $result;
            } else {
                $response = [
                    'success' => false,
                    'message' => 'Invalid action'
                ];
            }
            break;

        case 'GET':
            // READ operation: fetch budgets (single or list)
            if (!isset($_GET['user_id'])) {
                $response = [
                    'success' => false,
                    'message' => 'Missing user_id'
                ];
                break;
            }

            $userId = intval($_GET['user_id']);

            if (isset($_GET['id'])) {
                // Get single budget
                $budgetId = intval($_GET['id']);
                if (isset($_GET['status'])) {
                    // Get budget status
                    $result = $budget->getStatus($budgetId);
                } else {
                    $result = $budget->readById($budgetId);
                }
                $response = $result;
            } else {
                // Get all budgets for user
                $result = $budget->read($userId);
                $response = $result;
            }
            break;

        case 'PUT':
            // UPDATE operation: modify an existing budget
            if (empty($input) || !isset($input['id'])) {
                $response = [
                    'success' => false,
                    'message' => 'Missing budget ID'
                ];
                break;
            }

            $budgetId = intval($input['id']);
            $result = $budget->update($budgetId, $input);
            $response = $result;
            break;

        case 'DELETE':
            // DELETE operation: remove a budget record
            if (!isset($_GET['id'])) {
                $response = [
                    'success' => false,
                    'message' => 'Missing budget ID'
                ];
                break;
            }

            $budgetId = intval($_GET['id']);
            $result = $budget->delete($budgetId);
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
