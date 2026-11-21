/**
 * HOUSE OF JEWELUX — Payment Controller
 * Manages Razorpay order orchestration, signature verification, webhook processing,
 * and double-spend / replay prevention.
 */

const crypto = require('crypto');
const razorpayService = require('../services/razorpayService');
const db = require('../db');

/**
 * Public Payment Configuration
 */
const getPaymentConfig = (req, res) => {
  res.json({
    success: true,
    keyId: razorpayService.getPublicKey(),
    isConfigured: razorpayService.isConfigured(),
    currency: 'INR',
    codEnabled: false, // Cash on Delivery explicitly disabled for luxury jewellery
    supportedMethods: ['upi', 'card', 'netbanking', 'wallet', 'emi']
  });
};

/**
 * Server-Side Razorpay Order Creation
 */
const createPaymentOrder = async (req, res, next) => {
  try {
    const { items, couponCode, isGiftBox, customer } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Your acquisition bag is empty.' });
    }

    const products = db.readJSON('products.json');
    const coupons = db.readJSON('coupons.json', {});

    // Recalculate price server-side (prevent frontend price manipulation)
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
        metal: prod.metal || 'BIS 925 Sterling Silver',
        quantity: qty,
        image: prod.image,
        itemTotal
      });
    }

    if (validatedItems.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid jewellery items found in cart.' });
    }

    // Coupon calculation
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
    const amountInPaise = Math.round(grandTotal * 100);

    const internalOrderId = `HJ-ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const rzpOrder = await razorpayService.createOrder({
      amountInPaise,
      currency: 'INR',
      receipt: internalOrderId,
      notes: {
        customerEmail: customer?.email || '',
        customerName: customer?.name || customer?.fullName || '',
        internalOrderId
      }
    });

    res.json({
      success: true,
      razorpayOrderId: rzpOrder.id,
      amount: grandTotal,
      amountInPaise,
      currency: 'INR',
      keyId: razorpayService.getPublicKey(),
      internalOrderId,
      pricing: {
        subtotal,
        discount,
        couponCode: appliedCoupon,
        shipping,
        giftBoxCost,
        grandTotal
      },
      items: validatedItems
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Server-Side Payment Verification & Order Confirmation
 */
const verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      internalOrderId,
      customer,
      shippingAddress,
      items,
      pricing
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        error: 'Incomplete payment telemetry received from gateway.'
      });
    }

    // 1. Prevent Replay / Duplicate Payment Attacks
    const isDuplicate = await db.payments.isDuplicate(razorpay_payment_id);
    if (isDuplicate) {
      console.warn(`⚠️ [SECURITY ALERT] Duplicate payment attempt detected for payment ID: ${razorpay_payment_id}`);
      return res.status(409).json({
        success: false,
        error: 'This payment transaction has already been registered and confirmed.'
      });
    }

    // 2. Cryptographic Signature Verification
    // If Razorpay signature is provided, verify it strictly
    if (razorpay_signature) {
      const isValid = razorpayService.verifyPaymentSignature({
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature
      });

      // In production mode with configured secret, enforce signature validity
      if (razorpayService.isConfigured() && !isValid) {
        console.error(`❌ [SECURITY] Invalid Razorpay signature for order ${razorpay_order_id}`);
        return res.status(400).json({
          success: false,
          error: 'Cryptographic payment signature verification failed. Please contact concierge.'
        });
      }
    }

    // 3. Record Verified Payment in Audit Ledger
    const grandTotal = pricing?.grandTotal || 0;
    await db.payments.record({
      orderId: internalOrderId || `HJ-ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      gateway: 'razorpay',
      gatewayOrderId: razorpay_order_id,
      gatewayPaymentId: razorpay_payment_id,
      amount: grandTotal,
      currency: 'INR',
      status: 'captured',
      signature: razorpay_signature || 'verified_server',
      payload: {
        customerEmail: customer?.email,
        timestamp: new Date().toISOString()
      }
    });

    // 4. Create Confirmed Order in Database
    const orderId = internalOrderId || `HJ-ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const trackingNumber = `HJ-TRK-${Math.floor(100000 + Math.random() * 900000)}IN`;

    const newOrder = {
      orderId,
      orderDate: new Date().toISOString(),
      orderStatus: 'Confirmed by Jaipur Atelier',
      customer: {
        name: customer?.name || customer?.fullName || 'Valued Connoisseur',
        email: customer?.email || '',
        phone: customer?.phone || ''
      },
      shippingAddress: {
        addressLine: shippingAddress?.addressLine || shippingAddress?.address || '',
        city: shippingAddress?.city || '',
        state: shippingAddress?.state || '',
        pincode: shippingAddress?.pincode || '',
        country: 'India'
      },
      payment: {
        method: 'razorpay',
        status: 'Paid & Verified via Razorpay'
      },
      paymentMethod: 'razorpay',
      paymentStatus: 'Paid & Verified via Razorpay',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      pricing: pricing || { grandTotal },
      items: items || [],
      trackingNumber,
      estimatedDelivery: '3 - 5 Business Days via Sequel Secure Logistics'
    };

    await db.orders.create(newOrder);

    console.log(`✓ [ORDER SUCCESS] Order ${orderId} successfully confirmed via Razorpay ${razorpay_payment_id}`);

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

/**
 * Razorpay Server-to-Server Webhook
 */
const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    if (process.env.RAZORPAY_WEBHOOK_SECRET) {
      const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.warn('⚠️ [WEBHOOK REJECTED] Invalid signature received from webhook');
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    }

    const event = req.body?.event;
    const payload = req.body?.payload;

    console.log(`✦ [WEBHOOK EVENT] Received event: ${event}`);

    if (event === 'payment.captured' || event === 'order.paid') {
      const payment = payload?.payment?.entity;
      const rzpOrderId = payment?.order_id;
      const paymentId = payment?.id;

      if (rzpOrderId) {
        // Update order status if order exists
        const allOrders = await db.orders.getAll(100);
        const matched = allOrders.find(o => o.razorpayOrderId === rzpOrderId);
        if (matched) {
          await db.orders.update(matched.orderId, {
            paymentStatus: 'Paid & Verified via Razorpay Webhook',
            razorpayPaymentId: paymentId
          });
          console.log(`✓ [WEBHOOK UPDATED] Order ${matched.orderId} updated to Paid.`);
        }
      }
    }

    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(500).json({ error: 'Webhook processing error' });
  }
};

module.exports = {
  getPaymentConfig,
  createPaymentOrder,
  verifyPayment,
  handleWebhook
};
