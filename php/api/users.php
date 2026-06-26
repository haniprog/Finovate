<?php
/**
 * Users API Endpoint
 * Handles user authentication and profile management
 */

ini_set('display_errors', 0);
error_reporting(E_ALL);
ob_start();

require_once '../config/db.php';
require_once '../classes/Database.php';
require_once '../classes/Validation.php';
require_once '../classes/User.php';

enableCORS();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents("php://input"), true);

$response = [
    'success' => false,
    'message' => 'Unknown error',
    'data' => null
];

try {
    $user = new User();

    switch ($method) {
        case 'POST':
            // CREATE operation: register a new user OR authenticate login
            if (empty($input) || !isset($input['action'])) {
                $response = [
                    'success' => false,
                    'message' => 'Missing action or data'
                ];
                break;
            }

            if ($input['action'] === 'register') {
                $result = $user->register($input);
                $response = $result;
            } elseif ($input['action'] === 'login') {
                $result = $user->authenticate($input['username'] ?? '', $input['password'] ?? '');
                $response = $result;
            } else {
                $response = [
                    'success' => false,
                    'message' => 'Invalid action'
                ];
            }
            break;

        case 'GET':
            // READ operation: retrieve a user profile by ID
            if (!isset($_GET['id'])) {
                $response = [
                    'success' => false,
                    'message' => 'Missing user ID'
                ];
                break;
            }

            $userId = intval($_GET['id']);
            $result = $user->readById($userId);
            $response = $result;
            break;

        case 'PUT':
            // UPDATE operation: modify user profile information
            if (empty($input) || !isset($input['id'])) {
                $response = [
                    'success' => false,
                    'message' => 'Missing user ID'
                ];
                break;
            }

            $userId = intval($input['id']);
            $result = $user->update($userId, $input);
            $response = $result;
            break;

        case 'DELETE':
            // DELETE operation: remove a user account and related records
            if (!isset($_GET['id'])) {
                $response = [
                    'success' => false,
                    'message' => 'Missing user ID'
                ];
                break;
            }

            $userId = intval($_GET['id']);
            $result = $user->delete($userId);
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

ob_end_clean();
http_response_code($response['success'] ? 200 : 400);
echo json_encode($response);
?>
