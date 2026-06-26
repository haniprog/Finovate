<?php
/**
 * Validation Class
 * Handles input validation for all data types
 */

class Validation {
    private $errors = [];
    private $data = [];

    /**
     * Constructor
     * 
     * @param array $data Data to validate
     */
    public function __construct($data = []) {
        $this->data = $data;
    }

    /**
     * Validate required field
     * 
     * @param string $field Field name
     * @param string $fieldName Display name
     * @return self
     */
    public function required($field, $fieldName = null) {
        $fieldName = $fieldName ?: $field;
        
        if (empty($this->data[$field])) {
            $this->errors[$field] = "$fieldName is required";
        }
        
        return $this;
    }

    /**
     * Validate email format
     * 
     * @param string $field Field name
     * @return self
     */
    public function email($field) {
        if (!empty($this->data[$field])) {
            if (!filter_var($this->data[$field], FILTER_VALIDATE_EMAIL)) {
                $this->errors[$field] = "Invalid email format";
            }
        }
        
        return $this;
    }

    /**
     * Validate minimum length
     * 
     * @param string $field Field name
     * @param int $min Minimum length
     * @return self
     */
    public function minLength($field, $min) {
        if (!empty($this->data[$field])) {
            if (strlen($this->data[$field]) < $min) {
                $this->errors[$field] = "Minimum length is $min characters";
            }
        }
        
        return $this;
    }

    /**
     * Validate maximum length
     * 
     * @param string $field Field name
     * @param int $max Maximum length
     * @return self
     */
    public function maxLength($field, $max) {
        if (!empty($this->data[$field])) {
            if (strlen($this->data[$field]) > $max) {
                $this->errors[$field] = "Maximum length is $max characters";
            }
        }
        
        return $this;
    }

    /**
     * Validate numeric value
     * 
     * @param string $field Field name
     * @return self
     */
    public function numeric($field) {
        if (!empty($this->data[$field])) {
            if (!is_numeric($this->data[$field])) {
                $this->errors[$field] = "Must be a numeric value";
            }
        }
        
        return $this;
    }

    /**
     * Validate positive number
     * 
     * @param string $field Field name
     * @return self
     */
    public function positive($field) {
        if (!empty($this->data[$field])) {
            if (!is_numeric($this->data[$field]) || $this->data[$field] <= 0) {
                $this->errors[$field] = "Must be a positive number";
            }
        }
        
        return $this;
    }

    /**
     * Validate integer
     * 
     * @param string $field Field name
     * @return self
     */
    public function integer($field) {
        if (!empty($this->data[$field])) {
            if (!filter_var($this->data[$field], FILTER_VALIDATE_INT)) {
                $this->errors[$field] = "Must be an integer";
            }
        }
        
        return $this;
    }

    /**
     * Validate date format
     * 
     * @param string $field Field name
     * @param string $format Date format (default: Y-m-d)
     * @return self
     */
    public function date($field, $format = 'Y-m-d') {
        if (!empty($this->data[$field])) {
            $date = \DateTime::createFromFormat($format, $this->data[$field]);
            if (!$date || $date->format($format) !== $this->data[$field]) {
                $this->errors[$field] = "Invalid date format";
            }
        }
        
        return $this;
    }

    /**
     * Validate field matches another field
     * 
     * @param string $field Field name
     * @param string $matchField Field to match
     * @return self
     */
    public function matches($field, $matchField) {
        if ($this->data[$field] !== $this->data[$matchField]) {
            $this->errors[$field] = "Fields do not match";
        }
        
        return $this;
    }

    /**
     * Validate enum value
     * 
     * @param string $field Field name
     * @param array $allowed Allowed values
     * @return self
     */
    public function enum($field, $allowed = []) {
        if (!empty($this->data[$field])) {
            if (!in_array($this->data[$field], $allowed)) {
                $this->errors[$field] = "Invalid value";
            }
        }
        
        return $this;
    }

    /**
     * Check if validation passed
     * 
     * @return bool
     */
    public function passed() {
        return empty($this->errors);
    }

    /**
     * Check if validation failed
     * 
     * @return bool
     */
    public function failed() {
        return !empty($this->errors);
    }

    /**
     * Get errors
     * 
     * @return array
     */
    public function getErrors() {
        return $this->errors;
    }

    /**
     * Get single error
     * 
     * @param string $field Field name
     * @return string|null
     */
    public function getError($field) {
        return $this->errors[$field] ?? null;
    }

    /**
     * Add custom error
     * 
     * @param string $field Field name
     * @param string $message Error message
     * @return self
     */
    public function addError($field, $message) {
        $this->errors[$field] = $message;
        return $this;
    }
}
?>
