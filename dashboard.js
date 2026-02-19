// ============================================
// DASHBOARD.JS - COMPLETE LOGIC
// ============================================

// Configuration - UPDATE THIS WITH YOUR RENDER URL
const CONFIG = {
    API_URL: 'https://clify-api.onrender.com', // Your Render API
    APP_NAME: 'Clify Cloud',
    VERSION: '7.0.0'
};

// ==================== UTILITY FUNCTIONS ====================
function getUserIdFromUrl() {
    const path = window.location.pathname;
    const match = path.match(/\/dashboard\/([^\/]+)/);
    return match ? match[1] : null;
}

function saveAuth(token, userId, username) {
    localStorage.setItem('clify_token', token);
    localStorage.setItem('clify_userId', userId);
    localStorage.setItem('clify_username', username);
}

function clearAuth() {
    localStorage.removeItem('clify_token');
    localStorage.removeItem('clify_userId');
    localStorage.removeItem('clify_username');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(timestamp) {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
}

// ==================== API CONNECTION ====================
async function checkAPI() {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/api/health`);
        const data = await response.json();
        
        if (data.database && data.database.state === 1) {
            statusDot.className = 'dot connected';
            statusText.textContent = 'Connected to cloud';
            return true;
        } else {
            statusDot.className = 'dot disconnected';
            statusText.textContent = 'Cloud service unavailable';
            return false;
        }
    } catch (error) {
        statusDot.className = 'dot disconnected';
        statusText.textContent = 'Cannot connect to cloud';
        return false;
    }
}

// ==================== EXTENSION DETECTION ====================
function checkExtension() {
    const extDot = document.getElementById('extDot');
    const extText = document.getElementById('extText');
    
    // Check if running in Chrome extension context
    if (window.chrome && chrome.runtime && chrome.runtime.id) {
        extDot.className = 'ext-dot connected';
        extText.textContent = 'Clify extension detected';
        return true;
    } else {
        extDot.className = 'ext-dot disconnected';
        extText.textHTML = 'Extension not detected - using web mode';
        return false;
    }
}

// ==================== AUTH FUNCTIONS ====================
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
        const response = await fetch(`${CONFIG.API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            saveAuth(data.token, data.userId, data.username);
            
            // Show success and redirect
            errorEl.style.color = '#4caf50';
            errorEl.textContent = 'Login successful! Redirecting...';
            
            setTimeout(() => {
                window.location.href = `dashboard/${data.userId}`;
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
        const response = await fetch(`${CONFIG.API_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            successEl.textContent = 'Account created successfully! Redirecting...';
            saveAuth(data.token, data.userId, data.username);
            
            setTimeout(() => {
                window.location.href = `dashboard/${data.userId}`;
            }, 1500);
        } else {
            errorEl.textContent = data.error || 'Registration failed';
        }
    } catch (error) {
        errorEl.textContent = 'Connection error. Please try again.';
    }
}

// ==================== DASHBOARD FUNCTIONS ====================
async function loadDashboardData() {
    const userId = getUserIdFromUrl();
    const token = localStorage.getItem('clify_token');
    const username = localStorage.getItem('clify_username');
    
    if (!token || !userId) {
        window.location.href = '/cdashboard-v7/';
        return;
    }
    
    // Set user info
    document.getElementById('displayName').textContent = username;
    document.getElementById('username').textContent = username;
    document.getElementById('loginHint').textContent = username;
    
    // Set dashboard URL
    const dashboardUrl = window.location.href;
    document.getElementById('dashboardUrl').textContent = dashboardUrl;
    
    // Check extension
    checkExtension();
    
    // Load data from API
    try {
        const response = await fetch(`${CONFIG.API_URL}/api/data/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
            displayDashboardData(result.data);
            updateConnectionStatus('connected', formatDate(result.data.lastSync));
        } else {
            updateConnectionStatus('error', 'Failed to load data');
        }
    } catch (error) {
        console.error('Failed to load data:', error);
        updateConnectionStatus('error', 'Connection failed');
        document.getElementById('recentVideos').innerHTML = '<div class="error">Failed to load data from cloud</div>';
    }
}

function displayDashboardData(data) {
    // Update stats
    const videos = Object.keys(data.blockedVideos || {}).length;
    const keywords = (data.keywords || []).length;
    const shorts = Object.values(data.blockedVideos || {}).filter(v => v.reason === 'shorts').length;
    
    document.getElementById('totalBlocks').textContent = videos;
    document.getElementById('keywordsCount').textContent = keywords;
    document.getElementById('shortsCount').textContent = shorts;
    document.getElementById('videoCount').textContent = videos;
    document.getElementById('keywordCount').textContent = keywords;
    
    // Display recent videos
    displayRecentVideos(data.blockedVideos);
    
    // Display keywords
    displayKeywords(data.keywords);
    
    // Display raw data
    document.getElementById('rawData').textContent = JSON.stringify(data, null, 2);
}

function displayRecentVideos(videos) {
    const container = document.getElementById('recentVideos');
    
    if (!videos || Object.keys(videos).length === 0) {
        container.innerHTML = '<div class="loading">No videos blocked yet. Start using Clify extension!</div>';
        return;
    }
    
    const videoList = Object.values(videos)
        .sort((a, b) => (b.ts || 0) - (a.ts || 0))
        .slice(0, 10);
    
    container.innerHTML = videoList.map(video => `
        <div class="video-item">
            <span class="video-title">${escapeHtml(video.title || 'Untitled')}</span>
            <span class="video-reason">${video.reason || 'manual'}</span>
            <span class="video-time">${new Date(video.ts).toLocaleDateString()}</span>
        </div>
    `).join('');
}

function displayKeywords(keywords) {
    const container = document.getElementById('keywordList');
    
    if (!keywords || keywords.length === 0) {
        container.innerHTML = '<div class="loading">No keywords added. Add keywords in extension!</div>';
        return;
    }
    
    container.innerHTML = `
        <div class="keyword-tags">
            ${keywords.map(k => `<span class="keyword-tag">${escapeHtml(k)}</span>`).join('')}
        </div>
    `;
}

function updateConnectionStatus(status, lastSync) {
    const syncDot = document.getElementById('syncDot');
    const syncText = document.getElementById('syncText');
    const lastSyncEl = document.getElementById('lastDataSync');
    const apiStatus = document.getElementById('apiStatus');
    
    if (status === 'connected') {
        syncDot.className = 'sync-dot connected';
        syncText.textContent = 'Synced';
        apiStatus.textContent = 'Connected';
    } else {
        syncDot.className = 'sync-dot disconnected';
        syncText.textContent = 'Sync Pending';
        apiStatus.textContent = 'Connected';
    }
    
    if (lastSyncEl) {
        lastSyncEl.textContent = lastSync || 'Never';
    }
}

function copyUrl() {
    const url = document.getElementById('dashboardUrl').textContent;
    navigator.clipboard.writeText(url).then(() => {
        alert('Dashboard URL copied to clipboard!');
    });
}

function logout() {
    clearAuth();
    window.location.href = '/cdashboard-v7/';
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    const userId = getUserIdFromUrl();
    
    if (userId) {
        // We're on a dashboard page
        loadDashboardData();
    } else {
        // We're on login page
        checkAPI();
        checkExtension();
        
        // Update preview URL
        const previewEl = document.getElementById('previewUrl');
        if (previewEl) {
            previewEl.textContent = `https://diptodesign.github.io/cdashboard-v7/dashboard/YOUR-USER-ID`;
        }
        
        // Check if already logged in
        const token = localStorage.getItem('clify_token');
        const savedUserId = localStorage.getItem('clify_userId');
        if (token && savedUserId) {
            window.location.href = `dashboard/${savedUserId}`;
        }
    }
});