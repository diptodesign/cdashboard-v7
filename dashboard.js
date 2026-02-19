// ============================================
// dashboard.js - COMPLETE WORKING VERSION
// ============================================

const API_URL = 'https://clify-api.onrender.com';

// ========== URL HANDLING ==========
function getUserIdFromUrl() {
    // Check for userId in different URL formats
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    
    // Format 1: /dashboard/USERID
    if (path.includes('/dashboard/')) {
        return path.split('/dashboard/')[1].split('/')[0].split('?')[0];
    }
    
    // Format 2: ?user=USERID
    const userId = params.get('user');
    if (userId) return userId;
    
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
            localStorage.setItem('clify_token', data.token);
            localStorage.setItem('clify_userId', data.userId);
            localStorage.setItem('clify_username', data.username);
            
            errorEl.style.color = '#4caf50';
            errorEl.textContent = 'Login successful! Redirecting...';
            
            setTimeout(() => {
                window.location.href = `/cdashboard-v7/dashboard/${data.userId}`;
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
            successEl.textContent = 'Account created! Redirecting...';
            localStorage.setItem('clify_token', data.token);
            localStorage.setItem('clify_userId', data.userId);
            localStorage.setItem('clify_username', data.username);
            
            setTimeout(() => {
                window.location.href = `/cdashboard-v7/dashboard/${data.userId}`;
            }, 1500);
        } else {
            errorEl.textContent = data.error || 'Registration failed';
        }
    } catch (error) {
        errorEl.textContent = 'Connection error. Please try again.';
    }
}

function logout() {
    localStorage.removeItem('clify_token');
    localStorage.removeItem('clify_userId');
    localStorage.removeItem('clify_username');
    window.location.href = '/cdashboard-v7/';
}

// ========== DASHBOARD FUNCTIONS ==========
async function loadDashboardData() {
    const userId = getUserIdFromUrl();
    const token = localStorage.getItem('clify_token');
    const username = localStorage.getItem('clify_username');
    
    if (!userId) {
        window.location.href = '/cdashboard-v7/';
        return;
    }
    
    // Update UI with user info
    document.getElementById('displayName').textContent = username || 'User';
    document.getElementById('username').textContent = username || 'User';
    
    // Set dashboard URL
    const dashboardUrl = window.location.href;
    document.getElementById('dashboardUrl').textContent = dashboardUrl;
    
    // Load data from API
    try {
        const response = await fetch(`${API_URL}/api/data/${userId}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
            displayDashboardData(result.data);
        } else {
            document.getElementById('recentVideos').innerHTML = '<div class="loading">No data found</div>';
        }
    } catch (error) {
        console.error('Failed to load data:', error);
        document.getElementById('recentVideos').innerHTML = '<div class="loading">Failed to load data</div>';
    }
}

function displayDashboardData(data) {
    // Update stats
    const videos = Object.keys(data.blockedVideos || {}).length;
    const keywords = (data.keywords || []).length;
    const shorts = Object.values(data.blockedVideos || {}).filter(v => v?.reason === 'shorts').length;
    
    document.getElementById('totalBlocks').textContent = videos;
    document.getElementById('keywordsCount').textContent = keywords;
    document.getElementById('shortsCount').textContent = shorts;
    document.getElementById('videoCount').textContent = videos;
    document.getElementById('keywordCount').textContent = keywords;
    
    if (data.lastSync) {
        document.getElementById('lastSync').textContent = new Date(data.lastSync).toLocaleDateString();
    }
    
    // Display recent videos
    displayRecentVideos(data.blockedVideos);
    
    // Display keywords
    displayKeywords(data.keywords);
}

function displayRecentVideos(videos) {
    const container = document.getElementById('recentVideos');
    
    if (!videos || Object.keys(videos).length === 0) {
        container.innerHTML = '<div class="loading">No videos blocked yet</div>';
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
        container.innerHTML = '<div class="loading">No keywords added</div>';
        return;
    }
    
    container.innerHTML = `
        <div class="keyword-tags">
            ${keywords.map(k => `<span class="keyword-tag">${escapeHtml(k)}</span>`).join('')}
        </div>
    `;
}

function copyUrl() {
    const url = document.getElementById('dashboardUrl').textContent;
    navigator.clipboard.writeText(url).then(() => {
        alert('Dashboard URL copied to clipboard!');
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    const userId = getUserIdFromUrl();
    
    if (userId) {
        // We're on a dashboard page
        loadDashboardData();
        
        // Update preview URL on login page if it exists
        const previewEl = document.getElementById('previewUrl');
        if (previewEl) {
            previewEl.textContent = `https://diptodesign.github.io/cdashboard-v7/dashboard/${userId}`;
        }
    } else {
        // We're on login page
        // Check if already logged in
        const token = localStorage.getItem('clify_token');
        const savedUserId = localStorage.getItem('clify_userId');
        if (token && savedUserId) {
            window.location.href = `/cdashboard-v7/dashboard/${savedUserId}`;
        }
    }
});
