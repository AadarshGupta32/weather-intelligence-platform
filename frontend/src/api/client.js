/**
 * SURAKSHA-NET API Client
 * Centralized HTTP requests with timeout, error handling and resilient fallbacks
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
        'Accept': 'application/json',
        ...(options.headers || {})
    };

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const config = {
        ...options,
        headers,
        signal: AbortSignal.timeout(options.timeout || 8000)
    };

    try {
        const response = await fetch(url, config);
        if (!response.ok) {
            const errorBody = await response.text().catch(() => '');
            throw new Error(`HTTP ${response.status}: ${errorBody || response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        return await response.text();
    } catch (err) {
        console.warn(`[API Client] Request to ${endpoint} failed:`, err.message);
        throw err;
    }
}

export { API_BASE };
