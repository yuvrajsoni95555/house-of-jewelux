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

    const totalRevenue = orders.reduce((sum, o) => sum + ((o.pricing && o.pricing.grandTotal) || 0), 0);
    const pendingOrders = orders.filter(o => ['Payment pending', 'Awaiting payment'].includes(o.orderStatus)).length;

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
  } catch (err) {
    next(err);
  }
};

const updateOrder = async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus, trackingNumber } = req.body;
    const updated = await db.orders.update(req.params.orderId, {
      orderStatus,
      paymentStatus,
      trackingNumber
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

module.exports = {
  adminLogin,
  getOverview,
  updateOrder,
  updateProduct,
  editorSave,
  customOrder
};
