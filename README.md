# NovaStore — E-Commerce Frontend for Flask Backend Practice

NovaStore is a modern, responsive, zero-build-step e-commerce frontend built with semantic HTML5, pure CSS3, and vanilla JavaScript. It is specifically engineered to provide backend developers with a complete, realistic client interface to test and integrate a Python Flask REST API.

---

## 1. Project Overview

- **Stack:** Plain HTML5, CSS3, Vanilla JavaScript (ES6+).
- **No Build Step Required:** Runs directly via any static HTTP server or local development server.
- **Dual Operating Modes:**
  - **Mock Mode (Default):** Runs immediately in any browser with 12 pre-seeded sample products, interactive cart persistence in `localStorage`, client-side order simulation, and simulated admin CRUD.
  - **API Mode:** Communicates with your local Python Flask REST API at `http://127.0.0.1:5000/api/v1` via standard Fetch requests.
- **Zero Silent Fallback:** In API mode, network or backend errors are surfaced directly to the user with helpful diagnostics rather than silently masking issues.

---

## 2. Features

### Storefront (`index.html`)
- Responsive single-row navigation with brand mark, search, mode switcher indicator, and dynamic cart item counter.
- Hero campaign showcase highlighting flagship audio gear.
- Category filtering tabs (`All`, `Electronics`, `Accessories`, `Home`, `Lifestyle`).
- Real-time client-side search across title, description, and category.
- Dynamic sorting: Featured, Price (Low to High), Price (High to Low), Product Name (A-Z), Stock Availability.
- Product cards with high-fidelity imagery, tabular USD pricing, stock status indicators, and Add to Cart buttons.

### Product Detail Page (`product.html`)
- Loads individual product specifications via URL parameter (e.g. `product.html?id=1`).
- Sticky image showcase and contiguous purchase module.
- Quantity selector constrained by real-time available stock.
- Add to Cart and instant Buy Now flows.
- Related products recommendations within the same category.
- Developer callout explaining the matching Flask endpoint (`GET /api/v1/products/<id>`).

### Shopping Cart (`cart.html`)
- Itemized table with product thumbnails, unit prices, quantity steppers, and line item subtotals.
- Real-time quantity validation preventing selections greater than stock.
- Free shipping threshold progress bar ($50.00 free shipping qualification).
- Accurate subtotal, estimated tax (7%), and total calculations.
- Clean empty cart state with direct link to catalog.

### Demo Checkout (`checkout.html`)
- Two-column layout with customer contact info, delivery address, and demo payment method.
- Complete client-side required field and format validation (email, phone, postal code).
- Clearly labeled as a practice checkout simulation (no payment credentials collected).
- Generates structured order receipts and saves to order history.

### Order History (`orders.html`)
- Displays itemized order records with timestamps, customer details, tracking status, and line totals.
- Demo order generation and clearing tools.

### Demo Admin Dashboard (`admin.html`)
- Inventory metrics: Total products, low stock alerts, order counts, total inventory valuation.
- Product table with live search and category filtering.
- Modals for Adding new products, Editing price/stock, and Deleting products.
- Factory reset button to restore default sample catalog at any time.

### Demo Authentication (`login.html` & `register.html`)
- Client-side form validation for email, password strength, and password matching.
- "Fill Demo User" sandbox buttons for 1-click test credential entry.

---

## 3. Directory Structure

```text
NovaStore-Frontend/
├── index.html              # Main store homepage & catalog
├── product.html            # Individual product details view
├── cart.html               # Shopping cart & quantity adjustments
├── checkout.html           # Shipping address & demo order placement
├── login.html              # Simulated user login
├── register.html           # Simulated user registration
├── orders.html             # Customer order history
├── admin.html              # Product management dashboard
├── API_CONTRACT.md         # Full REST API specification for Flask
├── README.md               # Setup and development instructions
├── .gitignore              # Standard git ignore rules
└── assets/
    ├── css/
    │   └── styles.css      # Core responsive stylesheet
    ├── js/
    │   ├── config.js       # Environment mode & API URL settings
    │   ├── mock-data.js    # 12 initial products & local persistence
    │   ├── api.js          # Fetch client for Flask REST API
    │   ├── common.js       # Navigation, cart badge, modal, toasts
    │   ├── products.js     # Catalog search, filter, and PDP logic
    │   ├── cart.js         # Cart calculations and stepper events
    │   ├── checkout.js     # Checkout form validation & order dispatch
    │   ├── auth.js         # Client-side authentication simulation
    │   ├── orders.js       # Order history rendering
    │   └── admin.js        # Admin CRUD operations
    └── images/             # Product photography & vector illustrations
        ├── headphones.jpg
        ├── speaker.jpg
        ├── keyboard.jpg
        ├── bottle.jpg
        ├── monitor_stand.svg
        ├── ergonomic_mouse.svg
        ├── light_bar.svg
        ├── charging_stand.svg
        ├── desk_mat.svg
        ├── travel_daypack.svg
        ├── earbuds.svg
        └── coffee_set.svg
```

