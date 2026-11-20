/**
 * HOUSE OF JEWELUX — Order & Cart Controller
 * Handles cart price validation, order processing, tracking telemetry, and order lookup.
 */

const crypto = require('crypto');
const { readJSON, writeJSON } = require('../db/jsonDb');

const validateCart = (req, res, next) => {
  try {
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
      const qty = Number.parseInt(item.quantity, 10);
      if (!Number.isInteger(qty) || qty < 1 || qty > 10) return res.status(400).json({ success: false, error: 'Each product quantity must be between 1 and 10.' });
      const itemTotal = Number(prod.price) * qty;
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

    const shipping = null;
    const grandTotal = Math.max(0, subtotal - discount + (shipping || 0));

    res.json({
      success: true,
      subtotal,
      discount,
      appliedCoupon,
      shipping,
      grandTotal,
      items: validatedItems
    });
  } catch (err) {
    next(err);
  }
};

const createOrder = (req, res, next) => {
  try {
    const { 
      customer, 
      shippingAddress, 
      items, 
      paymentMethod, 
      couponCode,
      isGiftBox
    } = req.body;

    if (!customer || typeof customer !== 'object' || !shippingAddress || typeof shippingAddress !== 'object' || !Array.isArray(items) || items.length === 0 || items.length > 30) {
      return res.status(400).json({ success: false, error: 'Missing or invalid checkout information' });
    }
    const email = String(customer.email || '').trim();
    const phoneDigits = String(customer.phone || '').replace(/\D/g, '');
    const addressLine = String(shippingAddress.addressLine || shippingAddress.address || '').trim();
    const city = String(shippingAddress.city || '').trim();
    const state = String(shippingAddress.state || '').trim();
    const pincode = String(shippingAddress.pincode || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || phoneDigits.length < 10 || phoneDigits.length > 15 ||
        addressLine.length < 5 || city.length < 2 || state.length < 2 || !/^[A-Za-z0-9 -]{4,10}$/.test(pincode)) {
      return res.status(400).json({ success: false, error: 'Please provide a valid email, phone number and complete shipping address.' });
    }

    const allowedPaymentMethods = ['advance_payment'];
    const selectedPaymentMethod = paymentMethod || 'advance_payment';
    if (!allowedPaymentMethods.includes(selectedPaymentMethod)) {
      return res.status(400).json({ success: false, error: 'Only advance payment is accepted. Cash on Delivery is not available.' });
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
      const qty = Number.parseInt(item.quantity, 10);
      if (!Number.isInteger(qty) || qty < 1 || qty > 10) return res.status(400).json({ success: false, error: 'Each product quantity must be between 1 and 10.' });
      const itemTotal = Number(prod.price) * qty;
      subtotal += itemTotal;
      orderItems.push({
        id: prod.id,
        name: prod.name,
        price: prod.price,
        metal: prod.metal || 'See product specifications',
        quantity: qty,
        image: prod.image,
        itemTotal
      });
    }

    if (orderItems.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid products in cart' });
    }

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

    const shipping = null;
    const giftBoxCost = isGiftBox ? 150 : 0;
    const grandTotal = Math.max(0, subtotal - discount + (shipping || 0) + giftBoxCost);

    const orderId = `HJ-ORD-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    const trackingNumber = '';

    const newOrder = {
      orderId,
      orderDate: new Date().toISOString(),
      orderStatus: 'Awaiting Payment',
      customer: {
        name: customer.name || customer.fullName || 'Valued Connoisseur',
        email,
        phone: phoneDigits
      },
      shippingAddress: {
        addressLine,
        city,
        state,
        pincode,
        country: 'India'
      },
      payment: {
        method: selectedPaymentMethod,
        status: 'Payment Pending'
      },
      pricing: {
        subtotal,
        discount,
        couponCode: appliedCoupon,
        shipping,
        giftBoxCost,
        grandTotal
      },
      items: orderItems,
      trackingNumber,
      estimatedDelivery: 'Estimated delivery will be shared after order confirmation'
    };

    orders.unshift(newOrder);
    if (!writeJSON('orders.json', orders)) return res.status(500).json({ success: false, error: 'Unable to save your order. Please try again.' });

    res.status(201).json({
      success: true,
      orderId,
      trackingNumber,
      order: newOrder
    });
  } catch (err) {
    next(err);
  }
};

const getOrderById = (req, res, next) => {
  try {
    const orders = readJSON('orders.json');
    const order = orders.find(o => o.orderId.toLowerCase() === req.params.orderId.toLowerCase());
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

const trackOrder = (req, res, next) => {
  try {
    const { orderId, query } = req.body;
    const searchId = (orderId || query || '').trim().toUpperCase();

    if (!searchId) {
      return res.status(400).json({ success: false, error: 'Please enter a valid Order ID.' });
    }

    const orders = readJSON('orders.json');
    const matched = orders.find(o => String(o.orderId || '').toUpperCase() === searchId);

    if (!matched) {
      return res.status(404).json({
        success: false,
        error: `No consignment found for "${searchId}". Please verify your Order ID or contact Maison Concierge at +91 90799 98793.`
      });
    }

    res.json({
      success: true,
      order: {
        orderId: matched.orderId,
        orderDate: matched.orderDate,
        orderStatus: matched.orderStatus || 'Processing in Jaipur Atelier',
        paymentStatus: (matched.payment && matched.payment.status) || 'Payment Pending',
        trackingNumber: matched.trackingNumber || 'Not assigned yet',
        courierPartner: 'To be assigned',
        estimatedDelivery: matched.estimatedDelivery || 'Shared after dispatch',
        shippingCity: matched.shippingAddress ? `${matched.shippingAddress.city}, ${matched.shippingAddress.state}` : '',
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
  } catch (err) {
    next(err);
  }
};

module.exports = {
  validateCart,
  createOrder,
  getOrderById,
  trackOrder
};
