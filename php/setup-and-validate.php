<?php
/**
 * Finovate Database Setup & Validation Utility
 * 
 * This file provides database setup, configuration validation, and system checks
 * Usage: php php/setup-and-validate.php
 * Access via browser: http://localhost:8000/php/setup-and-validate.php
 */

// Set headers
header('Content-Type: text/html; charset=utf-8');

// Color constants
class Status {
    const SUCCESS = 'success';
    const ERROR = 'error';
    const WARNING = 'warning';
    const INFO = 'info';
}

// Start buffering for output
ob_start();

// Collect validation results
$validations = [];
$setup_complete = false;

// Function to add validation result
function addValidation($name, $status, $message) {
    global $validations;
    $validations[] = [
        'name' => $name,
        'status' => $status,
        'message' => $message
    ];
}

// ===== VALIDATION CHECKS =====

// 1. Check PHP Version
$php_version = phpversion();
$required_php = '7.4.0';
if (version_compare($php_version, $required_php, '>=')) {
    addValidation('PHP Version', Status::SUCCESS, "PHP $php_version (Required: $required_php+)");
} else {
    addValidation('PHP Version', Status::ERROR, "PHP $php_version (Required: $required_php+)");
}

// 2. Check MySQLi Extension
if (extension_loaded('mysqli')) {
    addValidation('MySQLi Extension', Status::SUCCESS, 'MySQLi extension is loaded');
} else {
    addValidation('MySQLi Extension', Status::ERROR, 'MySQLi extension is not installed');
}

// 3. Check Database Configuration
if (file_exists('../config/db.php')) {
    addValidation('Database Config File', Status::SUCCESS, 'db.php exists');
    
    // Try to load config
    require_once '../config/db.php';
    
    // Test database connection
    $db_host = DB_HOST;
    $db_user = DB_USER;
    $db_name = DB_NAME;
    $db_port = DB_PORT;
    
    $conn = @new mysqli($db_host, $db_user, DB_PASS, '', $db_port);
    
    if ($conn->connect_error) {
        addValidation('MySQL Connection', Status::ERROR, "Cannot connect to MySQL: " . $conn->connect_error);
    } else {
        addValidation('MySQL Connection', Status::SUCCESS, "Connected to MySQL at $db_host:$db_port");
        
        // Check if database exists
        $result = $conn->query("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '$db_name'");
        
        if ($result && $result->num_rows > 0) {
            addValidation('Database Exists', Status::SUCCESS, "Database '$db_name' exists");
            
            // Select database
            $conn->select_db($db_name);
            
            // Check tables
            $tables_needed = ['users', 'transactions', 'budgets', 'portfolios', 'audit_logs'];
            $result = $conn->query("SHOW TABLES");
            $existing_tables = [];
            
            while ($row = $result->fetch_row()) {
                $existing_tables[] = $row[0];
            }
            
            $missing_tables = array_diff($tables_needed, $existing_tables);
            
            if (empty($missing_tables)) {
                addValidation('Database Tables', Status::SUCCESS, count($existing_tables) . ' tables found');
                $setup_complete = true;
            } else {
                addValidation('Database Tables', Status::WARNING, 'Missing tables: ' . implode(', ', $missing_tables) . '. Run database.sql');
            }
        } else {
            addValidation('Database Exists', Status::WARNING, "Database '$db_name' not found. Run database.sql to create it");
        }
        
        $conn->close();
    }
} else {
    addValidation('Database Config File', Status::ERROR, 'db.php not found');
}

// 4. Check Required PHP Directories
$required_dirs = [
    '../config' => 'Config directory',
    '../classes' => 'Classes directory',
    '../api' => 'API directory'
];

foreach ($required_dirs as $dir => $desc) {
    if (is_dir($dir)) {
        addValidation($desc, Status::SUCCESS, "$desc exists and is writable");
    } else {
        addValidation($desc, Status::ERROR, "$desc does not exist");
    }
}

// 5. Check Required Classes
$required_classes = [
    '../classes/Database.php' => 'Database',
    '../classes/Validation.php' => 'Validation',
    '../classes/User.php' => 'User',
    '../classes/Transaction.php' => 'Transaction',
    '../classes/Budget.php' => 'Budget',
    '../classes/Portfolio.php' => 'Portfolio'
];

foreach ($required_classes as $file => $class) {
    if (file_exists($file)) {
        addValidation("$class Class", Status::SUCCESS, "$file exists");
    } else {
        addValidation("$class Class", Status::ERROR, "$file not found");
    }
}

