<?php
/**
 * User Model Class
 * Handles CRUD operations for users
 */

class User {
    private $database;

    /**
     * Constructor
     */
    public function __construct() {
        $this->database = new Database();
    }

    /**
     * CREATE OPERATION - Register a new user account
     * 
     * This method creates a new user account with email/username validation,
     * duplicate checking, and secure password hashing.
     * 
     * @param array $data User registration data containing:
     *                      - username (string): Unique username (3-50 chars)
     *                      - email (string): Unique email address
     *                      - password (string): Password (min 6 chars)
     *                      - full_name (string): User's full name
     * 
     * @return array Response array with:
     *                - success (bool): Whether registration succeeded
     *                - message (string): Status message
     *                - user_id (int): ID of newly created user (on success)
     *                - errors (array): Validation errors (on failure)
     * 
     * Security: Password is hashed with bcrypt, duplicates are prevented
     */
    public function register($data) {
        // Validate input
        $validation = new Validation($data);
        $validation->required('username', 'Username')
                  ->required('email', 'Email')
                  ->required('password', 'Password')
                  ->required('full_name', 'Full Name')
                  ->minLength('username', 3)
                  ->maxLength('username', 50)
                  ->minLength('password', 6)
                  ->maxLength('password', 255)
                  ->email('email');

        if ($validation->failed()) {
            return [
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validation->getErrors()
            ];
        }

        // Check if user already exists
        $sql = "SELECT id FROM users WHERE email = ? OR username = ?";
        if (!$this->database->query($sql)) {
            return [
                'success' => false,
                'message' => 'Query preparation failed',
                'error' => $this->database->getError()
            ];
        }

        $this->database->bind('email', sanitizeInput($data['email']), 's');
        $this->database->bind('username', sanitizeInput($data['username']), 's');

        if (!$this->database->execute()) {
            return [
                'success' => false,
                'message' => 'Query execution failed',
                'error' => $this->database->getError()
            ];
        }

        $existingUser = $this->database->single();
        if ($existingUser) {
            return [
                'success' => false,
                'message' => 'User with this email or username already exists'
            ];
        }

        // Hash password
        $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);

        // Create user
        $sql = "INSERT INTO users 
                (username, email, password, full_name, status, created_at) 
                VALUES (?, ?, ?, ?, 'active', NOW())";

        if (!$this->database->query($sql)) {
            return [
                'success' => false,
                'message' => 'Query preparation failed'
            ];
        }

        $this->database->bind('username', sanitizeInput($data['username']), 's');
        $this->database->bind('email', sanitizeInput($data['email']), 's');
        $this->database->bind('password', $hashedPassword, 's');
        $this->database->bind('full_name', sanitizeInput($data['full_name']), 's');

        if (!$this->database->execute()) {
            return [
                'success' => false,
                'message' => 'User registration failed'
            ];
        }

