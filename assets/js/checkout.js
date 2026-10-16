/**
 * NovaStore — Checkout Flow & Order Placement Controller
 * Validates shipping details and places demo orders (local storage or Flask API)
 */

(function (window) {
  'use strict';

  const FREE_SHIPPING_THRESHOLD = 50.00;
  const STANDARD_SHIPPING_FEE = 9.00;
  const TAX_RATE = 0.07;

  let currentCart = [];

  function initCheckout() {
    const container = document.getElementById('checkout-container');
    if (!container) return;

    currentCart = window.NovaCommon.getCart();

    if (currentCart.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="margin: 3rem 0;">
          <div class="empty-state-icon">🛒</div>
          <h2 class="empty-state-title">Your cart is empty</h2>
          <p class="empty-state-desc">You cannot checkout without items in your shopping cart.</p>
          <a href="index.html" class="btn btn-primary btn-lg">Browse Products</a>
        </div>
      `;
      return;
    }

    renderCheckoutUI();
  }

  function renderCheckoutUI() {
    const container = document.getElementById('checkout-container');
    if (!container) return;

    const subtotal = currentCart.reduce((sum, i) => sum + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);
    const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
    const shippingFee = isFreeShipping ? 0 : STANDARD_SHIPPING_FEE;
    const estimatedTax = subtotal * TAX_RATE;
    const total = subtotal + shippingFee + estimatedTax;

    // Prefill user details if logged in
    let prefill = { name: '', email: '', phone: '', address: '', city: '', state: '', zip: '' };
    try {
      const storedUser = localStorage.getItem(window.NovaConfig.STORAGE_KEYS.USER);
      if (storedUser) {
        const u = JSON.parse(storedUser);
        prefill.name = u.name || '';
        prefill.email = u.email || '';
      }
    } catch (e) {
      // ignore
    }

    container.innerHTML = `
      <!-- Demo Mode Notice Banner -->
      <div class="demo-banner-box">
        <span style="font-size:1.25rem;">ℹ️</span>
        <div>
          <strong>Practice Checkout Simulation:</strong>
          This checkout interface does not process real payments or require credit card details. When you click "Place Demo Order", the order is recorded in your browser's demo order history (or sent to your Flask REST API in API mode).
        </div>
      </div>

      <div class="checkout-grid">
        <!-- Shipping & Customer Form -->
        <div class="checkout-form-card">
          <form id="checkout-form" novalidate>
            <h2 class="form-section-title">1. Contact Information</h2>
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label" for="cust-name">Full Name <span class="required">*</span></label>
                <input type="text" id="cust-name" class="form-control" placeholder="Alex Morgan" value="${window.NovaCommon.escapeHTML(prefill.name)}" required>
                <div class="invalid-feedback">Please enter your full name.</div>
              </div>
              <div class="form-group">
                <label class="form-label" for="cust-email">Email Address <span class="required">*</span></label>
                <input type="email" id="cust-email" class="form-control" placeholder="alex@example.com" value="${window.NovaCommon.escapeHTML(prefill.email)}" required>
                <div class="invalid-feedback">Please enter a valid email address.</div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="cust-phone">Phone Number <span class="required">*</span></label>
              <input type="tel" id="cust-phone" class="form-control" placeholder="+1 (555) 234-5678" required>
              <div class="invalid-feedback">Please provide a phone number for delivery notifications.</div>
            </div>

            <h2 class="form-section-title" style="margin-top:2rem;">2. Shipping Address</h2>
            <div class="form-group">
              <label class="form-label" for="cust-address">Street Address <span class="required">*</span></label>
              <input type="text" id="cust-address" class="form-control" placeholder="742 Evergreen Terrace" required>
              <div class="invalid-feedback">Please enter a valid street delivery address.</div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label" for="cust-city">City <span class="required">*</span></label>
                <input type="text" id="cust-city" class="form-control" placeholder="San Francisco" required>
                <div class="invalid-feedback">City is required.</div>
              </div>
              <div class="form-group">
                <label class="form-label" for="cust-state">State / Province <span class="required">*</span></label>
                <input type="text" id="cust-state" class="form-control" placeholder="CA" required>
                <div class="invalid-feedback">State/Province is required.</div>
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label" for="cust-zip">ZIP / Postal Code <span class="required">*</span></label>
                <input type="text" id="cust-zip" class="form-control" placeholder="94107" required>
                <div class="invalid-feedback">Valid postal code is required.</div>
              </div>
              <div class="form-group">
                <label class="form-label" for="cust-country">Country</label>
                <select id="cust-country" class="form-control">
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Germany">Germany</option>
                </select>
              </div>
            </div>

            <h2 class="form-section-title" style="margin-top:2rem;">3. Demo Payment Selection</h2>
            <div style="background-color:var(--color-canvas); border:1px solid var(--color-border); border-radius:var(--radius-sm); padding:1rem; margin-bottom:1.5rem;">
              <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.875rem; margin-bottom:0.5rem; cursor:pointer;">
                <input type="radio" name="payment-method" value="demo-card" checked>
                <span><strong>Simulated Credit Card</strong> (Pre-approved sandbox)</span>
              </label>
              <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.875rem; cursor:pointer;">
                <input type="radio" name="payment-method" value="cod">
                <span><strong>Cash on Delivery (COD)</strong> (Demo delivery verification)</span>
              </label>
            </div>

            <button type="submit" id="place-order-btn" class="btn btn-primary btn-block btn-lg">
              Place Demo Order (${window.NovaCommon.formatUSD(total)})
            </button>
          </form>
        </div>

        <!-- Order Summary Column -->
        <div>
          <div class="cart-summary-card">
            <h2 class="summary-title">Summary (${currentCart.length} ${currentCart.length === 1 ? 'item' : 'items'})</h2>

            <div style="max-height: 280px; overflow-y:auto; margin-bottom:1.25rem; padding-right:0.25rem;">
              ${currentCart.map(i => `
                <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
                  <img src="${i.imageUrl}" class="cart-thumb" style="width:48px; height:48px;" alt="${window.NovaCommon.escapeHTML(i.name)}">
                  <div style="flex:1; min-width:0;">
                    <div style="font-size:0.8125rem; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                      ${window.NovaCommon.escapeHTML(i.name)}
                    </div>
                    <div style="font-size:0.75rem; color:var(--color-text-muted);">
                      Qty: ${i.quantity} × ${window.NovaCommon.formatUSD(i.price)}
                    </div>
                  </div>
                  <div style="font-size:0.875rem; font-weight:700;" class="tabular-nums">
                    ${window.NovaCommon.formatUSD(i.price * i.quantity)}
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="summary-row">
              <span>Subtotal</span>
              <span class="tabular-nums">${window.NovaCommon.formatUSD(subtotal)}</span>
            </div>
            <div class="summary-row">
              <span>Shipping</span>
              <span class="tabular-nums">${isFreeShipping ? '<span style="color:var(--color-success); font-weight:700;">FREE</span>' : window.NovaCommon.formatUSD(shippingFee)}</span>
            </div>
            <div class="summary-row">
              <span>Estimated Tax (7%)</span>
              <span class="tabular-nums">${window.NovaCommon.formatUSD(estimatedTax)}</span>
            </div>
            <div class="summary-row total-row">
              <span>Order Total</span>
              <span class="tabular-nums">${window.NovaCommon.formatUSD(total)}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    setupCheckoutFormValidation(total, subtotal, shippingFee, estimatedTax);
  }

  function setupCheckoutFormValidation(total, subtotal, shippingFee, estimatedTax) {
    const form = document.getElementById('checkout-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('cust-name');
      const emailInput = document.getElementById('cust-email');
      const phoneInput = document.getElementById('cust-phone');
      const addrInput = document.getElementById('cust-address');
      const cityInput = document.getElementById('cust-city');
      const stateInput = document.getElementById('cust-state');
      const zipInput = document.getElementById('cust-zip');

      let isValid = true;

      // Validate Name
      if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
        nameInput.classList.add('is-invalid');
        isValid = false;
      } else {
        nameInput.classList.remove('is-invalid');
      }

      // Validate Email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) {
        emailInput.classList.add('is-invalid');
        isValid = false;
      } else {
        emailInput.classList.remove('is-invalid');
      }

      // Validate Phone
      if (!phoneInput.value.trim() || phoneInput.value.trim().length < 7) {
        phoneInput.classList.add('is-invalid');
        isValid = false;
      } else {
        phoneInput.classList.remove('is-invalid');
      }

      // Validate Street
      if (!addrInput.value.trim() || addrInput.value.trim().length < 5) {
        addrInput.classList.add('is-invalid');
        isValid = false;
      } else {
        addrInput.classList.remove('is-invalid');
      }

      // Validate City
      if (!cityInput.value.trim()) {
        cityInput.classList.add('is-invalid');
        isValid = false;
      } else {
        cityInput.classList.remove('is-invalid');
      }

      // Validate State
      if (!stateInput.value.trim()) {
        stateInput.classList.add('is-invalid');
        isValid = false;
      } else {
        stateInput.classList.remove('is-invalid');
      }

      // Validate Zip
      if (!zipInput.value.trim() || zipInput.value.trim().length < 3) {
        zipInput.classList.add('is-invalid');
        isValid = false;
      } else {
        zipInput.classList.remove('is-invalid');
      }

      if (!isValid) {
        window.NovaCommon.showToast('Please correct the highlighted errors before submitting.', 'warning');
        return;
      }

      // Submit Order
      const submitBtn = document.getElementById('place-order-btn');
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Placing Order...';

      const orderPayload = {
        id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
        createdAt: new Date().toISOString(),
        customer: {
          name: nameInput.value.trim(),
          email: emailInput.value.trim(),
          phone: phoneInput.value.trim(),
          address: addrInput.value.trim(),
          city: cityInput.value.trim(),
          state: stateInput.value.trim(),
          zip: zipInput.value.trim(),
          country: document.getElementById('cust-country').value,
        },
        items: [...currentCart],
        subtotal,
        shipping: shippingFee,
        tax: estimatedTax,
        total,
        status: 'Processing',
      };

      const isMock = window.NovaConfig.isMockMode();

      try {
        if (isMock) {
          // Persist in localStorage orders
          let orders = [];
          try {
            const stored = localStorage.getItem(window.NovaConfig.STORAGE_KEYS.ORDERS);
            if (stored) orders = JSON.parse(stored);
          } catch (e) {
            orders = [];
          }
          orders.unshift(orderPayload);
          localStorage.setItem(window.NovaConfig.STORAGE_KEYS.ORDERS, JSON.stringify(orders));

          // Clear cart
          window.NovaCommon.saveCart([]);

          showOrderConfirmationModal(orderPayload);
        } else {
          // Send to Flask REST API: POST /api/v1/orders
          const response = await window.NovaApi.post('/orders', orderPayload);
          const finalOrder = response.order || orderPayload;

          window.NovaCommon.saveCart([]);
          showOrderConfirmationModal(finalOrder);
        }
      } catch (apiErr) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `Place Demo Order (${window.NovaCommon.formatUSD(total)})`;
        window.NovaCommon.showToast(`Flask API Order Error: ${apiErr.message}`, 'error');
      }
    });
  }

  function showOrderConfirmationModal(order) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.innerHTML = `
      <div class="modal-dialog" role="dialog">
        <div class="modal-header" style="background-color:var(--color-success-bg);">
          <div style="display:flex; align-items:center; gap:0.5rem; color:var(--color-success);">
            <span style="font-size:1.5rem;">✓</span>
            <h3 class="modal-title" style="color:var(--color-success);">Order Confirmed!</h3>
          </div>
        </div>
        <div class="modal-body">
          <p style="font-size:0.9375rem; margin-bottom:1.25rem;">
            Thank you, <strong>${window.NovaCommon.escapeHTML(order.customer.name)}</strong>! Your demo order has been registered successfully.
          </p>

          <div style="background-color:var(--color-canvas); border:1px solid var(--color-border); border-radius:var(--radius-sm); padding:1rem; margin-bottom:1.25rem; font-size:0.875rem;">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
              <span style="color:var(--color-text-muted);">Order Reference:</span>
              <strong class="tabular-nums">${order.id}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
              <span style="color:var(--color-text-muted);">Items:</span>
              <span>${order.items.length} items (${window.NovaCommon.formatUSD(order.total)})</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span style="color:var(--color-text-muted);">Status:</span>
              <span style="color:var(--color-success); font-weight:700;">● ${order.status}</span>
            </div>
          </div>

          <p style="font-size:0.8125rem; color:var(--color-text-muted);">
            A confirmation receipt will be delivered to <code>${window.NovaCommon.escapeHTML(order.customer.email)}</code> in production.
          </p>
        </div>
        <div class="modal-footer">
          <a href="orders.html" class="btn btn-secondary">View Order History</a>
          <a href="index.html" class="btn btn-primary">Return to Catalog</a>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  document.addEventListener('DOMContentLoaded', () => {
    initCheckout();
  });

  window.NovaCheckout = {
    initCheckout,
  };
})(window);
