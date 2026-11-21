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

    if (!customer || !shippingAddress || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing mandatory checkout information' });
    }

    const acceptedPaymentMethods = new Set(['online', 'upi', 'card', 'netbanking', 'razorpay', 'gpay']);
    if (typeof paymentMethod !== 'string' || !acceptedPaymentMethods.has(paymentMethod.toLowerCase())) {
      return res.status(400).json({ success: false, error: 'Cash on Delivery is unavailable. Please choose an online advance-payment method.' });
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
      const itemTotal = prod.price * qty;
      subtotal += itemTotal;
      orderItems.push({
        id: prod.id,
        name: prod.name,
        price: prod.price,
        metal: prod.metal || 'BIS 925 Sterling Silver',
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

    const shipping = subtotal >= 2500 ? 0 : 250;
    const giftBoxCost = isGiftBox ? 150 : 0;
    const grandTotal = Math.max(0, subtotal - discount + shipping + giftBoxCost);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = `HJ-ORD-2026-${randomSuffix}`;
    const trackingNumber = `HJ-TRK-${Math.floor(100000 + Math.random() * 900000)}IN`;

    const newOrder = {
      orderId,
      orderDate: new Date().toISOString(),
      orderStatus: 'Awaiting Payment',
      customer: {
        name: customer.name || customer.fullName || 'Valued Connoisseur',
        email: customer.email || '',
        phone: customer.phone || ''
      },
      shippingAddress: {
        addressLine: shippingAddress.addressLine || shippingAddress.address || '',
        city: shippingAddress.city || '',
        state: shippingAddress.state || '',
        pincode: shippingAddress.pincode || '',
        country: 'India'
      },
      payment: {
        method: paymentMethod.toLowerCase(),
        status: 'Pending Payment'
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
      estimatedDelivery: '3 - 5 Business Days via Sequel Secure Logistics'
    };

    orders.unshift(newOrder);
    writeJSON('orders.json', orders);

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
    const order = orders.find(o => o.orderId.toLowerCase() === String(req.params.orderId || '').toLowerCase());
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({
      success: true,
      order: {
        orderId: order.orderId,
        orderDate: order.orderDate,
        orderStatus: order.orderStatus,
        paymentStatus: (order.payment && order.payment.status) || order.paymentStatus || 'Pending Payment',
        trackingNumber: order.trackingNumber || null,
        estimatedDelivery: order.estimatedDelivery || null,
        itemCount: Array.isArray(order.items) ? order.items.length : 0
      }
    });
  } catch (err) {
    next(err);
  }
};

const trackOrder = (req, res, next) => {
  try {
    const { orderId, query } = req.body;
    const searchId = (orderId || query || '').trim().toUpperCase();

    if (!searchId) {
      return res.status(400).json({ success: false, error: 'Please enter a valid Order ID (e.g. HJ-ORD-2026-7701)' });
    }

    const orders = readJSON('orders.json');
    const matched = orders.find(o =>
      (o.orderId && o.orderId.toUpperCase() === searchId) ||
      (o.trackingNumber && o.trackingNumber.toUpperCase() === searchId)
    );

    if (!matched) {
      return res.status(404).json({
        success: false,
        error: `No consignment found for "${searchId}". Please verify your Order ID or contact Maison Concierge at +91 63770 61020.`
      });
    }

    res.json({
      success: true,
      order: {
        orderId: matched.orderId,
        orderDate: matched.orderDate,
        orderStatus: matched.orderStatus || 'Processing in Jaipur Atelier',
        paymentStatus: (matched.payment && matched.payment.status) || matched.paymentStatus || 'Pending Payment',
        trackingNumber: matched.trackingNumber || null,
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
