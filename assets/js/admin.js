/**
 * NovaStore — Demo Admin Dashboard Controller
 * Full CRUD for products, inventory stats, and Flask Admin endpoint integration
 */

(function (window) {
  'use strict';

  let adminProducts = [];
  let filterCategory = 'all';
  let adminSearchQuery = '';

  async function loadAdminData() {
    const isMock = window.NovaConfig.isMockMode();
    if (isMock) {
      adminProducts = window.NovaMockData.getProducts();
      return adminProducts;
    } else {
      try {
        const res = await window.NovaApi.get('/admin/products');
        adminProducts = res.products || (Array.isArray(res) ? res : []);
        return adminProducts;
      } catch (err) {
        console.error('[NovaStore Admin] API error:', err);
        throw err;
      }
    }
  }

  async function renderDashboard() {
    const container = document.getElementById('admin-container');
    if (!container) return;

    try {
      await loadAdminData();
    } catch (err) {
      container.innerHTML = `
        <div class="empty-state" style="border-color:#fca5a5; background-color:#fff5f5; margin:3rem 0;">
          <div class="empty-state-icon" style="color:var(--color-danger);">⚠️</div>
          <h2 class="empty-state-title" style="color:var(--color-danger);">Flask Admin API Connection Failed</h2>
          <p class="empty-state-desc" style="color:#7f1d1d;">${window.NovaCommon.escapeHTML(err.message)}</p>
          <div style="display:flex; justify-content:center; gap:1rem; margin-top:1rem;">
            <button type="button" class="btn btn-secondary" onclick="window.NovaCommon.openModeModal()">API Settings</button>
            <button type="button" class="btn btn-primary" onclick="window.location.reload()">Retry</button>
          </div>
        </div>
      `;
      return;
    }

    // Calculate metrics
    const totalProducts = adminProducts.length;
    const lowStockCount = adminProducts.filter(p => Number(p.stock) < 10).length;
    
    let ordersCount = 0;
    try {
      const orders = JSON.parse(localStorage.getItem(window.NovaConfig.STORAGE_KEYS.ORDERS) || '[]');
      ordersCount = orders.length;
    } catch (e) {
      ordersCount = 0;
    }

    const totalInventoryValue = adminProducts.reduce((sum, p) => sum + ((Number(p.price) || 0) * (Number(p.stock) || 0)), 0);

    container.innerHTML = `
      <!-- Admin Practice Banner -->
      <div class="admin-banner">
        <div>
          <strong>Backend Developer Practice Dashboard:</strong>
          These product management actions simulate Flask admin endpoints: <code>GET /api/v1/admin/products</code>, <code>POST /api/v1/admin/products</code>, <code>PATCH /api/v1/admin/products/&lt;id&gt;</code>, and <code>DELETE /api/v1/admin/products/&lt;id&gt;</code>. In Mock Mode, changes persist locally in your browser.
        </div>
        <button type="button" class="btn btn-secondary btn-sm" id="factory-reset-btn" style="white-space:nowrap; background:#fff;">
          Reset Factory Data
        </button>
      </div>

      <!-- KPI Stat Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Catalog Products</div>
          <div class="stat-value tabular-nums">${totalProducts}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Low Stock Alerts (&lt;10)</div>
          <div class="stat-value tabular-nums" style="color:${lowStockCount > 0 ? 'var(--color-warning)' : 'inherit'};">
            ${lowStockCount}
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Demo Orders</div>
          <div class="stat-value tabular-nums">${ordersCount}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Inventory Valuation</div>
          <div class="stat-value tabular-nums">${window.NovaCommon.formatUSD(totalInventoryValue)}</div>
        </div>
      </div>

      <!-- Product Management Card -->
      <div class="admin-table-card">
        <div class="admin-toolbar">
          <div style="display:flex; align-items:center; gap:1rem; flex:1; max-width:500px;">
            <input 
              type="text" 
              id="admin-search" 
              class="form-control" 
              placeholder="Search products by title or category..." 
              value="${window.NovaCommon.escapeHTML(adminSearchQuery)}"
              style="padding:0.45rem 0.75rem; font-size:0.875rem;"
            >
            <select id="admin-category-filter" class="form-control" style="width:160px; padding:0.45rem 0.75rem; font-size:0.875rem;">
              <option value="all">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Accessories">Accessories</option>
              <option value="Home">Home</option>
              <option value="Lifestyle">Lifestyle</option>
            </select>
          </div>
          <div>
            <button type="button" class="btn btn-primary btn-sm" id="open-add-product-btn">
              + Add New Product
            </button>
          </div>
        </div>

        <div style="overflow-x:auto;">
          <table class="admin-table">
            <thead>
              <tr>
                <th style="width:60px;">ID</th>
                <th style="width:64px;">Image</th>
                <th>Product Name</th>
                <th>Category</th>
                <th style="text-align:right;">Price</th>
                <th style="text-align:center;">Stock Units</th>
                <th style="text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody id="admin-table-body">
              <!-- Rendered rows -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add / Edit Product Modal -->
      <div id="product-modal" class="modal-overlay">
        <div class="modal-dialog" role="dialog">
          <div class="modal-header">
            <h3 class="modal-title" id="product-modal-title">Add New Product</h3>
            <button type="button" class="modal-close-btn" id="close-product-modal">&times;</button>
          </div>
          <form id="product-form">
            <div class="modal-body">
              <input type="hidden" id="prod-id">
              <div class="form-group">
                <label class="form-label" for="prod-name">Product Name <span class="required">*</span></label>
                <input type="text" id="prod-name" class="form-control" placeholder="e.g. Nova Horizon Wireless Mouse" required>
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label" for="prod-category">Category <span class="required">*</span></label>
                  <select id="prod-category" class="form-control" required>
                    <option value="Electronics">Electronics</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Home">Home</option>
                    <option value="Lifestyle">Lifestyle</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="prod-price">Price (USD) <span class="required">*</span></label>
                  <input type="number" step="0.01" min="0.01" id="prod-price" class="form-control" placeholder="99.00" required>
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label" for="prod-stock">Stock Quantity <span class="required">*</span></label>
                  <input type="number" min="0" step="1" id="prod-stock" class="form-control" placeholder="25" required>
                </div>
                <div class="form-group">
                  <label class="form-label" for="prod-image">Image URL / Path</label>
                  <input type="text" id="prod-image" class="form-control" placeholder="assets/images/headphones.jpg">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="prod-desc">Description <span class="required">*</span></label>
                <textarea id="prod-desc" rows="3" class="form-control" placeholder="Detailed product specifications and materials..." required></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="cancel-product-modal">Cancel</button>
              <button type="submit" class="btn btn-primary" id="save-product-submit">Save Product</button>
            </div>
          </form>
        </div>
      </div>
    `;

    renderTableRows();
    attachAdminEvents();
  }

  function getFilteredAdminProducts() {
    return adminProducts.filter(p => {
      const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
      const q = adminSearchQuery.toLowerCase().trim();
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }

  function renderTableRows() {
    const tbody = document.getElementById('admin-table-body');
    if (!tbody) return;

    const filtered = getFilteredAdminProducts();

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:3rem 1rem; color:var(--color-text-muted);">
            No products match current filter criteria.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(p => {
      const stock = Number(p.stock) || 0;
      let stockStyle = 'color:var(--color-success); font-weight:700;';
      if (stock === 0) stockStyle = 'color:var(--color-danger); font-weight:700;';
      else if (stock < 10) stockStyle = 'color:var(--color-warning); font-weight:700;';

      return `
        <tr data-prod-id="${p.id}">
          <td class="tabular-nums" style="color:var(--color-text-muted); font-size:0.8125rem;">#${p.id}</td>
          <td>
            <img 
              src="${p.imageUrl}" 
              alt="${window.NovaCommon.escapeHTML(p.name)}" 
              class="admin-thumb"
              onerror="window.NovaCommon.handleImageError(this, '${window.NovaCommon.escapeHTML(p.name)}', '${window.NovaCommon.escapeHTML(p.category)}')"
            >
          </td>
          <td>
            <div style="font-weight:700; color:var(--color-text-primary);">
              <a href="product.html?id=${p.id}" target="_blank" title="View product page">${window.NovaCommon.escapeHTML(p.name)}</a>
            </div>
            <div style="font-size:0.75rem; color:var(--color-text-muted); display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden;">
              ${window.NovaCommon.escapeHTML(p.description)}
            </div>
          </td>
          <td>
            <span style="font-size:0.8125rem; font-weight:600; color:var(--color-text-secondary);">${window.NovaCommon.escapeHTML(p.category)}</span>
          </td>
          <td style="text-align:right;" class="tabular-nums font-mono font-bold">
            ${window.NovaCommon.formatUSD(p.price)}
          </td>
          <td style="text-align:center;">
            <span style="${stockStyle}" class="tabular-nums">${stock}</span>
          </td>
          <td style="text-align:right; white-space:nowrap;">
            <button type="button" class="btn btn-secondary btn-sm edit-prod-btn" data-id="${p.id}" style="padding:0.25rem 0.5rem; font-size:0.75rem;">
              Edit
            </button>
            <button type="button" class="btn btn-secondary btn-sm delete-prod-btn" data-id="${p.id}" style="padding:0.25rem 0.5rem; font-size:0.75rem; color:var(--color-danger); margin-left:0.25rem;">
              Delete
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach Edit and Delete buttons
    tbody.querySelectorAll('.edit-prod-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id, 10);
        openEditProductModal(id);
      });
    });

    tbody.querySelectorAll('.delete-prod-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id, 10);
        handleDeleteProduct(id);
      });
    });
  }

  function attachAdminEvents() {
    // Search input
    const searchInput = document.getElementById('admin-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        adminSearchQuery = e.target.value;
        renderTableRows();
      });
    }

    // Category filter
    const catSelect = document.getElementById('admin-category-filter');
    if (catSelect) {
      catSelect.value = filterCategory;
      catSelect.addEventListener('change', (e) => {
        filterCategory = e.target.value;
        renderTableRows();
      });
    }

    // Add Product button
    const addBtn = document.getElementById('open-add-product-btn');
    if (addBtn) {
      addBtn.addEventListener('click', openAddProductModal);
    }

    // Factory reset button
    const resetBtn = document.getElementById('factory-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset catalog back to the initial 12 sample products? This clears all local product modifications.')) {
          window.NovaMockData.resetToFactoryData();
          window.NovaCommon.showToast('Catalog restored to default sample data.', 'info');
          renderDashboard();
        }
      });
    }

    // Modal close listeners
    const modal = document.getElementById('product-modal');
    const closeBtn = document.getElementById('close-product-modal');
    const cancelBtn = document.getElementById('cancel-product-modal');
    if (closeBtn) closeBtn.addEventListener('click', closeProductModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeProductModal);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeProductModal();
      });
    }

    // Form submit
    const form = document.getElementById('product-form');
    if (form) {
      form.addEventListener('submit', handleProductFormSubmit);
    }
  }

  function openAddProductModal() {
    const modal = document.getElementById('product-modal');
    const form = document.getElementById('product-form');
    document.getElementById('product-modal-title').textContent = 'Add New Product';
    form.reset();
    document.getElementById('prod-id').value = '';
    document.getElementById('prod-image').value = 'assets/images/headphones.jpg';
    modal.classList.add('open');
  }

  function openEditProductModal(id) {
    const product = adminProducts.find(p => p.id === id);
    if (!product) return;

    const modal = document.getElementById('product-modal');
    document.getElementById('product-modal-title').textContent = `Edit Product #${product.id}`;
    document.getElementById('prod-id').value = product.id;
    document.getElementById('prod-name').value = product.name;
    document.getElementById('prod-category').value = product.category;
    document.getElementById('prod-price').value = product.price;
    document.getElementById('prod-stock').value = product.stock;
    document.getElementById('prod-image').value = product.imageUrl || '';
    document.getElementById('prod-desc').value = product.description;

    modal.classList.add('open');
  }

  function closeProductModal() {
    const modal = document.getElementById('product-modal');
    if (modal) modal.classList.remove('open');
  }

  async function handleProductFormSubmit(e) {
    e.preventDefault();

    const idVal = document.getElementById('prod-id').value;
    const nameVal = document.getElementById('prod-name').value.trim();
    const catVal = document.getElementById('prod-category').value;
    const priceVal = parseFloat(document.getElementById('prod-price').value);
    const stockVal = parseInt(document.getElementById('prod-stock').value, 10);
    const imageVal = document.getElementById('prod-image').value.trim() || 'assets/images/headphones.jpg';
    const descVal = document.getElementById('prod-desc').value.trim();

    if (!nameVal || isNaN(priceVal) || isNaN(stockVal) || !descVal) {
      window.NovaCommon.showToast('Please complete all required fields.', 'warning');
      return;
    }

    const isEdit = Boolean(idVal);
    const productData = {
      name: nameVal,
      category: catVal,
      price: priceVal,
      stock: stockVal,
      imageUrl: imageVal,
      description: descVal,
      specs: {
        "Category": catVal,
        "Availability": stockVal > 0 ? "In Stock" : "Backorder",
        "Updated": "Today"
      }
    };

    const isMock = window.NovaConfig.isMockMode();

    try {
      if (isMock) {
        if (isEdit) {
          productData.id = parseInt(idVal, 10);
          window.NovaMockData.saveProduct(productData);
          window.NovaCommon.showToast(`Updated "${nameVal}".`, 'success');
        } else {
          window.NovaMockData.saveProduct(productData);
          window.NovaCommon.showToast(`Added "${nameVal}" to catalog.`, 'success');
        }
        closeProductModal();
        renderDashboard();
      } else {
        // In API mode, send to Flask backend
        if (isEdit) {
          await window.NovaApi.patch(`/admin/products/${idVal}`, productData);
          window.NovaCommon.showToast(`Updated "${nameVal}" via Flask API.`, 'success');
        } else {
          await window.NovaApi.post('/admin/products', productData);
          window.NovaCommon.showToast(`Added "${nameVal}" via Flask API.`, 'success');
        }
        closeProductModal();
        renderDashboard();
      }
    } catch (err) {
      window.NovaCommon.showToast(`Admin operation failed: ${err.message}`, 'error');
    }
  }

  async function handleDeleteProduct(id) {
    const product = adminProducts.find(p => p.id === id);
    const name = product ? product.name : `Product #${id}`;

    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    const isMock = window.NovaConfig.isMockMode();

    try {
      if (isMock) {
        window.NovaMockData.deleteProduct(id);
        window.NovaCommon.showToast(`Deleted "${name}".`, 'info');
        renderDashboard();
      } else {
        await window.NovaApi.del(`/admin/products/${id}`);
        window.NovaCommon.showToast(`Deleted "${name}" via Flask API.`, 'info');
        renderDashboard();
      }
    } catch (err) {
      window.NovaCommon.showToast(`Delete failed: ${err.message}`, 'error');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderDashboard();
  });

  window.NovaAdmin = {
    renderDashboard,
  };
})(window);
