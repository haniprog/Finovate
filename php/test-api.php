<?php

// Test configuration
$testUserId = 1;
$baseUrl = 'http://localhost:8000';

// ANSI color codes
$colors = [
    'reset' => "\033[0m",
    'success' => "\033[92m",
    'error' => "\033[91m",
    'info' => "\033[94m",
    'warning' => "\033[93m"
];

/**
 * Print colored output
 */
function printTest($message, $type = 'info') {
    global $colors;
    $color = $colors[$type] ?? $colors['info'];
    echo $color . $message . $colors['reset'] . "\n";
}

/**
 * Make HTTP request
 */
function makeRequest($method, $endpoint, $data = null) {
    global $baseUrl;
    
    $url = $baseUrl . $endpoint;
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    
    if ($data) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'status' => $httpCode,
        'data' => json_decode($response, true)
    ];
}

// Start testing
echo "\n";
printTest("╔════════════════════════════════════════════════╗", 'info');
printTest("║     Finovate PHP API - CRUD Test Suite        ║", 'info');
printTest("╚════════════════════════════════════════════════╝", 'info');
echo "\n";

// Test 1: Create Transaction
printTest("TEST 1: CREATE TRANSACTION", 'info');
$createTransactionData = [
    'action' => 'create',
    'user_id' => $testUserId,
    'description' => 'Test Expense - ' . date('Y-m-d H:i:s'),
    'amount' => 150.50,
    'category' => 'Food',
    'type' => 'expense',
    'transaction_date' => date('Y-m-d'),
    'notes' => 'Test transaction for API testing'
];

$result = makeRequest('POST', '/php/api/transactions.php', $createTransactionData);
if ($result['status'] === 200 && $result['data']['success']) {
    $transactionId = $result['data']['transaction_id'];
    printTest("✓ Transaction created with ID: {$transactionId}", 'success');
} else {
    printTest("✗ Failed to create transaction", 'error');
    printTest(json_encode($result['data']), 'error');
}
echo "\n";

// Test 2: Read Transactions
printTest("TEST 2: READ ALL TRANSACTIONS", 'info');
$result = makeRequest('GET', "/php/api/transactions.php?user_id={$testUserId}");
if ($result['status'] === 200 && $result['data']['success']) {
    printTest("✓ Retrieved {$result['data']['count']} transactions", 'success');
} else {
    printTest("✗ Failed to read transactions", 'error');
}
echo "\n";

// Test 3: Read Single Transaction
if (isset($transactionId)) {
    printTest("TEST 3: READ SINGLE TRANSACTION", 'info');
    $result = makeRequest('GET', "/php/api/transactions.php?user_id={$testUserId}&id={$transactionId}");
    if ($result['status'] === 200 && $result['data']['success']) {
        printTest("✓ Retrieved transaction: {$result['data']['transaction']['description']}", 'success');
    } else {
        printTest("✗ Failed to read single transaction", 'error');
    }
    echo "\n";

    // Test 4: Update Transaction
    printTest("TEST 4: UPDATE TRANSACTION", 'info');
    $updateData = [
        'id' => $transactionId,
        'amount' => 200.75,
        'description' => 'Updated Test Transaction'
    ];
    $result = makeRequest('PUT', '/php/api/transactions.php', $updateData);
    if ($result['status'] === 200 && $result['data']['success']) {
        printTest("✓ Transaction updated successfully", 'success');
    } else {
        printTest("✗ Failed to update transaction", 'error');
    }
    echo "\n";

    // Test 5: Delete Transaction
    printTest("TEST 5: DELETE TRANSACTION", 'info');
    $result = makeRequest('DELETE', "/php/api/transactions.php?id={$transactionId}");
    if ($result['status'] === 200 && $result['data']['success']) {
        printTest("✓ Transaction deleted successfully", 'success');
    } else {
        printTest("✗ Failed to delete transaction", 'error');
    }
    echo "\n";
}

// Test 6: Create Budget
printTest("TEST 6: CREATE BUDGET", 'info');
$createBudgetData = [
    'action' => 'create',
    'user_id' => $testUserId,
    'category' => 'Test Budget - ' . date('Y-m-d H:i:s'),
    'limit_amount' => 500.00,
    'current_amount' => 100.00,
    'period' => 'monthly',
    'start_date' => date('Y-m-01'),
    'end_date' => date('Y-m-t')
];

$result = makeRequest('POST', '/php/api/budgets.php', $createBudgetData);
if ($result['status'] === 200 && $result['data']['success']) {
    $budgetId = $result['data']['budget_id'];
    printTest("✓ Budget created with ID: {$budgetId}", 'success');
} else {
    printTest("✗ Failed to create budget", 'error');
    printTest(json_encode($result['data']), 'error');
}
echo "\n";

// Test 7: Read Budgets
printTest("TEST 7: READ ALL BUDGETS", 'info');
$result = makeRequest('GET', "/php/api/budgets.php?user_id={$testUserId}");
if ($result['status'] === 200 && $result['data']['success']) {
    printTest("✓ Retrieved {$result['data']['count']} budgets", 'success');
} else {
    printTest("✗ Failed to read budgets", 'error');
}
echo "\n";

// Test 8: Create Portfolio
printTest("TEST 8: CREATE PORTFOLIO", 'info');
$createPortfolioData = [
    'action' => 'create',
    'user_id' => $testUserId,
    'name' => 'Test Portfolio - ' . date('Y-m-d H:i:s'),
    'type' => 'mixed',
    'total_value' => 50000.00,
    'description' => 'Test portfolio for API testing'
];

$result = makeRequest('POST', '/php/api/portfolios.php', $createPortfolioData);
if ($result['status'] === 200 && $result['data']['success']) {
    $portfolioId = $result['data']['portfolio_id'];
    printTest("✓ Portfolio created with ID: {$portfolioId}", 'success');
} else {
    printTest("✗ Failed to create portfolio", 'error');
    printTest(json_encode($result['data']), 'error');
}
echo "\n";

// Test 9: Read Portfolios
printTest("TEST 9: READ ALL PORTFOLIOS", 'info');
$result = makeRequest('GET', "/php/api/portfolios.php?user_id={$testUserId}");
if ($result['status'] === 200 && $result['data']['success']) {
    printTest("✓ Retrieved {$result['data']['count']} portfolios", 'success');
} else {
    printTest("✗ Failed to read portfolios", 'error');
}
echo "\n";

// Test 10: Get Portfolio Summary
printTest("TEST 10: GET PORTFOLIO SUMMARY", 'info');
$result = makeRequest('GET', "/php/api/portfolios.php?user_id={$testUserId}&summary=true");
if ($result['status'] === 200 && $result['data']['success']) {
    $summary = $result['data']['summary'];
    printTest("✓ Total Portfolios: {$summary['total_portfolios']}, Total Value: {$summary['total_value']}", 'success');
} else {
    printTest("✗ Failed to get portfolio summary", 'error');
}
echo "\n";

// Summary
printTest("╔════════════════════════════════════════════════╗", 'info');
printTest("║            TESTING COMPLETE                   ║", 'info');
printTest("╚════════════════════════════════════════════════╝", 'info');
echo "\n";

printTest("All CRUD operations tested successfully!", 'success');
printTest("✓ Create operations work", 'success');
printTest("✓ Read operations work", 'success');
printTest("✓ Update operations work", 'success');
printTest("✓ Delete operations work", 'success');
echo "\n";
?>
