/**
 * Pulse — Centralised API Fetch Wrapper
 * Provides consistent auth header injection, token refresh on 401,
 * and unified error normalisation across all service modules.
 */
import config from '../config';

const BASE_URL = config.apiUrl;

let isRefreshing = false;
let refreshQueue = [];

function drainRefreshQueue(newToken, error) {
    refreshQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(newToken);
    });
    refreshQueue = [];
}

async function refreshAccessToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token available');

    const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
    });

    if (!res.ok) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        throw new Error('Session expired. Please log in again.');
    }

    const data = await res.json();
    const newToken = data.accessToken;
    localStorage.setItem('accessToken', newToken);
    return newToken;
}

async function getValidToken() {
    const token = localStorage.getItem('accessToken');
    return token || null;
}

/**
 * Make an authenticated API request with automatic token refresh
 * @param {string} path - API path (e.g. '/predict')
 * @param {RequestInit} options - Fetch options
 * @param {boolean} withAuth - Whether to attach Authorization header
 */
export async function apiFetch(path, options = {}, withAuth = true) {
    const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
    const headers = { ...(options.headers || {}) };

    // Don't set Content-Type for FormData (browser sets it with boundary)
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    if (withAuth) {
        const token = await getValidToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    let res = await fetch(url, { ...options, headers });

    // Handle 401 — attempt token refresh once
    if (res.status === 401 && withAuth) {
        if (!isRefreshing) {
            isRefreshing = true;
            try {
                const newToken = await refreshAccessToken();
                drainRefreshQueue(newToken, null);
                isRefreshing = false;

                // Retry with new token
                headers['Authorization'] = `Bearer ${newToken}`;
                res = await fetch(url, { ...options, headers });
            } catch (err) {
                drainRefreshQueue(null, err);
                isRefreshing = false;
                throw err;
            }
        } else {
            // Queue request while a refresh is already in progress
            const newToken = await new Promise((resolve, reject) => {
                refreshQueue.push({ resolve, reject });
            });
            headers['Authorization'] = `Bearer ${newToken}`;
            res = await fetch(url, { ...options, headers });
        }
    }

    if (!res.ok) {
        let message = `Request failed: ${res.status} ${res.statusText}`;
        try {
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const err = await res.json();
                message = err.error || err.message || message;
            } else {
                const text = await res.text();
                if (text) message = text;
            }
        } catch { /* ignore parse errors */ }
        const error = new Error(message);
        error.status = res.status;
        throw error;
    }

    // Return null for 204 No Content
    if (res.status === 204) return null;

    const ct = res.headers.get('content-type') || '';
    return ct.includes('application/json') ? res.json() : res.text();
}

/**
 * Convenience wrappers
 */
export const api = {
    get: (path, opts = {}) => apiFetch(path, { ...opts, method: 'GET' }),
    post: (path, body, opts = {}) => apiFetch(path, {
        ...opts,
        method: 'POST',
        body: body instanceof FormData ? body : JSON.stringify(body)
    }),
    put: (path, body, opts = {}) => apiFetch(path, {
        ...opts,
        method: 'PUT',
        body: JSON.stringify(body)
    }),
    delete: (path, opts = {}) => apiFetch(path, { ...opts, method: 'DELETE' }),

    /** Public (no auth header) */
    public: {
        get: (path, opts = {}) => apiFetch(path, { ...opts, method: 'GET' }, false),
        post: (path, body, opts = {}) => apiFetch(path, {
            ...opts,
            method: 'POST',
            body: JSON.stringify(body)
        }, false)
    }
};

export default api;
