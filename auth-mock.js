/**
 * LocalStorage Authentication
 * Temporary solution for testing without PHP/MySQL
 * Replace this with proper backend once PHP is installed
 */

// Mock user database in localStorage
const MOCK_USERS_KEY = 'finovate_mock_users';

// Default demo users for testing
const DEFAULT_DEMO_USERS = {
  'demo': {
    id: 1,
    username: 'demo',
    email: 'demo@finovate.local',
    password: btoa('Demo@1234'), // Simple encoding (NOT secure!)
    full_name: 'Demo User',
    status: 'active',
    created_at: new Date().toISOString()
  },
  'test': {
    id: 2,
    username: 'test',
    email: 'test@finovate.local',
    password: btoa('Test@1234'), // Simple encoding (NOT secure!)
    full_name: 'Test User',
    status: 'active',
    created_at: new Date().toISOString()
  }
};

/** Keep demo/test accounts available even after other sign-ups. */
function ensureDemoUsers() {
  try {
    const stored = localStorage.getItem(MOCK_USERS_KEY);
    const users = stored ? JSON.parse(stored) : {};
    let changed = false;
    Object.entries(DEFAULT_DEMO_USERS).forEach(([key, demoUser]) => {
      if (!users[key]) {
        users[key] = { ...demoUser };
        changed = true;
      }
    });
    if (changed || !stored) {
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
    }
    return users;
  } catch {
    return { ...DEFAULT_DEMO_USERS };
  }
}

function getMockUsers() {
  try {
    const stored = localStorage.getItem(MOCK_USERS_KEY);
    let users = stored ? JSON.parse(stored) : {};

    if (Object.keys(users).length === 0) {
      users = { ...DEFAULT_DEMO_USERS };
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
      return users;
    }

    return ensureDemoUsers();
  } catch {
    return { ...DEFAULT_DEMO_USERS };
  }
}

function mockSignupConflictMessage(payload) {
  const users = getMockUsers();
  const username = String(payload?.username || '').trim().toLowerCase();
  const email = String(payload?.email || '').trim().toLowerCase();
  const byUsername = Object.values(users).find(
    (u) => String(u.username || '').toLowerCase() === username
  );
  const byEmail = Object.values(users).find(
    (u) => String(u.email || '').toLowerCase() === email
  );
  if (byUsername) {
    return 'This username is already taken. Please choose another username and try again.';
  }
  if (byEmail) {
    return 'An account with this email already exists. Please log in or use a different email.';
  }
  return null;
}

function saveMockUser(username, userData) {
  try {
    const users = getMockUsers();
    users[username] = userData;
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
  } catch (_) {}
}

function findMockUser(identifier) {
  const users = getMockUsers();
  const key = String(identifier || '').trim().toLowerCase();
  if (!key) return null;
  return Object.values(users).find(
    (u) =>
      String(u.username || '').toLowerCase() === key ||
      String(u.email || '').toLowerCase() === key
  );
}

// API Mock - Replace auth.js fetch calls
async function mockRegister(data) {
  // Validate
  if (!data.username || !data.email || !data.password || !data.full_name) {
    return {
      success: false,
      message: 'Missing required fields'
    };
  }

  const conflict = mockSignupConflictMessage(data);
  if (conflict) {
    return { success: false, message: conflict };
  }

  const users = getMockUsers();

  // Create user
  const user = {
    id: Date.now(),
    username: data.username,
    email: data.email,
    password: btoa(data.password), // Simple encoding (NOT secure!)
    full_name: data.full_name,
    status: 'active',
    created_at: new Date().toISOString()
  };

  saveMockUser(data.username, user);

  return {
    success: true,
    message: 'User registered successfully',
    user_id: user.id,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      status: user.status
    }
  };
}

async function mockLogin(username, password) {
  const user = findMockUser(username);

  if (!user || btoa(password) !== user.password) {
    return {
      success: false,
      message: 'Invalid credentials'
    };
  }

  if (user.status !== 'active') {
    return {
      success: false,
      message: 'User account is not active'
    };
  }

  return {
    success: true,
    message: 'Login successful',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      status: user.status
    }
  };
}
