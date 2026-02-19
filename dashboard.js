// ============================================
// dashboard.js - FIXED DATA LOADING VERSION
// ============================================

const API_URL = 'https://clify-api.onrender.com';

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

// ========== FIXED DATA LOADING ==========
async function loadDashboardData() {
    const userId = getUserIdFromUrl();
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    console.log('Loading data for user:', userId);
    console.log('Token exists:', !!token);
    
    if (!userId) {
        window.location.href = '/cdashboard-v7/';
        return;
    }
    
    // Update basic UI
    document.getElementById('displayName').textContent = username || 'User';
    document.getElementById('username').textContent = username || 'User';
    document.getElementById('userId').textContent = userId;
    
    const dashboardUrl = window.location.href;
    document.getElementById('dashboardUrl').textContent = dashboardUrl;
    
    try {
        // Try with token first
        let response;
        if (token) {
            response = await fetch(`${API_URL}/api/data/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } else {
            // Try without token (public data)
            response = await fetch(`${API_URL}/api/data/${userId}`);
        }
        
        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('API Response:', result);
        
        if (result.success && result.data) {
            displayDashboardData(result.data);
        } else {
            // If no data, create sample data for testing
            console.log('No data found, creating sample data...');
            await createSampleData(userId, token);
        }
    } catch (error) {
        console.error('Failed to load data:', error);
        document.getElementById('recentVideos').innerHTML = '<div class="loading">Error loading data</div>';
    }
}

// Add sample data for testing
async function createSampleData(userId, token) {
    const sampleData = {
        blockedVideos: {
            "video1": {
                id: "video1",
                title: "Sample React Tutorial",
                reason: "keyword",
                ts: Date.now() - 86400000,
                timestamp: new Date().toLocaleString()
            },
            "video2": {
                id: "video2",
                title: "Funny Cat Videos",
                reason: "shorts",
                ts: Date.now() - 172800000,
                timestamp: new Date().toLocaleString()
            },
            "video3": {
                id: "video3",
                title: "Clickbait Title!!!",
                reason: "manual",
                ts: Date.now() - 259200000,
                timestamp: new Date().toLocaleString()
            }
        },
        keywords: ["react", "tutorial", "clickbait", "shorts", "funny"],
        lastSync: new Date().toISOString()
    };
    
    if (token) {
        try {
            await fetch(`${API_URL}/api/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: userId,
                    data: sampleData
                })
            });
            console.log('Sample data created');
            displayDashboardData(sampleData);
        } catch (error) {
            console.error('Failed to create sample data:', error);
        }
    } else {
        // Just display sample data locally
        displayDashboardData(sampleData);
    }
}

function displayDashboardData(data) {
    console.log('Displaying data:', data);
    
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
            <span class="video-reason" style="
                background: ${video.reason === 'shorts' ? '#0BA6DF' : 
                           video.reason === 'keyword' ? '#5a189a' : 
                           '#003e1f'};
                color: white;
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 11px;
            ">${video.reason || 'manual'}</span>
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
            ${keywords.map(k => `<span class="keyword-tag" style="
                background: rgba(193, 241, 29, 0.1);
                border: 1px solid rgba(193, 241, 29, 0.2);
                border-radius: 20px;
                color: #c1f11d;
                padding: 5px 12px;
                font-size: 12px;
                display: inline-block;
                margin: 4px;
            ">${escapeHtml(k)}</span>`).join('')}
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
    console.log('User ID from URL:', userId);
    
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
