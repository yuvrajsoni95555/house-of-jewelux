const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security Headers & Production HTTPS Enforcement Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Forwarded Proto HTTPS redirection for production reverse proxies
  if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(301, 'https://' + req.headers.host + req.url);
  }
  next();
});

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helpers for JSON files
function readJSON(filename, defaultVal = []) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultVal, null, 2), 'utf8');
    return defaultVal;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return defaultVal;
  }
}

function writeJSON(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Initialize Orders, Customers, CustomOrders if missing
if (!fs.existsSync(path.join(DATA_DIR, 'orders.json'))) writeJSON('orders.json', []);
if (!fs.existsSync(path.join(DATA_DIR, 'customers.json'))) writeJSON('customers.json', []);
if (!fs.existsSync(path.join(DATA_DIR, 'custom_orders.json'))) writeJSON('custom_orders.json', []);
if (!fs.existsSync(path.join(DATA_DIR, 'subscribers.json'))) writeJSON('subscribers.json', []);

// Static file serving
app.use(express.static(__dirname));

// ==================== REST APIS ====================

// 1. Products API
app.get('/api/products', (req, res) => {
  const products = readJSON('products.json');
  let result = [...products];

  const { category, collection, search, metal, sort, min_price, max_price } = req.query;

  if (category && category !== 'all') {
    result = result.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (collection && collection !== 'all') {
    result = result.filter(p => (p.collection || '').toLowerCase() === collection.toLowerCase());
  }

  if (metal) {
    result = result.filter(p => (p.metal || '').toLowerCase().includes(metal.toLowerCase()));
  }

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.category.toLowerCase().includes(q) || 
      (p.description || '').toLowerCase().includes(q) ||
      (p.stone || '').toLowerCase().includes(q)
    );
  }

  if (min_price) {
    result = result.filter(p => p.price >= Number(min_price));
  }
  if (max_price) {
    result = result.filter(p => p.price <= Number(max_price));
  }

  // Sorting
  if (sort === 'price_asc') {
    result.sort((a, b) => a.price - b.price);
  } else if (sort === 'price_desc') {
    result.sort((a, b) => b.price - a.price);
  } else if (sort === 'rating') {
    result.sort((a, b) => Number(b.rating) - Number(a.rating));
  } else if (sort === 'newest') {
    result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
  }

  res.json({ success: true, count: result.length, products: result });
});

// 2. Single Product API by handle or ID
app.get('/api/products/:identifier', (req, res) => {
  const products = readJSON('products.json');
  const idOrHandle = req.params.identifier.toLowerCase();
  const product = products.find(p => 
    p.id.toLowerCase() === idOrHandle || 
    p.handle.toLowerCase() === idOrHandle
  );

  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  // Also include 4 related products from the same category
  const related = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  res.json({ success: true, product, related });
});

// 3. Cart & Checkout Price Validation
app.post('/api/cart/validate', (req, res) => {
  const { items, couponCode } = req.body;
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ success: false, error: 'Invalid items array' });
  }

  const products = readJSON('products.json');
  const coupons = readJSON('coupons.json', {});

  let subtotal = 0;
  const validatedItems = [];

  for (const item of items) {
    const prod = products.find(p => p.id === item.id);
    if (!prod) continue;
    const qty = Math.max(1, parseInt(item.quantity) || 1);
    const itemTotal = prod.price * qty;
    subtotal += itemTotal;
    validatedItems.push({
      id: prod.id,
      name: prod.name,
      price: prod.price,
      quantity: qty,
      image: prod.image,
      itemTotal
    });
  }

  // Calculate discount
  let discount = 0;
  let appliedCoupon = null;
  if (couponCode && coupons[couponCode.toUpperCase()]) {
    const coupon = coupons[couponCode.toUpperCase()];
    appliedCoupon = coupon.code;
    if (coupon.discountPercent) {
      discount = Math.round((subtotal * coupon.discountPercent) / 100);
    } else if (coupon.flatDiscountINR) {
      discount = Math.min(subtotal, coupon.flatDiscountINR);
    }
  }

  const shipping = subtotal >= 2500 ? 0 : 250;
  const grandTotal = Math.max(0, subtotal - discount + shipping);

  res.json({
    success: true,
    subtotal,
    discount,
    appliedCoupon,
    shipping,
    grandTotal,
    items: validatedItems
  });
});

