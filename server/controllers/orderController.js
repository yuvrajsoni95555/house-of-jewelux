/**
 * HOUSE OF JEWELUX — Order & Cart Controller
 * Handles cart price validation, order requests without online payment, tracking and order lookup.
 */

const db = require('../db');
const { priceCart, newOrderId } = require('../services/pricing');

const validateCart = (req, res, next) => {
  try {
    const { items, couponCode } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, error: 'Invalid items array' });
    }
    const { items: validatedItems, pricing } = priceCart(items, couponCode, false);
    res.json({ success: true, ...pricing, appliedCoupon: pricing.couponCode, items: validatedItems });
  } catch (err) {
    next(err);
  }
};

// An order placed without online payment (e.g. bank transfer / advance payment): it waits for the
// atelier to confirm the money arrived. It is never marked as paid here.
const createOrder = async (req, res, next) => {
  try {
    const { customer, shippingAddress, items, paymentMethod, couponCode, isGiftBox } = req.body;

    if (paymentMethod === 'cod') {
      return res.status(400).json({
        success: false,
        error: 'Cash on Delivery (COD) is disabled for high-value precious jewellery. Please select Razorpay (UPI, Cards, Net Banking) to complete your acquisition securely.'
      });
    }
    if (!customer || !shippingAddress || !items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing mandatory checkout information' });
    }
    if (!customer.email && !customer.phone) {
      return res.status(400).json({ success: false, error: 'Please add an email address or phone number.' });
    }

    const { items: orderItems, pricing } = priceCart(items, couponCode, isGiftBox);
    if (orderItems.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid products in cart' });
    }

    const newOrder = {
      orderId: newOrderId(),
      orderDate: new Date().toISOString(),
      orderStatus: 'Awaiting payment',
      customer: {
        name: customer.name || customer.fullName || '',
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
      payment: { method: paymentMethod || 'bank_transfer', status: 'Awaiting payment' },
      paymentMethod: paymentMethod || 'bank_transfer',
      paymentStatus: 'Awaiting payment',
      pricing,
      items: orderItems,
      trackingNumber: null,
      estimatedDelivery: null
    };

    await db.orders.create(newOrder);

    res.status(201).json({ success: true, orderId: newOrder.orderId, trackingNumber: null, order: newOrder });
  } catch (err) {
    next(err);
  }
};

// Full order details (name, phone, address): admin only, see routes/api.js
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
      return res.status(400).json({ success: false, error: 'Please enter your Order ID.' });
    }

    const matched = await db.orders.findByQuery(searchId);

    if (!matched) {
      return res.status(404).json({
        success: false,
        error: `No order found for "${searchId}". Please check your Order ID or contact our concierge at +91 63770 61020.`
      });
    }

    // Public tracking shows status only: no address, phone or email
    res.json({
      success: true,
      order: {
        orderId: matched.orderId,
        orderDate: matched.orderDate,
        orderStatus: matched.orderStatus || 'Processing',
        paymentStatus: matched.paymentStatus || 'Pending',
        trackingNumber: matched.trackingNumber || null,
        courierPartner: matched.courierPartner || null,
        estimatedDelivery: matched.estimatedDelivery || null,
        shippingCity: matched.shippingAddress && matched.shippingAddress.city ? matched.shippingAddress.city : null,
        itemCount: matched.items ? matched.items.length : 0,
        items: (matched.items || []).map((i) => ({ name: i.name, quantity: i.quantity, metal: i.metal, image: i.image })),
        total: matched.pricing ? matched.pricing.grandTotal : null
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
