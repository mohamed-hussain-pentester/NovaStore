/**
 * NovaStore — Flask REST API Client
 * Clean, modular Fetch wrapper prepared for Python Flask Backend
 * 
 * Target Flask Base URL: http://127.0.0.1:5000/api/v1
 * Strict behavior: NEVER silently fall back to mock data on network errors.
 */

(function (window) {
  'use strict';

  class ApiError extends Error {
    constructor(message, status = 0, data = null) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.data = data;
    }
  }

  /**
   * Retrieves auth token from localStorage if user is logged in
   */
  function getAuthToken() {
    try {
      const user = localStorage.getItem(window.NovaConfig.STORAGE_KEYS.USER);
      if (user) {
        const parsed = JSON.parse(user);
        return parsed.token || null;
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  /**
   * Core request dispatcher with JSON handling, timeout, and descriptive error parsing
   * @param {string} endpoint - e.g. '/products' or '/cart'
   * @param {object} options - Fetch options (method, headers, body, etc.)
   * @returns {Promise<any>}
   */
  async function request(endpoint, options = {}) {
    const config = window.NovaConfig.getConfig();
    const baseUrl = config.apiBaseUrl.replace(/\/+$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${baseUrl}${cleanEndpoint}`;

    const headers = {
      'Accept': 'application/json',
      ...(options.headers || {})
    };

    // Attach auth header if token exists
    const token = getAuthToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Attach Content-Type for JSON body requests
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.requestTimeoutMs || 8000);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Attempt parsing JSON response
      let responseData = null;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          responseData = await response.json();
        } catch (jsonErr) {
          console.warn('[NovaStore API] Non-JSON payload received:', jsonErr);
        }
      } else {
        const text = await response.text();
        responseData = { message: text };
      }

      // Check HTTP status code
      if (!response.ok) {
        const errorMessage = (responseData && (responseData.error || responseData.message)) 
          ? (responseData.error || responseData.message)
          : `HTTP ${response.status} ${response.statusText} from Flask server`;
        
        throw new ApiError(errorMessage, response.status, responseData);
      }

      return responseData;

    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        const timeoutMsg = `Request to Flask API timed out after ${config.requestTimeoutMs / 1000}s. Check if your Flask server is responding at ${baseUrl}.`;
        console.error('[NovaStore API Timeout]', timeoutMsg);
        throw new ApiError(timeoutMsg, 408);
      }

      if (err instanceof ApiError) {
        console.error(`[NovaStore API Error ${err.status}]`, err.message, err.data);
        throw err;
      }

      // Network level failure (CORS blocked, connection refused, offline)
      const networkMsg = `Cannot connect to Flask API at ${baseUrl}. Please ensure your Flask server is running and CORS is enabled via flask-cors.`;
      console.error('[NovaStore API Network Error]', networkMsg, err);
      throw new ApiError(networkMsg, 0, { originalError: err.message });
    }
  }

  /**
   * HTTP GET
   * @param {string} endpoint 
   * @param {Record<string, any>} [params]
   */
  async function get(endpoint, params = {}) {
    let url = endpoint;
    const query = new URLSearchParams();
    
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });

    const queryString = query.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }

    return request(url, { method: 'GET' });
  }

  /**
   * HTTP POST
   * @param {string} endpoint 
   * @param {any} body 
   */
  async function post(endpoint, body) {
    return request(endpoint, {
      method: 'POST',
      body,
    });
  }

  /**
   * HTTP PUT
   * @param {string} endpoint 
   * @param {any} body 
   */
  async function put(endpoint, body) {
    return request(endpoint, {
      method: 'PUT',
      body,
    });
  }

  /**
   * HTTP PATCH
   * @param {string} endpoint 
   * @param {any} body 
   */
  async function patch(endpoint, body) {
    return request(endpoint, {
      method: 'PATCH',
      body,
    });
  }

  /**
   * HTTP DELETE
   * @param {string} endpoint 
   */
  async function del(endpoint) {
    return request(endpoint, {
      method: 'DELETE',
    });
  }

  /**
   * Verifies backend connectivity via GET /health
   */
  async function checkHealth() {
    return get('/health');
  }

  // Expose on global namespace
  window.NovaApi = {
    ApiError,
    request,
    get,
    post,
    put,
    patch,
    del,
    checkHealth,
  };
})(window);
