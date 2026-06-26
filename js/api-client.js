
/**
 * Finovate API Client
 * Handles all API communications with robust error handling, loading states, and JSON validation
 */

/**
 * Utility: Show loading state
 * @param {String|Element} target Element selector or DOM element
 * @param {Boolean} show Whether to show loading state
 */
function showLoadingState(target, show = true) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    
    if (show) {
        el.innerHTML = '<div class="loading-spinner"><span class="spinner"></span> Loading...</div>';
        el.classList.add('loading');
    } else {
        el.classList.remove('loading');
    }
}

/**
 * Utility: Show error message
 * @param {String|Element} target Element selector or DOM element
 * @param {String} message Error message to display
 */
function showErrorMessage(target, message) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.setAttribute('role', 'alert');
    errorDiv.innerHTML = `<strong>⚠️ Error:</strong> ${message || 'An error occurred. Please try again.'}`;
    
    el.innerHTML = '';
    el.appendChild(errorDiv);
    el.classList.remove('loading');
}

/**
 * Utility: Show success message
 * @param {String|Element} target Element selector or DOM element
 * @param {String} message Success message to display
 */
function showSuccessMessage(target, message) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.setAttribute('role', 'status');
    successDiv.innerHTML = `<strong>✓ Success:</strong> ${message || 'Operation completed successfully.'}`;
    
    el.appendChild(successDiv);
    
    // Auto-hide success message after 3 seconds
    setTimeout(() => {
        if (successDiv.parentElement) successDiv.remove();
    }, 3000);
}

/**
 * Core fetch wrapper with error handling
 * @param {String} url API endpoint
 * @param {Object} options Fetch options
 * @param {String|Element} loadingTarget Optional loading state target
 * @returns {Promise<Object>} Parsed JSON response
 */
async function safeFetch(url, options = {}, loadingTarget = null) {
    try {
        // Show loading state if target provided
        if (loadingTarget) showLoadingState(loadingTarget);

        const response = await fetch(url, {
            headers: { 'Content-Type': 'application/json' },
            ...options
        });

        // Check if response is ok (status 200-299)
        if (!response.ok) {
            const statusText = response.status === 404 ? 'Not found' : 
                             response.status === 500 ? 'Server error' : 
                             response.statusText || 'Request failed';
            throw new Error(`HTTP ${response.status}: ${statusText}`);
        }

        // Parse JSON with validation
        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            throw new Error('Invalid JSON response from server');
        }

        // Validate response structure
        if (data === null || typeof data !== 'object') {
            throw new Error('Invalid response format: expected object');
        }

        return data;

    } catch (error) {
        // Handle network errors
        if (error instanceof TypeError) {
            error.message = 'Network error: Unable to connect to server';
        }
        throw error;
    }
}

