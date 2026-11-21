/**
 * HOUSE OF JEWELUX — Customer Authentication Controller
 * Passwords use salted scrypt hashes; legacy SHA-256 hashes are upgraded after successful login.
 */
const crypto = require('crypto');
const { readJSON, writeJSON } = require('../db/jsonDb');

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return ['scrypt', salt.toString('hex'), derived.toString('hex')].join('$');
}

function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false;
  if (stored.startsWith('scrypt$')) {
    const parts = stored.split('$');
    if (parts.length !== 3 || !/^[a-f0-9]{32}$/i.test(parts[1]) || !/^[a-f0-9]{128}$/i.test(parts[2])) return false;
    const actual = crypto.scryptSync(password, Buffer.from(parts[1], 'hex'), 64, { N: 16384, r: 8, p: 1 });
    const expected = Buffer.from(parts[2], 'hex');
    return crypto.timingSafeEqual(actual, expected);
  }
  // Legacy SHA-256 hashes are accepted only to migrate accounts after a successful login.
  if (!/^[a-f0-9]{64}$/i.test(stored)) return false;
  const actual = crypto.createHash('sha256').update(password).digest();
  const expected = Buffer.from(stored, 'hex');
  return crypto.timingSafeEqual(actual, expected);
}

const register = (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body || {};
    if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !email.includes('@') || typeof password !== 'string' || password.length < 10 || password.length > 256) {
      return res.status(400).json({ success: false, error: 'Name, valid email, and a password of 10–256 characters are required' });
    }
    const customers = readJSON('customers.json');
    if (customers.find(c => c.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists' });
    }
    const newCustomer = {
      id: `CUST-${Date.now()}`, name: name.trim(), email: email.toLowerCase(), phone: typeof phone === 'string' ? phone : '',
      passwordHash: hashPassword(password), createdAt: new Date().toISOString(), orders: [], wishlist: []
    };
    customers.push(newCustomer);
    if (!writeJSON('customers.json', customers)) return res.status(500).json({ success: false, error: 'Unable to save account. Please try again.' });
    return res.json({ success: true, customer: { id: newCustomer.id, name: newCustomer.name, email: newCustomer.email, phone: newCustomer.phone } });
  } catch (err) { next(err); }
};

const login = (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string' || password.length > 256) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }
    const customers = readJSON('customers.json');
    const customer = customers.find(c => c.email.toLowerCase() === email.toLowerCase() && verifyPassword(password, c.passwordHash));
    if (!customer) return res.status(401).json({ success: false, error: 'Invalid email or password' });
    if (!String(customer.passwordHash).startsWith('scrypt$')) {
      customer.passwordHash = hashPassword(password);
      writeJSON('customers.json', customers);
    }
    const orders = readJSON('orders.json');
    const customerOrders = orders.filter(o => o.customer && o.customer.email && o.customer.email.toLowerCase() === customer.email.toLowerCase());
    return res.json({ success: true, customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone, orders: customerOrders, wishlist: customer.wishlist || [] } });
  } catch (err) { next(err); }
};

const recoverPassword = (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }
    const customers = readJSON('customers.json');
    const found = customers.some(c => c.email.toLowerCase() === email.toLowerCase());
    return res.json({
      success: true,
      message: found
        ? 'Password reset is not configured yet. Please contact the House of Jewelux support team.'
        : 'If an account exists for this email, password reset support is available through our contact channel.'
    });
  } catch (err) { next(err); }
};

module.exports = { register, login, recoverPassword };
