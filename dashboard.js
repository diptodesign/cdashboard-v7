// ============================================
// dashboard.js - COMPLETE WORKING VERSION
// ============================================

const API_URL = 'https://clify-api.onrender.com';

// ========== URL HANDLING ==========
function getUserIdFromUrl() {
    // Check for ?user=USERID format
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('user');
    if (userId) return userId;
    
    // Check for /dashboard/USERID format (though 404.html should handle this)
    const path = window.location.pathname;
    const match = path.match(/\/dashboard\/([^\/]+)/);
    if (match) return match[1];
    
    return null;
}

// ========== AUTH FUNCTIONS ==========
function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.form').forEach(f => f.classList.remove('active'));
    
    if (tabName === 'login') {
        document.querySelectorAll('.tab')[0].classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.querySelectorAll('.tab')[1].classList.add('active');
        document.getElementById('registerForm').classList.add('active');
    }
}

async function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    
    errorEl.textContent = '';
    
    if (!username || !password) {
        errorEl.textContent = 'Please fill in all fields';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('username', data.username);
            
            errorEl.style.color = '#4caf50';
            errorEl.textContent = 'Login successful! Redirecting...';
            
            setTimeout(() => {
                // Redirect to dashboard.html with user parameter
                window.location.href = `/cdashboard-v7/dashboard.html?user=${data.userId}`;
            }, 1500);
        } else {
            errorEl.textContent = data.error || 'Login failed';
        }
    } catch (error) {
        errorEl.textContent = 'Connection error. Please try again.';
    }
}

async function register() {
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirm').value;
    const errorEl = document.getElementById('registerError');
    const successEl = document.getElementById('registerSuccess');
    
    errorEl.textContent = '';
    successEl.textContent = '';
    
    if (!username || !password || !confirm) {
        errorEl.textContent = 'Please fill in all fields';
        return;
    }
    
    if (password !== confirm) {
        errorEl.textContent = 'Passwords do not match';
        return;
    }
    
    if (password.length < 6) {
        errorEl.textContent = 'Password must be at least 6 characters';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            successEl.textContent = 'Account created successfully! Redirecting...';
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('username', data.username);
            
            // FIXED: Redirect to dashboard.html with user parameter
            setTimeout(() => {
                window.location.href = `/cdashboard-v7/dashboard.html?user=${data.userId}`;
            }, 1500);
        } else {
            errorEl.textContent = data.error || 'Registration failed';
        }
    } catch (error) {
        errorEl.textContent = 'Connection error. Please try again.';
    }
}

function logout() {
    localStorage.clear();
    window.location.href = '/cdashboard-v7/';
}

// ========== DASHBOARD FUNCTIONS ==========
async function loadDashboardData() {
    const userId = getUserIdFromUrl();
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    if (!userId) {
        window.location.href = '/cdashboard-v7/';
        return;
    }
    
    // Update UI with user info
    document.getElementById('welcomeMessage').textContent = `Welcome, ${username || 'User'}!`;
    document.getElementById('userId').textContent = userId;
    
    // Load data from API
    try {
        const response = await fetch(`${API_URL}/api/data/${userId}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
            displayDashboardData(result.data);
        } else {
            document.getElementById('totalBlocks').textContent = '0';
            document.getElementById('keywordsCount').textContent = '0';
        }
    } catch (error) {
        console.error('Failed to load data:', error);
        document.getElementById('totalBlocks').textContent = '0';
        document.getElementById('keywordsCount').textContent = '0';
    }
}

function displayDashboardData(data) {
    // Update stats
    const videos = Object.keys(data.blockedVideos || {}).length;
    const keywords = (data.keywords || []).length;
    
    document.getElementById('totalBlocks').textContent = videos;
    document.getElementById('keywordsCount').textContent = keywords;
    
    if (data.lastSync) {
        document.getElementById('lastSync').textContent = new Date(data.lastSync).toLocaleString();
    }
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    const userId = getUserIdFromUrl();
    
    if (userId) {
        // We're on a dashboard page
        loadDashboardData();
    } else {
        // We're on login page
        // Check if already logged in
        const token = localStorage.getItem('token');
        const savedUserId = localStorage.getItem('userId');
        if (token && savedUserId) {
            window.location.href = `/cdashboard-v7/dashboard.html?user=${savedUserId}`;
        }
    }
});
