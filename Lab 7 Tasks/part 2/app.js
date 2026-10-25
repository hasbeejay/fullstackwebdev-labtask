// Lab 7 - Part 2: Persistent REST API Application for E-Commerce Store
// Backed by atomic JSON files using fs/promises and serialized write queues.
// Native Node.js node:http implementation.

const http = require('node:http');
const path = require('node:path');
const { createStore } = require('./store.js');
const {
  HttpError,
  positiveId,
  validateProduct,
  validateUser,
  validateLogin,
  validateCartItem,
  validateOrder,
  validateReview,
} = require('./validate.js');

function createApp(dataDir) {
  const productsStore = createStore(path.join(dataDir, 'products.json'));
  const usersStore = createStore(path.join(dataDir, 'users.json'));
  const cartStore = createStore(path.join(dataDir, 'cart.json'));
  const ordersStore = createStore(path.join(dataDir, 'orders.json'));
  const reviewsStore = createStore(path.join(dataDir, 'reviews.json'));

  function send(res, status, data) {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end(JSON.stringify(data, null, 2));
  }

  async function parseBody(req) {
    let raw = '';
    for await (const chunk of req) {
      raw += chunk.toString('utf8');
      if (Buffer.byteLength(raw) > 65536) {
        throw new HttpError(413, 'Request payload too large (max 64KB)');
      }
    }
    if (!raw.trim()) return {};
    try {
      return JSON.parse(raw);
    } catch {
      throw new HttpError(400, 'Malformed JSON payload');
    }
  }

  const server = http.createServer(async (req, res) => {
    // CORS Preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      });
      return res.end();
    }

    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      let pathname = parsedUrl.pathname.replace(/\/+$/, '') || '/';
      // Normalize /api prefix if present
      const cleanPath = pathname.startsWith('/api') ? pathname.slice(4) || '/' : pathname;
      const params = parsedUrl.searchParams;
      const method = req.method;

      // ----------------------------------------------------------------------
      // Root & Health
      // ----------------------------------------------------------------------
      if (cleanPath === '/' || cleanPath === '/health') {
        const [p, u, c, o, r] = await Promise.all([
          productsStore.list(),
          usersStore.list(),
          cartStore.list(),
          ordersStore.list(),
          reviewsStore.list(),
        ]);
        return send(res, 200, {
          store: "hasbeejay's Marketplace API",
          version: '1.0.0',
          student: 'Haseeb Jalil (241908)',
          course: 'Full Stack Web Development - Lab 7 (Part 2)',
          storage: 'Atomic Persistent JSON Files',
          status: 'healthy',
          databasePath: dataDir,
          counts: {
            products: p.length,
            users: u.length,
            cartItems: c.length,
            orders: o.length,
            reviews: r.length,
          },
          endpoints: {
            products: '/products',
            cart: '/cart',
            orders: '/orders',
            users: '/users',
            reviews: '/reviews',
          },
        });
      }

      // ----------------------------------------------------------------------
      // PRODUCTS ENDPOINTS
      // ----------------------------------------------------------------------
      // GET /products - list all products with filtering & search
      if (cleanPath === '/products' && method === 'GET') {
        let items = await productsStore.list();
        const category = params.get('category');
        const search = params.get('search');
        const minPrice = params.get('minPrice');
        const maxPrice = params.get('maxPrice');

        if (category) {
          items = items.filter(p => p.category.toLowerCase() === category.toLowerCase());
        }
        if (search) {
          const q = search.toLowerCase();
          items = items.filter(p => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)));
        }
        if (minPrice) {
          const min = Number(minPrice);
          if (!Number.isNaN(min)) items = items.filter(p => p.price >= min);
        }
        if (maxPrice) {
          const max = Number(maxPrice);
          if (!Number.isNaN(max)) items = items.filter(p => p.price <= max);
        }

        return send(res, 200, items);
      }

      // POST /products - create product
      if (cleanPath === '/products' && method === 'POST') {
        const body = await parseBody(req);
        const valid = validateProduct(body, false);

        const created = await productsStore.edit((products) => {
          const nextId = products.reduce((max, p) => Math.max(max, p.id || 0), 0) + 1;
          const product = {
            id: nextId,
            name: valid.name,
            category: valid.category || 'General',
            price: valid.price,
            rating: valid.rating !== undefined ? valid.rating : 5.0,
            stock: valid.stock !== undefined ? valid.stock : 10,
            emoji: valid.emoji || '📦',
            badge: valid.badge || '',
            description: valid.description || '',
          };
          products.push(product);
          return { changed: true, value: product };
        });

        return send(res, 201, created);
      }

      // /products/:id
      const productMatch = cleanPath.match(/^\/products\/([^/]+)$/);
      if (productMatch) {
        const id = positiveId(productMatch[1]);

        if (method === 'GET') {
          const products = await productsStore.list();
          const found = products.find(p => p.id === id);
          if (!found) throw new HttpError(404, `Product #${id} not found`);
          return send(res, 200, found);
        }

        if (method === 'PUT') {
          const body = await parseBody(req);
          const valid = validateProduct(body, false);
          const updated = await productsStore.edit((products) => {
            const index = products.findIndex(p => p.id === id);
            if (index < 0) throw new HttpError(404, `Product #${id} not found`);
            products[index] = {
              id,
              name: valid.name,
              category: valid.category || 'General',
              price: valid.price,
              rating: valid.rating !== undefined ? valid.rating : products[index].rating,
              stock: valid.stock !== undefined ? valid.stock : products[index].stock,
              emoji: valid.emoji || products[index].emoji || '📦',
              badge: valid.badge !== undefined ? valid.badge : products[index].badge,
              description: valid.description || '',
            };
            return { changed: true, value: products[index] };
          });
          return send(res, 200, updated);
        }

        if (method === 'PATCH') {
          const body = await parseBody(req);
          const valid = validateProduct(body, true);
          const updated = await productsStore.edit((products) => {
            const index = products.findIndex(p => p.id === id);
            if (index < 0) throw new HttpError(404, `Product #${id} not found`);
            Object.assign(products[index], valid);
            return { changed: true, value: products[index] };
          });
          return send(res, 200, updated);
        }

        if (method === 'DELETE') {
          const deleted = await productsStore.edit((products) => {
            const index = products.findIndex(p => p.id === id);
            if (index < 0) throw new HttpError(404, `Product #${id} not found`);
            const removed = products.splice(index, 1)[0];
            return { changed: true, value: removed };
          });
          return send(res, 200, { message: `Product #${id} deleted successfully`, deleted });
        }

        throw new HttpError(405, `Method ${method} not allowed for /products/:id`);
      }

      // ----------------------------------------------------------------------
      // USERS & AUTH ENDPOINTS
      // ----------------------------------------------------------------------
      // GET /users - list all users (sanitized, passwords omitted)
      if (cleanPath === '/users' && method === 'GET') {
        const users = await usersStore.list();
        const safe = users.map(({ password, ...u }) => u);
        return send(res, 200, safe);
      }

      // POST /users/register or POST /users
      if ((cleanPath === '/users' || cleanPath === '/users/register') && method === 'POST') {
        const body = await parseBody(req);
        const valid = validateUser(body);

        const created = await usersStore.edit((users) => {
          if (users.some(u => u.email.toLowerCase() === valid.email)) {
            throw new HttpError(409, 'A user with this email already exists');
          }
          const nextId = users.reduce((max, u) => Math.max(max, u.id || 0), 0) + 1;
          const user = {
            id: nextId,
            ...valid,
            createdAt: new Date().toISOString(),
          };
          users.push(user);
          const { password, ...safeUser } = user;
          return { changed: true, value: safeUser };
        });

        return send(res, 201, created);
      }

      // POST /users/login
      if (cleanPath === '/users/login' && method === 'POST') {
        const body = await parseBody(req);
        const { email, password } = validateLogin(body);
        const users = await usersStore.list();
        const user = users.find(u => u.email.toLowerCase() === email && u.password === password);
        if (!user) {
          throw new HttpError(401, 'Invalid email or password');
        }
        const { password: _, ...safeUser } = user;
        return send(res, 200, {
          message: 'Login successful',
          user: safeUser,
          token: `session_token_${user.id}_${Date.now()}`,
        });
      }

      // /users/:id
      const userMatch = cleanPath.match(/^\/users\/([^/]+)$/);
      if (userMatch && userMatch[1] !== 'register' && userMatch[1] !== 'login') {
        const id = positiveId(userMatch[1]);
        if (method === 'GET') {
          const users = await usersStore.list();
          const user = users.find(u => u.id === id);
          if (!user) throw new HttpError(404, `User #${id} not found`);
          const { password, ...safeUser } = user;
          return send(res, 200, safeUser);
        }
        if (method === 'DELETE') {
          await usersStore.edit((users) => {
            const index = users.findIndex(u => u.id === id);
            if (index < 0) throw new HttpError(404, `User #${id} not found`);
            users.splice(index, 1);
            return { changed: true, value: null };
          });
          return send(res, 200, { message: `User #${id} deleted` });
        }
      }

      // ----------------------------------------------------------------------
      // CART ENDPOINTS
      // ----------------------------------------------------------------------
      // GET /cart - get enriched cart with item details and subtotal
      if (cleanPath === '/cart' && method === 'GET') {
        const [cartItems, products] = await Promise.all([
          cartStore.list(),
          productsStore.list(),
        ]);

        const prodMap = new Map(products.map(p => [p.id, p]));
        const enriched = [];
        let subtotal = 0;

        for (const item of cartItems) {
          const prod = prodMap.get(item.productId);
          if (prod) {
            const lineTotal = prod.price * item.quantity;
            subtotal += lineTotal;
            enriched.push({
              productId: prod.id,
              name: prod.name,
              category: prod.category,
              price: prod.price,
              emoji: prod.emoji,
              quantity: item.quantity,
              stock: prod.stock,
              lineTotal,
            });
          }
        }

        const shipping = subtotal > 150 || subtotal === 0 ? 0 : 15;
        const tax = Number((subtotal * 0.05).toFixed(2));
        const total = Number((subtotal + shipping + tax).toFixed(2));

        return send(res, 200, {
          items: enriched,
          itemCount: enriched.reduce((sum, item) => sum + item.quantity, 0),
          subtotal,
          shipping,
          tax,
          total,
          freeShippingEligible: subtotal >= 150,
        });
      }

      // POST /cart - add item to cart
      if (cleanPath === '/cart' && method === 'POST') {
        const body = await parseBody(req);
        const { productId, quantity } = validateCartItem(body);

        const products = await productsStore.list();
        const product = products.find(p => p.id === productId);
        if (!product) throw new HttpError(404, `Product #${productId} not found`);
        if (product.stock < quantity) {
          throw new HttpError(400, `Insufficient stock for "${product.name}". Available: ${product.stock}`);
        }

        const updatedCart = await cartStore.edit((cart) => {
          const existing = cart.find(item => item.productId === productId);
          if (existing) {
            existing.quantity += quantity;
          } else {
            cart.push({ productId, quantity });
          }
          return { changed: true, value: cart };
        });

        return send(res, 200, { message: 'Item added to cart', cart: updatedCart });
      }

      // DELETE /cart - empty entire cart
      if (cleanPath === '/cart' && method === 'DELETE') {
        await cartStore.edit((cart) => {
          cart.length = 0;
          return { changed: true, value: [], data: [] };
        });
        return send(res, 200, { message: 'Cart cleared successfully', items: [] });
      }

      // /cart/:productId
      const cartItemMatch = cleanPath.match(/^\/cart\/([^/]+)$/);
      if (cartItemMatch) {
        const productId = positiveId(cartItemMatch[1]);

        // PUT or PATCH /cart/:productId - update quantity
        if (['PUT', 'PATCH'].includes(method)) {
          const body = await parseBody(req);
          const quantity = Number(body.quantity);
          if (!Number.isInteger(quantity)) throw new HttpError(400, 'Quantity must be an integer');

          const updated = await cartStore.edit((cart) => {
            const index = cart.findIndex(item => item.productId === productId);
            if (index < 0) throw new HttpError(404, `Product #${productId} not in cart`);
            if (quantity <= 0) {
              cart.splice(index, 1);
            } else {
              cart[index].quantity = quantity;
            }
            return { changed: true, value: cart };
          });
          return send(res, 200, { message: 'Cart updated', cart: updated });
        }

        // DELETE /cart/:productId - remove item
        if (method === 'DELETE') {
          const updated = await cartStore.edit((cart) => {
            const index = cart.findIndex(item => item.productId === productId);
            if (index < 0) throw new HttpError(404, `Product #${productId} not in cart`);
            cart.splice(index, 1);
            return { changed: true, value: cart };
          });
          return send(res, 200, { message: `Product #${productId} removed from cart`, cart: updated });
        }
      }

      // ----------------------------------------------------------------------
      // ORDERS (CHECKOUT) ENDPOINTS
      // ----------------------------------------------------------------------
      // GET /orders - list all orders
      if (cleanPath === '/orders' && method === 'GET') {
        const orders = await ordersStore.list();
        return send(res, 200, orders);
      }

      // POST /orders - create order from cart / checkout
      if (cleanPath === '/orders' && method === 'POST') {
        const body = await parseBody(req);
        const orderData = validateOrder(body);

        // Fetch products and active cart
        const [products, cartItems] = await Promise.all([
          productsStore.list(),
          cartStore.list(),
        ]);

        const prodMap = new Map(products.map(p => [p.id, p]));
        const rawItems = orderData.items || cartItems;

        if (!rawItems || rawItems.length === 0) {
          throw new HttpError(400, 'Cannot place order: cart/items are empty');
        }

        // Validate stock and build order items
        const orderItems = [];
        let subtotal = 0;

        for (const raw of rawItems) {
          const pid = Number(raw.productId || raw.id);
          const qty = Number(raw.quantity || 1);
          const prod = prodMap.get(pid);

          if (!prod) throw new HttpError(404, `Product #${pid} not found`);
          if (prod.stock < qty) {
            throw new HttpError(400, `Cannot order ${qty} of "${prod.name}". Only ${prod.stock} in stock.`);
          }

          const lineTotal = prod.price * qty;
          subtotal += lineTotal;
          orderItems.push({
            productId: prod.id,
            name: prod.name,
            price: prod.price,
            emoji: prod.emoji,
            quantity: qty,
            total: lineTotal,
          });
        }

        const shipping = subtotal > 150 ? 0 : 15;
        const tax = Number((subtotal * 0.05).toFixed(2));
        const total = Number((subtotal + shipping + tax).toFixed(2));

        // Atomically decrement stock in productsStore
        await productsStore.edit((prods) => {
          for (const item of orderItems) {
            const p = prods.find(x => x.id === item.productId);
            if (p) p.stock = Math.max(0, p.stock - item.quantity);
          }
          return { changed: true, value: null };
        });

        // Atomically create order
        const createdOrder = await ordersStore.edit((orders) => {
          const nextId = orders.reduce((max, o) => Math.max(max, o.id || 1000), 1000) + 1;
          const order = {
            id: nextId,
            orderNumber: `ORD-${new Date().getFullYear()}-${nextId}`,
            customer: orderData.customer,
            paymentMethod: orderData.paymentMethod,
            items: orderItems,
            subtotal,
            shipping,
            tax,
            total,
            status: 'Processing',
            createdAt: new Date().toISOString(),
          };
          orders.unshift(order); // Newest first
          return { changed: true, value: order };
        });

        // Clear the cart on successful checkout
        await cartStore.edit((cart) => {
          cart.length = 0;
          return { changed: true, value: [], data: [] };
        });

        return send(res, 201, {
          message: 'Order placed successfully',
          order: createdOrder,
        });
      }

      // /orders/:id
      const orderMatch = cleanPath.match(/^\/orders\/([^/]+)$/);
      if (orderMatch) {
        const id = positiveId(orderMatch[1]);

        if (method === 'GET') {
          const orders = await ordersStore.list();
          const found = orders.find(o => o.id === id);
          if (!found) throw new HttpError(404, `Order #${id} not found`);
          return send(res, 200, found);
        }

        if (method === 'PATCH') {
          const body = await parseBody(req);
          const updated = await ordersStore.edit((orders) => {
            const found = orders.find(o => o.id === id);
            if (!found) throw new HttpError(404, `Order #${id} not found`);
            if (body.status) found.status = String(body.status).trim();
            return { changed: true, value: found };
          });
          return send(res, 200, updated);
        }

        if (method === 'DELETE') {
          await ordersStore.edit((orders) => {
            const index = orders.findIndex(o => o.id === id);
            if (index < 0) throw new HttpError(404, `Order #${id} not found`);
            orders.splice(index, 1);
            return { changed: true, value: null };
          });
          return send(res, 200, { message: `Order #${id} deleted` });
        }
      }

      // ----------------------------------------------------------------------
      // REVIEWS ENDPOINTS
      // ----------------------------------------------------------------------
      // GET /reviews - list reviews (optional filter by ?productId=...)
      if (cleanPath === '/reviews' && method === 'GET') {
        let reviews = await reviewsStore.list();
        const pid = params.get('productId');
        if (pid) {
          const id = Number(pid);
          reviews = reviews.filter(r => r.productId === id);
        }
        return send(res, 200, reviews);
      }

      // POST /reviews - submit review
      if (cleanPath === '/reviews' && method === 'POST') {
        const body = await parseBody(req);
        const valid = validateReview(body);

        // Verify product exists
        const products = await productsStore.list();
        const product = products.find(p => p.id === valid.productId);
        if (!product) throw new HttpError(404, `Product #${valid.productId} not found`);

        const createdReview = await reviewsStore.edit((reviews) => {
          const nextId = reviews.reduce((max, r) => Math.max(max, r.id || 0), 0) + 1;
          const review = {
            id: nextId,
            productId: valid.productId,
            userName: valid.userName,
            rating: valid.rating,
            comment: valid.comment,
            date: new Date().toISOString().split('T')[0],
          };
          reviews.push(review);
          return { changed: true, value: review };
        });

        // Recalculate and persist aggregate rating on the product
        const allReviews = await reviewsStore.list();
        const prodReviews = allReviews.filter(r => r.productId === valid.productId);
        if (prodReviews.length > 0) {
          const avg = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
          await productsStore.edit((prods) => {
            const p = prods.find(item => item.id === valid.productId);
            if (p) p.rating = Number(avg.toFixed(1));
            return { changed: true, value: null };
          });
        }

        return send(res, 201, createdReview);
      }

      // DELETE /reviews/:id
      const reviewMatch = cleanPath.match(/^\/reviews\/([^/]+)$/);
      if (reviewMatch && method === 'DELETE') {
        const id = positiveId(reviewMatch[1]);
        await reviewsStore.edit((reviews) => {
          const index = reviews.findIndex(r => r.id === id);
          if (index < 0) throw new HttpError(404, `Review #${id} not found`);
          reviews.splice(index, 1);
          return { changed: true, value: null };
        });
        return send(res, 200, { message: `Review #${id} deleted` });
      }

      // 404 Route Not Found
      throw new HttpError(404, `Endpoint ${method} ${pathname} not found`);

    } catch (error) {
      if (res.headersSent) {
        res.destroy(error);
        return;
      }
      const isHttp = error instanceof HttpError;
      if (!isHttp) console.error('[Unexpected API Error]', error);
      send(res, isHttp ? error.status : 500, {
        error: isHttp ? error.message : 'Internal server error',
      });
    }
  });

  return { server, productsStore, usersStore, cartStore, ordersStore, reviewsStore };
}

module.exports = { createApp };
