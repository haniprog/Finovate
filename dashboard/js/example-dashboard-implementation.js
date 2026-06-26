/**
 * Example Dashboard Implementation
 * Shows how to use the improved API client with loading states and error handling
 */

/**
 * Initialize dashboard with all data loaded
 */
async function initializeDashboard() {
    console.log('Initializing dashboard...');
    
    // Load all dashboard sections
    await Promise.all([
        loadRecentTransactions(),
        loadBudgetOverview(),
        loadPortfolioSummary(),
        loadAlerts()
    ]);
    
    console.log('Dashboard initialized');
}

/**
 * Load Recent Transactions
 */
async function loadRecentTransactions() {
    const container = document.getElementById('recent-transactions-container');
    if (!container) return;
    
    try {
        showLoadingState(container);
        
        // Fetch transactions
        const response = await FINOVATE_API.transactions.getAll(10, 0);
        
        if (!response.data || !Array.isArray(response.data)) {
            throw new Error('Invalid transactions data');
        }
        
        // Show only recent 5
        const recentTransactions = response.data.slice(0, 5);
        
        if (!recentTransactions.length) {
            container.innerHTML = '<p class="empty-state">No transactions yet</p>';
            return;
        }
        
        // Build table
        const html = buildTableHTML(
            recentTransactions,
            ['description', 'amount', 'category', 'transaction_date'],
            {
                'description': 'Description',
                'amount': 'Amount (₱)',
                'category': 'Category',
                'transaction_date': 'Date'
            }
        );
        
        container.innerHTML = html;
        showSuccessMessage(container, `Loaded ${recentTransactions.length} recent transactions`);
        
    } catch (error) {
        console.error('Failed to load transactions:', error);
        showErrorMessage(container, error.message);
    }
}

/**
 * Load Budget Overview
 */
async function loadBudgetOverview() {
    const container = document.getElementById('budget-overview-container');
    if (!container) return;
    
    try {
        showLoadingState(container);
        
        // Fetch budgets
        const response = await FINOVATE_API.budgets.getAll();
        
        if (!response.data || !Array.isArray(response.data)) {
            throw new Error('Invalid budget data');
        }
        
        if (!response.data.length) {
            container.innerHTML = '<p class="empty-state">No budgets created yet</p>';
            return;
        }
        
        // Build cards
        const html = buildCardsHTML(
            response.data.slice(0, 6),  // Show top 6
            ['limit_amount', 'spent_amount', 'period'],
            'category'
        );
        
        container.innerHTML = html;
        showSuccessMessage(container, `Loaded ${response.data.length} budgets`);
        
    } catch (error) {
        console.error('Failed to load budgets:', error);
        showErrorMessage(container, error.message);
    }
}

/**
 * Load Portfolio Summary
 */
async function loadPortfolioSummary() {
    const container = document.getElementById('portfolio-container');
    if (!container) return;
    
    try {
        showLoadingState(container);
        
        // Fetch portfolio
        const response = await FINOVATE_API.portfolios.getSummary();
        
        if (!response.success || !response.summary) {
            throw new Error('Failed to load portfolio');
        }
        
        // Build cards from summary
        const html = buildCardsHTML(
            [response.summary],
            ['total_value', 'gain_loss', 'allocation', 'performance'],
            'name'
        );
        
        container.innerHTML = html;
        showSuccessMessage(container, 'Portfolio loaded');
        
    } catch (error) {
        console.error('Failed to load portfolio:', error);
        showErrorMessage(container, error.message);
    }
}

/**
 * Load Alerts
 */
async function loadAlerts() {
    const container = document.getElementById('alerts-container');
    if (!container) return;
    
    try {
        showLoadingState(container);
        
        // Fetch alerts (using transactions as a proxy)
        const response = await FINOVATE_API.transactions.getAll();
        
        if (!response.data?.length) {
            container.innerHTML = '<p class="empty-state">No alerts</p>';
            return;
        }
        
        // Build list
        const alerts = response.data.map(t => 
            `${t.category}: ${t.description} (₱${t.amount})`
        );
        
        const html = buildListHTML(alerts);
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Failed to load alerts:', error);
        showErrorMessage(container, error.message);
    }
}

/**
 * Refresh dashboard data
 */
async function refreshDashboard() {
    console.log('Refreshing dashboard...');
    await initializeDashboard();
}

/**
 * Search transactions
 */
