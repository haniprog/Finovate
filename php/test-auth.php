<?php

// Enable error reporting
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Import required files
require_once 'config/db.php';
require_once 'classes/Database.php';
require_once 'classes/Validation.php';
require_once 'classes/User.php';

echo "=== Finovate Authentication Test ===\n\n";

// Test 1: Database Connection
echo "1. Testing Database Connection...\n";
try {
    $db = new Database();
    echo "✓ Database connection successful\n\n";
} catch (Exception $e) {
    echo "✗ Database connection failed: " . $e->getMessage() . "\n\n";
    exit;
}

// Test 2: Create Test User (Registration)
echo "2. Testing User Registration...\n";
$userClass = new User();

$testUser = [
    'username' => 'testuser_' . time(),
    'email' => 'test_' . time() . '@example.com',
    'password' => 'TestPassword123',
    'full_name' => 'Test User'
];

echo "Registering user: {$testUser['username']}\n";
echo "Email: {$testUser['email']}\n";

$registerResult = $userClass->register($testUser);

if ($registerResult['success']) {
    echo "✓ Registration successful\n";
    echo "  User ID: " . $registerResult['user_id'] . "\n";
    $userId = $registerResult['user_id'];
} else {
    echo "✗ Registration failed: " . $registerResult['message'] . "\n";
    if (!empty($registerResult['errors'])) {
        echo "  Errors: " . json_encode($registerResult['errors']) . "\n";
    }
    echo "\n";
    exit;
}
echo "\n";

// Test 3: Login Test
echo "3. Testing User Login...\n";
echo "Username: {$testUser['username']}\n";
echo "Password: {$testUser['password']}\n";

$loginResult = $userClass->authenticate($testUser['username'], $testUser['password']);

if ($loginResult['success']) {
    echo "✓ Login successful\n";
    echo "  User ID: " . $loginResult['user']['id'] . "\n";
    echo "  Username: " . $loginResult['user']['username'] . "\n";
    echo "  Email: " . $loginResult['user']['email'] . "\n";
    echo "  Full Name: " . $loginResult['user']['full_name'] . "\n";
    echo "  Status: " . $loginResult['user']['status'] . "\n";
} else {
    echo "✗ Login failed: " . $loginResult['message'] . "\n";
    if (!empty($loginResult['errors'])) {
        echo "  Errors: " . json_encode($loginResult['errors']) . "\n";
    }
    echo "\n";
    exit;
}
echo "\n";

// Test 4: Read User Profile
echo "4. Testing Read User Profile...\n";
$readResult = $userClass->readById($userId);

if ($readResult['success']) {
    echo "✓ Profile read successful\n";
    echo "  User: " . json_encode($readResult['user']) . "\n";
} else {
    echo "✗ Profile read failed: " . $readResult['message'] . "\n";
}
echo "\n";

// Test 5: Update User Profile
echo "5. Testing Update User Profile...\n";
$updateResult = $userClass->update($userId, [
    'full_name' => 'Updated Test User',
    'status' => 'active'
]);

if ($updateResult['success']) {
    echo "✓ Profile update successful\n";
} else {
    echo "✗ Profile update failed: " . $updateResult['message'] . "\n";
}
echo "\n";

// Test 6: Wrong Password Login
echo "6. Testing Wrong Password Login...\n";
$wrongPasswordResult = $userClass->authenticate($testUser['username'], 'WrongPassword');

if (!$wrongPasswordResult['success']) {
    echo "✓ Wrong password correctly rejected\n";
    echo "  Message: " . $wrongPasswordResult['message'] . "\n";
} else {
    echo "✗ Wrong password was accepted (security issue!)\n";
}
echo "\n";

// Test 7: Nonexistent User Login
echo "7. Testing Nonexistent User Login...\n";
$nonexistentResult = $userClass->authenticate('nonexistentuser_' . time(), 'SomePassword123');

if (!$nonexistentResult['success']) {
    echo "✓ Nonexistent user correctly rejected\n";
    echo "  Message: " . $nonexistentResult['message'] . "\n";
} else {
    echo "✗ Nonexistent user was accepted (security issue!)\n";
}
echo "\n";

// Test 8: Delete User
echo "8. Testing Delete User...\n";
$deleteResult = $userClass->delete($userId);

if ($deleteResult['success']) {
    echo "✓ User deletion successful\n";
} else {
    echo "✗ User deletion failed: " . $deleteResult['message'] . "\n";
}
echo "\n";

// Test 9: Verify User Deleted
echo "9. Testing Verify User Deleted...\n";
$verifyResult = $userClass->readById($userId);

if (!$verifyResult['success']) {
    echo "✓ User correctly removed from database\n";
    echo "  Message: " . $verifyResult['message'] . "\n";
} else {
    echo "✗ User still exists in database (deletion issue!)\n";
}
echo "\n";

echo "=== Authentication Tests Complete ===\n";
?>
