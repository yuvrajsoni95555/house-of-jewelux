/**
 * HOUSE OF JEWELUX — Master REST API Router
 * Modular routing mapping controllers to versioned endpoints.
 */

const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');
const appointmentController = require('../controllers/appointmentController');
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const newsletterController = require('../controllers/newsletterController');

// 1. Products & Categories
router.get('/products', productController.getProducts);
router.get('/products/:identifier', productController.getProductByIdentifier);
router.get('/categories', productController.getCategories);

// 2. Cart & Orders
router.post('/cart/validate', orderController.validateCart);
router.post('/orders', orderController.createOrder);
router.get('/orders/:orderId', orderController.getOrderById);
router.post('/orders/track', orderController.trackOrder);

// 3. Customer Authentication
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/recover-password', authController.recoverPassword);

// 4. Appointments & Concierge
router.post('/appointments', appointmentController.createAppointment);
router.get('/appointments', appointmentController.getAppointments);

// 5. Admin & Atelier Controls
router.post('/admin/login', adminController.adminLogin);
router.get('/admin/overview', adminController.getOverview);
router.patch('/admin/orders/:orderId', adminController.updateOrder);
router.patch('/admin/products/:productId', adminController.updateProduct);
router.post('/admin/editor-save', adminController.editorSave);
router.post('/custom-order', adminController.customOrder);

// 6. Circle Newsletter
router.post('/newsletter', newsletterController.subscribe);

module.exports = router;
