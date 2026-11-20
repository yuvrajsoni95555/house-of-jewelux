/**
 * HOUSE OF JEWELUX — Admin Operations Controller
 */
const { readJSON, writeJSON } = require('../db/jsonDb');
const config = require('../config');
const { issueAdminSession } = require('../middleware/security');

const adminLogin = (req, res) => {
  const pin = String((req.body || {}).pin || '');
  if (!config.adminPin || !pin || pin.length > 128 || pin !== config.adminPin) {
    return res.status(401).json({ success: false, error: 'Invalid admin credentials.' });
  }
  return res.json({ success: true, token: issueAdminSession(), message: 'Admin authorized' });
};

const getOverview = (req, res, next) => {
  try {
    const orders = readJSON('orders.json');
    const products = readJSON('products.json');
    const customers = readJSON('customers.json');
    const totalRevenue = orders.filter(o => o.payment && o.payment.status === 'Paid').reduce((sum, o) => sum + ((o.pricing && o.pricing.grandTotal) || 0), 0);
    const pendingOrders = orders.filter(o => !o.payment || o.payment.status !== 'Paid').length;
    res.json({ success: true, metrics: { totalRevenue, totalOrders: orders.length, pendingVerification: pendingOrders, totalProducts: products.length, totalCustomers: customers.length }, recentOrders: orders.slice(0, 15) });
  } catch (err) { next(err); }
};

const updateOrder = (req, res, next) => {
  try {
    const { orderStatus, paymentStatus, trackingNumber } = req.body || {};
    const orders = readJSON('orders.json');
    const index = orders.findIndex(o => String(o.orderId).toLowerCase() === req.params.orderId.toLowerCase());
    if (index === -1) return res.status(404).json({ success: false, error: 'Order not found' });
    if (orderStatus) orders[index].orderStatus = String(orderStatus).slice(0, 100);
    // Manual admin verification is explicit; automated checkout never marks payment as paid.
    if (paymentStatus === 'Paid') {
      orders[index].payment = orders[index].payment || {};
      orders[index].payment.status = 'Paid';
      orders[index].payment.verifiedAt = new Date().toISOString();
    } else if (paymentStatus) {
      orders[index].payment = orders[index].payment || {};
      orders[index].payment.status = String(paymentStatus).slice(0, 60);
    }
    if (trackingNumber !== undefined) orders[index].trackingNumber = String(trackingNumber).slice(0, 100);
    if (!writeJSON('orders.json', orders)) return res.status(500).json({ success: false, error: 'Could not save order update.' });
    res.json({ success: true, order: orders[index] });
  } catch (err) { next(err); }
};

const updateProduct = (req, res, next) => {
  try {
    const { price, stockStatus, badge } = req.body || {};
    const products = readJSON('products.json');
    const index = products.findIndex(p => String(p.id).toLowerCase() === req.params.productId.toLowerCase());
    if (index === -1) return res.status(404).json({ success: false, error: 'Product not found' });
    if (price !== undefined) {
      const parsed = Number(price);
      if (!Number.isFinite(parsed) || parsed < 0) return res.status(400).json({ success: false, error: 'Invalid price' });
      products[index].price = parsed;
    }
    if (stockStatus) products[index].stockStatus = String(stockStatus).slice(0, 40);
    if (badge !== undefined) products[index].badge = String(badge).slice(0, 60);
    if (!writeJSON('products.json', products)) return res.status(500).json({ success: false, error: 'Could not save product.' });
    res.json({ success: true, product: products[index] });
  } catch (err) { next(err); }
};

const editorSave = (req, res, next) => {
  try {
    const { products: updatedProducts, config: updatedConfig, overrides } = req.body || {};
    let updatedCount = 0;
    if (updatedProducts && Array.isArray(updatedProducts)) {
      const products = readJSON('products.json');
      updatedProducts.forEach(u => {
        const idx = products.findIndex(p => p.id && p.id.toLowerCase() === String(u.id || '').toLowerCase());
        if (idx !== -1) {
          ['name','description','image','badge'].forEach(k => { if (u[k] !== undefined) products[idx][k] = u[k]; });
          ['price'].forEach(k => { if (u[k] !== undefined && Number.isFinite(Number(u[k])) && Number(u[k]) >= 0) products[idx][k] = Number(u[k]); });
          updatedCount++;
        }
      });
      if (!writeJSON('products.json', products)) return res.status(500).json({ success: false, error: 'Could not save products.' });
    }
    if (updatedConfig && typeof updatedConfig === 'object') {
      const cfg = readJSON('storeConfig.json', {});
      Object.assign(cfg, updatedConfig);
      if (!writeJSON('storeConfig.json', cfg)) return res.status(500).json({ success: false, error: 'Could not save store configuration.' });
    }
    if (overrides && typeof overrides === 'object') {
      const existing = readJSON('page_overrides.json', {});
      Object.assign(existing, overrides);
      if (!writeJSON('page_overrides.json', existing)) return res.status(500).json({ success: false, error: 'Could not save page overrides.' });
    }
    res.json({ success: true, updatedProductsCount: updatedCount });
  } catch (err) { next(err); }
};

const customOrder = (req, res) => res.status(410).json({ success: false, error: 'Custom commissions are not currently offered.' });

module.exports = { adminLogin, getOverview, updateOrder, updateProduct, editorSave, customOrder };
