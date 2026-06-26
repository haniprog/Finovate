<?php
/**
 * Budget Class
 * Handles CRUD operations for budgets
 */

class Budget {
    private $database;

    /**
     * Constructor
     */
    public function __construct() {
        $this->database = new Database();
    }

    /**
     * CREATE OPERATION - Create a new budget for tracking spending limits
     * 
     * This method creates a new budget entry that tracks spending for a specific category
     * during a defined time period. Used to set spending limits and monitor expenses.
     * 
     * @param array $data Budget data containing:
     *                      - user_id (int): ID of budget owner
     *                      - category (string): Category being budgeted for
     *                      - limit_amount (float): Maximum spending allowed (must be positive)
     *                      - current_amount (float, optional): Current spending (default: 0)
     *                      - period (string, optional): 'daily', 'weekly', 'monthly', 'yearly'
     *                      - start_date (string, optional): Budget start date (YYYY-MM-DD)
     *                      - end_date (string, optional): Budget end date (YYYY-MM-DD)
     * 
     * @return array Response array with:
     *                - success (bool): Whether creation succeeded
     *                - message (string): Status message
     *                - budget_id (int): ID of newly created budget (on success)
     *                - errors (array): Validation errors (on failure)
     * 
     * Security: All inputs validated and sanitized
     */
    public function create($data) {
        // Validate input
        $validation = new Validation($data);
        $validation->required('user_id', 'User ID')
                  ->required('category', 'Category')
                  ->required('limit_amount', 'Budget Limit')
                  ->positive('limit_amount')
                  ->maxLength('category', 100);

        if ($validation->failed()) {
            return [
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validation->getErrors()
            ];
        }

        $sql = "INSERT INTO budgets 
                (user_id, category, limit_amount, current_amount, period, start_date, end_date, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";

        if (!$this->database->query($sql)) {
            return [
                'success' => false,
                'message' => 'Query preparation failed'
            ];
        }

        $startDate = $data['start_date'] ?? date('Y-m-01');
        $endDate = $data['end_date'] ?? date('Y-m-t');
        $period = $data['period'] ?? 'monthly';

        $this->database->bind('user_id', $data['user_id'], 'i');
        $this->database->bind('category', sanitizeInput($data['category']), 's');
        $this->database->bind('limit_amount', $data['limit_amount'], 'd');
        $this->database->bind('current_amount', $data['current_amount'] ?? 0, 'd');
        $this->database->bind('period', sanitizeInput($period), 's');
        $this->database->bind('start_date', $startDate, 's');
        $this->database->bind('end_date', $endDate, 's');

        if (!$this->database->execute()) {
            return [
                'success' => false,
                'message' => 'Budget creation failed'
            ];
        }

        return [
            'success' => true,
            'message' => 'Budget created successfully',
            'budget_id' => $this->database->lastId()
        ];
    }

    /**
     * READ OPERATION - Retrieve all budgets for a specific user
     * 
     * This method fetches all budgets belonging to a user, ordered by creation date.
     * Shows all active budgets and their current spending status.
     * 
     * @param int $userId User ID whose budgets to retrieve (must be positive integer)
     * 
     * @return array Response array with:
     *                - success (bool): Whether operation succeeded
     *                - message (string): Status message
     *                - budgets (array): Array of all user budgets with:
     *                  * id, category, limit_amount, current_amount
     *                  * period, start_date, end_date, timestamps
     *                - count (int): Number of budgets returned
     * 
     * Use this to display all budgets in user dashboard
     */
    public function read($userId) {
        if (!is_numeric($userId) || $userId <= 0) {
            return [
                'success' => false,
                'message' => 'Invalid user ID',
                'budgets' => []
            ];
        }

        $sql = "SELECT * FROM budgets 
                WHERE user_id = ? 
                ORDER BY created_at DESC";

        if (!$this->database->query($sql)) {
            return [
                'success' => false,
                'message' => 'Query preparation failed',
                'budgets' => []
            ];
        }

        $this->database->bind('user_id', $userId, 'i');

        if (!$this->database->execute()) {
            return [
                'success' => false,
                'message' => 'Budget fetch failed',
                'budgets' => []
            ];
        }

        $budgets = $this->database->resultSet();

        return [
            'success' => true,
            'message' => 'Budgets retrieved successfully',
            'budgets' => $budgets,
            'count' => count($budgets)
        ];
    }

    /**
     * READ OPERATION - Retrieve a specific budget by ID
     * 
     * This method fetches complete details of a single budget including its
     * limit amount, current spending, and period information.
     * 
     * @param int $budgetId ID of budget to retrieve (must be positive integer)
     * 
     * @return array Response array with:
     *                - success (bool): Whether budget was found
     *                - message (string): Status message
     *                - budget (array): Complete budget data (on success)
     * 
     * Returns: All budget fields including category, limits, dates, timestamps
     */
    public function readById($budgetId) {
        if (!is_numeric($budgetId) || $budgetId <= 0) {
            return [
                'success' => false,
                'message' => 'Invalid budget ID'
            ];
        }

        $sql = "SELECT * FROM budgets WHERE id = ? LIMIT 1";

        if (!$this->database->query($sql)) {
            return [
                'success' => false,
                'message' => 'Query preparation failed'
            ];
        }

        $this->database->bind('id', $budgetId, 'i');

        if (!$this->database->execute()) {
            return [
                'success' => false,
                'message' => 'Budget fetch failed'
            ];
        }

        $budget = $this->database->single();

        if (!$budget) {
            return [
                'success' => false,
                'message' => 'Budget not found'
            ];
        }

        return [
            'success' => true,
            'message' => 'Budget retrieved successfully',
            'budget' => $budget
        ];
    }

    /**
     * UPDATE OPERATION - Modify an existing budget
     * 
     * This method updates budget details such as limit amount or current spending.
     * Only provided fields are updated; others remain unchanged.
     * 
     * @param int $budgetId ID of budget to update (must be positive integer)
     * @param array $data Fields to update. Can include:
     *                     - category (string): Update budget category
     *                     - limit_amount (float): Update spending limit (must be positive)
     *                     - current_amount (float): Update current spending
     * 
     * @return array Response array with:
     *                - success (bool): Whether update succeeded
     *                - message (string): Status message
     *                - errors (array): Validation errors (if any)
     * 
     * Common use: Update current_amount when transaction added to this category
     */
    public function update($budgetId, $data) {
        if (!is_numeric($budgetId) || $budgetId <= 0) {
            return [
                'success' => false,
                'message' => 'Invalid budget ID'
            ];
        }

        $validation = new Validation($data);
        if (!empty($data['limit_amount'])) {
            $validation->positive('limit_amount');
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

        if (!empty($data['category'])) {
            $updateFields[] = "category = ?";
            $params[] = sanitizeInput($data['category']);
            $types .= 's';
        }

        if (!empty($data['limit_amount'])) {
            $updateFields[] = "limit_amount = ?";
            $params[] = $data['limit_amount'];
            $types .= 'd';
        }

        if (!empty($data['current_amount'])) {
            $updateFields[] = "current_amount = ?";
            $params[] = $data['current_amount'];
            $types .= 'd';
        }

        if (empty($updateFields)) {
            return [
                'success' => false,
                'message' => 'No fields to update'
            ];
        }

        $updateFields[] = "updated_at = NOW()";
        $sql = "UPDATE budgets SET " . implode(', ', $updateFields) . " WHERE id = ?";
        $params[] = $budgetId;
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
                'message' => 'Budget update failed'
            ];
        }

        return [
            'success' => true,
            'message' => 'Budget updated successfully'
        ];
    }

