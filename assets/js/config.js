/**
 * NovaStore — App Configuration & Environment State
 * Controls Mock Mode vs Flask REST API Mode
 */

(function (window) {
  'use strict';

  // Default configuration values
  const DEFAULT_CONFIG = {
    mode: 'mock', // 'mock' (default) or 'api'
    apiBaseUrl: 'http://127.0.0.1:5000/api/v1',
    requestTimeoutMs: 8000,
  };

  // LocalStorage keys for state persistence
  const STORAGE_KEYS = {
    CONFIG: 'novastore_config',
    CART: 'novastore_cart',
    ORDERS: 'novastore_orders',
    PRODUCTS: 'novastore_products_custom',
    USER: 'novastore_user',
  };

  /**
   * Retrieves active configuration from localStorage with defaults fallback
   */
  function getConfig() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
        };
      }
    } catch (err) {
      console.warn('[NovaStore Config] Failed to read config from localStorage, using defaults:', err);
    }
    return { ...DEFAULT_CONFIG };
  }

  /**
   * Updates configuration settings in localStorage
   * @param {Partial<typeof DEFAULT_CONFIG>} partialConfig 
   */
  function updateConfig(partialConfig) {
    const current = getConfig();
    const updated = { ...current, ...partialConfig };
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('novastore:configChanged', { detail: updated }));
    } catch (err) {
      console.error('[NovaStore Config] Failed to save config to localStorage:', err);
    }
    return updated;
  }

  /**
   * Switch between 'mock' and 'api' mode
   * @param {'mock' | 'api'} mode 
   */
  function setMode(mode) {
    if (mode !== 'mock' && mode !== 'api') {
      throw new Error(`Invalid mode "${mode}". Supported modes: "mock" or "api".`);
    }
    return updateConfig({ mode });
  }

  /**
   * Updates the Flask REST API Base URL
   * @param {string} url 
   */
  function setApiBaseUrl(url) {
    const cleanUrl = url.trim().replace(/\/+$/, '');
    return updateConfig({ apiBaseUrl: cleanUrl });
  }

  /**
   * Helper flags
   */
  function isMockMode() {
    return getConfig().mode === 'mock';
  }

  function isApiMode() {
    return getConfig().mode === 'api';
  }

  function getApiBaseUrl() {
    return getConfig().apiBaseUrl;
  }

  // Expose on global NovaConfig namespace
  window.NovaConfig = {
    STORAGE_KEYS,
    DEFAULT_CONFIG,
    getConfig,
    updateConfig,
    setMode,
    setApiBaseUrl,
    isMockMode,
    isApiMode,
    getApiBaseUrl,
  };
})(window);
