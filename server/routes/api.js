/**
 * HOUSE OF JEWELUX — Master REST API Router
 * Modular routing mapping controllers to versioned endpoints.
 */

const express = require('express');
const { requireAdmin } = require('../middleware/adminAuth');
const router = express.Router();

const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');
const appointmentController = require('../controllers/appointmentController');
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const newsletterController = require('../controllers/newsletterController');
const paymentController = require('../controllers/paymentController');
const db = require('../db');

// Health Check Endpoint (System, DB, and Gateway telemetry)
router.get('/health', async (req, res) => {
  const dbHealth = await db.getHealth();
  res.json({
    status: 'healthy',
    service: 'House of Jewelux Atelier API',
    version: '2026.11-production',
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    database: dbHealth,
    paymentGateway: {
      provider: 'Razorpay',
      configured: require('../services/razorpayService').isConfigured(),
      codPolicy: 'DISABLED'
    },
    timestamp: new Date().toISOString()
  });
});

// 1. Products & Categories
router.get('/products', productController.getProducts);
router.get('/products/:identifier', productController.getProductByIdentifier);
router.get('/categories', productController.getCategories);

// 2. Cart & Orders
router.post('/cart/validate', orderController.validateCart);
router.post('/orders', orderController.createOrder);
router.get('/orders/:orderId', requireAdmin, orderController.getOrderById);
router.post('/orders/track', orderController.trackOrder);

// 2b. Razorpay Payment Gateway Integration
router.get('/payment/config', paymentController.getPaymentConfig);
router.post('/payment/create-order', paymentController.createPaymentOrder);
router.post('/payment/verify', paymentController.verifyPayment);
router.post('/payment/webhook', paymentController.handleWebhook);

// 3. Customer Authentication
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/recover-password', authController.recoverPassword);

// 4. Appointments & Concierge
router.post('/appointments', appointmentController.createAppointment);
router.get('/appointments', requireAdmin, appointmentController.getAppointments);

// 5. Admin & Atelier Controls
router.post('/admin/login', adminController.adminLogin);
router.get('/admin/overview', requireAdmin, adminController.getOverview);
router.patch('/admin/orders/:orderId', requireAdmin, adminController.updateOrder);
router.patch('/admin/products/:productId', requireAdmin, adminController.updateProduct);
router.post('/admin/editor-save', requireAdmin, adminController.editorSave);
router.post('/custom-order', adminController.customOrder);

// 6. Circle Newsletter
router.post('/newsletter', newsletterController.subscribe);

module.exports = router;
