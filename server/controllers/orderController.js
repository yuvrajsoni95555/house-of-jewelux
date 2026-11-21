/**
 * HOUSE OF JEWELUX — Order & Cart Controller
 * Handles cart price validation, order processing, tracking telemetry, and order lookup.
 */

const crypto = require('crypto');
const db = require('../db');

const validateCart = (req, res, next) => {
  try {
    const { items, couponCode } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, error: 'Invalid items array' });
    }

    const products = db.readJSON('products.json');
    const coupons = db.readJSON('coupons.json', {});

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

const createOrder = async (req, res, next) => {
  try {
    const { 
      customer, 
      shippingAddress, 
      items, 
      paymentMethod, 
      couponCode,
      isGiftBox
    } = req.body;

    // Explicit Policy Check: Cash on Delivery Disabled
    if (paymentMethod === 'cod') {
      return res.status(400).json({
        success: false,
        error: 'Cash on Delivery (COD) is disabled for high-value precious jewellery. Please select Razorpay (UPI, Cards, Net Banking) to complete your acquisition securely.'
      });
    }

    if (!customer || !shippingAddress || !items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing mandatory checkout information' });
    }

    const products = db.readJSON('products.json');
    const coupons = db.readJSON('coupons.json', {});

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
      orderStatus: 'Confirmed by Jaipur Atelier',
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
        method: paymentMethod || 'razorpay',
        status: 'Paid & Verified'
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

    await db.orders.create(newOrder);

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

const getOrderById = async (req, res, next) => {
  try {
    const order = await db.orders.getById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

const trackOrder = async (req, res, next) => {
  try {
    const { orderId, query } = req.body;
    const searchId = (orderId || query || '').trim();

    if (!searchId) {
      return res.status(400).json({ success: false, error: 'Please enter a valid Order ID (e.g. HJ-ORD-2026-7701)' });
    }

    const matched = await db.orders.findByQuery(searchId);

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
        paymentStatus: matched.paymentStatus || 'Paid & Verified',
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