async function searchTransactions(query) {
    const container = document.getElementById('search-results-container');
    if (!container || !query.trim()) return;
    
    try {
        showLoadingState(container);
        
        // Fetch all and filter
        const response = await FINOVATE_API.transactions.getAll(100, 0);
        
        if (!response.data?.length) {
            container.innerHTML = '<p>No results found</p>';
            return;
        }
        
        // Filter by description or category
        const results = response.data.filter(t =>
            t.description.toLowerCase().includes(query.toLowerCase()) ||
            t.category.toLowerCase().includes(query.toLowerCase())
        );
        
        if (!results.length) {
            container.innerHTML = '<p>No transactions match your search</p>';
            return;
        }
        
        const html = buildTableHTML(
            results,
            ['description', 'amount', 'category', 'transaction_date']
        );
        
        container.innerHTML = html;
        showSuccessMessage(container, `Found ${results.length} results`);
        
    } catch (error) {
        showErrorMessage(container, error.message);
    }
}

/**
 * Create new transaction
 */
async function createTransaction(formData) {
    const container = document.getElementById('transaction-form-feedback');
    if (!container) return;
    
    try {
        // Validate form data
        if (!formData.description || !formData.amount || !formData.category) {
            throw new Error('All fields are required');
        }
        
        if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
            throw new Error('Amount must be a positive number');
        }
        
        // Create transaction
        const response = await FINOVATE_API.transactions.create(formData, container);
        
        if (response.success) {
            showSuccessMessage(container, 'Transaction created successfully!');
            
            // Clear form
            document.getElementById('transaction-form')?.reset();
            
            // Refresh transactions list
            await loadRecentTransactions();
        } else {
            throw new Error(response.message || 'Failed to create transaction');
        }
        
    } catch (error) {
        showErrorMessage(container, error.message);
    }
}

/**
 * Create new budget
 */
async function createBudget(formData) {
    const container = document.getElementById('budget-form-feedback');
    if (!container) return;
    
    try {
        // Validate
        if (!formData.category || !formData.limit_amount) {
            throw new Error('Category and limit are required');
        }
        
        // Create budget
        const response = await FINOVATE_API.budgets.create(formData, container);
        
        if (response.success) {
            showSuccessMessage(container, 'Budget created successfully!');
            document.getElementById('budget-form')?.reset();
            await loadBudgetOverview();
        } else {
            throw new Error(response.message || 'Failed to create budget');
        }
        
    } catch (error) {
        showErrorMessage(container, error.message);
    }
}

/**
 * Delete transaction with confirmation
 */
async function deleteTransaction(transactionId) {
    if (!confirm('Are you sure you want to delete this transaction?')) {
        return;
    }
    
    const container = document.getElementById('transaction-action-feedback');
    
    try {
        showLoadingState(container || 'body');
        
        const response = await FINOVATE_API.transactions.delete(transactionId);
        
        if (response.success) {
            showSuccessMessage(container || 'body', 'Transaction deleted successfully');
            await loadRecentTransactions();
        } else {
            throw new Error(response.message || 'Failed to delete transaction');
        }
        
    } catch (error) {
        showErrorMessage(container || 'body', error.message);
    }
}

/**
 * Update transaction
 */
async function updateTransaction(transactionId, updateData) {
    const container = document.getElementById('transaction-action-feedback');
    
    try {
        showLoadingState(container || 'body');
        
        const response = await FINOVATE_API.transactions.update(transactionId, updateData);
        
        if (response.success) {
            showSuccessMessage(container || 'body', 'Transaction updated successfully');
            await loadRecentTransactions();
        } else {
            throw new Error(response.message || 'Failed to update transaction');
        }
        
    } catch (error) {
        showErrorMessage(container || 'body', error.message);
    }
}

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    // Refresh button
    document.getElementById('refresh-btn')?.addEventListener('click', refreshDashboard);
    
    // Transaction form
    document.getElementById('transaction-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        createTransaction(Object.fromEntries(formData));
    });
    
    // Budget form
    document.getElementById('budget-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        createBudget(Object.fromEntries(formData));
    });
    
    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('keyup', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchTransactions(e.target.value);
            }, 300); // Debounce 300ms
        });
    }
}

/**
 * Page initialization
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, initializing...');
    initializeEventListeners();
    initializeDashboard();
});

// Optional: Auto-refresh every 30 seconds
// setInterval(refreshDashboard, 30000);
