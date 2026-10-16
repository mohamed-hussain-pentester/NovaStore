/**
 * NovaStore — Products Catalog & Detail Page Controller
 * Handles product listing, filtering, search, sorting, and single product views
 */

(function (window) {
  'use strict';

  let allProducts = [];
  let currentCategory = 'all';
  let searchQuery = '';
  let sortBy = 'featured';

  /**
   * Fetch all products based on active mode (Mock vs Flask API)
   */
  async function loadProducts() {
    const isMock = window.NovaConfig.isMockMode();

    if (isMock) {
      allProducts = window.NovaMockData.getProducts();
      return allProducts;
    } else {
      // In API mode, fetch directly from Flask backend
      try {
        const response = await window.NovaApi.get('/products');
        // Accept either raw array or { products: [...] }
        allProducts = Array.isArray(response) ? response : (response.products || []);
        return allProducts;
      } catch (err) {
        console.error('[NovaStore] Failed loading products from Flask API:', err);
        throw err;
      }
    }
  }

  /**
   * Fetch a single product by ID based on active mode
   */
  async function loadProductById(id) {
    const isMock = window.NovaConfig.isMockMode();
    const numId = parseInt(id, 10);

    if (isNaN(numId)) {
      return null;
    }

    if (isMock) {
      return window.NovaMockData.getProductById(numId);
    } else {
      try {
        const response = await window.NovaApi.get(`/products/${numId}`);
        return response.product || response;
      } catch (err) {
        console.error(`[NovaStore] Failed loading product ${numId} from Flask API:`, err);
        throw err;
      }
    }
  }

  /**
   * Filters and sorts the in-memory products array
   */
  function getFilteredProducts() {
    let result = [...allProducts];

    // Filter by Category
    if (currentCategory && currentCategory !== 'all') {
      result = result.filter(p => p.category && p.category.toLowerCase() === currentCategory.toLowerCase());
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        break;
      case 'price-desc':
        result.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
        break;
      case 'name-asc':
        result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'stock-desc':
        result.sort((a, b) => (Number(b.stock) || 0) - (Number(a.stock) || 0));
        break;
      case 'featured':
      default:
        result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || a.id - b.id);
        break;
    }

    return result;
  }

  /**
   * Render product cards into the catalog grid on index.html
   */
  function renderCatalogGrid() {
    const gridEl = document.getElementById('product-grid');
    const countEl = document.getElementById('product-count');
    if (!gridEl) return;

    const filtered = getFilteredProducts();

    if (countEl) {
      countEl.textContent = `Showing ${filtered.length} of ${allProducts.length} products`;
    }

    if (filtered.length === 0) {
      gridEl.innerHTML = `
        <div style="grid-column: 1 / -1;">
          <div class="empty-state">
            <div class="empty-state-icon">🔍</div>
            <h3 class="empty-state-title">No matching products found</h3>
            <p class="empty-state-desc">
              We couldn't find any products matching your search or filters. Try adjusting your query or resetting filters.
            </p>
            <button type="button" class="btn btn-secondary" id="reset-filters-btn">Reset All Filters</button>
          </div>
        </div>
      `;
      const resetBtn = document.getElementById('reset-filters-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          currentCategory = 'all';
          searchQuery = '';
          const searchInput = document.getElementById('product-search');
          if (searchInput) searchInput.value = '';
          document.querySelectorAll('.category-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === 'all');
          });
          renderCatalogGrid();
        });
      }
      return;
    }

    gridEl.innerHTML = filtered.map(p => {
      const stock = Number(p.stock) || 0;
      let stockClass = 'in-stock';
      let stockLabel = `In Stock (${stock})`;
      if (stock === 0) {
        stockClass = 'out-of-stock';
        stockLabel = 'Out of Stock';
      } else if (stock < 10) {
        stockClass = 'low-stock';
        stockLabel = `Low Stock (${stock} left)`;
      }

      return `
        <article class="product-card" data-product-id="${p.id}">
          <a href="product.html?id=${p.id}" class="product-card-image-wrap" tabindex="-1" aria-hidden="true">
            <img src="${p.imageUrl}" alt="${window.NovaCommon.escapeHTML(p.name)}" onerror="window.NovaCommon.handleImageError(this, '${window.NovaCommon.escapeHTML(p.name)}', '${window.NovaCommon.escapeHTML(p.category)}')" loading="lazy">
          </a>
          <div class="product-card-body">
            <div class="product-card-meta">
              <span>${window.NovaCommon.escapeHTML(p.category)}</span>
              <span aria-hidden="true">·</span>
              <span class="product-stock-tag ${stockClass}">${stockLabel}</span>
            </div>
            <h3 class="product-card-title">
              <a href="product.html?id=${p.id}">${window.NovaCommon.escapeHTML(p.name)}</a>
            </h3>
            <p class="product-card-desc">${window.NovaCommon.escapeHTML(p.description)}</p>
            <div class="product-card-footer">
              <div class="product-price-block">
                <span class="product-price tabular-nums">${window.NovaCommon.formatUSD(p.price)}</span>
              </div>
              <button 
                type="button" 
                class="btn btn-primary btn-sm add-to-cart-btn" 
                data-id="${p.id}" 
                ${stock <= 0 ? 'disabled' : ''}
              >
                ${stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Attach click events to Add to Cart buttons
    gridEl.querySelectorAll('.add-to-cart-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const id = parseInt(button.dataset.id, 10);
        const product = allProducts.find(item => item.id === id);
        if (product) {
          window.NovaCommon.addToCart(product, 1);
        }
      });
    });
  }

  /**
   * Initializes catalog controls on index.html
   */
  async function initCatalog() {
    const gridEl = document.getElementById('product-grid');
    if (!gridEl) return;

    // Show initial loading state
    gridEl.innerHTML = `
      <div style="grid-column: 1 / -1; text-align:center; padding: 4rem 1rem;">
        <div style="display:inline-block; width:36px; height:36px; border:3px solid #cbd5e1; border-top-color:var(--color-primary); border-radius:50%; animation:spin 1s linear infinite;"></div>
        <p style="margin-top:1rem; font-size:0.875rem; color:var(--color-text-muted);">Loading NovaStore catalog...</p>
      </div>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;

    try {
      await loadProducts();
      renderCatalogGrid();
    } catch (err) {
      gridEl.innerHTML = `
        <div style="grid-column: 1 / -1;">
          <div class="empty-state" style="border-color:#fca5a5; background-color:#fff5f5;">
            <div class="empty-state-icon" style="color:var(--color-danger);">⚠️</div>
            <h3 class="empty-state-title" style="color:var(--color-danger);">Failed to Connect to Flask REST API</h3>
            <p class="empty-state-desc" style="color:#7f1d1d;">
              ${window.NovaCommon.escapeHTML(err.message)}
            </p>
            <div style="display:flex; justify-content:center; gap:1rem; margin-top:1rem;">
              <button type="button" class="btn btn-secondary" onclick="window.NovaCommon.openModeModal()">Change Settings</button>
              <button type="button" class="btn btn-primary" onclick="window.location.reload()">Retry Connection</button>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // Category Tabs click listeners
    const categoryTabs = document.querySelectorAll('.category-tab-btn');
    categoryTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        categoryTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentCategory = tab.dataset.category || 'all';
        renderCatalogGrid();
      });
    });

    // Search input listener with debouncing
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
      let timeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          searchQuery = e.target.value;
          renderCatalogGrid();
        }, 180);
      });
    }

    // Sort select listener
    const sortSelect = document.getElementById('product-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        sortBy = e.target.value;
        renderCatalogGrid();
      });
    }

    // Listen to mode switch or updates
    window.addEventListener('novastore:productsUpdated', async () => {
      await loadProducts();
      renderCatalogGrid();
    });
    window.addEventListener('novastore:modeChanged', async () => {
      await initCatalog();
    });
  }

  /**
   * Initializes Product Detail Page (product.html)
   */
  async function initProductDetail() {
    const container = document.getElementById('pdp-container');
    if (!container) return;

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
      renderPdpError('No Product ID Specified', 'Please choose a product from our catalog.');
      return;
    }

    container.innerHTML = `
      <div style="text-align:center; padding: 5rem 1rem;">
        <div style="display:inline-block; width:36px; height:36px; border:3px solid #cbd5e1; border-top-color:var(--color-primary); border-radius:50%; animation:spin 1s linear infinite;"></div>
        <p style="margin-top:1rem; font-size:0.875rem; color:var(--color-text-muted);">Fetching product details...</p>
      </div>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;

    let product = null;
    try {
      product = await loadProductById(productId);
    } catch (err) {
      renderPdpError('Flask API Error', err.message);
      return;
    }

    if (!product) {
      renderPdpError('Product Not Found', `Product #${productId} does not exist in the catalog.`);
      return;
    }

    // Update document title
    document.title = `${product.name} — NovaStore`;

    const stock = Number(product.stock) || 0;
    let stockClass = 'in-stock';
    let stockLabel = `In Stock (${stock} units available)`;
    if (stock <= 0) {
      stockClass = 'out-of-stock';
      stockLabel = 'Currently Out of Stock';
    } else if (stock < 10) {
      stockClass = 'low-stock';
      stockLabel = `Low Stock (${stock} units left)`;
    }

    // Render breadcrumb and PDP content
    container.innerHTML = `
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="index.html">Catalog</a>
        <span class="breadcrumb-separator" aria-hidden="true">/</span>
        <a href="index.html?category=${encodeURIComponent(product.category.toLowerCase())}">${window.NovaCommon.escapeHTML(product.category)}</a>
        <span class="breadcrumb-separator" aria-hidden="true">/</span>
        <span style="color:var(--color-text-primary); font-weight:600;">${window.NovaCommon.escapeHTML(product.name)}</span>
      </nav>

      <div class="pdp-grid">
        <!-- Gallery -->
        <div class="pdp-gallery-card">
          <div class="pdp-main-image">
            <img 
              id="pdp-img"
              src="${product.imageUrl}" 
              alt="${window.NovaCommon.escapeHTML(product.name)}" 
              onerror="window.NovaCommon.handleImageError(this, '${window.NovaCommon.escapeHTML(product.name)}', '${window.NovaCommon.escapeHTML(product.category)}')"
            >
          </div>
        </div>

        <!-- Purchase & Details Module -->
        <div class="pdp-purchase-module">
          <div>
            <div class="pdp-meta">
              <span>${window.NovaCommon.escapeHTML(product.category)}</span>
              <span aria-hidden="true">·</span>
              <span>SKU: NOVA-${String(product.id).padStart(4, '0')}</span>
              <span aria-hidden="true">·</span>
              <span>Rating: ★ ${product.rating || '4.8'}</span>
            </div>
            <h1 class="pdp-title">${window.NovaCommon.escapeHTML(product.name)}</h1>
          </div>

          <div class="pdp-price-strip">
            <span class="pdp-price tabular-nums">${window.NovaCommon.formatUSD(product.price)}</span>
            <span class="pdp-stock-status product-stock-tag ${stockClass}">
              ● ${stockLabel}
            </span>
          </div>

          <p class="pdp-description">${window.NovaCommon.escapeHTML(product.description)}</p>

          <!-- Specifications -->
          ${renderSpecsBox(product.specs)}

          <!-- Purchase Controls -->
          <div class="pdp-action-area">
            <div class="quantity-control-group">
              <label for="pdp-qty-input" style="font-size:0.875rem; font-weight:700;">Quantity:</label>
              <div class="quantity-stepper">
                <button type="button" class="stepper-btn" id="qty-minus" aria-label="Decrease quantity" ${stock <= 0 ? 'disabled' : ''}>-</button>
                <input 
                  type="number" 
                  id="pdp-qty-input" 
                  class="stepper-input tabular-nums" 
                  value="1" 
                  min="1" 
                  max="${stock}" 
                  ${stock <= 0 ? 'disabled' : ''}
                >
                <button type="button" class="stepper-btn" id="qty-plus" aria-label="Increase quantity" ${stock <= 0 ? 'disabled' : ''}>+</button>
              </div>
              <span style="font-size:0.8125rem; color:var(--color-text-muted);">
                Max ${stock} units
              </span>
            </div>

            <div class="pdp-cta-buttons">
              <button 
                type="button" 
                class="btn btn-secondary btn-lg" 
                id="pdp-add-cart-btn" 
                ${stock <= 0 ? 'disabled' : ''}
              >
                ${stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button 
                type="button" 
                class="btn btn-primary btn-lg" 
                id="pdp-buy-now-btn" 
                ${stock <= 0 ? 'disabled' : ''}
              >
                Buy Now
              </button>
            </div>
          </div>

          <!-- Backend learning note -->
          <div class="backend-practice-callout">
            <strong>Flask API Practice Endpoint</strong>
            This page requests <code>GET /api/v1/products/${product.id}</code>. In API mode, your Flask route should return JSON conforming to the contract: <code>{"product": {...}}</code>.
          </div>
        </div>
      </div>

      <!-- Related Products -->
      <section style="margin-top:5rem; padding-top:3rem; border-top:1px solid var(--color-border);">
        <h2 style="font-size:1.5rem; font-weight:800; margin-bottom:1.5rem;">Related in ${window.NovaCommon.escapeHTML(product.category)}</h2>
        <div class="product-grid" id="related-products-grid">
          <!-- Rendered dynamically -->
        </div>
      </section>
    `;

    setupPdpEvents(product, stock);
    renderRelatedProducts(product);
  }

  function renderSpecsBox(specs) {
    if (!specs || Object.keys(specs).length === 0) return '';
    const rows = Object.entries(specs).map(([key, val]) => `
      <li class="pdp-spec-row">
        <span class="spec-key">${window.NovaCommon.escapeHTML(key)}</span>
        <span class="spec-val">${window.NovaCommon.escapeHTML(val)}</span>
      </li>
    `).join('');

    return `
      <div class="pdp-specs-box">
        <h3 class="pdp-specs-title">Technical Specifications</h3>
        <ul class="pdp-specs-list">${rows}</ul>
      </div>
    `;
  }

  function setupPdpEvents(product, stock) {
    const qtyInput = document.getElementById('pdp-qty-input');
    const minusBtn = document.getElementById('qty-minus');
    const plusBtn = document.getElementById('qty-plus');
    const addBtn = document.getElementById('pdp-add-cart-btn');
    const buyBtn = document.getElementById('pdp-buy-now-btn');

    if (!qtyInput || stock <= 0) return;

    minusBtn.addEventListener('click', () => {
      let val = parseInt(qtyInput.value, 10) || 1;
      if (val > 1) {
        qtyInput.value = val - 1;
      }
    });

    plusBtn.addEventListener('click', () => {
      let val = parseInt(qtyInput.value, 10) || 1;
      if (val < stock) {
        qtyInput.value = val + 1;
      } else {
        window.NovaCommon.showToast(`Maximum available stock is ${stock}.`, 'warning');
      }
    });

    qtyInput.addEventListener('change', () => {
      let val = parseInt(qtyInput.value, 10) || 1;
      if (val < 1) val = 1;
      if (val > stock) val = stock;
      qtyInput.value = val;
    });

    addBtn.addEventListener('click', () => {
      const qty = parseInt(qtyInput.value, 10) || 1;
      window.NovaCommon.addToCart(product, qty);
    });

    buyBtn.addEventListener('click', () => {
      const qty = parseInt(qtyInput.value, 10) || 1;
      const success = window.NovaCommon.addToCart(product, qty);
      if (success) {
        window.location.href = 'checkout.html';
      }
    });
  }

  async function renderRelatedProducts(currentProduct) {
    const grid = document.getElementById('related-products-grid');
    if (!grid) return;

    const all = await loadProducts();
    const related = all
      .filter(p => p.id !== currentProduct.id && p.category === currentProduct.category)
      .slice(0, 3);

    // If not enough in same category, supplement with others
    if (related.length < 3) {
      const others = all.filter(p => p.id !== currentProduct.id && !related.includes(p)).slice(0, 3 - related.length);
      related.push(...others);
    }

    grid.innerHTML = related.map(p => `
      <article class="product-card">
        <a href="product.html?id=${p.id}" class="product-card-image-wrap" tabindex="-1">
          <img src="${p.imageUrl}" alt="${window.NovaCommon.escapeHTML(p.name)}" onerror="window.NovaCommon.handleImageError(this, '${window.NovaCommon.escapeHTML(p.name)}', '${window.NovaCommon.escapeHTML(p.category)}')" loading="lazy">
        </a>
        <div class="product-card-body">
          <div class="product-card-meta">
            <span>${window.NovaCommon.escapeHTML(p.category)}</span>
          </div>
          <h3 class="product-card-title">
            <a href="product.html?id=${p.id}">${window.NovaCommon.escapeHTML(p.name)}</a>
          </h3>
          <div class="product-card-footer">
            <span class="product-price tabular-nums">${window.NovaCommon.formatUSD(p.price)}</span>
            <button type="button" class="btn btn-secondary btn-sm related-add-btn" data-id="${p.id}">
              Add to Cart
            </button>
          </div>
        </div>
      </article>
    `).join('');

    grid.querySelectorAll('.related-add-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id, 10);
        const p = all.find(item => item.id === id);
        if (p) window.NovaCommon.addToCart(p, 1);
      });
    });
  }

  function renderPdpError(title, message) {
    const container = document.getElementById('pdp-container');
    if (!container) return;
    container.innerHTML = `
      <div class="empty-state" style="margin: 4rem 0;">
        <div class="empty-state-icon" style="color:var(--color-danger);">⚠️</div>
        <h2 class="empty-state-title">${window.NovaCommon.escapeHTML(title)}</h2>
        <p class="empty-state-desc">${window.NovaCommon.escapeHTML(message)}</p>
        <div style="display:flex; justify-content:center; gap:1rem;">
          <a href="index.html" class="btn btn-primary">Back to Catalog</a>
          <button type="button" class="btn btn-secondary" onclick="window.NovaCommon.openModeModal()">API Settings</button>
        </div>
      </div>
    `;
  }

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', () => {
    initCatalog();
    initProductDetail();
  });

  window.NovaProducts = {
    loadProducts,
    loadProductById,
    initCatalog,
    initProductDetail,
  };
})(window);
