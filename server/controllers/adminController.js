/**
 * HOUSE OF JEWELUX — Admin & Atelier Operations Controller
 * Handles administrative verification, telemetry, visual editor state persistence, and bespoke commissions.
 */

const crypto = require('crypto');
const db = require('../db');
const adminAuth = require('../middleware/adminAuth');

const adminLogin = (req, res) => {
  if (!adminAuth.enabled()) {
    return res.status(503).json({ success: false, error: 'Admin login is not set up on the server (ADMIN_SECRET_PIN, SESSION_SECRET).' });
  }
  const { pin } = req.body || {};
  if (!adminAuth.pinMatches(pin)) {
    return res.status(401).json({ success: false, error: 'Invalid PIN' });
  }
  res.json({ success: true, token: adminAuth.issueToken(), expiresInHours: 12 });
};

const getOverview = async (req, res, next) => {
  try {
    const orders = await db.orders.getAll(100);
    const products = db.readJSON('products.json');
    const customers = await db.customers.getAll();

    // Revenue counts paid orders only; unpaid checkouts are not sales
    const paid = orders.filter(o => o.paymentStatus === 'Paid');
    const totalRevenue = paid.reduce((sum, o) => sum + ((o.pricing && o.pricing.grandTotal) || 0), 0);
    const pendingOrders = orders.filter(o => ['Payment pending', 'Awaiting payment'].includes(o.orderStatus)).length;

    res.json({
      success: true,
      metrics: {
        totalRevenue,
        totalOrders: orders.length,
        paidOrders: paid.length,
        pendingVerification: pendingOrders,
        totalProducts: products.length,
        totalCustomers: customers.length
      },
      recentOrders: orders.slice(0, 15)
    });
  } catch (err) {
    next(err);
  }
};

const ORDER_STATUSES = ['Payment pending', 'Awaiting payment', 'Confirmed', 'Processing', 'Ready to ship', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'Refunded'];
const PAYMENT_STATUSES = ['Pending', 'Awaiting payment', 'Paid', 'Failed', 'Refunded'];
const text = (v, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined);

const updateOrder = async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus } = req.body || {};
    if (orderStatus !== undefined && !ORDER_STATUSES.includes(orderStatus)) {
      return res.status(400).json({ success: false, error: 'Unknown order status' });
    }
    if (paymentStatus !== undefined && !PAYMENT_STATUSES.includes(paymentStatus)) {
      return res.status(400).json({ success: false, error: 'Unknown payment status' });
    }
    const updated = await db.orders.update(req.params.orderId, {
      orderStatus,
      paymentStatus,
      trackingNumber: text(req.body.trackingNumber, 100),
      courierPartner: text(req.body.courierPartner, 100),
      estimatedDelivery: text(req.body.estimatedDelivery, 100)
    });

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({ success: true, order: updated });
  } catch (err) {
    next(err);
  }
};

const updateProduct = (req, res, next) => {
  try {
    const { price, stockStatus, badge } = req.body;
    const products = db.readJSON('products.json');
    const index = products.findIndex(p => p.id.toLowerCase() === req.params.productId.toLowerCase());

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    if (price) products[index].price = Number(price);
    if (stockStatus) products[index].stockStatus = stockStatus;
    if (badge !== undefined) products[index].badge = badge;

    db.writeJSON('products.json', products);
    res.json({ success: true, product: products[index] });
  } catch (err) {
    next(err);
  }
};

const editorSave = (req, res, next) => {
  try {
    const { products: updatedProducts, config: updatedConfig, overrides } = req.body || {};
    let updatedCount = 0;

    if (updatedProducts && Array.isArray(updatedProducts)) {
      const products = db.readJSON('products.json');
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
      db.writeJSON('products.json', products);
    }

    if (updatedConfig && typeof updatedConfig === 'object') {
      const cfg = db.readJSON('storeConfig.json', {});
      Object.assign(cfg, updatedConfig);
      db.writeJSON('storeConfig.json', cfg);
    }

    if (overrides && typeof overrides === 'object') {
      const existing = db.readJSON('page_overrides.json', {});
      Object.assign(existing, overrides);
      db.writeJSON('page_overrides.json', existing);
    }

    res.json({ success: true, updatedProductsCount: updatedCount, message: 'All on-page changes successfully saved to disk.' });
  } catch (err) {
    next(err);
  }
};

const customOrder = async (req, res, next) => {
  try {
    const { fullName, phone, email, jewelleryType, metalPreference, budgetBand, description } = req.body;
    if (!fullName || !phone || !email) {
      return res.status(400).json({ success: false, error: 'Name, phone, and email are required' });
    }

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

    await db.customOrders.create(commission);

    res.json({
      success: true,
      message: 'Bespoke commission submitted successfully. Our atelier concierge will contact you within 24 business hours.',
      commissionId: commission.id
    });
  } catch (err) {
    next(err);
  }
};

// Read-only lists for the admin panel (admin token required, see routes/api.js)
const list = (load) => async (req, res, next) => {
  try { res.json({ success: true, items: await load(req) }); } catch (err) { next(err); }
};
const listOrders = list((req) => db.orders.getAll(Math.min(500, parseInt(req.query.limit, 10) || 200)));
// Never send password hashes to the browser
const listCustomers = list(async () => (await db.customers.getAll()).map(({ id, name, email, phone, createdAt }) => ({ id, name, email, phone, createdAt })));
const listSubscribers = list(() => db.subscribers.getAll());
const listCustomOrders = list(() => db.customOrders.getAll());

module.exports = {
  ORDER_STATUSES,
  listOrders,
  listCustomers,
  listSubscribers,
  listCustomOrders,
  adminLogin,
  getOverview,
  updateOrder,
  updateProduct,
  editorSave,
  customOrder
};
