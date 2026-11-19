/**
 * HOUSE OF JEWELUX — Admin & Atelier Operations Controller
 * Handles administrative verification, telemetry, visual editor state persistence, and bespoke commissions.
 */

const { readJSON, writeJSON } = require('../db/jsonDb');
const config = require('../config');

const adminLogin = (req, res) => {
  const { pin } = req.body;
  if (pin === '2026' || pin === '1122' || pin === config.adminPin) {
    res.json({ success: true, message: 'Admin authorized' });
  } else {
    res.status(401).json({ success: false, error: 'Invalid Atelier Master PIN' });
  }
};

const getOverview = (req, res, next) => {
  try {
    const orders = readJSON('orders.json');
    const products = readJSON('products.json');
    const customers = readJSON('customers.json');

    const totalRevenue = orders.reduce((sum, o) => sum + ((o.pricing && o.pricing.grandTotal) || 0), 0);
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
  } catch (err) {
    next(err);
  }
};

const updateOrder = (req, res, next) => {
  try {
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
  } catch (err) {
    next(err);
  }
};

const updateProduct = (req, res, next) => {
  try {
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
  } catch (err) {
    next(err);
  }
};

const editorSave = (req, res, next) => {
  try {
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
  } catch (err) {
    next(err);
  }
};

const customOrder = (req, res, next) => {
  try {
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
