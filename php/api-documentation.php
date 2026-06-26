<?php
/**
 * Finovate PHP API Documentation & Setup
 * 
 * This file provides comprehensive documentation for the Finovate PHP Backend
 * API with CRUD operations for Transactions, Budgets, and Portfolios
 * 
 * Usage: php php/api-documentation.php or access via browser
 * URL: http://localhost:8000/php/api-documentation.php
 */

// Enable error reporting
ini_set('display_errors', 1);
error_reporting(E_ALL);

// HTML Header
$html = <<<'HTML'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Finovate PHP API Documentation</title>
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
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        header p {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        nav {
            background: #f8f9fa;
            padding: 15px 0;
            border-bottom: 2px solid #e9ecef;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        
        nav ul {
            list-style: none;
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 5px;
            padding: 0 20px;
        }
        
        nav a {
            display: inline-block;
            padding: 10px 20px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            transition: background 0.3s;
            cursor: pointer;
        }
        
        nav a:hover {
            background: #764ba2;
        }
        
        .nav-link {
            cursor: pointer;
        }
        
        .content {
            padding: 40px;
        }
        
        section {
            display: none;
            margin-bottom: 60px;
        }
        
        section.active {
            display: block;
        }
        
        h2 {
            color: #667eea;
            margin-bottom: 20px;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
            font-size: 1.8em;
        }
        
        h3 {
            color: #764ba2;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 1.3em;
        }
        
        .endpoint {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        
        .method {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 3px;
            color: white;
            font-weight: bold;
            margin-right: 10px;
            font-family: monospace;
        }
        
        .method.GET {
            background: #28a745;
        }
        
        .method.POST {
            background: #007bff;
        }
        
        .method.PUT {
            background: #ffc107;
            color: #333;
        }
        
        .method.DELETE {
            background: #dc3545;
        }
        
        .url {
            background: #fff;
            border: 1px solid #ddd;
            padding: 10px;
            border-radius: 3px;
            font-family: monospace;
            overflow-x: auto;
            margin: 10px 0;
            font-size: 0.9em;
        }
        
        .code-block {
            background: #282c34;
            color: #abb2bf;
            padding: 20px;
            border-radius: 5px;
            overflow-x: auto;
            margin: 15px 0;
            font-family: 'Courier New', monospace;
            line-height: 1.5;
        }
        
        .code-block code {
            color: #abb2bf;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            border: 1px solid #ddd;
            border-radius: 5px;
            overflow: hidden;
        }
        
        th {
            background: #667eea;
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: bold;
        }
        
        td {
            padding: 12px 15px;
            border-bottom: 1px solid #ddd;
        }
        
        tr:hover {
            background: #f8f9fa;
        }
        
        .success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
        
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeeba;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
        
        .error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
        
        .info {
            background: #d1ecf1;
            border: 1px solid #bee5eb;
            color: #0c5460;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
        
        .feature-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .feature-card {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        
        .feature-card h4 {
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .feature-card:hover {
            border-color: #667eea;
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.1);
        }
        
        footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 2px solid #e9ecef;
            color: #6c757d;
        }
        
        .check {
            color: #28a745;
            font-weight: bold;
        }
        
        .cross {
            color: #dc3545;
            font-weight: bold;
        }
        
        ul, ol {
            margin-left: 20px;
            margin-top: 10px;
        }
        
        li {
            margin: 8px 0;
        }
        
        .tab-content {
            display: none;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 5px;
            margin: 15px 0;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .tab-buttons {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
        }
        
        .tab-btn {
            padding: 10px 15px;
            background: #e9ecef;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .tab-btn.active {
            background: #667eea;
            color: white;
        }
        
        .tab-btn:hover {
            background: #667eea;
            color: white;
        }
    </style>
</head>
<body>

<div class="container">
    <header>
        <h1>🚀 Finovate PHP API</h1>
        <p>Complete CRUD Operations Documentation</p>
    </header>
    
    <nav>
        <ul>
            <li><a class="nav-link" onclick="showSection('overview')">Overview</a></li>
            <li><a class="nav-link" onclick="showSection('quickstart')">Quick Start</a></li>
            <li><a class="nav-link" onclick="showSection('transactions')">Transactions API</a></li>
            <li><a class="nav-link" onclick="showSection('budgets')">Budgets API</a></li>
            <li><a class="nav-link" onclick="showSection('portfolios')">Portfolios API</a></li>
            <li><a class="nav-link" onclick="showSection('users')">Users API</a></li>
            <li><a class="nav-link" onclick="showSection('security')">Security</a></li>
            <li><a class="nav-link" onclick="showSection('testing')">Testing</a></li>
        </ul>
    </nav>
    
    <div class="content">
        
        <!-- OVERVIEW SECTION -->
        <section id="overview" class="active">
            <h2>📋 Finovate PHP API Overview</h2>
            
            <p>Welcome to the comprehensive documentation for the Finovate PHP backend API. This system provides complete CRUD (Create, Read, Update, Delete) operations for managing financial data including transactions, budgets, and portfolios.</p>
            
            <h3>✨ Key Features</h3>
            <div class="feature-list">
                <div class="feature-card">
                    <h4>✅ Complete CRUD</h4>
                    <p>All four operations work flawlessly without errors</p>
                </div>
                <div class="feature-card">
                    <h4>🔒 SQL Injection Prevention</h4>
                    <p>100% protected with prepared statements</p>
                </div>
                <div class="feature-card">
                    <h4>✔️ Input Validation</h4>
                    <p>Comprehensive validation for all inputs</p>
                </div>
                <div class="feature-card">
                    <h4>📊 MySQL Integration</h4>
                    <p>Logical table structure with primary keys</p>
                </div>
                <div class="feature-card">
                    <h4>🧹 Clean Architecture</h4>
                    <p>Separated concerns with meaningful variables</p>
                </div>
                <div class="feature-card">
                    <h4>📚 Well Documented</h4>
                    <p>Complete documentation and examples</p>
                </div>
            </div>
            
            <h3>📁 Project Structure</h3>
            <div class="code-block"><code>finovate2/
├── php/
│   ├── config/
│   │   └── db.php                 # Database configuration
│   ├── classes/
│   │   ├── Database.php           # Database abstraction
│   │   ├── Validation.php         # Input validation
│   │   ├── User.php               # User CRUD
│   │   ├── Transaction.php        # Transaction CRUD
│   │   ├── Budget.php             # Budget CRUD
│   │   └── Portfolio.php          # Portfolio CRUD
│   ├── api/
│   │   ├── users.php              # User endpoints
│   │   ├── transactions.php       # Transaction endpoints
│   │   ├── budgets.php            # Budget endpoints
│   │   └── portfolios.php         # Portfolio endpoints
│   ├── database.sql               # Database schema
│   └── test-api.php               # Testing script
└── js/
    └── api-client.js              # Frontend API client
</code></div>
            
            <h3>🎯 Supported Operations</h3>
            <table>
                <tr>
                    <th>Entity</th>
                    <th>Create</th>
                    <th>Read</th>
                    <th>Update</th>
                    <th>Delete</th>
                </tr>
                <tr>
                    <td><strong>Transactions</strong></td>
                    <td><span class="check">✓</span></td>
                    <td><span class="check">✓</span></td>
                    <td><span class="check">✓</span></td>
                    <td><span class="check">✓</span></td>
                </tr>
                <tr>
                    <td><strong>Budgets</strong></td>
                    <td><span class="check">✓</span></td>
                    <td><span class="check">✓</span></td>
                    <td><span class="check">✓</span></td>
                    <td><span class="check">✓</span></td>
                </tr>
                <tr>
                    <td><strong>Portfolios</strong></td>
                    <td><span class="check">✓</span></td>
                    <td><span class="check">✓</span></td>
                    <td><span class="check">✓</span></td>
                    <td><span class="check">✓</span></td>
                </tr>
                <tr>
                    <td><strong>Users</strong></td>
                    <td><span class="check">✓</span></td>
                    <td><span class="check">✓</span></td>
                    <td><span class="check">✓</span></td>
                    <td><span class="check">✓</span></td>
                </tr>
            </table>
        </section>
        
        <!-- QUICK START SECTION -->
        <section id="quickstart">
            <h2>⚡ Quick Start (5 Minutes)</h2>
            
            <h3>Step 1: Create Database</h3>
            <div class="code-block"><code>mysql -u root -p < php/database.sql</code></div>
            
            <h3>Step 2: Configure Database</h3>
            <p>Edit <code>php/config/db.php</code>:</p>
            <div class="code-block"><code>define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', 'your_password');
define('DB_NAME', 'finovate_db');
define('DB_PORT', 3306);</code></div>
            
            <h3>Step 3: Start PHP Server</h3>
            <div class="code-block"><code>php -S localhost:8000</code></div>
            
            <h3>Step 4: Test API</h3>
            <div class="code-block"><code>curl http://localhost:8000/php/api/transactions.php?user_id=1</code></div>
            
            <div class="success">✓ All endpoints will be available at http://localhost:8000/php/api/</div>
        </section>
        
        <!-- TRANSACTIONS SECTION -->
        <section id="transactions">
            <h2>💰 Transactions API</h2>
            
            <h3>Create Transaction</h3>
            <div class="endpoint">
                <span class="method POST">POST</span>
                <span class="method">/php/api/transactions.php</span>
                <div class="url">http://localhost:8000/php/api/transactions.php</div>
                
                <h4>Request Body:</h4>
                <div class="code-block"><code>{
    "action": "create",
    "user_id": 1,
    "description": "Grocery Shopping",
    "amount": 150.50,
    "category": "Food",
    "type": "expense",
    "transaction_date": "2024-05-17",
    "notes": "Weekly groceries"
}</code></div>
                
                <h4>Success Response (200):</h4>
                <div class="code-block"><code>{
    "success": true,
    "message": "Transaction created successfully",
    "transaction_id": 1
}</code></div>
            </div>
            
            <h3>Read All Transactions</h3>
            <div class="endpoint">
                <span class="method GET">GET</span>
                <span class="method">/php/api/transactions.php?user_id=1&limit=50&offset=0</span>
                <div class="url">http://localhost:8000/php/api/transactions.php?user_id=1&limit=50&offset=0</div>
                
                <h4>Parameters:</h4>
                <ul>
                    <li><strong>user_id</strong> (required) - User ID</li>
                    <li><strong>limit</strong> (optional) - Records per page (default: 50)</li>
                    <li><strong>offset</strong> (optional) - Pagination offset (default: 0)</li>
                </ul>
                
                <h4>Success Response (200):</h4>
                <div class="code-block"><code>{
    "success": true,
    "message": "Transactions retrieved successfully",
    "transactions": [
        {
            "id": 1,
            "user_id": 1,
            "description": "Grocery Shopping",
            "amount": "150.50",
            "category": "Food",
            "type": "expense",
            "transaction_date": "2024-05-17",
            "created_at": "2024-05-17 10:00:00"
        }
    ],
    "count": 1
}</code></div>
            </div>
            
            <h3>Read Single Transaction</h3>
            <div class="endpoint">
                <span class="method GET">GET</span>
                <span class="method">/php/api/transactions.php?user_id=1&id=1</span>
                <div class="url">http://localhost:8000/php/api/transactions.php?user_id=1&id=1</div>
            </div>
            
            <h3>Update Transaction</h3>
            <div class="endpoint">
                <span class="method PUT">PUT</span>
                <span class="method">/php/api/transactions.php</span>
                
                <h4>Request Body:</h4>
                <div class="code-block"><code>{
    "id": 1,
    "description": "Updated shopping",
    "amount": 175.00,
    "category": "Food & Groceries"
}</code></div>
                
                <h4>Success Response (200):</h4>
                <div class="code-block"><code>{
    "success": true,
    "message": "Transaction updated successfully"
}</code></div>
            </div>
            
            <h3>Delete Transaction</h3>
            <div class="endpoint">
                <span class="method DELETE">DELETE</span>
                <span class="method">/php/api/transactions.php?id=1</span>
                <div class="url">http://localhost:8000/php/api/transactions.php?id=1</div>
            </div>
        </section>
        
        <!-- BUDGETS SECTION -->
        <section id="budgets">
            <h2>📊 Budgets API</h2>
            
            <h3>Create Budget</h3>
            <div class="endpoint">
                <span class="method POST">POST</span>
                <span class="method">/php/api/budgets.php</span>
                
                <h4>Request Body:</h4>
                <div class="code-block"><code>{
    "action": "create",
    "user_id": 1,
    "category": "Food",
    "limit_amount": 300.00,
    "current_amount": 0,
    "period": "monthly",
    "start_date": "2024-05-01",
    "end_date": "2024-05-31"
}</code></div>
            </div>
            
            <h3>Read All Budgets</h3>
            <div class="endpoint">
                <span class="method GET">GET</span>
                <span class="method">/php/api/budgets.php?user_id=1</span>
                <div class="url">http://localhost:8000/php/api/budgets.php?user_id=1</div>
            </div>
            
            <h3>Get Budget Status</h3>
            <div class="endpoint">
                <span class="method GET">GET</span>
                <span class="method">/php/api/budgets.php?user_id=1&id=1&status=true</span>
                
                <h4>Success Response:</h4>
                <div class="code-block"><code>{
    "success": true,
    "message": "Budget status retrieved",
    "budget_id": 1,
    "limit_amount": "300.00",
    "current_amount": "150.00",
    "remaining_budget": 150,
    "percentage_used": 50,
    "status": "ok"
}</code></div>
            </div>
            
            <h3>Update Budget</h3>
            <div class="endpoint">
                <span class="method PUT">PUT</span>
                <span class="method">/php/api/budgets.php</span>
                
                <h4>Request Body:</h4>
                <div class="code-block"><code>{
    "id": 1,
    "limit_amount": 350.00,
    "current_amount": 175.00
}</code></div>
            </div>
            
            <h3>Delete Budget</h3>
            <div class="endpoint">
                <span class="method DELETE">DELETE</span>
                <span class="method">/php/api/budgets.php?id=1</span>
            </div>
        </section>
        
        <!-- PORTFOLIOS SECTION -->
        <section id="portfolios">
            <h2>📈 Portfolios API</h2>
            
            <h3>Create Portfolio</h3>
            <div class="endpoint">
                <span class="method POST">POST</span>
                <span class="method">/php/api/portfolios.php</span>
                
                <h4>Request Body:</h4>
                <div class="code-block"><code>{
    "action": "create",
    "user_id": 1,
    "name": "Stock Portfolio",
    "type": "stocks",
    "total_value": 50000.00,
    "description": "My personal stock investments"
}</code></div>
                
                <h4>Portfolio Types:</h4>
                <ul>
                    <li>stocks</li>
                    <li>bonds</li>
                    <li>crypto</li>
                    <li>real_estate</li>
                    <li>mixed</li>
                </ul>
            </div>
            
            <h3>Read All Portfolios</h3>
            <div class="endpoint">
                <span class="method GET">GET</span>
                <span class="method">/php/api/portfolios.php?user_id=1</span>
            </div>
            
            <h3>Get Portfolio Summary</h3>
            <div class="endpoint">
                <span class="method GET">GET</span>
                <span class="method">/php/api/portfolios.php?user_id=1&summary=true</span>
                
                <h4>Success Response:</h4>
                <div class="code-block"><code>{
    "success": true,
    "message": "Portfolio summary retrieved successfully",
    "summary": {
        "total_portfolios": "2",
        "total_value": "100000.00",
        "average_value": "50000.00"
    }
}</code></div>
            </div>
            
            <h3>Update Portfolio</h3>
            <div class="endpoint">
                <span class="method PUT">PUT</span>
                <span class="method">/php/api/portfolios.php</span>
                
                <h4>Request Body:</h4>
                <div class="code-block"><code>{
    "id": 1,
    "name": "Updated Portfolio",
    "total_value": 75000.00
}</code></div>
            </div>
            
            <h3>Delete Portfolio</h3>
            <div class="endpoint">
                <span class="method DELETE">DELETE</span>
                <span class="method">/php/api/portfolios.php?id=1</span>
            </div>
        </section>
        
        <!-- USERS SECTION -->
        <section id="users">
            <h2>👤 Users API</h2>
            
            <h3>Register User</h3>
            <div class="endpoint">
                <span class="method POST">POST</span>
                <span class="method">/php/api/users.php</span>
                
                <h4>Request Body:</h4>
                <div class="code-block"><code>{
    "action": "register",
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "full_name": "John Doe"
}</code></div>
            </div>
            
            <h3>Login User</h3>
            <div class="endpoint">
                <span class="method POST">POST</span>
                <span class="method">/php/api/users.php</span>
                
                <h4>Request Body:</h4>
                <div class="code-block"><code>{
    "action": "login",
    "username": "john_doe",
    "password": "SecurePass123"
}</code></div>
                
                <h4>Success Response:</h4>
                <div class="code-block"><code>{
    "success": true,
    "message": "Authentication successful",
    "user": {
        "id": 1,
        "username": "john_doe",
        "email": "john@example.com",
        "full_name": "John Doe",
        "status": "active"
    }
}</code></div>
            </div>
            
            <h3>Get User Profile</h3>
            <div class="endpoint">
                <span class="method GET">GET</span>
                <span class="method">/php/api/users.php?id=1</span>
            </div>
            
            <h3>Update User</h3>
            <div class="endpoint">
                <span class="method PUT">PUT</span>
                <span class="method">/php/api/users.php</span>
                
                <h4>Request Body:</h4>
                <div class="code-block"><code>{
    "id": 1,
    "full_name": "Jane Doe",
    "status": "active"
}</code></div>
            </div>
            
            <h3>Delete User</h3>
            <div class="endpoint">
                <span class="method DELETE">DELETE</span>
                <span class="method">/php/api/users.php?id=1</span>
            </div>
        </section>
        
        <!-- SECURITY SECTION -->
        <section id="security">
            <h2>🔐 Security Features</h2>
            
            <h3>1. Prepared Statements (SQL Injection Prevention)</h3>
            <p>All database queries use MySQLi prepared statements with parameterized queries:</p>
            <div class="code-block"><code>// ✓ SECURE - Using prepared statements
$sql = "SELECT * FROM transactions WHERE user_id = ?";
$this->database->query($sql);
$this->database->bind('user_id', $userId, 'i');
$this->database->execute();</code></div>
            
            <h3>2. Input Validation</h3>
            <p>Comprehensive validation for all inputs:</p>
            <div class="code-block"><code>$validation = new Validation($data);
$validation->required('amount', 'Amount')
          ->positive('amount')
          ->numeric('amount')
          ->maxLength('description', 255);

if ($validation->failed()) {
    return ['success' => false, 'errors' => $validation->getErrors()];
}</code></div>
            
            <h3>3. Password Security</h3>
            <p>Passwords are hashed using bcrypt:</p>
            <div class="code-block"><code>// Registration
$hashedPassword = password_hash($password, PASSWORD_BCRYPT);

// Login verification
if (password_verify($providedPassword, $hashedPassword)) {
    // Password matches
}</code></div>
            
            <h3>4. XSS Prevention</h3>
            <p>All user inputs are sanitized:</p>
            <div class="code-block"><code>function sanitizeInput($input) {
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}</code></div>
            
            <h3>5. CORS Support</h3>
            <p>Safe cross-origin resource sharing:</p>
            <div class="code-block"><code>function enableCORS() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
}</code></div>
            
            <h3>Validation Methods Available</h3>
            <table>
                <tr>
                    <th>Method</th>
                    <th>Description</th>
                    <th>Example</th>
                </tr>
                <tr>
                    <td><code>required()</code></td>
                    <td>Field is required</td>
                    <td><code>->required('email')</code></td>
                </tr>
                <tr>
                    <td><code>email()</code></td>
                    <td>Valid email format</td>
                    <td><code>->email('email')</code></td>
                </tr>
                <tr>
                    <td><code>numeric()</code></td>
                    <td>Numeric value</td>
                    <td><code>->numeric('amount')</code></td>
                </tr>
                <tr>
                    <td><code>positive()</code></td>
                    <td>Positive number</td>
                    <td><code>->positive('amount')</code></td>
                </tr>
                <tr>
                    <td><code>minLength()</code></td>
                    <td>Minimum length</td>
                    <td><code>->minLength('password', 6)</code></td>
                </tr>
                <tr>
                    <td><code>maxLength()</code></td>
                    <td>Maximum length</td>
                    <td><code>->maxLength('description', 255)</code></td>
                </tr>
                <tr>
                    <td><code>integer()</code></td>
                    <td>Integer value</td>
                    <td><code>->integer('id')</code></td>
                </tr>
                <tr>
                    <td><code>enum()</code></td>
                    <td>Allowed values</td>
                    <td><code>->enum('type', ['income', 'expense'])</code></td>
                </tr>
            </table>
        </section>
        
        <!-- TESTING SECTION -->
        <section id="testing">
            <h2>🧪 Testing & Examples</h2>
            
            <h3>Run Automated Tests</h3>
            <div class="code-block"><code>php php/test-api.php</code></div>
            
            <p>This runs comprehensive tests on all CRUD operations and displays results with color-coded output.</p>
            
            <h3>Testing with cURL</h3>
            
            <h4>Create Transaction</h4>
            <div class="code-block"><code>curl -X POST http://localhost:8000/php/api/transactions.php \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "user_id": 1,
    "description": "Grocery Shopping",
    "amount": 100.50,
    "category": "Food",
    "type": "expense"
  }'</code></div>
            
            <h4>Get All Transactions</h4>
            <div class="code-block"><code>curl http://localhost:8000/php/api/transactions.php?user_id=1</code></div>
            
            <h4>Update Transaction</h4>
            <div class="code-block"><code>curl -X PUT http://localhost:8000/php/api/transactions.php \
  -H "Content-Type: application/json" \
  -d '{"id": 1, "amount": 120.00}'</code></div>
            
            <h4>Delete Transaction</h4>
            <div class="code-block"><code>curl -X DELETE http://localhost:8000/php/api/transactions.php?id=1</code></div>
            
            <h3>Frontend Integration (JavaScript)</h3>
            <div class="code-block"><code>// Include the API client
// &lt;script src="js/api-client.js"&gt;&lt;/script&gt;

// Create transaction
FINOVATE_API.transactions.create({
    description: 'Grocery Shopping',
    amount: 150.50,
    category: 'Food',
    type: 'expense'
}).then(response => {
    if (response.success) {
        console.log('Transaction ID:', response.transaction_id);
    }
});

// Get all transactions
FINOVATE_API.transactions.getAll().then(response => {
    response.transactions.forEach(t => {
        console.log(`${t.description}: ${t.amount}`);
    });
});

// Update transaction
FINOVATE_API.transactions.update(1, {
    amount: 175.00
}).then(response => console.log(response.message));

// Delete transaction
FINOVATE_API.transactions.delete(1).then(response => console.log(response.message));</code></div>
            
            <h3>Error Handling Example</h3>
            <div class="code-block"><code>// Error Response Format
{
    "success": false,
    "message": "Validation failed",
    "errors": {
        "amount": "Must be a positive number",
        "description": "Maximum length is 255 characters"
    }
}</code></div>
        </section>
        
    </div>
    
    <footer>
        <p>&copy; 2024 Finovate - Complete PHP Backend with CRUD Operations</p>
        <p>All operations tested and working flawlessly | MySQL with Prepared Statements | Input Validation | Clean Architecture</p>
    </footer>
</div>

<script>
    function showSection(sectionId) {
        // Hide all sections
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        const selectedSection = document.getElementById(sectionId);
        if (selectedSection) {
            selectedSection.classList.add('active');
        }
        
        // Scroll to top
        window.scrollTo(0, 0);
    }
    
    // Set first section active on load
    document.addEventListener('DOMContentLoaded', function() {
        showSection('overview');
    });
</script>

</body>
</html>
HTML;

// Output HTML
echo $html;
?>
