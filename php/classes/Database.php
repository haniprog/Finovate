<?php
/**
 * Database Class
 * Handles all database operations with prepared statements
 * Implements prepared statements to prevent SQL injection
 */

class Database {
    private $connection;
    private $statement;
    private $error;
    private $rowCount = 0;
    private $bindParams = [];
    private $bindTypes = '';

    /**
     * Constructor - Initialize database connection
     */
    public function __construct() {
        try {
            $this->connection = new mysqli(
                DB_HOST,
                DB_USER,
                DB_PASS,
                DB_NAME,
                DB_PORT
            );

            // Check connection
            if ($this->connection->connect_error) {
                $this->error = "Connection failed: " . $this->connection->connect_error;
                throw new Exception($this->error);
            }

            // Set charset to UTF8
            $this->connection->set_charset("utf8mb4");
        } catch (Exception $e) {
            handleError("Database connection error: " . $e->getMessage(), 500);
        }
    }

    /**
     * Prepare SQL statement
     * 
     * @param string $sql SQL query
     * @return bool
     */
    public function query($sql) {
        try {
            $this->bindParams = [];
            $this->bindTypes = '';
            $this->statement = $this->connection->prepare($sql);
            if (!$this->statement) {
                throw new Exception("Prepare failed: " . $this->connection->error);
            }
            return true;
        } catch (Exception $e) {
            $this->error = $e->getMessage();
            return false;
        }
    }

    /**
     * Bind values to prepared statement
     * Supports multiple data types: s (string), i (integer), d (double), b (blob)
     * 
     * @param string $param Parameter name (e.g., :id)
     * @param mixed $value Value to bind
     * @param string $type Data type
     * @return bool
     */
    public function bind($param, $value, $type = null) {
        if (is_null($type)) {
            switch (true) {
                case is_int($value):
                    $type = 'i';
                    break;
                case is_float($value):
                    $type = 'd';
                    break;
                case is_string($value):
                    $type = 's';
                    break;
                default:
                    $type = 's';
            }
        }

        try {
            // Remove leading colon if present
            $param = ltrim($param, ':');
            
            // Store parameter for binding
            $this->bindParams[$param] = $value;
            $this->bindTypes .= $type;
            
            return true;
        } catch (Exception $e) {
            $this->error = $e->getMessage();
            return false;
        }
    }

    /**
     * Execute prepared statement
     * 
     * @return bool
     */
    public function execute() {
        try {
            if (!empty($this->bindParams)) {
                // Build bind_param call with types and values
                $types = $this->bindTypes;
                $params = array($types);
                
                // Add references to all parameters
                foreach ($this->bindParams as $key => $value) {
                    $params[] = &$this->bindParams[$key];
                }
                
                // Bind parameters
                call_user_func_array(array($this->statement, 'bind_param'), $params);
                
                // Clear for next execution
                $this->bindParams = [];
                $this->bindTypes = '';
            }

            if (!$this->statement->execute()) {
                throw new Exception("Execute failed: " . $this->statement->error);
            }

            $this->rowCount = $this->statement->affected_rows;
            return true;
        } catch (Exception $e) {
            $this->error = $e->getMessage();
            return false;
        }
    }

    /**
     * Get single row result
     * 
     * @return array|null
     */
    public function single() {
        try {
            $result = $this->statement->get_result();
            if ($result->num_rows > 0) {
                return $result->fetch_assoc();
            }
            return null;
        } catch (Exception $e) {
            $this->error = $e->getMessage();
            return null;
        }
    }

    /**
     * Get all results
     * 
     * @return array
     */
    public function resultSet() {
        try {
            $result = $this->statement->get_result();
            $results = [];
            while ($row = $result->fetch_assoc()) {
                $results[] = $row;
            }
            return $results;
        } catch (Exception $e) {
            $this->error = $e->getMessage();
            return [];
        }
    }

    /**
     * Get row count
     * 
     * @return int
     */
    public function rowCount() {
        return $this->rowCount;
    }

    /**
     * Get last inserted ID
     * 
     * @return int
     */
    public function lastId() {
        return $this->connection->insert_id;
    }

    /**
     * Get error message
     * 
     * @return string
     */
    public function getError() {
        return $this->error;
    }

    /**
     * Close database connection
     */
    public function closeConnection() {
        if ($this->statement) {
            $this->statement->close();
        }
        if ($this->connection) {
            $this->connection->close();
        }
    }

    /**
     * Destructor - Close connection
     */
    public function __destruct() {
        $this->closeConnection();
    }
}
?>
