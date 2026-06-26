<?php
/**
 * Diagnostic Test /

// Test 1: PHP Execution
echo json_encode([
    'test' => 'PHP Execution',
    'status' => 'Working',
    'php_version' => phpversion(),
    'timestamp' => date('Y-m-d H:i:s')
]);
?>
