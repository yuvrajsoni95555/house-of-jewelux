/**
 * HOUSE OF JEWELUX — Cart pricing and order IDs (one place for every endpoint)
 * Prices always come from data/products.json on the server; the browser's prices are never trusted.
 */

const crypto = require('crypto');
const db = require('../db');

// shortcut: shipping and gift-box charges are fixed here; move them to store settings when the admin gets a Settings page
const FREE_SHIPPING_FROM = 2500;
const SHIPPING_FEE = 250;
const GIFT_BOX_FEE = 150;
const MAX_QTY = 10;

function priceCart(items, couponCode, isGiftBox) {
  const products = db.readJSON('products.json');
  const coupons = db.readJSON('coupons.json', {});
  let subtotal = 0;
  const lines = [];
  for (const item of Array.isArray(items) ? items : []) {
    const prod = products.find((p) => p.id === item.id);
    if (!prod || prod.status === 'draft' || prod.stockStatus === 'Out of Stock') continue;
    const quantity = Math.min(MAX_QTY, Math.max(1, parseInt(item.quantity, 10) || 1));
    const itemTotal = prod.price * quantity;
    subtotal += itemTotal;
    lines.push({ id: prod.id, name: prod.name, sku: prod.sku || '', price: prod.price, metal: prod.metal || '', quantity, image: prod.image, itemTotal });
  }
  let discount = 0;
  let appliedCoupon = null;
  const coupon = couponCode ? coupons[String(couponCode).toUpperCase()] : null;
  if (coupon) {
    appliedCoupon = coupon.code;
    if (coupon.discountPercent) discount = Math.round((subtotal * coupon.discountPercent) / 100);
    else if (coupon.flatDiscountINR) discount = Math.min(subtotal, coupon.flatDiscountINR);
  }
  const shipping = subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
  const giftBoxCost = isGiftBox ? GIFT_BOX_FEE : 0;
  const grandTotal = Math.max(0, subtotal - discount + shipping + giftBoxCost);
  return { items: lines, pricing: { subtotal, discount, couponCode: appliedCoupon, shipping, giftBoxCost, grandTotal } };
}

// Unguessable order IDs, e.g. HJ-MX3K9A-7F2C1B (the old 4-digit numbers could be guessed and collided)
function newOrderId() {
  return `HJ-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

module.exports = { priceCart, newOrderId };
