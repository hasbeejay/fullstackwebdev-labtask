// Lab 7 - Part 2: Input Validation Module
// Provides HttpError and schema validators for e-commerce entities.

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function positiveId(text) {
  if (!/^[1-9]\d*$/.test(String(text))) {
    throw new HttpError(400, 'ID must be a positive integer');
  }
  const id = Number(text);
  if (!Number.isSafeInteger(id)) {
    throw new HttpError(400, 'ID is out of safe range');
  }
  return id;
}

function validateProduct(body, isPatch = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Product payload must be a JSON object');
  }

  const allowed = ['name', 'category', 'price', 'rating', 'stock', 'emoji', 'description', 'badge'];
  const keys = Object.keys(body);
  const unknown = keys.find(k => !allowed.includes(k));
  if (unknown) {
    throw new HttpError(400, `Unknown field "${unknown}" in product payload`);
  }

  if (isPatch && keys.length === 0) {
    throw new HttpError(400, 'Provide at least one field to update');
  }

  if (!isPatch) {
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      throw new HttpError(400, 'Product "name" is required');
    }
    if (typeof body.price !== 'number' || body.price < 0) {
      throw new HttpError(400, 'Product "price" must be a non-negative number');
    }
  }

  const clean = {};
  if (body.name !== undefined) clean.name = String(body.name).trim();
  if (body.category !== undefined) clean.category = String(body.category).trim();
  if (body.price !== undefined) {
    const p = Number(body.price);
    if (Number.isNaN(p) || p < 0) throw new HttpError(400, 'Invalid price');
    clean.price = p;
  }
  if (body.rating !== undefined) {
    const r = Number(body.rating);
    if (Number.isNaN(r) || r < 0 || r > 5) throw new HttpError(400, 'Rating must be between 0 and 5');
    clean.rating = Number(r.toFixed(1));
  }
  if (body.stock !== undefined) {
    const s = Number(body.stock);
    if (!Number.isInteger(s) || s < 0) throw new HttpError(400, 'Stock must be a non-negative integer');
    clean.stock = s;
  }
  if (body.emoji !== undefined) clean.emoji = String(body.emoji).trim();
  if (body.description !== undefined) clean.description = String(body.description).trim();
  if (body.badge !== undefined) clean.badge = String(body.badge).trim();

  return clean;
}

function validateUser(body) {
  if (!body || typeof body !== 'object') throw new HttpError(400, 'User payload must be a JSON object');
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '').trim();

  if (!name) throw new HttpError(400, 'Name is required');
  if (!email || !email.includes('@')) throw new HttpError(400, 'Valid email is required');
  if (!password || password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters long');

  return {
    name,
    email,
    password,
    role: body.role === 'admin' ? 'admin' : 'customer',
  };
}

function validateLogin(body) {
  if (!body || typeof body !== 'object') throw new HttpError(400, 'Credentials required');
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '').trim();
  if (!email || !password) throw new HttpError(400, 'Email and password are required');
  return { email, password };
}

function validateCartItem(body) {
  if (!body || typeof body !== 'object') throw new HttpError(400, 'Cart item payload must be a JSON object');
  const productId = positiveId(body.productId);
  const quantity = body.quantity !== undefined ? Number(body.quantity) : 1;
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new HttpError(400, 'Quantity must be a positive integer');
  }
  return { productId, quantity };
}

function validateOrder(body) {
  if (!body || typeof body !== 'object') throw new HttpError(400, 'Order payload must be a JSON object');
  const customer = body.customer;
  if (!customer || typeof customer !== 'object') throw new HttpError(400, 'Customer details required');
  if (!customer.name || !String(customer.name).trim()) throw new HttpError(400, 'Customer name required');
  if (!customer.email || !String(customer.email).includes('@')) throw new HttpError(400, 'Customer email required');
  if (!customer.address || !String(customer.address).trim()) throw new HttpError(400, 'Shipping address required');
  if (!customer.city || !String(customer.city).trim()) throw new HttpError(400, 'City is required');

  return {
    customer: {
      name: String(customer.name).trim(),
      email: String(customer.email).trim().toLowerCase(),
      phone: String(customer.phone || '').trim(),
      address: String(customer.address).trim(),
      city: String(customer.city).trim(),
      zip: String(customer.zip || '').trim(),
    },
    paymentMethod: String(body.paymentMethod || 'Credit Card').trim(),
    items: Array.isArray(body.items) ? body.items : null, // If null, order will use active cart
  };
}

function validateReview(body) {
  if (!body || typeof body !== 'object') throw new HttpError(400, 'Review payload must be a JSON object');
  const productId = positiveId(body.productId);
  const userName = String(body.userName || body.name || '').trim();
  const comment = String(body.comment || '').trim();
  const rating = Number(body.rating);

  if (!userName) throw new HttpError(400, 'Reviewer name is required');
  if (Number.isNaN(rating) || rating < 1 || rating > 5) {
    throw new HttpError(400, 'Rating must be an integer between 1 and 5');
  }
  if (!comment) throw new HttpError(400, 'Review comment is required');

  return {
    productId,
    userName,
    rating: Math.round(rating),
    comment,
  };
}

module.exports = {
  HttpError,
  positiveId,
  validateProduct,
  validateUser,
  validateLogin,
  validateCartItem,
  validateOrder,
  validateReview,
};
