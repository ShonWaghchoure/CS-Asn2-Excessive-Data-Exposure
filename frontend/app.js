/**
 * Excessive Data Exposure Demo - Frontend Application
 * 
 * This frontend demonstrates the vulnerability by:
 * 1. Fetching user data from either vulnerable (v1) or fixed (v2) API
 * 2. Displaying ONLY the fields a normal user would see
 * 3. Providing a way to inspect the raw API response (revealing the vulnerability)
 */

// Current API version: 'v1' (vulnerable) or 'v2' (fixed)
let currentApiVersion = 'v1';
let currentUserData = null;

// DOM Elements
const userListEl = document.getElementById('userList');
const userDetailEl = document.getElementById('userDetail');
const detailCardEl = document.getElementById('detailCard');
const rawResponseEl = document.getElementById('rawResponse');
const versionV1Radio = document.getElementById('versionV1');
const versionV2Radio = document.getElementById('versionV2');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadUserList();
    setupVersionToggle();
});

function setupVersionToggle() {
    versionV1Radio.addEventListener('change', () => {
        if (versionV1Radio.checked) {
            currentApiVersion = 'v1';
            loadUserList();
            showUserList();
        }
    });
    
    versionV2Radio.addEventListener('change', () => {
        if (versionV2Radio.checked) {
            currentApiVersion = 'v2';
            loadUserList();
            showUserList();
        }
    });
}

// ============================================
// API Functions
// ============================================

async function fetchApi(endpoint) {
    const baseUrl = `/api/${currentApiVersion}`;
    const response = await fetch(`${baseUrl}${endpoint}`);
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
}

async function fetchRawResponse(endpoint) {
    const baseUrl = `/api/${currentApiVersion}`;
    const response = await fetch(`${baseUrl}${endpoint}`);
    const text = await response.text();
    return { status: response.status, text };
}

// ============================================
// User List
// ============================================

async function loadUserList() {
    userListEl.innerHTML = '<div class="loading">Loading employees...</div>';
    
    try {
        const users = await fetchApi('/users');
        renderUserList(users);
    } catch (error) {
        console.error('Failed to load users:', error);
        userListEl.innerHTML = `<div class="loading" style="color: #dc2626;">Error loading users: ${error.message}</div>`;
    }
}

function renderUserList(users) {
    if (!users || users.length === 0) {
        userListEl.innerHTML = '<div class="loading">No users found</div>';
        return;
    }
    
    userListEl.innerHTML = users.map(user => `
        <article class="user-card" onclick="showUserDetail(${user.id})">
            <img src="${user.avatar}" alt="${user.name}" class="avatar" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=default'">
            <div class="name">${escapeHtml(user.name)}</div>
            <div class="email">${escapeHtml(user.email)}</div>
            <div class="meta">
                <span class="badge badge-role">${escapeHtml(user.role)}</span>
                <span class="badge badge-dept">${escapeHtml(user.department)}</span>
            </div>
        </article>
    `).join('');
}

// ============================================
// User Detail
// ============================================

async function showUserDetail(userId) {
    try {
        const user = await fetchApi(`/users/${userId}`);
        currentUserData = user;
        renderUserDetail(user);
        userListEl.parentElement.style.display = 'none';
        userDetailEl.style.display = 'block';
        rawResponseEl.style.display = 'none';
        rawResponseEl.textContent = '';
    } catch (error) {
        console.error('Failed to load user detail:', error);
        alert(`Error loading user: ${error.message}`);
    }
}

function renderUserDetail(user) {
    // Only display the fields that a normal frontend would show
    // These are the "public" fields - the frontend deliberately doesn't show sensitive data
    detailCardEl.innerHTML = `
        <img src="${user.avatar}" alt="${escapeHtml(user.name)}" class="avatar" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=default'">
        <div class="name">${escapeHtml(user.name)}</div>
        <div class="email">${escapeHtml(user.email)}</div>
        <div class="meta">
            <span class="badge badge-role">${escapeHtml(user.role || 'N/A')}</span>
            <span class="badge badge-dept">${escapeHtml(user.department || 'N/A')}</span>
        </div>
        <div class="field">
            <div class="field-label">Employee Since</div>
            <div class="field-value">${formatDate(user.created_at)}</div>
        </div>
        <div class="field">
            <div class="field-label">User ID</div>
            <div class="field-value">#${user.id}</div>
        </div>
    `;
}

function showUserList() {
    userDetailEl.style.display = 'none';
    userListEl.parentElement.style.display = 'block';
    currentUserData = null;
}

// ============================================
// API Response Inspector (The Attack Demo)
// ============================================

async function inspectRawResponse() {
    if (!currentUserData) return;
    
    const inspectBtn = document.querySelector('.inspect-btn');
    inspectBtn.textContent = 'Fetching raw response...';
    inspectBtn.disabled = true;
    
    try {
        const { status, text } = await fetchRawResponse(`/users/${currentUserData.id}`);
        
        // Pretty-print JSON with syntax highlighting
        let formatted;
        try {
            const parsed = JSON.parse(text);
            formatted = JSON.stringify(parsed, null, 2);
        } catch {
            formatted = text;
        }
        
        rawResponseEl.textContent = formatted;
        rawResponseEl.style.display = 'block';
        applySyntaxHighlighting();
        
        inspectBtn.textContent = 'Raw Response Loaded ✓';
        inspectBtn.style.background = '#16a34a';
        
        // Scroll to response
        rawResponseEl.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        rawResponseEl.textContent = `Error: ${error.message}`;
        rawResponseEl.style.display = 'block';
        inspectBtn.textContent = 'Error - Try Again';
        inspectBtn.style.background = '#dc2626';
    } finally {
        inspectBtn.disabled = false;
    }
}

function applySyntaxHighlighting() {
    // Simple client-side syntax highlighting for JSON
    let html = rawResponseEl.textContent
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)/g, (match) => {
            if (match.endsWith(':')) {
                return `<span class="key">${match}</span>`;
            }
            return `<span class="string">${match}</span>`;
        })
        .replace(/(\b\d+\.?\d*\b)/g, '<span class="number">$1</span>')
        .replace(/\b(true|false)\b/g, '<span class="boolean">$1</span>')
        .replace(/\bnull\b/g, '<span class="null">$1</span>');
    
    rawResponseEl.innerHTML = html;
}

// ============================================
// Utilities
// ============================================

function escapeHtml(text) {
    if (text === null || text === undefined) return 'N/A';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Expose functions globally for onclick handlers
window.showUserDetail = showUserDetail;
window.showUserList = showUserList;
window.inspectRawResponse = inspectRawResponse;