---

## 4. How to Run Locally

Because NovaStore utilizes multiple HTML pages and modern browser APIs, **do not open pages with `file://` URLs**. Run a simple local HTTP server from the project directory.

### Option A: Using Python (Recommended)

Python comes pre-installed on macOS, Linux, and Windows:

```bash
# Python 3
python3 -m http.server 8000

# Or Python on Windows
python -m http.server 8000
```
Then open your browser to:
```
http://localhost:8000
```

### Option B: Using Node.js `npx serve` or `http-server`

```bash
npx serve .
# Or
npx http-server -p 8000
```

### Option C: Using VS Code Live Server Extension
Open the folder in VS Code, right-click `index.html`, and select **Open with Live Server**.

---

## 5. How to Switch Between Mock Mode and API Mode

NovaStore is configured to run in **Mock Mode** by default so that all pages and interactions work immediately without any setup.

To switch to **API Mode**:
1. Click the **Mock Mode (Local)** badge in the top navigation bar (or the link in the top announcement bar).
2. In the modal dialog that appears:
   - Select **API Mode (Connects to Python Flask REST API)**.
   - Verify or edit the **Flask REST API Base URL** (default is `http://127.0.0.1:5000/api/v1`).
   - Click **Test Connection** to test if your Flask backend's `GET /api/v1/health` endpoint is responding.
   - Click **Save Settings**.
3. The store will now issue real HTTP requests to your Flask backend.

---

## 6. How the Frontend Communicates with Flask

- **Endpoint Structure:** All requests are sent to `${apiBaseUrl}/${endpoint}` (e.g. `http://127.0.0.1:5000/api/v1/products`).
- **Headers:** 
  - `Accept: application/json`
  - `Content-Type: application/json` for POST, PUT, and PATCH bodies.
  - `Authorization: Bearer <token>` when a user session exists.
- **CORS Setup in Flask:** Your Flask server must allow Cross-Origin requests. In Flask:
  ```bash
  pip install flask-cors
  ```
  ```python
  from flask import Flask
  from flask_cors import CORS

  app = Flask(__name__)
  CORS(app, resources={r"/api/*": {"origins": "*"}})
  ```
- **Refer to `API_CONTRACT.md`:** See the comprehensive documentation in `API_CONTRACT.md` for exact request payloads, response bodies, and HTTP status codes.

---

## 7. Known Demo Limitations

1. **Client-Side Storage:** In Mock Mode, cart items, customer orders, and admin edits are stored in your browser's `localStorage`. Clearing browser data will reset the state.
2. **Simulated Authentication:** The login and registration flows do not use real password hashing or asymmetric JWT signing in Mock Mode. Never enter real passwords.
3. **Simulated Payment:** Checkout does not connect to Stripe or payment gateways; it simulates order creation.

---

## 8. Suggested Flask Backend Learning Roadmap

Use this frontend as your target client while building your Flask backend in Python:

1. **Phase 1: Basic Server & Health Check**
   - Create `app.py` with Flask and `flask-cors`.
   - Implement `GET /api/v1/health`.
   - Test connectivity using NovaStore's settings modal.
2. **Phase 2: Product Catalog & Database Models**
   - Configure SQLite or PostgreSQL with SQLAlchemy.
   - Seed the initial 12 products.
   - Implement `GET /api/v1/products` with `search`, `category`, and `sort` query parameters.
   - Implement `GET /api/v1/products/<id>`.
3. **Phase 3: Shopping Cart & Order Processing**
   - Implement session-based or user-based cart endpoints (`/cart`, `/cart/items`).
   - Implement `POST /api/v1/orders` to save customer orders and decrement stock.
   - Implement `GET /api/v1/orders` to return order history.
4. **Phase 4: Authentication & Security**
   - Add user password hashing with `werkzeug.security` or `bcrypt`.
   - Implement JWT token issuance (`POST /auth/login` and `POST /auth/register`).
5. **Phase 5: Admin Role & Protected CRUD**
   - Add admin authorization middleware / decorator (`@admin_required`).
   - Implement `POST`, `PATCH`, and `DELETE` on `/admin/products`.