        return [
            'success' => true,
            'message' => 'User registered successfully',
            'user_id' => $this->database->lastId()
        ];
    }

    /**
     * READ OPERATION - Retrieve a user's profile information
     * 
     * This method fetches user profile data by ID. Password is NOT included
     * for security reasons.
     * 
     * @param int $userId ID of user to retrieve (must be positive integer)
     * 
     * @return array Response array with:
     *                - success (bool): Whether user was found
     *                - message (string): Status message
     *                - user (array): User data (on success) with fields:
     *                  * id, username, email, full_name, status, created_at, updated_at
     * 
     * Note: Password hash is never returned for security
     */
    public function readById($userId) {
        if (!is_numeric($userId) || $userId <= 0) {
            return [
                'success' => false,
                'message' => 'Invalid user ID'
            ];
        }

        $sql = "SELECT id, username, email, full_name, status, created_at, updated_at 
                FROM users WHERE id = ? LIMIT 1";

        if (!$this->database->query($sql)) {
            return [
                'success' => false,
                'message' => 'Query preparation failed'
            ];
        }

        $this->database->bind('id', $userId, 'i');

        if (!$this->database->execute()) {
            return [
                'success' => false,
                'message' => 'Query execution failed'
            ];
        }

        $user = $this->database->single();

        if (!$user) {
            return [
                'success' => false,
                'message' => 'User not found'
            ];
        }

        return [
            'success' => true,
            'message' => 'User retrieved successfully',
            'user' => $user
        ];
    }

    /**
     * UPDATE OPERATION - Modify user profile information
     * 
     * This method updates user profile fields such as name or status.
     * Only provided fields are updated; others remain unchanged.
     * Password updates should use a separate method for security.
     * 
     * @param int $userId ID of user to update (must be positive integer)
     * @param array $data Fields to update. Can include:
     *                     - full_name (string): Update user's full name
     *                     - status (string): Update status (active/inactive/suspended)
     * 
     * @return array Response array with:
     *                - success (bool): Whether update succeeded
     *                - message (string): Status message
     *                - errors (array): Validation errors (if any)
     * 
     * Note: updated_at timestamp is automatically set to current time
     */
    public function update($userId, $data) {
        if (!is_numeric($userId) || $userId <= 0) {
            return [
                'success' => false,
                'message' => 'Invalid user ID'
            ];
        }

        $validation = new Validation($data);
        if (!empty($data['full_name'])) {
            $validation->maxLength('full_name', 100);
        }

        if ($validation->failed()) {
            return [
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validation->getErrors()
            ];
        }

        $updateFields = [];
        $params = [];
        $types = '';

        if (!empty($data['full_name'])) {
            $updateFields[] = "full_name = ?";
            $params[] = sanitizeInput($data['full_name']);
            $types .= 's';
        }

        if (!empty($data['status'])) {
            $updateFields[] = "status = ?";
            $params[] = sanitizeInput($data['status']);
            $types .= 's';
        }

        if (empty($updateFields)) {
            return [
                'success' => false,
                'message' => 'No fields to update'
            ];
        }

        $updateFields[] = "updated_at = NOW()";
        $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?";
        $params[] = $userId;
        $types .= 'i';

        if (!$this->database->query($sql)) {
            return [
                'success' => false,
                'message' => 'Query preparation failed'
            ];
        }

        for ($i = 0; $i < count($params); $i++) {
            $this->database->bind("param" . $i, $params[$i], $types[$i]);
        }

        if (!$this->database->execute()) {
            return [
                'success' => false,
                'message' => 'User update failed'
            ];
        }

        return [
            'success' => true,
            'message' => 'User updated successfully'
        ];
    }

    /**
     * READ OPERATION - Authenticate user login (verify credentials)
     * 
     * This method verifies user login credentials against stored hashed password.
     * Returns user data on successful authentication. Password is never returned.
     * 
     * @param string $username Username or email address to authenticate
     * @param string $password Plain text password to verify
     * 
     * @return array Response array with:
     *                - success (bool): Whether authentication succeeded
     *                - message (string): Status message or error reason
     *                - user (array): User data (on success) with:
     *                  * id, username, email, full_name, status
     *                  * Password hash is NOT included
     * 
     * Security: Uses bcrypt password_verify() for secure comparison
     *          Checks if user account is active (status = 'active')
     */
    public function authenticate($username, $password) {
        $validation = new Validation(['username' => $username, 'password' => $password]);
        $validation->required('username', 'Username')
                  ->required('password', 'Password');

        if ($validation->failed()) {
            return [
                'success' => false,
                'message' => 'Invalid credentials'
            ];
        }

        $sql = "SELECT id, username, email, password, full_name, status 
                FROM users WHERE username = ? OR email = ?";

        if (!$this->database->query($sql)) {
            return [
                'success' => false,
                'message' => 'Query preparation failed'
            ];
        }

        $this->database->bind('username', sanitizeInput($username), 's');
        $this->database->bind('email', sanitizeInput($username), 's');

        if (!$this->database->execute()) {
            return [
                'success' => false,
                'message' => 'Query execution failed'
            ];
        }

        $user = $this->database->single();

        if (!$user || !password_verify($password, $user['password'])) {
            return [
                'success' => false,
                'message' => 'Invalid credentials'
            ];
        }

        if ($user['status'] !== 'active') {
            return [
                'success' => false,
                'message' => 'User account is not active'
            ];
        }

        // Remove password from response
        unset($user['password']);

        return [
            'success' => true,
            'message' => 'Authentication successful',
            'user' => $user
        ];
    }

    /**
     * DELETE OPERATION - Remove a user account from the database
     * 
     * This method permanently deletes a user account and all associated data:
     * - All transactions for this user
     * - All budgets for this user
     * - All portfolios for this user
     * due to CASCADE delete in foreign key relationships.
     * 
     * This action CANNOT be undone.
     * 
     * @param int $userId ID of user to delete (must be positive integer)
     * 
     * @return array Response array with:
     *                - success (bool): Whether deletion succeeded
     *                - message (string): Status message ('User deleted successfully')
     * 
     * WARNING: All user data is permanently removed from database.
     *         Consider deactivating user (status = 'inactive') instead if audit trail needed.
     */
    public function delete($userId) {
        if (!is_numeric($userId) || $userId <= 0) {
            return [
                'success' => false,
                'message' => 'Invalid user ID'
            ];
        }

        $sql = "DELETE FROM users WHERE id = ?";

        if (!$this->database->query($sql)) {
            return [
                'success' => false,
                'message' => 'Query preparation failed'
            ];
        }

        $this->database->bind('id', $userId, 'i');

        if (!$this->database->execute()) {
            return [
                'success' => false,
                'message' => 'User deletion failed'
            ];
        }

        return [
            'success' => true,
            'message' => 'User deleted successfully'
        ];
    }
}
?>
