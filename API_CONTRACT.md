# NovaStore REST API Contract Specification

**Target Version:** `v1`  
**Base URL:** `http://127.0.0.1:5000/api/v1`  
**Protocol:** HTTP/1.1 or HTTP/2 over JSON  
**Content-Type:** `application/json; charset=utf-8`  
**Author:** NovaStore Development Team  
**Audience:** Python Flask Backend Developers  

---

## 1. Architectural Overview & Conventions

This document specifies the exact REST API contract that the NovaStore frontend expects from your Python Flask backend server.

### Authentication & Authorization Headers
Protected endpoints require an `Authorization` header containing a standard JWT bearer token:
```http
Authorization: Bearer <jwt_access_token>
```

### Standard Error Response Format
All non-2xx responses must return a consistent JSON payload:
```json
{
  "status": "error",
  "code": "VALIDATION_FAILED",
  "message": "Field 'price' must be a positive number greater than 0.",
  "errors": {
    "price": ["Must be greater than 0.00"]
  }
}
```

### Standard Success Response Format
Responses should return appropriate HTTP status codes (e.g., `200 OK`, `201 Created`, `204 No Content`).

### CORS Requirement
Because the frontend runs in the browser, your Flask app **must** enable CORS headers:
```python
# In your Flask application (app.py)
from flask_cors import CORS
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
```

---

## 2. API Endpoints

### 2.1 Health Check

