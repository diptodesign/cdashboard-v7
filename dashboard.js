// ============================================
// dashboard.js - COMPLETE WORKING VERSION
// ============================================

const API_URL = 'https://clify-api.onrender.com';
const VERSION = "v7.0.0";

// ========== URL HANDLING ==========
function getUserIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('user');
    if (userId) return userId;
    
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
            successEl.textContent = 'Account created! Redirecting...';
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('username', data.username);
            
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
    
    document.getElementById('displayName').textContent = username || 'User';
    document.getElementById('username').textContent = username || 'User';
    document.getElementById('userId').textContent = userId;
    
    const dashboardUrl = window.location.href;
    document.getElementById('dashboardUrl').textContent = dashboardUrl;
    
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
        const date = new Date(data.lastSync);
        document.getElementById('lastSync').textContent = date.toLocaleString();
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
        loadDashboardData();
        
        const previewEl = document.getElementById('previewUrl');
        if (previewEl) {
            previewEl.textContent = `https://diptodesign.github.io/cdashboard-v7/dashboard/${userId}`;
        }
    } else {
        const token = localStorage.getItem('token');
        const savedUserId = localStorage.getItem('userId');
        if (token && savedUserId) {
            window.location.href = `/cdashboard-v7/dashboard.html?user=${savedUserId}`;
        }
    }
});
