<?php
/**
 * Transactions API Endpoint
 * Handles all transaction CRUD operations
 */

// Enable error reporting for development
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Import required files
require_once '../config/db.php';
require_once '../classes/Database.php';
require_once '../classes/Validation.php';
require_once '../classes/Transaction.php';

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
    // Instantiate Transaction class
    $transaction = new Transaction();

    // Route based on request method and action
    switch ($method) {
        case 'POST':
            // CREATE operation: create a new transaction record
            if (empty($input) || !isset($input['action'])) {
                $response = [
                    'success' => false,
                    'message' => 'Missing action or data'
                ];
                break;
            }

            if ($input['action'] === 'create') {
                $result = $transaction->create($input);
                $response = $result;
            } else {
                $response = [
                    'success' => false,
                    'message' => 'Invalid action'
                ];
            }
            break;

        case 'GET':
            // READ operation: fetch transactions (single or list)
            if (!isset($_GET['user_id'])) {
                $response = [
                    'success' => false,
                    'message' => 'Missing user_id'
                ];
                break;
            }

            $userId = intval($_GET['user_id']);
            $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
            $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;

            if (isset($_GET['id'])) {
                // Get single transaction
                $transactionId = intval($_GET['id']);
                $result = $transaction->readById($transactionId);
                $response = $result;
            } else {
                // Get all transactions for user
                $result = $transaction->read($userId, $limit, $offset);
                $response = $result;
            }
            break;

        case 'PUT':
            // UPDATE operation: modify an existing transaction
            if (empty($input) || !isset($input['id'])) {
                $response = [
                    'success' => false,
                    'message' => 'Missing transaction ID'
                ];
                break;
            }

            $transactionId = intval($input['id']);
            $result = $transaction->update($transactionId, $input);
            $response = $result;
            break;

        case 'DELETE':
            // DELETE operation: remove a transaction record
            if (!isset($_GET['id'])) {
                $response = [
                    'success' => false,
                    'message' => 'Missing transaction ID'
                ];
                break;
            }

            $transactionId = intval($_GET['id']);
            $result = $transaction->delete($transactionId);
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