#### `GET /api/v1/health`
Used by the frontend to verify backend connectivity from the settings modal.
- **Auth Required:** No
- **Admin Required:** No
- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "service": "NovaStore Flask API",
  "version": "1.0.0",
  "timestamp": "2026-10-16T12:00:00Z"
}
```

---

### 2.2 Product Catalog

#### `GET /api/v1/products`
Retrieves products with optional search query, category filtering, and sorting.
- **Auth Required:** No
- **Admin Required:** No
- **Query Parameters:**
  - `category` (optional, string): Filter by category name (e.g., `Electronics`, `Accessories`, `Home`, `Lifestyle`).
  - `search` (optional, string): Case-insensitive keyword search matching title, description, or category.
  - `sort` (optional, string): Sort order: `featured`, `price-asc`, `price-desc`, `name-asc`, `stock-desc`.
  - `page` (optional, integer): Page number for pagination (default: `1`).
  - `limit` (optional, integer): Items per page (default: `20`).
- **Response `200 OK`**:
```json
{
  "products": [
    {
      "id": 1,
      "name": "Nova Pro ANC Wireless Headphones",
      "description": "Engineered with 40mm beryllium drivers and hybrid active noise cancellation.",
      "price": 279.00,
      "category": "Electronics",
      "imageUrl": "assets/images/headphones.jpg",
      "stock": 24,
      "rating": 4.9,
      "featured": true,
      "specs": {
        "Acoustic Driver": "40mm custom beryllium dynamic",
        "Battery Life": "Up to 38 hours (ANC enabled)"
      }
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 20
}
```

#### `GET /api/v1/products/<id>`
Retrieves single product details by numerical ID.
- **Auth Required:** No
- **Admin Required:** No
- **Response `200 OK`**:
```json
{
  "product": {
    "id": 1,
    "name": "Nova Pro ANC Wireless Headphones",
    "description": "Engineered with 40mm beryllium drivers and hybrid active noise cancellation.",
    "price": 279.00,
    "category": "Electronics",
    "imageUrl": "assets/images/headphones.jpg",
    "stock": 24,
    "rating": 4.9,
    "featured": true,
    "specs": {
      "Acoustic Driver": "40mm custom beryllium dynamic",
      "Battery Life": "Up to 38 hours (ANC enabled)",
      "Connectivity": "Bluetooth 5.3 + 3.5mm low-latency cable",
      "Weight": "248g"
    }
  }
}
```
- **Error Responses:**
  - `404 Not Found`:
    ```json
    { "error": "Product not found" }
    ```

---

### 2.3 Authentication

#### `POST /api/v1/auth/register`
Creates a new customer user account.
- **Auth Required:** No
- **Admin Required:** No
- **Request Body:**
```json
{
  "name": "Alex Morgan",
  "email": "alex@example.com",
  "password": "SecurePassword123!"
}
```
- **Response `201 Created`**:
```json
{
  "message": "Account created successfully",
  "user": {
    "id": 42,
    "name": "Alex Morgan",
    "email": "alex@example.com",
    "role": "customer"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
- **Error Responses:**
  - `400 Bad Request`: Validation failure (e.g. missing fields, weak password).
  - `409 Conflict`: Email address is already registered.

#### `POST /api/v1/auth/login`
Authenticates existing user and issues JWT.
- **Auth Required:** No
- **Admin Required:** No
- **Request Body:**
```json
{
  "email": "alex@example.com",
  "password": "SecurePassword123!"
}
```
- **Response `200 OK`**:
```json
{
  "message": "Login successful",
  "user": {
    "id": 42,
    "name": "Alex Morgan",
    "email": "alex@example.com",
    "role": "customer"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
- **Error Responses:**
  - `401 Unauthorized`: Invalid credentials.

---

### 2.4 Shopping Cart

#### `GET /api/v1/cart`
Retrieves items currently in user's server-side cart.
- **Auth Required:** Optional (or session-based / guest cart ID)
- **Response `200 OK`**:
```json
{
  "items": [
    {
      "id": 1,
      "productId": 1,
      "name": "Nova Pro ANC Wireless Headphones",
      "price": 279.00,
      "quantity": 2,
      "imageUrl": "assets/images/headphones.jpg",
      "stock": 24
    }
  ],
  "subtotal": 558.00
}
```

#### `POST /api/v1/cart/items`
Adds an item to the cart or increments existing quantity.
- **Auth Required:** Optional
- **Request Body:**
```json
{
  "productId": 1,
  "quantity": 1
}
```
- **Response `201 Created`**:
```json
{
  "message": "Item added to cart",
  "item": {
    "productId": 1,
    "quantity": 1,
    "name": "Nova Pro ANC Wireless Headphones",
    "price": 279.00
  }
}
```
- **Error Responses:**
  - `400 Bad Request`: Requested quantity exceeds available stock.

#### `PATCH /api/v1/cart/items/<id>`
Updates quantity of a specific item in cart.
- **Request Body:**
```json
{
  "quantity": 3
}
```
- **Response `200 OK`**:
```json
{
  "message": "Quantity updated",
  "itemId": 1,
  "quantity": 3
}
```

#### `DELETE /api/v1/cart/items/<id>`
Removes an item from the cart.
- **Response `200 OK` or `204 No Content`**:
```json
{
  "message": "Item removed from cart"
}
```

---

### 2.5 Orders

#### `POST /api/v1/orders`
Places a new order from current cart.
- **Auth Required:** Optional (supports guest checkout with customer payload)
- **Request Body:**
```json
{
  "customer": {
    "name": "Alex Morgan",
    "email": "alex@example.com",
    "phone": "+1 (555) 234-5678",
    "address": "742 Evergreen Terrace",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94107",
    "country": "United States"
  },
  "items": [
    {
      "id": 1,
      "name": "Nova Pro ANC Wireless Headphones",
      "price": 279.00,
      "quantity": 1
    }
  ],
  "subtotal": 279.00,
  "shipping": 0.00,
  "tax": 19.53,
  "total": 298.53
}
```
- **Response `201 Created`**:
```json
{
  "message": "Order created successfully",
  "order": {
    "id": "ORD-583921",
    "createdAt": "2026-10-16T12:30:00Z",
    "status": "Processing",
    "total": 298.53,
    "customer": {
      "name": "Alex Morgan",
      "email": "alex@example.com"
    },
    "items": [
      {
        "id": 1,
        "name": "Nova Pro ANC Wireless Headphones",
        "price": 279.00,
        "quantity": 1
      }
    ]
  }
}
```

#### `GET /api/v1/orders`
Retrieves order history for authenticated user (or past orders).
- **Auth Required:** Recommended (Bearer token)
- **Response `200 OK`**:
```json
{
  "orders": [
    {
      "id": "ORD-583921",
      "createdAt": "2026-10-16T12:30:00Z",
      "status": "Processing",
      "total": 298.53,
      "items": [ ... ]
    }
  ]
}
```

---

### 2.6 Admin Product Management

#### `GET /api/v1/admin/products`
Retrieves product inventory list for administrator.
- **Auth Required:** Yes
- **Admin Required:** Yes
- **Response `200 OK`**:
```json
{
  "products": [
    {
      "id": 1,
      "name": "Nova Pro ANC Wireless Headphones",
      "category": "Electronics",
      "price": 279.00,
      "stock": 24,
      "imageUrl": "assets/images/headphones.jpg",
      "description": "Engineered with 40mm beryllium drivers..."
    }
  ],
  "total": 12
}
```

#### `POST /api/v1/admin/products`
Creates a new product in the store catalog.
- **Auth Required:** Yes
- **Admin Required:** Yes
- **Request Body:**
```json
{
  "name": "Nova Horizon Wireless Mouse",
  "category": "Accessories",
  "price": 89.00,
  "stock": 40,
  "imageUrl": "assets/images/ergonomic_mouse.svg",
  "description": "Ergonomic wireless mouse with silent magnetic scroll."
}
```
- **Response `201 Created`**:
```json
{
  "message": "Product created successfully",
  "product": {
    "id": 13,
    "name": "Nova Horizon Wireless Mouse",
    "category": "Accessories",
    "price": 89.00,
    "stock": 40,
    "imageUrl": "assets/images/ergonomic_mouse.svg",
    "description": "Ergonomic wireless mouse with silent magnetic scroll."
  }
}
```

#### `PATCH /api/v1/admin/products/<id>`
Updates fields of an existing product (partial update).
- **Auth Required:** Yes
- **Admin Required:** Yes
- **Request Body (any subset of fields):**
```json
{
  "price": 259.00,
  "stock": 30
}
```
- **Response `200 OK`**:
```json
{
  "message": "Product updated successfully",
  "product": {
    "id": 1,
    "name": "Nova Pro ANC Wireless Headphones",
    "price": 259.00,
    "stock": 30
  }
}
```

#### `DELETE /api/v1/admin/products/<id>`
Deletes a product from the catalog.
- **Auth Required:** Yes
- **Admin Required:** Yes
- **Response `200 OK` or `204 No Content`**:
```json
{
  "message": "Product 1 deleted successfully"
}
```
