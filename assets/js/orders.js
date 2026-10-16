/**
 * NovaStore — Order History Page Controller
 * Displays customer order records from local storage or Flask REST API
 */

(function (window) {
  'use strict';

  async function fetchOrders() {
    const isMock = window.NovaConfig.isMockMode();
    if (isMock) {
      try {
        const stored = localStorage.getItem(window.NovaConfig.STORAGE_KEYS.ORDERS);
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        console.error('[NovaStore Orders] Error reading orders from localStorage:', e);
        return [];
      }
    } else {
      try {
        const res = await window.NovaApi.get('/orders');
        return res.orders || (Array.isArray(res) ? res : []);
      } catch (err) {
        console.error('[NovaStore Orders] API orders fetch error:', err);
        throw err;
      }
    }
  }

  async function renderOrders() {
    const container = document.getElementById('orders-container');
    if (!container) return;

    let orders = [];
    try {
      orders = await fetchOrders();
    } catch (err) {
      container.innerHTML = `
        <div class="empty-state" style="border-color:#fca5a5; background-color:#fff5f5;">
          <div class="empty-state-icon" style="color:var(--color-danger);">⚠️</div>
          <h2 class="empty-state-title" style="color:var(--color-danger);">Cannot Load Orders from Flask API</h2>
          <p class="empty-state-desc" style="color:#7f1d1d;">${window.NovaCommon.escapeHTML(err.message)}</p>
          <div style="display:flex; justify-content:center; gap:1rem; margin-top:1rem;">
            <button type="button" class="btn btn-secondary" onclick="window.NovaCommon.openModeModal()">API Settings</button>
            <button type="button" class="btn btn-primary" onclick="window.location.reload()">Retry</button>
          </div>
        </div>
      `;
      return;
    }

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📦</div>
          <h2 class="empty-state-title">No orders placed yet</h2>
          <p class="empty-state-desc">
            You don't have any purchase records in your demo order history. Place an order through checkout or generate a sample order below.
          </p>
          <div style="display:flex; justify-content:center; gap:1rem;">
            <a href="index.html" class="btn btn-primary">Start Shopping</a>
            <button type="button" class="btn btn-secondary" id="seed-sample-order-btn">Generate Sample Order</button>
          </div>
        </div>
      `;

      const seedBtn = document.getElementById('seed-sample-order-btn');
      if (seedBtn) {
        seedBtn.addEventListener('click', seedSampleOrder);
      }
      return;
    }

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
        <div>
          <span style="font-size:0.875rem; color:var(--color-text-muted);">
            Showing ${orders.length} ${orders.length === 1 ? 'order' : 'orders'} in your history
          </span>
        </div>
        <div style="display:flex; gap:0.75rem;">
          <button type="button" class="btn btn-secondary btn-sm" id="seed-sample-order-btn">
            + Sample Order
          </button>
          <button type="button" class="btn btn-secondary btn-sm" id="clear-orders-btn" style="color:var(--color-danger);">
            Clear History
          </button>
        </div>
      </div>

      <div class="orders-list">
        ${orders.map(order => {
          const formattedDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          return `
            <div class="order-card">
              <div class="order-card-header">
                <div class="order-header-block">
                  <span class="order-header-label">Order Number</span>
                  <span class="order-header-val tabular-nums">${window.NovaCommon.escapeHTML(order.id)}</span>
                </div>
                <div class="order-header-block">
                  <span class="order-header-label">Date Placed</span>
                  <span class="order-header-val">${formattedDate}</span>
                </div>
                <div class="order-header-block">
                  <span class="order-header-label">Total Amount</span>
                  <span class="order-header-val tabular-nums">${window.NovaCommon.formatUSD(order.total)}</span>
                </div>
                <div class="order-header-block">
                  <span class="order-header-label">Status</span>
                  <span class="order-header-val" style="color:var(--color-success);">● ${window.NovaCommon.escapeHTML(order.status || 'Confirmed')}</span>
                </div>
              </div>

              <div class="order-card-body">
                <div class="order-items-grid">
                  ${(order.items || []).map(item => `
                    <div class="order-item-row">
                      <div style="display:flex; align-items:center; gap:1rem;">
                        <img 
                          src="${item.imageUrl}" 
                          alt="${window.NovaCommon.escapeHTML(item.name)}" 
                          class="cart-thumb" 
                          style="width:54px; height:54px;"
                          onerror="window.NovaCommon.handleImageError(this, '${window.NovaCommon.escapeHTML(item.name)}', '${window.NovaCommon.escapeHTML(item.category || '')}')"
                        >
                        <div>
                          <a href="product.html?id=${item.id}" style="font-size:0.9375rem; font-weight:700; color:var(--color-text-primary);">
                            ${window.NovaCommon.escapeHTML(item.name)}
                          </a>
                          <div style="font-size:0.75rem; color:var(--color-text-muted); margin-top:2px;">
                            Quantity: ${item.quantity} · Unit Price: ${window.NovaCommon.formatUSD(item.price)}
                          </div>
                        </div>
                      </div>
                      <div style="font-weight:700; font-size:0.9375rem;" class="tabular-nums">
                        ${window.NovaCommon.formatUSD((item.price || 0) * (item.quantity || 1))}
                      </div>
                    </div>
                  `).join('')}
                </div>

                ${order.customer ? `
                  <div style="margin-top:1.25rem; padding-top:1rem; border-top:1px solid var(--color-border-subtle); display:flex; justify-content:space-between; flex-wrap:wrap; gap:1rem; font-size:0.8125rem; color:var(--color-text-secondary);">
                    <div>
                      <strong>Ship to:</strong> ${window.NovaCommon.escapeHTML(order.customer.name)} (${window.NovaCommon.escapeHTML(order.customer.email)})<br>
                      ${window.NovaCommon.escapeHTML(order.customer.address)}, ${window.NovaCommon.escapeHTML(order.customer.city)}, ${window.NovaCommon.escapeHTML(order.customer.state)} ${window.NovaCommon.escapeHTML(order.customer.zip)}
                    </div>
                    <div>
                      <strong>Delivery Method:</strong> Standard Insured Delivery<br>
                      <strong>Payment:</strong> Demo Card Verification
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Event listeners
    const clearBtn = document.getElementById('clear-orders-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Clear all demo orders?')) {
          localStorage.removeItem(window.NovaConfig.STORAGE_KEYS.ORDERS);
          window.NovaCommon.showToast('Order history cleared.', 'info');
          renderOrders();
        }
      });
    }

    const seedBtn = document.getElementById('seed-sample-order-btn');
    if (seedBtn) {
      seedBtn.addEventListener('click', seedSampleOrder);
    }
  }

  function seedSampleOrder() {
    const products = window.NovaMockData.getProducts();
    const sampleItems = [
      { ...products[0], quantity: 1 },
      { ...products[2], quantity: 1 },
    ];
    const subtotal = sampleItems.reduce((s, i) => s + (i.price * i.quantity), 0);
    const tax = subtotal * 0.07;
    const total = subtotal + tax;

    const sampleOrder = {
      id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
      customer: {
        name: 'Jordan Miller',
        email: 'jordan.m@example.com',
        phone: '+1 (555) 789-0123',
        address: '450 Mission Street, Suite 800',
        city: 'San Francisco',
        state: 'CA',
        zip: '94105',
        country: 'United States',
      },
      items: sampleItems,
      subtotal,
      shipping: 0,
      tax,
      total,
      status: 'Shipped',
    };

    let orders = [];
    try {
      const stored = localStorage.getItem(window.NovaConfig.STORAGE_KEYS.ORDERS);
      if (stored) orders = JSON.parse(stored);
    } catch (e) {
      orders = [];
    }
    orders.unshift(sampleOrder);
    localStorage.setItem(window.NovaConfig.STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    window.NovaCommon.showToast('Generated sample demo order.', 'success');
    renderOrders();
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderOrders();
  });

  window.NovaOrders = {
    renderOrders,
    seedSampleOrder,
  };
})(window);