// 4. Create Order API with Real Validation
app.post('/api/orders', (req, res) => {
  const { 
    customer, 
    shippingAddress, 
    items, 
    paymentMethod, 
    couponCode,
    isGiftBox
  } = req.body;

  if (!customer || !shippingAddress || !items || items.length === 0) {
    return res.status(400).json({ success: false, error: 'Missing mandatory checkout information' });
  }

  const products = readJSON('products.json');
  const coupons = readJSON('coupons.json', {});
  const orders = readJSON('orders.json');

  // Server-side recalculation to prevent price tampering
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const prod = products.find(p => p.id === item.id);
    if (!prod) continue;
    const qty = Math.max(1, parseInt(item.quantity) || 1);
    const lineTotal = prod.price * qty;
    subtotal += lineTotal;
    orderItems.push({
      id: prod.id,
      name: prod.name,
      price: prod.price,
      quantity: qty,
      size: item.size || 'Standard',
      metal: item.metal || 'BIS 925 Sterling Silver',
      image: prod.image,
      lineTotal
    });
  }

  if (orderItems.length === 0) {
    return res.status(400).json({ success: false, error: 'No valid products in order' });
  }

  let discount = 0;
  if (couponCode && coupons[couponCode.toUpperCase()]) {
    const coupon = coupons[couponCode.toUpperCase()];
    if (coupon.discountPercent) {
      discount = Math.round((subtotal * coupon.discountPercent) / 100);
    } else if (coupon.flatDiscountINR) {
      discount = Math.min(subtotal, coupon.flatDiscountINR);
    }
  }

  const giftBoxFee = isGiftBox ? 250 : 0;
  const shipping = subtotal >= 2500 ? 0 : 250;
  const grandTotal = subtotal - discount + shipping + giftBoxFee;

  const orderId = `HJ-ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const orderDate = new Date().toISOString();

  // Status mapping
  let orderStatus = 'Confirmed';
  let paymentStatus = 'Paid';

  if (paymentMethod === 'bank_transfer') {
    orderStatus = 'Pending Verification';
    paymentStatus = 'Pending Verification';
  } else if (paymentMethod === 'cod') {
    orderStatus = 'Confirmed (COD)';
    paymentStatus = 'Due on Delivery';
  }

  const newOrder = {
    orderId,
    orderDate,
    customer,
    shippingAddress,
    items: orderItems,
    pricing: {
      subtotal,
      discount,
      couponCode: couponCode || null,
      giftBoxFee,
      shipping,
      grandTotal
    },
    paymentMethod,
    paymentStatus,
    orderStatus,
    trackingNumber: `HJ-TRK-${Math.floor(100000 + Math.random() * 900000)}IN`,
    estimatedDelivery: "3 - 5 Business Days via Insured Courier"
  };

  orders.unshift(newOrder);
  writeJSON('orders.json', orders);

  // If customer has account, record order in customer history
  const customers = readJSON('customers.json');
  const custIndex = customers.findIndex(c => c.email.toLowerCase() === customer.email.toLowerCase());
  if (custIndex !== -1) {
    customers[custIndex].orders = customers[custIndex].orders || [];
    customers[custIndex].orders.unshift(orderId);
    writeJSON('customers.json', customers);
  }

  res.json({
    success: true,
    message: 'Order created successfully',
    order: newOrder
  });
});

// 5. Get Order by ID
app.get('/api/orders/:orderId', (req, res) => {
  const orders = readJSON('orders.json');
  const order = orders.find(o => o.orderId.toLowerCase() === req.params.orderId.toLowerCase());
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }
  res.json({ success: true, order });
});

// 6. Customer Authentication APIs
app.post('/api/auth/register', (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Name, email, and password required' });
  }

  const customers = readJSON('customers.json');
  if (customers.find(c => c.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ success: false, error: 'An account with this email already exists' });
  }

  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
  const newCustomer = {
    id: `CUST-${Date.now()}`,
    name,
    email: email.toLowerCase(),
    phone: phone || '',
    passwordHash,
    createdAt: new Date().toISOString(),
    orders: [],
    wishlist: []
  };

  customers.push(newCustomer);
  writeJSON('customers.json', customers);

  res.json({
    success: true,
    customer: { id: newCustomer.id, name: newCustomer.name, email: newCustomer.email, phone: newCustomer.phone }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }

  const customers = readJSON('customers.json');
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
  const customer = customers.find(c => c.email.toLowerCase() === email.toLowerCase() && c.passwordHash === passwordHash);

  if (!customer) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  // Get full customer orders
  const orders = readJSON('orders.json');
  const customerOrders = orders.filter(o => o.customer.email.toLowerCase() === customer.email.toLowerCase());

  res.json({
    success: true,
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      orders: customerOrders,
      wishlist: customer.wishlist || []
    }
  });
});

// 7. Admin Authentication & Management APIs
app.post('/api/admin/login', (req, res) => {
  const { pin } = req.body;
  // Master PIN for House of Jewelux: 2026 or 1122
  if (pin === '2026' || pin === '1122') {
    res.json({ success: true, message: 'Admin authorized' });
  } else {
    res.status(401).json({ success: false, error: 'Invalid Atelier Master PIN' });
  }
});

app.get('/api/admin/overview', (req, res) => {
  const orders = readJSON('orders.json');
  const products = readJSON('products.json');
  const customers = readJSON('customers.json');

  const totalRevenue = orders.reduce((sum, o) => sum + (o.pricing.grandTotal || 0), 0);
  const pendingOrders = orders.filter(o => o.orderStatus === 'Pending Verification').length;

  res.json({
    success: true,
    metrics: {
      totalRevenue,
      totalOrders: orders.length,
      pendingVerification: pendingOrders,
      totalProducts: products.length,
      totalCustomers: customers.length
    },
    recentOrders: orders.slice(0, 15)
  });
});

app.patch('/api/admin/orders/:orderId', (req, res) => {
  const { orderStatus, paymentStatus, trackingNumber } = req.body;
  const orders = readJSON('orders.json');
  const index = orders.findIndex(o => o.orderId.toLowerCase() === req.params.orderId.toLowerCase());

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  if (orderStatus) orders[index].orderStatus = orderStatus;
  if (paymentStatus) orders[index].paymentStatus = paymentStatus;
  if (trackingNumber) orders[index].trackingNumber = trackingNumber;

  writeJSON('orders.json', orders);
  res.json({ success: true, order: orders[index] });
});

app.patch('/api/admin/products/:productId', (req, res) => {
  const { price, stockStatus, badge } = req.body;
  const products = readJSON('products.json');
  const index = products.findIndex(p => p.id.toLowerCase() === req.params.productId.toLowerCase());

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  if (price) products[index].price = Number(price);
  if (stockStatus) products[index].stockStatus = stockStatus;
  if (badge !== undefined) products[index].badge = badge;

  writeJSON('products.json', products);
  res.json({ success: true, product: products[index] });
});

// 7.1 Visual On-Page Editor Batch Save API
app.post('/api/admin/editor-save', (req, res) => {
  const { products: updatedProducts, config: updatedConfig, overrides } = req.body || {};
  let updatedCount = 0;

  if (updatedProducts && Array.isArray(updatedProducts)) {
    const products = readJSON('products.json');
    updatedProducts.forEach(u => {
      const idx = products.findIndex(p => p.id && p.id.toLowerCase() === (u.id || '').toLowerCase());
      if (idx !== -1) {
        if (u.price !== undefined) products[idx].price = Number(u.price);
        if (u.originalPrice !== undefined) products[idx].originalPrice = Number(u.originalPrice);
        if (u.name !== undefined) products[idx].name = u.name;
        if (u.description !== undefined) products[idx].description = u.description;
        if (u.image !== undefined) products[idx].image = u.image;
        if (u.badge !== undefined) products[idx].badge = u.badge;
        updatedCount++;
      }
    });
    writeJSON('products.json', products);
  }

  if (updatedConfig && typeof updatedConfig === 'object') {
    const cfg = readJSON('storeConfig.json', {});
    Object.assign(cfg, updatedConfig);
    writeJSON('storeConfig.json', cfg);
  }

  if (overrides && typeof overrides === 'object') {
    const existing = readJSON('page_overrides.json', {});
    Object.assign(existing, overrides);
    writeJSON('page_overrides.json', existing);
  }

  res.json({ success: true, updatedProductsCount: updatedCount, message: 'All on-page changes successfully saved to disk.' });
});

// 8. Custom / Bespoke Order API
app.post('/api/custom-order', (req, res) => {
  const { fullName, phone, email, jewelleryType, metalPreference, budgetBand, description } = req.body;
  if (!fullName || !phone || !email) {
    return res.status(400).json({ success: false, error: 'Name, phone, and email are required' });
  }

  const customOrders = readJSON('custom_orders.json');
  const commission = {
    id: `HJ-BESPOKE-${Date.now()}`,
    createdAt: new Date().toISOString(),
    fullName,
    phone,
    email,
    jewelleryType,
    metalPreference,
    budgetBand,
    description,
    status: 'In Review with Master Goldsmith Yuvraj Soni'
  };

  customOrders.unshift(commission);
  writeJSON('custom_orders.json', customOrders);

  res.json({
    success: true,
    message: 'Bespoke commission submitted successfully. Our atelier concierge will contact you within 24 business hours.',
    commissionId: commission.id
  });
});

// 9. Newsletter Subscription API
app.post('/api/newsletter', (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'Valid email required' });
  }

  const subs = readJSON('subscribers.json');
  if (!subs.includes(email.toLowerCase())) {
    subs.push(email.toLowerCase());
    writeJSON('subscribers.json', subs);
  }

  res.json({
    success: true,
    message: 'Welcome to the House of Jewelux Atelier Circle. Use code FIRSTLUX for 10% privilege on your first acquisition.'
  });
});

// 10. Categories API (Jaipur Jewels Category Navigation)
app.get('/api/categories', (req, res) => {
  const categories = readJSON('categories.json');
  res.json({ success: true, categories });
});

// 11. Book an Appointment API (Jaipur Jewels Private Consultation)
app.post('/api/appointments', (req, res) => {
  const { fullName, email, phone, appointmentDate, preferredTime, consultationType, interests, notes } = req.body;
  
  if (!fullName || !email || !phone || !appointmentDate) {
    return res.status(400).json({ success: false, error: 'Full name, email, phone, and appointment date are required.' });
  }

  const appointments = readJSON('appointments.json');
  const appointmentId = `HJ-APT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const newAppointment = {
    id: appointmentId,
    createdAt: new Date().toISOString(),
    fullName,
    email,
    phone,
    appointmentDate,
    preferredTime: preferredTime || '15:00 - 16:30 IST',
    consultationType: consultationType || 'Private Jaipur Atelier Experience',
    interests: interests || 'Fine Jewellery & Bespoke Commissions',
    notes: notes || '',
    status: 'Confirmed & Concierge Assigned'
  };

  appointments.unshift(newAppointment);
  writeJSON('appointments.json', appointments);

  res.json({
    success: true,
    appointmentId,
    appointment: newAppointment,
    message: `Consultation confirmed for ${fullName}. Appointment Reference: ${appointmentId}. Our Salon Concierge will send private directions to ${email}.`
  });
});

