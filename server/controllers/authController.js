/**
 * HOUSE OF JEWELUX — Customer Authentication Controller
 * Passwords use Node.js scrypt with per-user salts. Legacy SHA-256 hashes are
 * upgraded after a successful login.
 */
const crypto = require('crypto');
const { promisify } = require('util');
const scrypt = promisify(crypto.scrypt);
const { readJSON, writeJSON } = require('../db/jsonDb');

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${derived.toString('hex')}`;
}

async function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false;
  if (stored.startsWith('scrypt$')) {
    const parts = stored.split('$');
    if (parts.length !== 3) return false;
    const expected = Buffer.from(parts[2], 'hex');
    const actual = await scrypt(password, parts[1], expected.length);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  }
  // Backward-compatible verification for existing SHA-256 accounts.
  const legacy = crypto.createHash('sha256').update(password).digest('hex');
  const a = Buffer.from(legacy, 'hex');
  const b = Buffer.from(stored, 'hex');
  return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b);
}

const register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body || {};
    if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        typeof password !== 'string' || password.length < 10 || password.length > 256) {
      return res.status(400).json({ success: false, error: 'Enter a valid name and email. Password must be at least 10 characters.' });
    }
    const customers = readJSON('customers.json');
    const normalizedEmail = email.trim().toLowerCase();
    if (customers.find(c => String(c.email || '').toLowerCase() === normalizedEmail)) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists' });
    }
    const newCustomer = {
      id: `CUST-${crypto.randomBytes(8).toString('hex')}`,
      name: name.trim().slice(0, 100),
      email: normalizedEmail,
      phone: typeof phone === 'string' ? phone.slice(0, 30) : '',
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString(),
      orders: [],
      wishlist: []
    };
    customers.push(newCustomer);
    if (!writeJSON('customers.json', customers)) return res.status(500).json({ success: false, error: 'Unable to create account right now.' });
    res.status(201).json({ success: true, customer: { id: newCustomer.id, name: newCustomer.name, email: newCustomer.email, phone: newCustomer.phone } });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }
    const customers = readJSON('customers.json');
    const customer = customers.find(c => String(c.email || '').toLowerCase() === email.trim().toLowerCase());
    if (!customer || !(await verifyPassword(password, customer.passwordHash))) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
    if (!String(customer.passwordHash).startsWith('scrypt$')) {
      customer.passwordHash = await hashPassword(password);
      writeJSON('customers.json', customers);
    }
    const orders = readJSON('orders.json');
    const customerOrders = orders.filter(o => o.customer && String(o.customer.email || '').toLowerCase() === customer.email.toLowerCase())
      .map(o => ({ orderId: o.orderId, orderDate: o.orderDate, orderStatus: o.orderStatus, paymentStatus: (o.payment && o.payment.status) || 'Payment Pending', pricing: o.pricing, items: o.items }));
    res.json({ success: true, customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone, orders: customerOrders, wishlist: customer.wishlist || [] } });
  } catch (err) { next(err); }
};

const recoverPassword = (req, res) => {
  const email = req.body && req.body.email;
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
  }
  // Do not claim that an email was sent: no mail delivery provider is configured.
  res.json({ success: true, message: 'If an account exists for this address, password recovery instructions will be provided when email recovery is enabled. Please contact customer support for assistance.' });
};

module.exports = { register, login, recoverPassword };