const FINOVATE_API = {
    baseUrl: 'http://localhost:8000/php/api',
    userId: 1, // Set from authentication

    /**
     * Transaction Operations
     */
    transactions: {
        /**
         * Create transaction
         * @param {Object} data Transaction data
         * @param {String|Element} loadingTarget Optional loading state target
         * @returns {Promise<Object>}
         */
        create: async function(data, loadingTarget = null) {
            try {
                return await safeFetch(`${FINOVATE_API.baseUrl}/transactions.php`, {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'create',
                        user_id: FINOVATE_API.userId,
                        ...data
                    })
                }, loadingTarget);
            } catch (error) {
                console.error('Transaction creation failed:', error);
                throw error;
            }
        },

        /**
         * Get all transactions
         * @param {Number} limit Records per page
         * @param {Number} offset Pagination offset
         * @param {String|Element} loadingTarget Optional loading state target
         * @returns {Promise<Object>}
         */
        getAll: async function(limit = 50, offset = 0, loadingTarget = null) {
            try {
                const response = await safeFetch(
                    `${FINOVATE_API.baseUrl}/transactions.php?user_id=${FINOVATE_API.userId}&limit=${limit}&offset=${offset}`,
                    {},
                    loadingTarget
                );
                
                // Validate response has expected array structure
                if (!Array.isArray(response.data)) {
                    throw new Error('Expected array of transactions');
                }
                
                return response;
            } catch (error) {
                console.error('Failed to fetch transactions:', error);
                throw error;
            }
        },

        /**
         * Get single transaction
         * @param {Number} id Transaction ID
         * @param {String|Element} loadingTarget Optional loading state target
         * @returns {Promise<Object>}
         */
        getById: async function(id, loadingTarget = null) {
            try {
                if (!id) throw new Error('Transaction ID is required');
                
                return await safeFetch(
                    `${FINOVATE_API.baseUrl}/transactions.php?user_id=${FINOVATE_API.userId}&id=${id}`,
                    {},
                    loadingTarget
                );
            } catch (error) {
                console.error('Failed to fetch transaction:', error);
                throw error;
            }
        },

        /**
         * Update transaction
         * @param {Number} id Transaction ID
         * @param {Object} data Updated data
         * @param {String|Element} loadingTarget Optional loading state target
         * @returns {Promise<Object>}
         */
        update: async function(id, data, loadingTarget = null) {
            try {
                if (!id) throw new Error('Transaction ID is required');
                
                return await safeFetch(`${FINOVATE_API.baseUrl}/transactions.php`, {
                    method: 'PUT',
                    body: JSON.stringify({ id, ...data })
                }, loadingTarget);
            } catch (error) {
                console.error('Transaction update failed:', error);
                throw error;
            }
        },

        /**
         * Delete transaction
         * @param {Number} id Transaction ID
         * @param {String|Element} loadingTarget Optional loading state target
         * @returns {Promise<Object>}
         */
        delete: async function(id, loadingTarget = null) {
            try {
                if (!id) throw new Error('Transaction ID is required');
                
                return await safeFetch(
                    `${FINOVATE_API.baseUrl}/transactions.php?id=${id}`,
                    { method: 'DELETE' },
                    loadingTarget
                );
            } catch (error) {
                console.error('Transaction deletion failed:', error);
                throw error;
            }
        }
    },

    /**
     * Budget Operations
     */
    budgets: {
        /**
         * Create budget
         * @param {Object} data Budget data
         * @param {String|Element} loadingTarget Optional loading state target
         * @returns {Promise<Object>}
         */
        create: async function(data, loadingTarget = null) {
            try {
                return await safeFetch(`${FINOVATE_API.baseUrl}/budgets.php`, {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'create',
                        user_id: FINOVATE_API.userId,
                        ...data
                    })
                }, loadingTarget);
            } catch (error) {
                console.error('Budget creation failed:', error);
                throw error;
            }
        },

        /**
         * Get all budgets
         * @param {String|Element} loadingTarget Optional loading state target
         * @returns {Promise<Object>}
         */
        getAll: async function(loadingTarget = null) {
            try {
                const response = await safeFetch(
                    `${FINOVATE_API.baseUrl}/budgets.php?user_id=${FINOVATE_API.userId}`,
                    {},
                    loadingTarget
                );
                
                // Validate response has expected array structure
                if (!Array.isArray(response.data)) {
                    throw new Error('Expected array of budgets');
                }
                
                return response;
            } catch (error) {
                console.error('Failed to fetch budgets:', error);
                throw error;
            }
        },

        /**
         * Get budget status
         * @param {Number} id Budget ID
         * @param {String|Element} loadingTarget Optional loading state target
         * @returns {Promise<Object>}
         */
        getStatus: async function(id, loadingTarget = null) {
            try {
                if (!id) throw new Error('Budget ID is required');
                
                return await safeFetch(
                    `${FINOVATE_API.baseUrl}/budgets.php?user_id=${FINOVATE_API.userId}&id=${id}&status=true`,
                    {},
                    loadingTarget
                );
            } catch (error) {
                console.error('Failed to fetch budget status:', error);
                throw error;
            }
        },

        /**
         * Update budget
         * @param {Number} id Budget ID
         * @param {Object} data Updated data
         * @param {String|Element} loadingTarget Optional loading state target
         * @returns {Promise<Object>}
         */
        update: async function(id, data, loadingTarget = null) {
            try {
                if (!id) throw new Error('Budget ID is required');
                
                return await safeFetch(`${FINOVATE_API.baseUrl}/budgets.php`, {
                    method: 'PUT',
                    body: JSON.stringify({ id, ...data })
                }, loadingTarget);
            } catch (error) {
                console.error('Budget update failed:', error);
                throw error;
            }
        },

        /**
         * Delete budget
         * @param {Number} id Budget ID
         * @param {String|Element} loadingTarget Optional loading state target
         * @returns {Promise<Object>}
         */
        delete: async function(id, loadingTarget = null) {
            try {
                if (!id) throw new Error('Budget ID is required');
                
                return await safeFetch(
                    `${FINOVATE_API.baseUrl}/budgets.php?id=${id}`,
                    { method: 'DELETE' },
                    loadingTarget
                );
            } catch (error) {
                console.error('Budget deletion failed:', error);
                throw error;
            }
        }
    },

    /**
     * Portfolio Operations
     */
    portfolios: {
        /**
         * Create portfolio
         * @param {Object} data Portfolio data
         * @param {String|Element} loadingTarget Optional loading state target
         * @returns {Promise<Object>}
         */
        create: async function(data, loadingTarget = null) {
            try {
                return await safeFetch(`${FINOVATE_API.baseUrl}/portfolios.php`, {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'create',
                        user_id: FINOVATE_API.userId,
                        ...data
                    })
                }, loadingTarget);
            } catch (error) {
                console.error('Portfolio creation failed:', error);
                throw error;
            }
        },

        /**
         * Get all portfolios
         * @param {String|Element} loadingTarget Optional loading state target
         * @returns {Promise<Object>}
         */
        getAll: async function(loadingTarget = null) {
            try {
                const response = await safeFetch(
                    `${FINOVATE_API.baseUrl}/portfolios.php?user_id=${FINOVATE_API.userId}`,
                    {},
                    loadingTarget
                );
                
                // Validate response has expected array structure
                if (!Array.isArray(response.data)) {
                    throw new Error('Expected array of portfolios');
                }
                
                return response;
            } catch (error) {
                console.error('Failed to fetch portfolios:', error);
                throw error;
            }
        },

        /**
         * Get portfolio summary
         * @param {String|Element} loadingTarget Optional loading state target
         * @returns {Promise<Object>}
         */
        getSummary: async function(loadingTarget = null) {
            try {
                return await safeFetch(
                    `${FINOVATE_API.baseUrl}/portfolios.php?user_id=${FINOVATE_API.userId}&summary=true`,
                    {},
                    loadingTarget
                );
            } catch (error) {
                console.error('Failed to fetch portfolio summary:', error);
                throw error;
            }
        },

        /**
         * Update portfolio
         * @param {Number} id Portfolio ID
         * @param {Object} data Updated data
         * @param {String|Element} loadingTarget Optional loading state target
         * @returns {Promise<Object>}
         */
        update: async function(id, data, loadingTarget = null) {
            try {
                if (!id) throw new Error('Portfolio ID is required');
                
                return await safeFetch(`${FINOVATE_API.baseUrl}/portfolios.php`, {
                    method: 'PUT',
                    body: JSON.stringify({ id, ...data })
                }, loadingTarget);
            } catch (error) {
                console.error('Portfolio update failed:', error);
                throw error;
            }
        },

        /**
         * Delete portfolio
         * @param {Number} id Portfolio ID
         * @param {String|Element} loadingTarget Optional loading state target
         * @returns {Promise<Object>}
         */
        delete: async function(id, loadingTarget = null) {
            try {
                if (!id) throw new Error('Portfolio ID is required');
                
                return await safeFetch(
                    `${FINOVATE_API.baseUrl}/portfolios.php?id=${id}`,
                    { method: 'DELETE' },
                    loadingTarget
                );
            } catch (error) {
                console.error('Portfolio deletion failed:', error);
                throw error;
            }
        }
    },

    /**
     * User Operations
     */
    users: {
        /**
         * Register new user
         * @param {Object} data User data
         * @param {String|Element} loadingTarget Optional loading state target
         * @returns {Promise<Object>}
         */
        register: async function(data, loadingTarget = null) {
            try {
                if (!data.username || !data.email || !data.password) {
                    throw new Error('Username, email, and password are required');
                }
                
                return await safeFetch(`${FINOVATE_API.baseUrl}/users.php`, {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'register',
                        ...data
                    })
                }, loadingTarget);
            } catch (error) {
                console.error('Registration failed:', error);
                throw error;
            }
        },

        /**
         * Login user
         * @param {String} username Username or email
         * @param {String} password Password
         * @param {String|Element} loadingTarget Optional loading state target
         * @returns {Promise<Object>}
         */
        login: async function(username, password, loadingTarget = null) {
            try {
                if (!username || !password) {
                    throw new Error('Username and password are required');
                }
                
                return await safeFetch(`${FINOVATE_API.baseUrl}/users.php`, {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'login',
                        username,
                        password
                    })
                }, loadingTarget);
            } catch (error) {
                console.error('Login failed:', error);
                throw error;
            }
        },

        /**
         * Get user profile
         * @param {Number} id User ID
         * @param {String|Element} loadingTarget Optional loading state target
         * @returns {Promise<Object>}
         */
        getProfile: async function(id, loadingTarget = null) {
            try {
                if (!id) throw new Error('User ID is required');
                
                return await safeFetch(
                    `${FINOVATE_API.baseUrl}/users.php?id=${id}`,
                    {},
                    loadingTarget
                );
            } catch (error) {
                console.error('Failed to fetch user profile:', error);
                throw error;
            }
        },

        /**
         * Update user profile
         * @param {Number} id User ID
         * @param {Object} data Updated data
         * @param {String|Element} loadingTarget Optional loading state target
         * @returns {Promise<Object>}
         */
        update: async function(id, data, loadingTarget = null) {
            try {
                if (!id) throw new Error('User ID is required');
                
                return await safeFetch(`${FINOVATE_API.baseUrl}/users.php`, {
                    method: 'PUT',
                    body: JSON.stringify({ id, ...data })
                }, loadingTarget);
            } catch (error) {
                console.error('Profile update failed:', error);
                throw error;
            }
        }
    }
};

