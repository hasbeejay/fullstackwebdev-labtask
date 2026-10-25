// Lab 7 - Part 2: Automated Integration Tests for Persistent E-Commerce API
// Uses a temporary isolated directory for data persistence verification.

const path = require('node:path');
const fs = require('node:fs/promises');
const { createApp } = require('./app.js');

const TEST_PORT = 3106;
const BASE_URL = `http://localhost:${TEST_PORT}`;
const testDataDir = path.join(__dirname, '.test_data');

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  let data = null;
  const text = await response.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: response.status, data };
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  \x1b[32m✔\x1b[0m ${message}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log(`\n======================================================`);
  console.log(` Running Integration Tests: Lab 7 - Part 2 Persistent API`);
  console.log(`======================================================\n`);

  // Clean and prepare test directory with seeds
  await fs.rm(testDataDir, { recursive: true, force: true }).catch(() => {});
  await fs.mkdir(testDataDir, { recursive: true });

  const initialProducts = [
    { id: 1, name: 'Aurora Wireless Headphones', category: 'Audio', price: 129, rating: 4.8, stock: 10, emoji: '🎧' },
    { id: 2, name: 'Linen Lounge Chair', category: 'Home', price: 249, rating: 4.8, stock: 5, emoji: '🪑' },
    { id: 3, name: 'Minimalist Desk Lamp', category: 'Lighting', price: 45, rating: 4.7, stock: 20, emoji: '💡' },
  ];
  await fs.writeFile(path.join(testDataDir, 'products.json'), JSON.stringify(initialProducts, null, 2));
  await fs.writeFile(path.join(testDataDir, 'users.json'), JSON.stringify([]));
  await fs.writeFile(path.join(testDataDir, 'cart.json'), JSON.stringify([]));
  await fs.writeFile(path.join(testDataDir, 'orders.json'), JSON.stringify([]));
  await fs.writeFile(path.join(testDataDir, 'reviews.json'), JSON.stringify([]));

  const { server } = createApp(testDataDir);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));

  try {
    // 1. Health & Info
    console.log(`\x1b[36m[Module 0: Server Health & Stats]\x1b[0m`);
    const health = await request('/health');
    assert(health.status === 200, 'GET /health returns 200');
    assert(health.data.counts.products === 3, 'Initial product count verified');

    // 2. Products CRUD
    console.log(`\n\x1b[36m[Module 1: Products Persistent CRUD]\x1b[0m`);
    const products = await request('/products');
    assert(products.status === 200 && products.data.length === 3, 'GET /products returns 3 initial products');

    // Filter by category
    const audio = await request('/products?category=Audio');
    assert(audio.status === 200 && audio.data.length === 1 && audio.data[0].id === 1, 'GET /products?category=Audio filters correctly');

    // Create product
    const newProd = await request('/products', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Ergonomic Mechanical Keyboard',
        category: 'Tech',
        price: 159,
        rating: 4.9,
        stock: 12,
        emoji: '⌨️',
      }),
    });
    assert(newProd.status === 201, 'POST /products returns 201 Created');
    assert(newProd.data.id === 4, 'New product assigned auto-increment id 4');

    // Verify persistence on disk!
    const fileContent = JSON.parse(await fs.readFile(path.join(testDataDir, 'products.json'), 'utf8'));
    assert(fileContent.some(p => p.id === 4), 'New product atomically persisted to products.json file on disk');

    // PATCH product
    const patchProd = await request('/products/4', {
      method: 'PATCH',
      body: JSON.stringify({ price: 149 }),
    });
    assert(patchProd.status === 200 && patchProd.data.price === 149, 'PATCH /products/4 updated price');

    // DELETE product
    const delProd = await request('/products/4', { method: 'DELETE' });
    assert(delProd.status === 200, 'DELETE /products/4 returns 200');
    const verifyDel = await request('/products/4');
    assert(verifyDel.status === 404, 'GET deleted product returns 404');

    // 3. User Registration & Login
    console.log(`\n\x1b[36m[Module 2: Users & Authentication]\x1b[0m`);
    const reg = await request('/users/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Haseeb Jalil',
        email: '241908@students.au.edu.pk',
        password: 'securePassword123',
      }),
    });
    assert(reg.status === 201, 'POST /users/register returns 201 Created');
    assert(!reg.data.password, 'User password is sanitized and never returned in response');

    // Duplicate email registration should fail
    const dupReg = await request('/users/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Duplicate Haseeb',
        email: '241908@students.au.edu.pk',
        password: 'password999',
      }),
    });
    assert(dupReg.status === 409, 'POST /users/register rejects duplicate email with 409 Conflict');

    // Login with valid credentials
    const login = await request('/users/login', {
      method: 'POST',
      body: JSON.stringify({
        email: '241908@students.au.edu.pk',
        password: 'securePassword123',
      }),
    });
    assert(login.status === 200 && login.data.token, 'POST /users/login returns 200 and session token');

    // Login with invalid password
    const badLogin = await request('/users/login', {
      method: 'POST',
      body: JSON.stringify({
        email: '241908@students.au.edu.pk',
        password: 'wrongPassword',
      }),
    });
    assert(badLogin.status === 401, 'POST /users/login with wrong password returns 401 Unauthorized');

    // 4. Cart Operations
    console.log(`\n\x1b[36m[Module 3: Cart Operations]\x1b[0m`);
    // Add product 1 to cart
    const addCart1 = await request('/cart', {
      method: 'POST',
      body: JSON.stringify({ productId: 1, quantity: 2 }),
    });
    assert(addCart1.status === 200, 'POST /cart adds 2x headphones to cart');

    // Add product 3 to cart
    const addCart2 = await request('/cart', {
      method: 'POST',
      body: JSON.stringify({ productId: 3, quantity: 1 }),
    });
    assert(addCart2.status === 200, 'POST /cart adds 1x desk lamp to cart');

    // Inspect cart totals
    const cart = await request('/cart');
    assert(cart.status === 200, 'GET /cart returns 200');
    assert(cart.data.items.length === 2, 'Cart has 2 distinct product lines');
    // subtotal = 2 * 129 (258) + 1 * 45 (45) = 303. Subtotal > 150, free shipping = 0
    assert(cart.data.subtotal === 303, `Computed cart subtotal is 303 (got ${cart.data.subtotal})`);
    assert(cart.data.shipping === 0, 'Subtotal > $150 qualifies for free shipping');

    // Update quantity
    const updateQty = await request('/cart/3', {
      method: 'PATCH',
      body: JSON.stringify({ quantity: 3 }),
    });
    assert(updateQty.status === 200, 'PATCH /cart/3 updated item quantity');

    // 5. Checkout & Orders Flow (Stock reduction & persistence)
    console.log(`\n\x1b[36m[Module 4: Checkout & Orders Flow]\x1b[0m`);
    const initialHeadphoneStock = (await request('/products/1')).data.stock;

    const checkout = await request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        customer: {
          name: 'Haseeb Jalil',
          email: '241908@students.au.edu.pk',
          phone: '+92 300 0000000',
          address: 'Air University Sector E-9',
          city: 'Islamabad',
          zip: '44000',
        },
        paymentMethod: 'Credit Card',
      }),
    });
    assert(checkout.status === 201, 'POST /orders creates order successfully (201 Created)');
    assert(checkout.data.order.orderNumber.startsWith('ORD-'), 'Order assigned formatted order number');
    const orderId = checkout.data.order.id;

    // Check that cart was emptied after successful checkout
    const postOrderCart = await request('/cart');
    assert(postOrderCart.data.items.length === 0, 'Cart is automatically cleared after checkout');

    // Check that product stock was decremented atomically on disk
    const updatedHeadphoneStock = (await request('/products/1')).data.stock;
    assert(updatedHeadphoneStock === initialHeadphoneStock - 2, `Product stock decremented from ${initialHeadphoneStock} to ${updatedHeadphoneStock}`);

    // Update order status
    const updateOrder = await request(`/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Shipped' }),
    });
    assert(updateOrder.status === 200 && updateOrder.data.status === 'Shipped', 'PATCH /orders/:id updated status to "Shipped"');

    // 6. Reviews Module
    console.log(`\n\x1b[36m[Module 5: Product Reviews & Rating Recalculation]\x1b[0m`);
    const addReview = await request('/reviews', {
      method: 'POST',
      body: JSON.stringify({
        productId: 1,
        userName: 'Ayesha Khan',
        rating: 5,
        comment: 'Crystal clear sound quality and comfortable memory foam cushions!',
      }),
    });
    assert(addReview.status === 201, 'POST /reviews returns 201 Created');

    const reviews = await request('/reviews?productId=1');
    assert(reviews.status === 200 && reviews.data.some(r => r.userName === 'Ayesha Khan'), 'GET /reviews?productId=1 contains submitted review');

    console.log(`\n------------------------------------------------------`);
    console.log(` Part 2 Test Results: \x1b[32m${passed} passed\x1b[0m, \x1b[${failed ? '31' : '32'}m${failed} failed\x1b[0m`);
    console.log(`------------------------------------------------------\n`);

  } finally {
    server.close();
    // Clean up test data
    await fs.rm(testDataDir, { recursive: true, force: true }).catch(() => {});
  }
}

if (require.main === module) {
  runTests().then(() => {
    if (failed > 0) process.exit(1);
  }).catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
}