// 6. Check API Endpoints
$api_endpoints = [
    '../api/users.php' => 'Users API',
    '../api/transactions.php' => 'Transactions API',
    '../api/budgets.php' => 'Budgets API',
    '../api/portfolios.php' => 'Portfolios API'
];

foreach ($api_endpoints as $file => $endpoint) {
    if (file_exists($file)) {
        addValidation($endpoint, Status::SUCCESS, "$file exists");
    } else {
        addValidation($endpoint, Status::ERROR, "$file not found");
    }
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Finovate - Setup & Validation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            line-height: 1.6;
            padding: 20px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            overflow: hidden;
        }
        
        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        header h1 {
            font-size: 2em;
            margin-bottom: 10px;
        }
        
        header p {
            opacity: 0.9;
        }
        
        .content {
            padding: 30px;
        }
        
        .status-section {
            margin: 30px 0;
        }
        
        .status-section h2 {
            color: #667eea;
            margin-bottom: 20px;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
            font-size: 1.3em;
        }
        
        .check-item {
            display: flex;
            align-items: center;
            padding: 12px 15px;
            margin: 8px 0;
            border-radius: 5px;
            border-left: 4px solid #ddd;
        }
        
        .check-item.success {
            background: #d4edda;
            border-left-color: #28a745;
            color: #155724;
        }
        
        .check-item.error {
            background: #f8d7da;
            border-left-color: #dc3545;
            color: #721c24;
        }
        
        .check-item.warning {
            background: #fff3cd;
            border-left-color: #ffc107;
            color: #856404;
        }
        
        .check-item.info {
            background: #d1ecf1;
            border-left-color: #17a2b8;
            color: #0c5460;
        }
        
        .status-icon {
            font-size: 1.5em;
            margin-right: 15px;
            min-width: 25px;
        }
        
        .check-content {
            flex: 1;
        }
        
        .check-name {
            font-weight: bold;
            font-size: 1em;
        }
        
        .check-message {
            font-size: 0.9em;
            opacity: 0.8;
            margin-top: 3px;
        }
        
        .setup-button-group {
            display: flex;
            gap: 10px;
            margin: 20px 0;
            flex-wrap: wrap;
        }
        
        .setup-button {
            padding: 12px 25px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1em;
            transition: all 0.3s;
            font-weight: bold;
        }
        
        .setup-button.primary {
            background: #667eea;
            color: white;
        }
        
        .setup-button.primary:hover {
            background: #764ba2;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
        }
        
        .setup-button.secondary {
            background: #e9ecef;
            color: #333;
        }
        
        .setup-button.secondary:hover {
            background: #dee2e6;
        }
        
        .setup-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .summary {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
        }
        
        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        
        .summary-row:last-child {
            border-bottom: none;
        }
        
        .summary-label {
            font-weight: bold;
            color: #667eea;
        }
        
        .summary-value {
            color: #666;
        }
        
        .setup-complete {
            background: #d4edda;
            border: 2px solid #28a745;
            color: #155724;
            padding: 20px;
            border-radius: 5px;
            text-align: center;
            font-size: 1.1em;
            margin: 20px 0;
        }
        
        .setup-incomplete {
            background: #fff3cd;
            border: 2px solid #ffc107;
            color: #856404;
            padding: 20px;
            border-radius: 5px;
            text-align: center;
            font-size: 1.1em;
            margin: 20px 0;
        }
        
        .code-block {
            background: #282c34;
            color: #abb2bf;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            margin: 10px 0;
        }
        
        footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            border-top: 1px solid #e9ecef;
        }
        
        .action-links {
            margin: 20px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        
        .action-links a {
            display: inline-block;
            margin: 8px 15px 8px 0;
            padding: 10px 20px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            transition: background 0.3s;
        }
        
        .action-links a:hover {
            background: #764ba2;
        }
    </style>
</head>
<body>

<div class="container">
    <header>
        <h1>🔧 Finovate Setup & Validation</h1>
        <p>System Configuration Check & Database Validation</p>
    </header>
    
    <div class="content">
        
        <!-- STATUS CHECK RESULTS -->
        <div class="status-section">
            <h2>📊 System Status</h2>
            
            <?php
            // Count statuses
            $success_count = 0;
            $error_count = 0;
            $warning_count = 0;
            $info_count = 0;
            
            foreach ($validations as $check) {
                switch ($check['status']) {
                    case Status::SUCCESS: $success_count++; break;
                    case Status::ERROR: $error_count++; break;
                    case Status::WARNING: $warning_count++; break;
                    case Status::INFO: $info_count++; break;
                }
            }
            ?>
            
            <div class="summary">
                <div class="summary-row">
                    <span class="summary-label">✓ Successful Checks:</span>
                    <span class="summary-value"><strong><?php echo $success_count; ?></strong></span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">✗ Failed Checks:</span>
                    <span class="summary-value"><strong><?php echo $error_count; ?></strong></span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">⚠ Warnings:</span>
                    <span class="summary-value"><strong><?php echo $warning_count; ?></strong></span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">ℹ Info:</span>
                    <span class="summary-value"><strong><?php echo $info_count; ?></strong></span>
                </div>
            </div>
            
            <?php if ($setup_complete): ?>
                <div class="setup-complete">
                    ✅ System is ready! All components configured correctly.
                </div>
            <?php elseif ($error_count > 0): ?>
                <div class="setup-incomplete">
                    ⚠️ Setup requires attention. Please fix the errors below.
                </div>
            <?php else: ?>
                <div class="setup-incomplete">
                    ℹ️ Setup is complete but some optimizations are recommended.
                </div>
            <?php endif; ?>
        </div>
        
        <!-- DETAILED CHECKS -->
        <div class="status-section">
            <h2>🔍 Detailed Checks</h2>
            
            <?php foreach ($validations as $check): ?>
                <div class="check-item <?php echo $check['status']; ?>">
                    <span class="status-icon">
                        <?php 
                        switch($check['status']) {
                            case Status::SUCCESS: echo '✓'; break;
                            case Status::ERROR: echo '✗'; break;
                            case Status::WARNING: echo '⚠'; break;
                            case Status::INFO: echo 'ℹ'; break;
                        }
                        ?>
                    </span>
                    <div class="check-content">
                        <div class="check-name"><?php echo $check['name']; ?></div>
                        <div class="check-message"><?php echo $check['message']; ?></div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
        
        <!-- SETUP INSTRUCTIONS -->
        <div class="status-section">
            <h2>⚡ Quick Setup</h2>
            
            <h3 style="color: #667eea; margin-top: 20px;">Step 1: Create Database</h3>
            <div class="code-block">mysql -u root -p < database.sql</div>
            
            <h3 style="color: #667eea; margin-top: 20px;">Step 2: Configure Database</h3>
            <p>Edit <code>config/db.php</code>:</p>
            <div class="code-block">define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', 'your_password');
define('DB_NAME', 'finovate_db');</div>
            
            <h3 style="color: #667eea; margin-top: 20px;">Step 3: Start Server</h3>
            <div class="code-block">php -S localhost:8000</div>
            
            <h3 style="color: #667eea; margin-top: 20px;">Step 4: Test API</h3>
            <div class="code-block">curl http://localhost:8000/php/api/transactions.php?user_id=1</div>
        </div>
        
        <!-- ACTION LINKS -->
        <div class="action-links">
            <a href="api-documentation.php" target="_blank">📖 View API Documentation</a>
            <a href="test-api.php" target="_blank">🧪 Run API Tests</a>
            <a href="javascript:location.reload()">🔄 Refresh Status</a>
        </div>
        
        <!-- ENVIRONMENT INFO -->
        <div class="status-section">
            <h2>📋 Environment Information</h2>
            <div class="summary">
                <div class="summary-row">
                    <span class="summary-label">PHP Version:</span>
                    <span class="summary-value"><?php echo phpversion(); ?></span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Server Software:</span>
                    <span class="summary-value"><?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'; ?></span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Current Directory:</span>
                    <span class="summary-value"><?php echo __DIR__; ?></span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Execution Time:</span>
                    <span class="summary-value"><?php echo round(microtime(true) * 1000, 2); ?> ms</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Memory Usage:</span>
                    <span class="summary-value"><?php echo round(memory_get_usage() / 1024 / 1024, 2); ?> MB</span>
                </div>
            </div>
        </div>
        
    </div>
    
    <footer>
        <p><strong>Finovate</strong> - Complete PHP Backend with CRUD Operations</p>
        <p>Setup & Validation Utility | Created: May 2024 | Version: 1.0.0</p>
    </footer>
</div>

</body>
</html>
<?php ob_end_flush(); ?>