/**
 * HTML Generation Utilities
 * Dynamically generate HTML content from JSON data
 */

/**
 * Build HTML table from array of objects
 * @param {Array<Object>} data Array of data objects
 * @param {Array<String>} columns Column keys to display
 * @param {Object} columnLabels Optional column label mapping
 * @returns {String} HTML table string
 */
function buildTableHTML(data, columns, columnLabels = {}) {
    if (!Array.isArray(data) || !data.length) {
        return '<p>No data available</p>';
    }

    // Validate data structure
    if (typeof data[0] !== 'object') {
        throw new Error('Data must be an array of objects');
    }

    let html = '<table class="data-table"><thead><tr>';
    
    // Build header
    columns.forEach(col => {
        const label = columnLabels[col] || col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, ' ');
        html += `<th>${label}</th>`;
    });
    html += '</tr></thead><tbody>';

    // Build rows
    data.forEach(row => {
        html += '<tr>';
        columns.forEach(col => {
            const value = row[col] !== undefined ? row[col] : '—';
            html += `<td>${String(value).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
}

/**
 * Build HTML list from array of items
 * @param {Array} items Array of items or objects
 * @param {String} itemKey Optional key to extract from objects
 * @returns {String} HTML list string
 */
function buildListHTML(items, itemKey = null) {
    if (!Array.isArray(items) || !items.length) {
        return '<p>No items available</p>';
    }

    let html = '<ul class="data-list">';
    
    items.forEach(item => {
        let content = item;
        
        // Extract value if object
        if (typeof item === 'object' && item !== null) {
            if (itemKey && item[itemKey]) {
                content = item[itemKey];
            } else {
                content = JSON.stringify(item);
            }
        }
        
        // Escape HTML
        content = String(content).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html += `<li>${content}</li>`;
    });

    html += '</ul>';
    return html;
}

/**
 * Build HTML cards from array of objects
 * @param {Array<Object>} data Array of data objects
 * @param {Array<String>} fields Fields to display in each card
 * @param {String} titleField Field to use as card title
 * @returns {String} HTML cards string
 */
function buildCardsHTML(data, fields, titleField = 'title') {
    if (!Array.isArray(data) || !data.length) {
        return '<p>No items to display</p>';
    }

    let html = '<div class="cards-grid">';
    
    data.forEach(item => {
        const title = item[titleField] || 'Item';
        html += `<div class="card"><h3>${String(title).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h3><div class="card-content">`;
        
        fields.forEach(field => {
            const value = item[field];
            if (value !== undefined) {
                const label = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
                const displayValue = String(value).replace(/</g, '&lt;').replace(/>/g, '&gt;');
                html += `<p><strong>${label}:</strong> ${displayValue}</p>`;
            }
        });
        
        html += '</div></div>';
    });

    html += '</div>';
    return html;
}

/**
 * Usage Examples:
 * 
 * EXAMPLE 1: Fetch and display transactions in a table
 * 
 * async function loadTransactionsTable() {
 *     const containerId = '#transactions-container';
 *     try {
 *         showLoadingState(containerId);
 *         const response = await FINOVATE_API.transactions.getAll();
 *         
 *         if (!response.data || !Array.isArray(response.data)) {
 *             throw new Error('Invalid response structure');
 *         }
 *         
 *         const tableHTML = buildTableHTML(
 *             response.data,
 *             ['id', 'description', 'amount', 'category', 'transaction_date'],
 *             {
 *                 'id': 'ID',
 *                 'description': 'Description',
 *                 'amount': 'Amount',
 *                 'category': 'Category',
 *                 'transaction_date': 'Date'
 *             }
 *         );
 *         
 *         document.querySelector(containerId).innerHTML = tableHTML;
 *         showSuccessMessage(containerId, 'Transactions loaded successfully');
 *     } catch (error) {
 *         showErrorMessage(containerId, error.message);
 *     }
 * }
 * 
 * // Call it
 * loadTransactionsTable();
 * 
 * 
 * EXAMPLE 2: Fetch budgets and display as cards with error handling
 * 
 * async function loadBudgetCards() {
 *     const container = document.getElementById('budgets-container');
 *     
 *     try {
 *         showLoadingState(container);
 *         const response = await FINOVATE_API.budgets.getAll();
 *         
 *         if (response.success !== true) {
 *             throw new Error(response.message || 'Failed to load budgets');
 *         }
 *         
 *         const cardsHTML = buildCardsHTML(
 *             response.data,
 *             ['limit_amount', 'period', 'spent_amount'],
 *             'category'
 *         );
 *         
 *         container.innerHTML = cardsHTML;
 *         showSuccessMessage(container, `${response.data.length} budgets loaded`);
 *     } catch (error) {
 *         showErrorMessage(container, error.message);
 *     }
 * }
 * 
 * loadBudgetCards();
 * 
 * 
 * EXAMPLE 3: User registration with comprehensive error handling
 * 
 * async function handleUserRegistration(formData) {
 *     const feedbackEl = document.getElementById('form-feedback');
 *     
 *     try {
 *         showLoadingState(feedbackEl, true);
 *         
 *         // Validate required fields
 *         if (!formData.username || !formData.email || !formData.password) {
 *             throw new Error('All fields are required');
 *         }
 *         
 *         // Validate email format
 *         const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
 *         if (!emailRegex.test(formData.email)) {
 *             throw new Error('Invalid email format');
 *         }
 *         
 *         const response = await FINOVATE_API.users.register(formData);
 *         
 *         if (response.success) {
 *             showSuccessMessage(feedbackEl, 'Registration successful! Redirecting...');
 *             setTimeout(() => window.location.href = '/dashboard', 2000);
 *         } else {
 *             throw new Error(response.message || 'Registration failed');
 *         }
 *     } catch (error) {
 *         showErrorMessage(feedbackEl, error.message);
 *     }
 * }
 * 
 * 
 * EXAMPLE 4: Fetch portfolio data with retry logic
 * 
 * async function fetchPortfolioWithRetry(maxRetries = 3) {
 *     const container = '#portfolio-section';
 *     let lastError;
 *     
 *     for (let attempt = 1; attempt <= maxRetries; attempt++) {
 *         try {
 *             showLoadingState(container);
 *             const response = await FINOVATE_API.portfolios.getSummary();
 *             
 *             if (response.success) {
 *                 const html = buildCardsHTML(
 *                     [response.summary],
 *                     ['total_value', 'gain_loss', 'allocation'],
 *                     'name'
 *                 );
 *                 document.querySelector(container).innerHTML = html;
 *                 return;
 *             }
 *         } catch (error) {
 *             lastError = error;
 *             console.log(`Attempt ${attempt}/${maxRetries} failed:`, error.message);
 *             
 *             if (attempt < maxRetries) {
 *                 // Wait before retrying
 *                 await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
 *             }
 *         }
 *     }
 *     
 *     showErrorMessage(container, `Failed after ${maxRetries} attempts: ${lastError.message}`);
 * }
 * 
 * 
 * EXAMPLE 5: Handle 404 and 500 errors gracefully
 * 
 * async function safeTransactionFetch(transactionId) {
 *     const container = '#transaction-detail';
 *     
 *     try {
 *         showLoadingState(container);
 *         const response = await FINOVATE_API.transactions.getById(transactionId);
 *         
 *         if (response.success) {
 *             const html = buildCardsHTML(
 *                 [response.transaction],
 *                 ['amount', 'category', 'description', 'transaction_date']
 *             );
 *             document.querySelector(container).innerHTML = html;
 *         } else {
 *             throw new Error(response.message);
 *         }
 *     } catch (error) {
 *         if (error.message.includes('404')) {
 *             showErrorMessage(container, 'Transaction not found');
 *         } else if (error.message.includes('500')) {
 *             showErrorMessage(container, 'Server error. Please try again later.');
 *         } else if (error.message.includes('Network')) {
 *             showErrorMessage(container, 'Check your internet connection and try again');
 *         } else {
 *             showErrorMessage(container, error.message);
 *         }
 *     }
 * }
 * 
 */
