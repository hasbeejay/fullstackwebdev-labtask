# Lab 07 — Part 2: Persistent E-Commerce REST API

**Course**: Full Stack Web Development  
**Student**: Haseeb Jalil  
**Roll No**: 241908 | **Class**: BSCS V-A  
**Instructor**: Hafiz Obaid Ullah  
**Due Date**: 25/10/26  

---

## Overview

Part 2 implements a production-grade, atomic **Persistent REST API** for the E-Commerce Store designed in Lab 3. The architecture uses pure Node.js native `node:http` and atomic file persistence via `fs/promises`, serialization write queues, and temporary file replacement to guarantee zero data corruption or race conditions.

### Persisted Modules:
1. **Products** (CRUD, search, category filters, real-time stock levels, rating computation)
2. **Users & Auth** (Registration, email collision detection, credential validation, sanitized session tokens)
3. **Cart** (Persistent cart items, line item calculation, free shipping threshold over $150, dynamic tax calculation)
4. **Orders (Checkout)** (Order creation with validation, atomic stock decrements, auto-generated order IDs `ORD-YYYY-XXXX`, automatic cart clearance upon checkout)
5. **Reviews** (Product reviews with auto-recalculated product ratings)

---

## Architecture & Data Persistence

- **Atomic Writes**: Each write operation generates an isolated temp file (`${file}.${uuid}.tmp`) and applies an atomic file rename (`fs.rename`).
- **Serialized Write Queue**: A chained promise queue prevents interleaved disk writes, guaranteeing thread-safety.
- **Data Location**: Persisted in `data/` directory as structured JSON files:
  - `data/products.json`
  - `data/users.json`
  - `data/cart.json`
  - `data/orders.json`
  - `data/reviews.json`

---

## Quick Start

### Start the Server:
```bash
node server.js
# Defaults to http://localhost:3006
```

### Run the Automated Test Suite:
```bash
node test.js
```
Runs 29 automated end-to-end integration tests asserting file persistence, atomic operations, stock reduction, and CRUD endpoints.

---

## API Endpoints Reference

### 1. Products Module (`/products`)
| Method | Endpoint | Description | Sample Query/Payload |
|---|---|---|---|
| `GET` | `/products` | List products with filtering | `?category=Audio&search=headphones&minPrice=50&maxPrice=200` |
| `GET` | `/products/:id` | Get single product | N/A |
| `POST` | `/products` | Add new product | `{"name":"Desk Mat","category":"Accessories","price":29,"stock":25,"emoji":"🖱️"}` |
| `PUT` | `/products/:id` | Full update | `{"name":"Desk Mat Pro","category":"Accessories","price":35,"stock":20,"emoji":"🖱️"}` |
| `PATCH` | `/products/:id` | Partial update | `{"price":32,"stock":18}` |
| `DELETE` | `/products/:id` | Delete product | N/A |

### 2. Users & Auth (`/users`)
| Method | Endpoint | Description | Sample Payload |
|---|---|---|---|
| `GET` | `/users` | List users (passwords omitted) | N/A |
| `POST` | `/users/register` | Register new account | `{"name":"Haseeb","email":"haseeb@example.com","password":"mypassword"}` |
| `POST` | `/users/login` | Log in and get token | `{"email":"haseeb@example.com","password":"mypassword"}` |
| `GET` | `/users/:id` | Get user profile | N/A |
| `DELETE` | `/users/:id` | Remove user | N/A |

### 3. Cart Module (`/cart`)
| Method | Endpoint | Description | Sample Payload |
|---|---|---|---|
| `GET` | `/cart` | Get cart with calculated totals | Returns subtotal, shipping, tax, and total |
| `POST` | `/cart` | Add item to cart | `{"productId":1,"quantity":2}` |
| `PATCH` | `/cart/:productId` | Update item quantity | `{"quantity":3}` |
| `DELETE` | `/cart/:productId` | Remove item | N/A |
| `DELETE` | `/cart` | Empty entire cart | N/A |

### 4. Orders & Checkout (`/orders`)
| Method | Endpoint | Description | Sample Payload |
|---|---|---|---|
| `GET` | `/orders` | List all orders | N/A |
| `GET` | `/orders/:id` | Get order details | N/A |
| `POST` | `/orders` | Place order (checkout) | `{"customer":{"name":"Haseeb","email":"haseeb@example.com","phone":"03001234567","address":"PAF Complex","city":"Islamabad","zip":"44000"},"paymentMethod":"Credit Card"}` |
| `PATCH` | `/orders/:id` | Update status | `{"status":"Shipped"}` |
| `DELETE` | `/orders/:id` | Cancel order | N/A |

### 5. Reviews Module (`/reviews`)
| Method | Endpoint | Description | Sample Payload |
|---|---|---|---|
| `GET` | `/reviews` | List reviews (filter by product) | `?productId=1` |
| `POST` | `/reviews` | Submit product review | `{"productId":1,"userName":"Ayesha","rating":5,"comment":"Outstanding quality!"}` |
| `DELETE` | `/reviews/:id` | Remove review | N/A |
