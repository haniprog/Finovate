<?php
/**
 * Portfolio Model Class
 * Handles CRUD operations for user portfolios
 */

class Portfolio {
    private $database;

    /**
     * Constructor
     */
    public function __construct() {
        $this->database = new Database();
    }

    /**
     * CREATE OPERATION - Create a new investment portfolio
     * 
     * This method creates a new portfolio to organize and track investment assets.
     * Portfolios can contain stocks, bonds, crypto, real estate, or mixed assets.
     * 
     * @param array $data Portfolio data containing:
     *                      - user_id (int): ID of portfolio owner
     *                      - name (string): Portfolio name/title (max 100 chars)
     *                      - type (string): Asset type - 'stocks', 'bonds', 'crypto', 
     *                                       'real_estate', or 'mixed'
     *                      - total_value (float, optional): Current portfolio value (default: 0)
     *                      - description (string, optional): Portfolio description
     * 
     * @return array Response array with:
     *                - success (bool): Whether creation succeeded
     *                - message (string): Status message
     *                - portfolio_id (int): ID of newly created portfolio (on success)
     *                - errors (array): Validation errors (on failure)
     * 
     * Security: Type validation ensures only allowed types are stored
     */
    public function create($data) {
        // Validate input
        $validation = new Validation($data);
        $validation->required('user_id', 'User ID')
                  ->required('name', 'Portfolio Name')
                  ->required('type', 'Portfolio Type')
                  ->maxLength('name', 100)
                  ->enum('type', ['stocks', 'bonds', 'crypto', 'real_estate', 'mixed']);

        if ($validation->failed()) {
            return [
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validation->getErrors()
            ];
        }

        $sql = "INSERT INTO portfolios 
                (user_id, name, type, total_value, description, created_at) 
                VALUES (?, ?, ?, ?, ?, NOW())";

        if (!$this->database->query($sql)) {
            return [
                'success' => false,
                'message' => 'Query preparation failed'
            ];
        }

        $this->database->bind('user_id', $data['user_id'], 'i');
        $this->database->bind('name', sanitizeInput($data['name']), 's');
        $this->database->bind('type', sanitizeInput($data['type']), 's');
        $this->database->bind('total_value', $data['total_value'] ?? 0, 'd');
        $this->database->bind('description', sanitizeInput($data['description'] ?? ''), 's');

        if (!$this->database->execute()) {
            return [
                'success' => false,
                'message' => 'Portfolio creation failed'
            ];
        }

        return [
            'success' => true,
            'message' => 'Portfolio created successfully',
            'portfolio_id' => $this->database->lastId()
        ];
    }

    /**
     * READ OPERATION - Retrieve all portfolios owned by a user
     * 
     * This method fetches all investment portfolios belonging to a user,
     * ordered by creation date (newest first). Shows all portfolio details.
     * 
     * @param int $userId User ID whose portfolios to retrieve (must be positive integer)
     * 
     * @return array Response array with:
     *                - success (bool): Whether operation succeeded
     *                - message (string): Status message
     *                - portfolios (array): Array of all user portfolios with:
     *                  * id, name, type, total_value, description, timestamps
     *                - count (int): Number of portfolios returned
     * 
     * Use this to display portfolio list in user dashboard
     */
    public function read($userId) {
        if (!is_numeric($userId) || $userId <= 0) {
            return [
                'success' => false,
                'message' => 'Invalid user ID',
                'portfolios' => []
            ];
        }

        $sql = "SELECT * FROM portfolios 
                WHERE user_id = ? 
                ORDER BY created_at DESC";

        if (!$this->database->query($sql)) {
            return [
                'success' => false,
                'message' => 'Query preparation failed',
                'portfolios' => []
            ];
        }

        $this->database->bind('user_id', $userId, 'i');

        if (!$this->database->execute()) {
            return [
                'success' => false,
                'message' => 'Portfolio fetch failed',
                'portfolios' => []
            ];
        }

        $portfolios = $this->database->resultSet();

        return [
            'success' => true,
            'message' => 'Portfolios retrieved successfully',
            'portfolios' => $portfolios,
            'count' => count($portfolios)
        ];
    }

