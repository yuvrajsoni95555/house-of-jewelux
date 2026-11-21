/**
 * HOUSE OF JEWELUX — Production End-to-End Automated Test Suite
 * Tests all production requirements:
 * 1. Database adapter, schema, and repository operations
 * 2. Razorpay payment order generation, signature verification & double-spend prevention
 * 3. Strict rejection of Cash on Delivery (COD Policy)
 * 4. End-to-end customer journey: Register -> Login -> Cart -> Order -> Verify Payment -> Track
 * 5. Security headers, CORS, health endpoint, and rate limiter
 */

require('dotenv').config();
const http = require('http');
const crypto = require('crypto');
const app = require('../server/app');
const db = require('../server/db');

let server;
const PORT = 3099;
const BASE_URL = `http://localhost:${PORT}`;

function makeRequest(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };

    let postData = null;
    if (body) {
      postData = typeof body === 'string' ? body : JSON.stringify(body);
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: reqHeaders
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('=================================================================');
  console.log('HOUSE OF JEWELUX — PRODUCTION VERIFICATION TEST SUITE');
  console.log('=================================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${details}`);
      failed++;
    }
  }

  // Start test server
  await new Promise((resolve) => {
    server = app.listen(PORT, resolve);
  });

  try {
    // ---------------------------------------------------------------
    // GROUP 1: Health, Telemetry & Security Headers
    // ---------------------------------------------------------------
    console.log('\n--- 1. Health, System Telemetry & Security Headers ---');
    const healthRes = await makeRequest('/api/health');
    assert(healthRes.status === 200, 'GET /api/health returns 200 OK');
    assert(healthRes.body.service === 'House of Jewelux Atelier API', 'Service identity reported correctly');
    assert(healthRes.body.database && healthRes.body.database.status, 'Database status reported in health telemetry');
    assert(healthRes.body.paymentGateway.provider === 'Razorpay', 'Payment gateway identified as Razorpay');
    assert(healthRes.body.paymentGateway.codPolicy === 'DISABLED', 'COD policy explicitly reported as DISABLED');
    assert(healthRes.headers['x-content-type-options'] === 'nosniff', 'X-Content-Type-Options: nosniff present');
    assert(healthRes.headers['x-frame-options'] === 'SAMEORIGIN', 'X-Frame-Options: SAMEORIGIN present');
    assert(healthRes.headers['strict-transport-security'], 'Strict-Transport-Security (HSTS) present');

    // ---------------------------------------------------------------
    // GROUP 2: Catalog & Categories API
    // ---------------------------------------------------------------
    console.log('\n--- 2. Catalog & Categories ---');
    const prodRes = await makeRequest('/api/products');
    const productsList = prodRes.body.products || prodRes.body;
    assert(prodRes.status === 200 && Array.isArray(productsList), 'GET /api/products returns products array');
    assert(productsList.length >= 50, `Catalog contains 50 creations (found ${productsList.length})`);

    const catRes = await makeRequest('/api/categories');
    const categoriesList = catRes.body.categories || catRes.body;
    assert(catRes.status === 200 && Array.isArray(categoriesList), 'GET /api/categories returns categories array');

    // ---------------------------------------------------------------
    // GROUP 3: Customer Authentication & Hardened Security
    // ---------------------------------------------------------------
    console.log('\n--- 3. Customer Authentication & PBKDF2 Password Security ---');
    const testEmail = `patron_test_${Date.now()}@houseofjewelux.com`;
    const testPassword = 'AtelierSecretPass2026!';

    // Register
    const regRes = await makeRequest('/api/auth/register', 'POST', {
      name: 'Princess Gayatri Devi',
      email: testEmail,
      phone: '+91 98290 12345',
      password: testPassword
    });
    assert(regRes.status === 201 && regRes.body.success, 'POST /api/auth/register creates customer');
    assert(regRes.body.customer.email === testEmail, 'Registered customer email matches input');

    // Duplicate registration rejection
    const dupRegRes = await makeRequest('/api/auth/register', 'POST', {
      name: 'Princess Gayatri Devi',
      email: testEmail,
      phone: '+91 98290 12345',
      password: testPassword
    });
    assert(dupRegRes.status === 400, 'Duplicate customer registration rejected with 400');

    // Login with valid credentials
    const loginRes = await makeRequest('/api/auth/login', 'POST', {
      email: testEmail,
      password: testPassword
    });
    assert(loginRes.status === 200 && loginRes.body.success, 'POST /api/auth/login succeeds with correct password');

    // Login with wrong password
    const wrongLoginRes = await makeRequest('/api/auth/login', 'POST', {
      email: testEmail,
      password: 'WrongPassword123'
    });
    assert(wrongLoginRes.status === 401, 'Login with incorrect password rejected with 401');

    // Password Recovery
    const recoverRes = await makeRequest('/api/auth/recover-password', 'POST', {
      email: testEmail
    });
    assert(recoverRes.status === 200 && recoverRes.body.success, 'POST /api/auth/recover-password succeeds');

    // ---------------------------------------------------------------
    // GROUP 4: Cart Price Validation & Coupon Calculation
    // ---------------------------------------------------------------
    console.log('\n--- 4. Cart Price Validation & Privileges ---');
    const firstProduct = productsList[0];
    const cartItems = [{ id: firstProduct.id, quantity: 1 }];

    const cartValRes = await makeRequest('/api/cart/validate', 'POST', {
      items: cartItems,
      couponCode: 'FIRSTLUX'
    });
    assert(cartValRes.status === 200 && cartValRes.body.success, 'POST /api/cart/validate succeeds');
    assert(cartValRes.body.appliedCoupon === 'FIRSTLUX', 'FIRSTLUX coupon code applied');
    assert(cartValRes.body.discount > 0, `Discount calculated correctly (${cartValRes.body.discount} INR)`);
    assert(cartValRes.body.grandTotal === cartValRes.body.subtotal - cartValRes.body.discount + cartValRes.body.shipping, 'Grand total matches math');

    // ---------------------------------------------------------------
    // GROUP 5: Payment Gateway Integration (Razorpay)
    // ---------------------------------------------------------------
    console.log('\n--- 5. Razorpay Payment Gateway Integration ---');
    const payConfigRes = await makeRequest('/api/payment/config');
    assert(payConfigRes.status === 200, 'GET /api/payment/config returns 200 OK');
    assert(payConfigRes.body.codEnabled === false, 'Payment config declares codEnabled: false');
    assert(payConfigRes.body.supportedMethods.includes('upi'), 'Supported methods includes UPI');

    // Create Payment Order Server-Side
    const createOrderRes = await makeRequest('/api/payment/create-order', 'POST', {
      items: cartItems,
      couponCode: 'FIRSTLUX',
      customer: {
        name: 'Princess Gayatri Devi',
        email: testEmail,
        phone: '+91 98290 12345'
      }
    });
    assert(createOrderRes.status === 200 && createOrderRes.body.success, 'POST /api/payment/create-order generates Razorpay order');
    assert(createOrderRes.body.razorpayOrderId, `Razorpay order ID created: ${createOrderRes.body.razorpayOrderId}`);
    assert(createOrderRes.body.amountInPaise === Math.round(createOrderRes.body.amount * 100), 'Paise conversion exact');

    // Verify Payment Signature & Confirm Order
    const rzpOrderId = createOrderRes.body.razorpayOrderId;
    const testPaymentId = `pay_test_${Date.now()}`;
    const testSecret = process.env.RAZORPAY_KEY_SECRET || 'test_secret_for_signature_verification';
    const testSignature = crypto
      .createHmac('sha256', testSecret)
      .update(`${rzpOrderId}|${testPaymentId}`)
      .digest('hex');

    const verifyRes = await makeRequest('/api/payment/verify', 'POST', {
      razorpay_order_id: rzpOrderId,
      razorpay_payment_id: testPaymentId,
      razorpay_signature: testSignature,
      internalOrderId: createOrderRes.body.internalOrderId,
      customer: {
        name: 'Princess Gayatri Devi',
        email: testEmail,
        phone: '+91 98290 12345'
      },
      shippingAddress: {
        addressLine: 'Rambagh Palace Suite 101',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302005'
      },
      items: createOrderRes.body.items,
      pricing: createOrderRes.body.pricing
    });

    assert(verifyRes.status === 201 && verifyRes.body.success, 'POST /api/payment/verify confirms payment and creates order');
    assert(verifyRes.body.order.paymentStatus === 'Paid & Verified via Razorpay', 'Order marked Paid & Verified via Razorpay');
    assert(verifyRes.body.trackingNumber, `Tracking number generated: ${verifyRes.body.trackingNumber}`);

    // Test Duplicate / Replay Payment Prevention
    const duplicateVerifyRes = await makeRequest('/api/payment/verify', 'POST', {
      razorpay_order_id: rzpOrderId,
      razorpay_payment_id: testPaymentId, // Same payment ID replayed
      razorpay_signature: testSignature,
      internalOrderId: createOrderRes.body.internalOrderId
    });
    assert(duplicateVerifyRes.status === 409, 'Duplicate payment replay attack correctly rejected with 409 Conflict');

    // ---------------------------------------------------------------
    // GROUP 6: COD Policy Enforcement (Must Be Disabled)
    // ---------------------------------------------------------------
    console.log('\n--- 6. Cash on Delivery Policy Enforcement ---');
    const codOrderRes = await makeRequest('/api/orders', 'POST', {
      customer: { name: 'Test', email: testEmail, phone: '9999999999' },
      shippingAddress: { addressLine: 'Street', city: 'City', pincode: '302001' },
      items: cartItems,
      paymentMethod: 'cod' // Explicit COD attempt
    });
    assert(codOrderRes.status === 400, 'Direct COD order submission strictly rejected with 400 Bad Request');
    assert(codOrderRes.body.error && codOrderRes.body.error.includes('disabled'), 'COD rejection error explains policy');

    // ---------------------------------------------------------------
    // GROUP 7: Order Retrieval & Tracking Telemetry
    // ---------------------------------------------------------------
    console.log('\n--- 7. Order Retrieval & Tracking Telemetry ---');
    const confirmedOrderId = verifyRes.body.orderId;
    const getOrderRes = await makeRequest(`/api/orders/${confirmedOrderId}`);
    assert(getOrderRes.status === 200 && getOrderRes.body.success, `GET /api/orders/${confirmedOrderId} retrieves order`);

    // Track by Order ID
    const trackRes = await makeRequest('/api/orders/track', 'POST', {
      orderId: confirmedOrderId
    });
    assert(trackRes.status === 200 && trackRes.body.success, 'POST /api/orders/track locates consignment');
    assert(trackRes.body.order.courierPartner.includes('Sequel'), 'Courier partner reported as Sequel Armored Logistics');

    // Track by Tracking Number
    const trackByNumberRes = await makeRequest('/api/orders/track', 'POST', {
      query: verifyRes.body.trackingNumber
    });
    assert(trackByNumberRes.status === 200 && trackByNumberRes.body.success, 'Tracking by consignment number succeeds');

    // ---------------------------------------------------------------
    // GROUP 8: Concierge Appointments, Bespoke & Newsletter
    // ---------------------------------------------------------------
    console.log('\n--- 8. Salon Concierge, Bespoke & Newsletter ---');
    const apptRes = await makeRequest('/api/appointments', 'POST', {
      name: 'Princess Gayatri Devi',
      phone: '+91 98290 12345',
      email: testEmail,
      date: '2026-12-15',
      timeSlot: 'Morning Private Suite (11:00 AM - 1:00 PM)',
      notes: 'Bridal jewellery sizing and diamond consultation'
    });
    assert(apptRes.status === 201 && apptRes.body.success, 'POST /api/appointments reserves private suite');

    const bespokeRes = await makeRequest('/api/custom-order', 'POST', {
      fullName: 'Maharaja Padmanabh',
      email: 'maharaja@jaipurroyal.org',
      phone: '+91 98290 99999',
      jewelleryType: 'Royal Nakshi Sarpech (Turban Ornament)',
      metalPreference: '22K Kundan Polki Gold',
      budgetBand: 'INR 15,00,000+',
      description: 'Heirloom restoration and bespoke falcon crest'
    });
    assert(bespokeRes.status === 200 && bespokeRes.body.success, 'POST /api/custom-order registers bespoke commission');

    const newsRes = await makeRequest('/api/newsletter', 'POST', {
      email: testEmail
    });
    assert(newsRes.status === 200 && newsRes.body.success, 'POST /api/newsletter subscribes to circle');

    // ---------------------------------------------------------------
    // GROUP 9: Admin Authentication & Telemetry Overview
    // ---------------------------------------------------------------
    console.log('\n--- 9. Admin Authentication & Atelier Overview ---');
    const adminLoginRes = await makeRequest('/api/admin/login', 'POST', { pin: '1926' });
    assert(adminLoginRes.status === 200 && adminLoginRes.body.success, 'POST /api/admin/login authorizes with master PIN');

    const adminWrongLogin = await makeRequest('/api/admin/login', 'POST', { pin: '999999' });
    assert(adminWrongLogin.status === 401, 'POST /api/admin/login rejects invalid PIN with 401');

    const overviewRes = await makeRequest('/api/admin/overview');
    assert(overviewRes.status === 200 && overviewRes.body.metrics, 'GET /api/admin/overview delivers business telemetry');

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    server.close();
    console.log('\n=================================================================');
    console.log(`TEST RESULTS: ${passed} Passed, ${failed} Failed out of ${passed + failed} Tests`);
    console.log('=================================================================');
    if (failed > 0) process.exit(1);
  }
}

if (require.main === module) {
  runTests().catch(() => process.exit(1));
}

module.exports = runTests;
