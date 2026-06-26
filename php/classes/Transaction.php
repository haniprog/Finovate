<?php
/**
 * Transaction Model Class
 * Handles CRUD operations for transactions
 */

class Transaction {
    private $database;

    /**
     * Constructor
     */
    public function __construct() {
        $this->database = new Database();
    }

    /**
     * CREATE OPERATION - Add a new transaction to the database
     * 
     * This method creates a new financial transaction (income, expense, or transfer)
     * and stores it in the database with proper validation.
     * 
     * @param array $data Transaction data containing:
     *                      - user_id (int): ID of the user making the transaction
     *                      - description (string): What the transaction is for
     *                      - amount (float): Transaction amount (must be positive)
     *                      - category (string): Category classification
     *                      - type (string): 'income', 'expense', or 'transfer'
     *                      - transaction_date (string, optional): Date of transaction
     *                      - notes (string, optional): Additional notes
     * 
     * @return array Response array with:
     *                - success (bool): Whether operation succeeded
     *                - message (string): Status message
     *                - transaction_id (int): ID of newly created transaction (on success)
     *                - errors (array): Validation errors (on failure)
     * 
     * Security: Uses prepared statements and validates all inputs
     */
    public function create($data) {
        // Validate input
        $validation = new Validation($data);
        $validation->required('user_id', 'User ID')
                  ->required('description', 'Description')
                  ->required('amount', 'Amount')
                  ->required('category', 'Category')
                  ->required('type', 'Transaction Type')
                  ->positive('amount')
                  ->enum('type', ['income', 'expense', 'transfer'])
                  ->maxLength('description', 255);

        if ($validation->failed()) {
            return [
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validation->getErrors()
            ];
        }

        // Prepare SQL
        $sql = "INSERT INTO transactions 
                (user_id, description, amount, category, type, transaction_date, notes, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";

        if (!$this->database->query($sql)) {
            return [
                'success' => false,
                'message' => 'Query preparation failed'
            ];
        }

        // Bind parameters
        $this->database->bind('user_id', $data['user_id'], 'i');
        $this->database->bind('description', sanitizeInput($data['description']), 's');
        $this->database->bind('amount', $data['amount'], 'd');
        $this->database->bind('category', sanitizeInput($data['category']), 's');
        $this->database->bind('type', sanitizeInput($data['type']), 's');
        $this->database->bind('transaction_date', $data['transaction_date'] ?? date('Y-m-d'), 's');
        $this->database->bind('notes', sanitizeInput($data['notes'] ?? ''), 's');

        // Execute
        if (!$this->database->execute()) {
            return [
                'success' => false,
                'message' => 'Transaction creation failed'
            ];
        }

        return [
            'success' => true,
            'message' => 'Transaction created successfully',
            'transaction_id' => $this->database->lastId()
        ];
    }

    /**
     * READ OPERATION - Retrieve all transactions for a specific user
     * 
     * This method fetches all transactions belonging to a user with pagination support.
     * Results are ordered by transaction date (newest first).
     * 
     * @param int $userId User ID to retrieve transactions for (must be positive integer)
     * @param int $limit Maximum number of records to return (default: 50)
     * @param int $offset Number of records to skip for pagination (default: 0)
     * 
     * @return array Response array with:
     *                - success (bool): Whether operation succeeded
     *                - message (string): Status message
     *                - transactions (array): Array of transaction records
     *                - count (int): Number of transactions returned
     * 
     * Example: Get 25 transactions starting from record 50 for user 1:
     *          read(1, 25, 50)
     */
    public function read($userId, $limit = 50, $offset = 0) {
        // Validate input
        if (!is_numeric($userId) || $userId <= 0) {
            return [
                'success' => false,
                'message' => 'Invalid user ID',
                'transactions' => []
            ];
        }

        $sql = "SELECT * FROM transactions 
                WHERE user_id = ? 
                ORDER BY transaction_date DESC 
                LIMIT ? OFFSET ?";

        if (!$this->database->query($sql)) {
            return [
                'success' => false,
                'message' => 'Query preparation failed',
                'transactions' => []
            ];
        }

        $this->database->bind('user_id', $userId, 'i');
        $this->database->bind('limit', $limit, 'i');
        $this->database->bind('offset', $offset, 'i');

        if (!$this->database->execute()) {
            return [
                'success' => false,
                'message' => 'Transaction fetch failed',
                'transactions' => []
            ];
        }

        $transactions = $this->database->resultSet();

        return [
            'success' => true,
            'message' => 'Transactions retrieved successfully',
            'transactions' => $transactions,
            'count' => count($transactions)
        ];
    }

    /**
     * READ OPERATION - Retrieve a specific transaction by ID
     * 
     * This method fetches details of a single transaction from the database.
     * Used when you need complete information about one specific transaction.
     * 
     * @param int $transactionId ID of the transaction to retrieve (must be positive integer)
     * 
     * @return array Response array with:
     *                - success (bool): Whether transaction was found
     *                - message (string): Status message
     *                - transaction (array): Complete transaction data (on success)
     * 
     * Returns: ID, user_id, description, amount, category, type, date, notes, timestamps
     */
    public function readById($transactionId) {
        if (!is_numeric($transactionId) || $transactionId <= 0) {
            return [
                'success' => false,
                'message' => 'Invalid transaction ID'
            ];
        }

        $sql = "SELECT * FROM transactions WHERE id = ? LIMIT 1";

        if (!$this->database->query($sql)) {
            return [
                'success' => false,
                'message' => 'Query preparation failed'
            ];
        }

        $this->database->bind('id', $transactionId, 'i');

        if (!$this->database->execute()) {
            return [
                'success' => false,
                'message' => 'Transaction fetch failed'
            ];
        }

        $transaction = $this->database->single();

        if (!$transaction) {
            return [
                'success' => false,
                'message' => 'Transaction not found'
            ];
        }

        return [
            'success' => true,
            'message' => 'Transaction retrieved successfully',
            'transaction' => $transaction
        ];
    }

    /**
     * UPDATE OPERATION - Modify an existing transaction
     * 
     * This method updates one or more fields of an existing transaction.
     * Only provided fields are updated; omitted fields remain unchanged.
     * Validates data before updating.
     * 
     * @param int $transactionId ID of transaction to update (must be positive integer)
     * @param array $data Fields to update. Can include:
     *                     - description (string): Update transaction description
     *                     - amount (float): Update amount (must be positive)
     *                     - category (string): Update category
     *                     - type (string): Update transaction type
     *                     - notes (string): Update notes
     * 
     * @return array Response array with:
     *                - success (bool): Whether update succeeded
     *                - message (string): Status message
     *                - errors (array): Validation errors (if any)
     * 
     * Note: updated_at timestamp is automatically set to current time
     */
    public function update($transactionId, $data) {
        // Validate input
        if (!is_numeric($transactionId) || $transactionId <= 0) {
            return [
                'success' => false,
                'message' => 'Invalid transaction ID'
            ];
        }

        $validation = new Validation($data);
        if (!empty($data['amount'])) {
            $validation->positive('amount');
        }
        if (!empty($data['type'])) {
            $validation->enum('type', ['income', 'expense', 'transfer']);
        }
        if (!empty($data['description'])) {
            $validation->maxLength('description', 255);
        }

        if ($validation->failed()) {
            return [
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validation->getErrors()
            ];
        }

        // Build update query dynamically
        $updateFields = [];
        $params = [];
        $types = '';

        if (!empty($data['description'])) {
            $updateFields[] = "description = ?";
            $params[] = sanitizeInput($data['description']);
            $types .= 's';
        }

        if (!empty($data['amount'])) {
            $updateFields[] = "amount = ?";
            $params[] = $data['amount'];
            $types .= 'd';
        }

        if (!empty($data['category'])) {
            $updateFields[] = "category = ?";
            $params[] = sanitizeInput($data['category']);
            $types .= 's';
        }

        if (!empty($data['type'])) {
            $updateFields[] = "type = ?";
            $params[] = sanitizeInput($data['type']);
            $types .= 's';
        }

        if (empty($updateFields)) {
            return [
                'success' => false,
                'message' => 'No fields to update'
            ];
        }

        $updateFields[] = "updated_at = NOW()";
        $sql = "UPDATE transactions SET " . implode(', ', $updateFields) . " WHERE id = ?";
        $params[] = $transactionId;
        $types .= 'i';

        if (!$this->database->query($sql)) {
            return [
                'success' => false,
                'message' => 'Query preparation failed'
            ];
        }

        // Bind all parameters
        for ($i = 0; $i < count($params); $i++) {
            $this->database->bind("param" . $i, $params[$i], $types[$i]);
        }

        if (!$this->database->execute()) {
            return [
                'success' => false,
                'message' => 'Transaction update failed'
            ];
        }

        return [
            'success' => true,
            'message' => 'Transaction updated successfully'
        ];
    }

    /**
     * DELETE OPERATION - Remove a transaction from the database
     * 
     * This method permanently deletes a transaction record from the database.
     * This action cannot be undone - consider archiving instead if audit trail needed.
     * 
     * @param int $transactionId ID of transaction to delete (must be positive integer)
     * 
     * @return array Response array with:
     *                - success (bool): Whether deletion succeeded
     *                - message (string): Status message ('Transaction deleted successfully')
     * 
     * Warning: This is a permanent operation. Transaction is removed from database entirely.
     */
    public function delete($transactionId) {
        if (!is_numeric($transactionId) || $transactionId <= 0) {
            return [
                'success' => false,
                'message' => 'Invalid transaction ID'
            ];
        }

        $sql = "DELETE FROM transactions WHERE id = ?";

        if (!$this->database->query($sql)) {
            return [
                'success' => false,
                'message' => 'Query preparation failed'
            ];
        }

        $this->database->bind('id', $transactionId, 'i');

        if (!$this->database->execute()) {
            return [
                'success' => false,
                'message' => 'Transaction deletion failed'
            ];
        }

        return [
            'success' => true,
            'message' => 'Transaction deleted successfully'
        ];
    }

    /**
     * Get transaction summary for user
     * 
     * @param int $userId User ID
     * @return array
     */
    public function getSummary($userId) {
        if (!is_numeric($userId) || $userId <= 0) {
            return [
                'success' => false,
                'message' => 'Invalid user ID',
                'summary' => null
            ];
        }

        $sql = "SELECT 
                type,
                COUNT(*) as transaction_count,
                SUM(amount) as total_amount
                FROM transactions 
                WHERE user_id = ?
                GROUP BY type";

        if (!$this->database->query($sql)) {
            return [
                'success' => false,
                'message' => 'Query preparation failed'
            ];
        }

        $this->database->bind('user_id', $userId, 'i');

        if (!$this->database->execute()) {
            return [
                'success' => false,
                'message' => 'Summary fetch failed'
            ];
        }

        $summary = $this->database->resultSet();

        return [
            'success' => true,
            'message' => 'Summary retrieved successfully',
            'summary' => $summary
        ];
    }
}
?>
