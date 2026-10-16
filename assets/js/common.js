/**
 * NovaStore — Shared Common Utilities & Navigation Controller
 * Handles Cart Badge, Mode Indicator, Modal Dialogs, Toasts, and Session UI
 */

(function (window) {
  'use strict';

  /**
   * Currency formatter for USD
   * @param {number} amount 
   * @returns {string}
   */
  function formatUSD(amount) {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num);
  }

  /**
   * Show toast notification
   * @param {string} message 
   * @param {'info'|'success'|'error'|'warning'} type 
   * @param {number} duration 
   */
  function showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Icon based on type
    let icon = 'ℹ️';
    if (type === 'success') icon = '✓';
    if (type === 'error') icon = '⚠️';
    if (type === 'warning') icon = '⚡';

    toast.innerHTML = `
      <span style="font-weight:700;">${icon}</span>
      <span>${escapeHTML(message)}</span>
    `;

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  /**
   * Simple HTML escaping helper
   */
  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Get cart from localStorage
   */
  function getCart() {
    try {
      const data = localStorage.getItem(window.NovaConfig.STORAGE_KEYS.CART);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('[NovaStore] Failed reading cart:', e);
      return [];
    }
  }

  /**
   * Save cart to localStorage
   */
  function saveCart(cart) {
    try {
      localStorage.setItem(window.NovaConfig.STORAGE_KEYS.CART, JSON.stringify(cart));
      updateCartBadge();
      window.dispatchEvent(new CustomEvent('novastore:cartUpdated', { detail: cart }));
    } catch (e) {
      console.error('[NovaStore] Failed saving cart:', e);
    }
  }

  /**
   * Calculate total count of items in cart
   */
  function getCartCount() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (Number(item.quantity) || 0), 0);
  }

  /**
   * Update all cart badges across DOM
   */
  function updateCartBadge() {
    const count = getCartCount();
    const badges = document.querySelectorAll('.cart-count-badge');
    badges.forEach(badge => {
      badge.textContent = count;
      badge.setAttribute('aria-label', `${count} items in shopping cart`);
    });
  }

  /**
   * Add an item to the cart with stock validation
   * @param {object} product 
   * @param {number} quantity 
   */
  function addToCart(product, quantity = 1) {
    const qtyToAdd = Math.max(1, parseInt(quantity, 10) || 1);
    const cart = getCart();
    const existing = cart.find(item => item.id === product.id);

    const currentQty = existing ? existing.quantity : 0;
    const requestedTotal = currentQty + qtyToAdd;

    // Validate available stock
    const availableStock = Number(product.stock) || 0;
    if (availableStock <= 0) {
      showToast(`"${product.name}" is currently out of stock.`, 'warning');
      return false;
    }

    if (requestedTotal > availableStock) {
      showToast(`Cannot add ${qtyToAdd} more. Only ${availableStock} in stock (${currentQty} already in your cart).`, 'warning');
      return false;
    }

    if (existing) {
      existing.quantity = requestedTotal;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        imageUrl: product.imageUrl,
        stock: product.stock,
        quantity: qtyToAdd,
      });
    }

    saveCart(cart);
    showToast(`Added ${qtyToAdd} × "${product.name}" to cart.`, 'success');
    return true;
  }

  /**
   * Image loading fallback generator
   */
  function handleImageError(img, title = 'Product', category = 'Item') {
    img.onerror = null; // prevent loop
    const parent = img.parentElement;
    if (!parent) return;

    const fallback = document.createElement('div');
    fallback.className = 'image-fallback-container';
    fallback.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
      <span>${escapeHTML(category)}</span>
      <div style="font-size:0.75rem; color:#64748b; margin-top:2px;">${escapeHTML(title)}</div>
    `;

    img.style.display = 'none';
    parent.appendChild(fallback);
  }

  /**
   * Auth Session State UI Sync
   */
  function syncAuthUI() {
    let user = null;
    try {
      const stored = localStorage.getItem(window.NovaConfig.STORAGE_KEYS.USER);
      if (stored) user = JSON.parse(stored);
    } catch (e) {
      // ignore
    }

    const authContainer = document.getElementById('nav-auth-container');
    if (!authContainer) return;

    if (user && user.email) {
      authContainer.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <a href="orders.html" class="auth-trigger-btn" title="View order history">
            👤 <strong>${escapeHTML(user.name || 'Demo User')}</strong>
          </a>
          <button id="logout-btn" class="btn btn-secondary btn-sm" style="padding:0.25rem 0.5rem; font-size:0.75rem;">
            Logout
          </button>
        </div>
      `;
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          localStorage.removeItem(window.NovaConfig.STORAGE_KEYS.USER);
          showToast('Signed out of demo session.', 'info');
          syncAuthUI();
          if (window.location.pathname.includes('admin') || window.location.pathname.includes('checkout')) {
            // Stay on page
          }
        });
      }
    } else {
      authContainer.innerHTML = `
        <a href="login.html" class="auth-trigger-btn">Sign In</a>
      `;
    }
  }

  /**
   * Sync Mode Indicator in Header & Notice Bar
   */
  function syncModeIndicator() {
    const config = window.NovaConfig.getConfig();
    const isMock = config.mode === 'mock';

    // Header badge
    const indicators = document.querySelectorAll('.mode-indicator');
    indicators.forEach(el => {
      el.className = `mode-indicator ${isMock ? '' : 'is-api'}`;
      el.innerHTML = `
        <span class="status-indicator-dot"></span>
        <span>${isMock ? 'Mock Mode (Local)' : 'API Mode (Flask)'}</span>
      `;
      el.onclick = openModeModal;
    });

    // Top notice bar
    const modeNameSpans = document.querySelectorAll('.current-mode-name');
    modeNameSpans.forEach(span => {
      span.textContent = isMock ? 'Mock Mode' : 'Flask API Mode';
    });
  }

  /**
   * Mode Configuration Modal
   */
  function openModeModal() {
    let modal = document.getElementById('mode-switch-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'mode-switch-modal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-dialog" role="dialog" aria-labelledby="mode-modal-title">
          <div class="modal-header">
            <h3 class="modal-title" id="mode-modal-title">API Integration Settings</h3>
            <button class="modal-close-btn" id="close-mode-modal" aria-label="Close dialog">&times;</button>
          </div>
          <div class="modal-body">
            <p style="font-size:0.875rem; color:var(--color-text-secondary); margin-bottom:1.25rem;">
              Choose how NovaStore communicates with backend services. Default is <strong>Mock Mode</strong> so the storefront runs instantly with zero setup.
            </p>

            <div class="form-group">
              <label class="form-label">Operation Mode</label>
              <div style="display:flex; gap:1rem; margin-top:0.5rem;">
                <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.875rem; cursor:pointer;">
                  <input type="radio" name="store-mode" value="mock" id="mode-radio-mock">
                  <span><strong>Mock Mode</strong> (Local demo data in browser)</span>
                </label>
              </div>
              <div style="display:flex; gap:1rem; margin-top:0.5rem;">
                <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.875rem; cursor:pointer;">
                  <input type="radio" name="store-mode" value="api" id="mode-radio-api">
                  <span><strong>API Mode</strong> (Connects to Python Flask REST API)</span>
                </label>
              </div>
            </div>

            <div class="form-group" id="api-url-group">
              <label class="form-label" for="flask-api-url">Flask REST API Base URL</label>
              <input type="url" id="flask-api-url" class="form-control" placeholder="http://127.0.0.1:5000/api/v1">
              <div class="form-help">Default: <code>http://127.0.0.1:5000/api/v1</code> (Requires CORS enabled on Flask)</div>
            </div>

            <div style="margin-top:1rem; padding:0.875rem; border-radius:var(--radius-sm); background-color:var(--color-canvas); border:1px solid var(--color-border); font-size:0.8125rem;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                <strong>Flask Health Check</strong>
                <button type="button" id="test-flask-btn" class="btn btn-secondary btn-sm">Test Connection</button>
              </div>
              <div id="flask-health-status" style="color:var(--color-text-muted);">
                Click "Test Connection" to ping <code>/api/v1/health</code>.
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="cancel-mode-modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="save-mode-modal">Save Settings</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // Event listeners
      document.getElementById('close-mode-modal').addEventListener('click', closeModeModal);
      document.getElementById('cancel-mode-modal').addEventListener('click', closeModeModal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModeModal();
      });

      document.getElementById('save-mode-modal').addEventListener('click', () => {
        const isMockSelected = document.getElementById('mode-radio-mock').checked;
        const newMode = isMockSelected ? 'mock' : 'api';
        const urlInput = document.getElementById('flask-api-url').value;

        window.NovaConfig.setMode(newMode);
        if (urlInput) {
          window.NovaConfig.setApiBaseUrl(urlInput);
        }

        syncModeIndicator();
        closeModeModal();
        showToast(`Saved settings: Running in ${newMode.toUpperCase()} mode.`, 'success');

        // Reload data if on products or admin page
        window.dispatchEvent(new CustomEvent('novastore:modeChanged', { detail: { mode: newMode } }));
      });

      document.getElementById('test-flask-btn').addEventListener('click', async () => {
        const statusEl = document.getElementById('flask-health-status');
        const urlInput = document.getElementById('flask-api-url').value || 'http://127.0.0.1:5000/api/v1';
        
        statusEl.innerHTML = 'Connecting to Flask API...';
        statusEl.style.color = 'var(--color-accent)';

        // Temporarily set url
        const prevUrl = window.NovaConfig.getApiBaseUrl();
        window.NovaConfig.setApiBaseUrl(urlInput);

        try {
          const res = await window.NovaApi.checkHealth();
          statusEl.innerHTML = `<span style="color:var(--color-success); font-weight:700;">✓ Connected!</span> Flask server responded: ${JSON.stringify(res)}`;
        } catch (err) {
          statusEl.innerHTML = `<span style="color:var(--color-danger); font-weight:700;">✗ Connection Failed:</span> ${escapeHTML(err.message)}`;
        } finally {
          window.NovaConfig.setApiBaseUrl(prevUrl);
        }
      });
    }

    // Populate current values
    const cfg = window.NovaConfig.getConfig();
    const mockRadio = document.getElementById('mode-radio-mock');
    const apiRadio = document.getElementById('mode-radio-api');
    const urlInput = document.getElementById('flask-api-url');

    if (cfg.mode === 'mock') {
      mockRadio.checked = true;
    } else {
      apiRadio.checked = true;
    }
    urlInput.value = cfg.apiBaseUrl;

    modal.classList.add('open');
  }

  function closeModeModal() {
    const modal = document.getElementById('mode-switch-modal');
    if (modal) modal.classList.remove('open');
  }

  /**
   * Mobile menu toggle setup
   */
  function setupMobileMenu() {
    const toggleBtn = document.querySelector('.mobile-menu-btn');
    const drawer = document.querySelector('.mobile-nav-drawer');
    if (toggleBtn && drawer) {
      toggleBtn.addEventListener('click', () => {
        const isOpen = drawer.classList.toggle('open');
        toggleBtn.setAttribute('aria-expanded', String(isOpen));
      });
    }
  }

  /**
   * Dismissible Notice Bar
   */
  function setupNoticeBar() {
    const closeBtn = document.querySelector('.notice-close-btn');
    const noticeBar = document.querySelector('.top-notice-bar');
    if (closeBtn && noticeBar) {
      closeBtn.addEventListener('click', () => {
        noticeBar.style.display = 'none';
      });
    }
  }

  // Initialize on DOM load
  document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    syncAuthUI();
    syncModeIndicator();
    setupMobileMenu();
    setupNoticeBar();

    // Listen to mode switch trigger from top banner
    const bannerModeLinks = document.querySelectorAll('.mode-pill-link');
    bannerModeLinks.forEach(link => link.addEventListener('click', openModeModal));
  });

  // Global exports
  window.NovaCommon = {
    formatUSD,
    showToast,
    escapeHTML,
    getCart,
    saveCart,
    getCartCount,
    updateCartBadge,
    addToCart,
    handleImageError,
    syncAuthUI,
    syncModeIndicator,
    openModeModal,
    closeModeModal,
  };
})(window);