    /**
     * READ OPERATION - Retrieve a specific portfolio by ID
     * 
     * This method fetches complete details of a single portfolio including
     * its type, current value, and description.
     * 
     * @param int $portfolioId ID of portfolio to retrieve (must be positive integer)
     * 
     * @return array Response array with:
     *                - success (bool): Whether portfolio was found
     *                - message (string): Status message
     *                - portfolio (array): Complete portfolio data (on success)
     * 
     * Returns: All portfolio fields including name, type, value, description, dates
     */
    public function readById($portfolioId) {
        if (!is_numeric($portfolioId) || $portfolioId <= 0) {
            return [
                'success' => false,
                'message' => 'Invalid portfolio ID'
            ];
        }

        $sql = "SELECT * FROM portfolios WHERE id = ? LIMIT 1";

        if (!$this->database->query($sql)) {
            return [
                'success' => false,
                'message' => 'Query preparation failed'
            ];
        }

        $this->database->bind('id', $portfolioId, 'i');

        if (!$this->database->execute()) {
            return [
                'success' => false,
                'message' => 'Portfolio fetch failed'
            ];
        }

        $portfolio = $this->database->single();

        if (!$portfolio) {
            return [
                'success' => false,
                'message' => 'Portfolio not found'
            ];
        }

        return [
            'success' => true,
            'message' => 'Portfolio retrieved successfully',
            'portfolio' => $portfolio
        ];
    }

    /**
     * UPDATE OPERATION - Modify an existing portfolio
     * 
     * This method updates portfolio details such as name, type, or value.
     * Only provided fields are updated; others remain unchanged.
     * 
     * @param int $portfolioId ID of portfolio to update (must be positive integer)
     * @param array $data Fields to update. Can include:
     *                     - name (string): Update portfolio name (max 100 chars)
     *                     - type (string): Update asset type
     *                     - total_value (float): Update current portfolio value
     *                     - description (string): Update portfolio description
     * 
     * @return array Response array with:
     *                - success (bool): Whether update succeeded
     *                - message (string): Status message
     *                - errors (array): Validation errors (if any)
     * 
     * Common use: Update total_value as investments gain/lose value
     */
    public function update($portfolioId, $data) {
        if (!is_numeric($portfolioId) || $portfolioId <= 0) {
            return [
                'success' => false,
                'message' => 'Invalid portfolio ID'
            ];
        }

        $validation = new Validation($data);
        if (!empty($data['name'])) {
            $validation->maxLength('name', 100);
        }
        if (!empty($data['total_value'])) {
            $validation->positive('total_value');
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

        if (!empty($data['name'])) {
            $updateFields[] = "name = ?";
            $params[] = sanitizeInput($data['name']);
            $types .= 's';
        }

        if (!empty($data['type'])) {
            $updateFields[] = "type = ?";
            $params[] = sanitizeInput($data['type']);
            $types .= 's';
        }

        if (isset($data['total_value']) && $data['total_value'] !== '') {
            $updateFields[] = "total_value = ?";
            $params[] = $data['total_value'];
            $types .= 'd';
        }

        if (!empty($data['description'])) {
            $updateFields[] = "description = ?";
            $params[] = sanitizeInput($data['description']);
            $types .= 's';
        }

        if (empty($updateFields)) {
            return [
                'success' => false,
                'message' => 'No fields to update'
            ];
        }

        $updateFields[] = "updated_at = NOW()";
        $sql = "UPDATE portfolios SET " . implode(', ', $updateFields) . " WHERE id = ?";
        $params[] = $portfolioId;
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
                'message' => 'Portfolio update failed'
            ];
        }

        return [
            'success' => true,
            'message' => 'Portfolio updated successfully'
        ];
    }

    /**
     * DELETE OPERATION - Remove a portfolio from the database
     * 
     * This method permanently deletes a portfolio and all associated holdings records.
     * This action cannot be undone.
     * 
     * @param int $portfolioId ID of portfolio to delete (must be positive integer)
     * 
     * @return array Response array with:
     *                - success (bool): Whether deletion succeeded
     *                - message (string): Status message ('Portfolio deleted successfully')
     * 
     * Important: This also deletes all portfolio_holdings records associated with this portfolio
     *           due to CASCADE delete in database foreign key relationship.
     */
    public function delete($portfolioId) {
        if (!is_numeric($portfolioId) || $portfolioId <= 0) {
            return [
                'success' => false,
                'message' => 'Invalid portfolio ID'
            ];
        }

        $sql = "DELETE FROM portfolios WHERE id = ?";

        if (!$this->database->query($sql)) {
            return [
                'success' => false,
                'message' => 'Query preparation failed'
            ];
        }

        $this->database->bind('id', $portfolioId, 'i');

        if (!$this->database->execute()) {
            return [
                'success' => false,
                'message' => 'Portfolio deletion failed'
            ];
        }

        return [
            'success' => true,
            'message' => 'Portfolio deleted successfully'
        ];
    }

    /**
     * Get portfolio summary
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
                COUNT(*) as total_portfolios,
                SUM(total_value) as total_value,
                AVG(total_value) as average_value
                FROM portfolios 
                WHERE user_id = ?";

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

        $summary = $this->database->single();

        return [
            'success' => true,
            'message' => 'Portfolio summary retrieved successfully',
            'summary' => $summary
        ];
    }
}
?>
