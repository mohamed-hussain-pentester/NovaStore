/**
 * NovaStore — Shopping Cart Page Controller
 * Handles itemized cart table, steppers, stock constraints, subtotal, shipping, and checkout trigger
 */

(function (window) {
  'use strict';

  const FREE_SHIPPING_THRESHOLD = 50.00;
  const STANDARD_SHIPPING_FEE = 9.00;
  const TAX_RATE = 0.07; // 7% demo estimated sales tax

  /**
   * Fetch cart based on active mode
   */
  async function fetchCart() {
    const isMock = window.NovaConfig.isMockMode();
    if (isMock) {
      return window.NovaCommon.getCart();
    } else {
      try {
        const res = await window.NovaApi.get('/cart');
        return res.items || res.cart || [];
      } catch (err) {
        console.error('[NovaStore Cart] API cart fetch error:', err);
        throw err;
      }
    }
  }

  /**
   * Update item quantity in cart
   */
  async function updateItemQuantity(itemId, newQuantity) {
    const isMock = window.NovaConfig.isMockMode();
    const qty = parseInt(newQuantity, 10);

    if (isNaN(qty) || qty < 1) return;

    if (isMock) {
      const cart = window.NovaCommon.getCart();
      const item = cart.find(i => i.id === itemId);
      if (!item) return;

      if (qty > item.stock) {
        window.NovaCommon.showToast(`Cannot increase beyond available stock (${item.stock}).`, 'warning');
        renderCart();
        return;
      }

      item.quantity = qty;
      window.NovaCommon.saveCart(cart);
      renderCart();
    } else {
      try {
        await window.NovaApi.patch(`/cart/items/${itemId}`, { quantity: qty });
        await renderCart();
      } catch (err) {
        window.NovaCommon.showToast(`Failed to update quantity: ${err.message}`, 'error');
        await renderCart();
      }
    }
  }

  /**
   * Remove item from cart
   */
  async function removeItem(itemId) {
    const isMock = window.NovaConfig.isMockMode();
    if (isMock) {
      const cart = window.NovaCommon.getCart();
      const filtered = cart.filter(i => i.id !== itemId);
      window.NovaCommon.saveCart(filtered);
      window.NovaCommon.showToast('Item removed from cart.', 'info');
      renderCart();
    } else {
      try {
        await window.NovaApi.del(`/cart/items/${itemId}`);
        window.NovaCommon.showToast('Item removed from cart.', 'info');
        await renderCart();
      } catch (err) {
        window.NovaCommon.showToast(`Failed to remove item: ${err.message}`, 'error');
      }
    }
  }

  /**
   * Clear entire cart
   */
  function clearCart() {
    if (confirm('Are you sure you want to remove all items from your cart?')) {
      window.NovaCommon.saveCart([]);
      window.NovaCommon.showToast('Cart cleared.', 'info');
      renderCart();
    }
  }

  /**
   * Renders the cart page content
   */
  async function renderCart() {
    const container = document.getElementById('cart-container');
    if (!container) return;

    let cart = [];
    try {
      cart = await fetchCart();
    } catch (err) {
      container.innerHTML = `
        <div class="empty-state" style="border-color:#fca5a5; background-color:#fff5f5;">
          <div class="empty-state-icon" style="color:var(--color-danger);">⚠️</div>
          <h2 class="empty-state-title" style="color:var(--color-danger);">Cannot Load Cart from Flask API</h2>
          <p class="empty-state-desc" style="color:#7f1d1d;">${window.NovaCommon.escapeHTML(err.message)}</p>
          <div style="display:flex; justify-content:center; gap:1rem; margin-top:1rem;">
            <button type="button" class="btn btn-secondary" onclick="window.NovaCommon.openModeModal()">API Settings</button>
            <button type="button" class="btn btn-primary" onclick="window.location.reload()">Retry</button>
          </div>
        </div>
      `;
      return;
    }

    if (cart.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>
          <h2 class="empty-state-title">Your shopping cart is empty</h2>
          <p class="empty-state-desc">
            Explore our collection of precision audio gear, workspace tools, and lifestyle essentials to fill your bag.
          </p>
          <a href="index.html" class="btn btn-primary btn-lg">Explore Catalog</a>
        </div>
      `;
      return;
    }

    // Calculations
    const subtotal = cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
    const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
    const shippingFee = isFreeShipping ? 0 : STANDARD_SHIPPING_FEE;
    const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
    const shippingProgressPct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
    const estimatedTax = subtotal * TAX_RATE;
    const orderTotal = subtotal + shippingFee + estimatedTax;

    container.innerHTML = `
      <div class="cart-layout">
        <!-- Cart Items Table -->
        <div class="cart-items-card">
          <table class="cart-table">
            <thead>
              <tr>
                <th>Product</th>
                <th style="width:140px; text-align:center;">Quantity</th>
                <th style="width:120px; text-align:right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${cart.map(item => {
                const itemTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
                const stock = Number(item.stock) || 99;

                return `
                  <tr data-item-id="${item.id}">
                    <td>
                      <div class="cart-item-info">
                        <img 
                          class="cart-thumb" 
                          src="${item.imageUrl}" 
                          alt="${window.NovaCommon.escapeHTML(item.name)}"
                          onerror="window.NovaCommon.handleImageError(this, '${window.NovaCommon.escapeHTML(item.name)}', '${window.NovaCommon.escapeHTML(item.category || '')}')"
                        >
                        <div>
                          <a href="product.html?id=${item.id}" class="cart-item-title">${window.NovaCommon.escapeHTML(item.name)}</a>
                          <div class="cart-item-meta">
                            <span>${window.NovaCommon.escapeHTML(item.category || 'Gear')}</span>
                            <span aria-hidden="true">·</span>
                            <span class="price">${window.NovaCommon.formatUSD(item.price)} each</span>
                          </div>
                          <button type="button" class="cart-remove-btn" data-id="${item.id}">
                            ✕ Remove
                          </button>
                        </div>
                      </div>
                    </td>
                    <td style="text-align:center;">
                      <div class="quantity-stepper" style="margin:0 auto;">
                        <button type="button" class="stepper-btn cart-qty-minus" data-id="${item.id}">-</button>
                        <input 
                          type="number" 
                          class="stepper-input cart-qty-input tabular-nums" 
                          data-id="${item.id}" 
                          value="${item.quantity}" 
                          min="1" 
                          max="${stock}"
                        >
                        <button type="button" class="stepper-btn cart-qty-plus" data-id="${item.id}" ${item.quantity >= stock ? 'disabled' : ''}>+</button>
                      </div>
                      ${item.quantity >= stock ? `<div style="font-size:0.7rem; color:var(--color-warning); margin-top:4px;">Max stock reached</div>` : ''}
                    </td>
                    <td style="text-align:right;">
                      <span class="price tabular-nums" style="font-weight:700; font-size:1rem;">
                        ${window.NovaCommon.formatUSD(itemTotal)}
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <div style="padding:1rem 1.25rem; display:flex; justify-content:space-between; align-items:center; background-color:var(--color-canvas); border-top:1px solid var(--color-border);">
            <a href="index.html" class="btn btn-secondary btn-sm">← Continue Shopping</a>
            <button type="button" class="btn btn-secondary btn-sm" id="clear-cart-btn" style="color:var(--color-danger);">
              Clear Cart
            </button>
          </div>
        </div>

        <!-- Order Summary Card -->
        <div class="cart-summary-card">
          <h2 class="summary-title">Order Summary</h2>

          <!-- Free Shipping Threshold Banner -->
          <div class="shipping-bar-container">
            ${isFreeShipping 
              ? `<div style="color:var(--color-success); font-weight:700;">✓ You unlocked Free Standard Shipping!</div>` 
              : `<div>Add <strong>${window.NovaCommon.formatUSD(remainingForFreeShipping)}</strong> more to unlock <strong>Free Shipping</strong></div>`
            }
            <div class="shipping-progress-bg">
              <div class="shipping-progress-fill" style="width: ${shippingProgressPct}%;"></div>
            </div>
          </div>

          <div class="summary-row">
            <span>Items Subtotal</span>
            <span class="price tabular-nums">${window.NovaCommon.formatUSD(subtotal)}</span>
          </div>

          <div class="summary-row">
            <span>Estimated Shipping</span>
            <span class="price tabular-nums">
              ${isFreeShipping ? '<span style="color:var(--color-success); font-weight:700;">FREE</span>' : window.NovaCommon.formatUSD(shippingFee)}
            </span>
          </div>

          <div class="summary-row">
            <span>Estimated Tax (7%)</span>
            <span class="price tabular-nums">${window.NovaCommon.formatUSD(estimatedTax)}</span>
          </div>

          <div class="summary-row total-row">
            <span>Total USD</span>
            <span class="price tabular-nums">${window.NovaCommon.formatUSD(orderTotal)}</span>
          </div>

          <div style="margin-top:1.5rem;">
            <a href="checkout.html" class="btn btn-primary btn-block btn-lg" style="margin-bottom:0.75rem;">
              Proceed to Checkout →
            </a>
          </div>

          <div style="font-size:0.75rem; color:var(--color-text-muted); text-align:center; line-height:1.4; margin-top:1rem;">
            🔒 Demo Checkout Simulation. No real credit card or payment required.
          </div>
        </div>
      </div>
    `;

    attachCartEvents();
  }

  function attachCartEvents() {
    // Minus buttons
    document.querySelectorAll('.cart-qty-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id, 10);
        const input = document.querySelector(`.cart-qty-input[data-id="${id}"]`);
        if (input) {
          const val = parseInt(input.value, 10) || 1;
          if (val > 1) {
            updateItemQuantity(id, val - 1);
          } else {
            removeItem(id);
          }
        }
      });
    });

    // Plus buttons
    document.querySelectorAll('.cart-qty-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id, 10);
        const input = document.querySelector(`.cart-qty-input[data-id="${id}"]`);
        if (input) {
          const val = parseInt(input.value, 10) || 1;
          updateItemQuantity(id, val + 1);
        }
      });
    });

    // Numeric inputs
    document.querySelectorAll('.cart-qty-input').forEach(input => {
      input.addEventListener('change', () => {
        const id = parseInt(input.dataset.id, 10);
        const val = parseInt(input.value, 10) || 1;
        updateItemQuantity(id, val);
      });
    });

    // Remove buttons
    document.querySelectorAll('.cart-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id, 10);
        removeItem(id);
      });
    });

    // Clear cart button
    const clearBtn = document.getElementById('clear-cart-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', clearCart);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderCart();
  });

  window.NovaCart = {
    renderCart,
    updateItemQuantity,
    removeItem,
    clearCart,
  };
})(window);
