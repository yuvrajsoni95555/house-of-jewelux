/**
 * HOUSE OF JEWELUX — Master REST API Router
 */
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');
const appointmentController = require('../controllers/appointmentController');
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const newsletterController = require('../controllers/newsletterController');
const { requireAdmin } = require('../middleware/security');

router.get('/products', productController.getProducts);
router.get('/products/:identifier', productController.getProductByIdentifier);
router.get('/categories', productController.getCategories);

router.post('/cart/validate', orderController.validateCart);
router.post('/orders', orderController.createOrder);
router.post('/orders/track', orderController.trackOrder);

router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/recover-password', authController.recoverPassword);

router.post('/appointments', appointmentController.createAppointment);
router.get('/appointments', requireAdmin, appointmentController.getAppointments);

router.post('/admin/login', adminController.adminLogin);
router.get('/admin/overview', requireAdmin, adminController.getOverview);
router.patch('/admin/orders/:orderId', requireAdmin, adminController.updateOrder);
router.patch('/admin/products/:productId', requireAdmin, adminController.updateProduct);
router.post('/admin/editor-save', requireAdmin, adminController.editorSave);
router.post('/custom-order', adminController.customOrder);

router.post('/newsletter', newsletterController.subscribe);
module.exports = router;