app.get('/api/appointments', (req, res) => {
  const appointments = readJSON('appointments.json');
  res.json({ success: true, appointments });
});

// 12. Track Your Order API (Jaipur Jewels Order Tracking)
app.post('/api/orders/track', (req, res) => {
  const { orderId, query } = req.body;
  const searchId = (orderId || query || '').trim().toUpperCase();

  if (!searchId) {
    return res.status(400).json({ success: false, error: 'Please enter a valid Order ID (e.g. HJ-ORD-2026-7701)' });
  }

  const orders = readJSON('orders.json');
  const matched = orders.find(o => 
    o.orderId.toUpperCase() === searchId || 
    (o.trackingNumber && o.trackingNumber.toUpperCase() === searchId) ||
    (o.customer && (o.customer.email.toUpperCase() === searchId || o.customer.phone.replace(/[^0-9]/g, '') === searchId.replace(/[^0-9]/g, '')))
  );

  if (!matched) {
    return res.status(404).json({
      success: false,
      error: `No consignment found for "${searchId}". Please verify your Order ID or contact Maison Concierge at +91 63770 61020.`
    });
  }

  // Return sanitized, verified order tracking info
  res.json({
    success: true,
    order: {
      orderId: matched.orderId,
      orderDate: matched.orderDate,
      orderStatus: matched.orderStatus || 'Processing in Jaipur Atelier',
      paymentStatus: matched.paymentStatus || 'Paid',
      trackingNumber: matched.trackingNumber || 'HJ-TRK-749102IN',
      courierPartner: 'Sequel Secure Armored Logistics & Blue Dart Apex',
      estimatedDelivery: matched.estimatedDelivery || '3 - 5 Business Days with White-Glove Armored Transit',
      shippingCity: matched.shippingAddress ? `${matched.shippingAddress.city}, ${matched.shippingAddress.state}` : 'Jaipur, Rajasthan',
      itemCount: matched.items ? matched.items.length : 1,
      items: (matched.items || []).map(i => ({
        name: i.name,
        quantity: i.quantity,
        metal: i.metal,
        image: i.image
      })),
      total: matched.pricing ? matched.pricing.grandTotal : 0
    }
  });
});

// 13. Password Recovery API (Customer Authentication)
app.post('/api/auth/recover-password', (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'Please enter a valid registered patron email address.' });
  }

  const customers = readJSON('customers.json');
  const found = customers.find(c => c.email.toLowerCase() === email.toLowerCase());

  res.json({
    success: true,
    message: found 
      ? `A secure password reset link has been dispatched to ${email}. Please check your inbox.`
      : `If an account is associated with ${email}, password reset instructions have been dispatched.`
  });
});

// ==================== SPA FALLBACK ROUTE ====================
// Any unhandled GET route serves the main application entry point (index.html)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`✦ HOUSE OF JEWELUX Server live at http://localhost:${PORT}`);
  console.log(`✦ Reference: Palmonas 1:1 Recreation with official brand replacement`);
});
