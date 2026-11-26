/**
 * HOUSE OF JEWELUX — Payment Controller
 * Razorpay order creation, signature verification, webhook processing and replay prevention.
 *
 * Flow: create-order prices the cart on the server, creates the Razorpay order and saves our order as
 * "Payment pending". verify (from the browser) and the webhook (from Razorpay) mark it paid only after
 * the Razorpay signature checks out. Amounts always come from the saved order, never from the browser.
 */

const razorpayService = require('../services/razorpayService');
const db = require('../db');
const { priceCart, newOrderId } = require('../services/pricing');

const notConfigured = (res) => res.status(503).json({ success: false, error: 'Online payment is not available yet. Please contact our concierge to place your order.' });

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

const createPaymentOrder = async (req, res, next) => {
  try {
    const { items, couponCode, isGiftBox, customer, shippingAddress } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Your acquisition bag is empty.' });
    }
    if (!razorpayService.isConfigured() && process.env.NODE_ENV !== 'test') return notConfigured(res);

    const { items: validatedItems, pricing } = priceCart(items, couponCode, isGiftBox);
    if (validatedItems.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid jewellery items found in cart.' });
    }

    const internalOrderId = newOrderId();
    const amountInPaise = Math.round(pricing.grandTotal * 100);
    const rzpOrder = await razorpayService.createOrder({
      amountInPaise,
      currency: 'INR',
      receipt: internalOrderId,
      notes: { internalOrderId }
    });

    // Saved now, so payment verification uses these server-side prices and items
    await db.orders.create({
      orderId: internalOrderId,
      orderDate: new Date().toISOString(),
      orderStatus: 'Payment pending',
      customer: {
        name: (customer && (customer.name || customer.fullName)) || '',
        email: (customer && customer.email) || '',
        phone: (customer && customer.phone) || ''
      },
      shippingAddress: {
        addressLine: (shippingAddress && (shippingAddress.addressLine || shippingAddress.address)) || '',
        city: (shippingAddress && shippingAddress.city) || '',
        state: (shippingAddress && shippingAddress.state) || '',
        pincode: (shippingAddress && shippingAddress.pincode) || '',
        country: 'India'
      },
      payment: { method: 'razorpay', status: 'Pending' },
      paymentMethod: 'razorpay',
      paymentStatus: 'Pending',
      razorpayOrderId: rzpOrder.id,
      pricing,
      items: validatedItems,
      trackingNumber: null,
      estimatedDelivery: null
    });

    res.json({
      success: true,
      razorpayOrderId: rzpOrder.id,
      amount: pricing.grandTotal,
      amountInPaise,
      currency: 'INR',
      keyId: razorpayService.getPublicKey(),
      internalOrderId,
      pricing,
      items: validatedItems
    });
  } catch (err) {
    next(err);
  }
};

// Marks the saved order paid once (idempotent): used by verify and by the webhook
async function markPaid(order, paymentId, signature, source) {
  if (await db.payments.isDuplicate(paymentId)) return { duplicate: true };
  await db.payments.record({
    orderId: order.orderId,
    gateway: 'razorpay',
    gatewayOrderId: order.razorpayOrderId,
    gatewayPaymentId: paymentId,
    amount: order.pricing ? order.pricing.grandTotal : 0,
    currency: 'INR',
    status: 'captured',
    signature: signature || null,
    payload: { source, timestamp: new Date().toISOString() }
  });
  await db.orders.update(order.orderId, {
    orderStatus: 'Confirmed',
    paymentStatus: 'Paid',
    razorpayPaymentId: paymentId,
    razorpaySignature: signature || undefined
  });
  return { duplicate: false };
}

const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Incomplete payment details received from the gateway.' });
    }
    if (!razorpayService.isConfigured() && process.env.NODE_ENV !== 'test') return notConfigured(res);

    const valid = razorpayService.verifyPaymentSignature({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature
    });
    if (!valid) {
      console.error(`[SECURITY] Invalid Razorpay signature for order ${razorpay_order_id}`);
      return res.status(400).json({ success: false, error: 'Payment verification failed. Please contact our concierge.' });
    }

    const order = await db.orders.getByRazorpayOrderId(razorpay_order_id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'We could not find this order. Please contact our concierge with your payment ID.' });
    }

    const { duplicate } = await markPaid(order, razorpay_payment_id, razorpay_signature, 'checkout');
    if (duplicate) {
      return res.status(409).json({ success: false, error: 'This payment has already been registered and confirmed.' });
    }

    const confirmed = { ...order, orderStatus: 'Confirmed', paymentStatus: 'Paid', razorpayPaymentId: razorpay_payment_id };
    res.status(201).json({ success: true, orderId: order.orderId, trackingNumber: null, order: confirmed });
  } catch (err) {
    next(err);
  }
};

// Razorpay server-to-server webhook: refused unless RAZORPAY_WEBHOOK_SECRET is set and the signature matches
const handleWebhook = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) return res.status(503).json({ error: 'Webhook not configured' });
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody || '';
    if (!signature || !razorpayService.verifyWebhookSignature(rawBody, signature)) {
      console.warn('[WEBHOOK REJECTED] Invalid signature');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body && req.body.event;
    const payment = req.body && req.body.payload && req.body.payload.payment && req.body.payload.payment.entity;
    if ((event === 'payment.captured' || event === 'order.paid') && payment && payment.order_id) {
      const order = await db.orders.getByRazorpayOrderId(payment.order_id);
      if (order && order.paymentStatus !== 'Paid') await markPaid(order, payment.id, null, 'webhook');
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