    /**
     * DELETE OPERATION - Remove a budget from the database
     * 
     * This method permanently deletes a budget record. Associated transactions
     * are NOT deleted - only the budget tracking record is removed.
     * 
     * @param int $budgetId ID of budget to delete (must be positive integer)
     * 
     * @return array Response array with:
     *                - success (bool): Whether deletion succeeded
     *                - message (string): Status message ('Budget deleted successfully')
     * 
     * Note: Transactions in this category will continue to exist after budget deletion
     */
    public function delete($budgetId) {
        if (!is_numeric($budgetId) || $budgetId <= 0) {
            return [
                'success' => false,
                'message' => 'Invalid budget ID'
            ];
        }

        $sql = "DELETE FROM budgets WHERE id = ?";

        if (!$this->database->query($sql)) {
            return [
                'success' => false,
                'message' => 'Query preparation failed'
            ];
        }

        $this->database->bind('id', $budgetId, 'i');

        if (!$this->database->execute()) {
            return [
                'success' => false,
                'message' => 'Budget deletion failed'
            ];
        }

        return [
            'success' => true,
            'message' => 'Budget deleted successfully'
        ];
    }

    /**
     * Check budget status
     * 
     * @param int $budgetId Budget ID
     * @return array
     */
    public function getStatus($budgetId) {
        $result = $this->readById($budgetId);
        
        if (!$result['success']) {
            return $result;
        }

        $budget = $result['budget'];
        $percentageUsed = ($budget['current_amount'] / $budget['limit_amount']) * 100;
        $remainingBudget = $budget['limit_amount'] - $budget['current_amount'];
        $status = $percentageUsed >= 100 ? 'exceeded' : ($percentageUsed >= 80 ? 'warning' : 'ok');

        return [
            'success' => true,
            'message' => 'Budget status retrieved',
            'budget_id' => $budgetId,
            'limit_amount' => $budget['limit_amount'],
            'current_amount' => $budget['current_amount'],
            'remaining_budget' => max(0, $remainingBudget),
            'percentage_used' => round($percentageUsed, 2),
            'status' => $status
        ];
    }
}
?>
