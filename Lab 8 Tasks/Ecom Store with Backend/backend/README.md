# Task 8 E-Commerce API

NestJS backend for the marketplace in the parent folder. It provides in-memory product, cart, user, and order models and REST controllers.

## Run

```sh
npm install
npm run start:dev
```

The API listens on `http://localhost:3000/api`.

## Endpoints

- `GET /api/products?category=Home&search=lamp`
- `GET /api/products/:id`
- `POST /api/auth/register` with `{ "name", "email", "password" }`
- `POST /api/auth/login` with `{ "email", "password" }`
- `GET /api/cart/:userId`
- `POST /api/cart/:userId/items` with `{ "productId", "quantity" }`
- `DELETE /api/cart/:userId/items/:productId`
- `DELETE /api/cart/:userId`
- `POST /api/users/:userId/orders` with `{ "customer", "paymentMethod", "items" }`; items are optional and default to the cart
- `GET /api/users/:userId/orders`
- `GET /api/users/:userId/orders/:id`

All data is held in memory for this assignment and resets when the server restarts. Authentication is a classroom demo and should be replaced with password hashing, persistent storage, and signed tokens before production use.
