/**
 * HOUSE OF JEWELUX — Customer Authentication Controller
 * Handles patron registration, credential verification, and password recovery.
 */

const crypto = require('crypto');
const { readJSON, writeJSON } = require('../db/jsonDb');

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return 'scrypt

const register = (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password || typeof password !== 'string' || password.length < 10 || password.length > 256) {
      return res.status(400).json({ success: false, error: 'Name, email, and a password of 10–256 characters are required' });
    }

    const customers = readJSON('customers.json');
    if (customers.find(c => c.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists' });
    }

    const passwordHash = hashPassword(password);
    const newCustomer = {
      id: `CUST-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      passwordHash,
      createdAt: new Date().toISOString(),
      orders: [],
      wishlist: []
    };

    customers.push(newCustomer);
    writeJSON('customers.json', customers);

    res.json({
      success: true,
      customer: { id: newCustomer.id, name: newCustomer.name, email: newCustomer.email, phone: newCustomer.phone }
    });
  } catch (err) {
    next(err);
  }
};

const login = (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const customers = readJSON('customers.json');
    const customer = customers.find(c => c.email.toLowerCase() === email.toLowerCase() && verifyPassword(password, c.passwordHash));
    if (customer && !String(customer.passwordHash).startsWith('scrypt

    if (!customer) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const orders = readJSON('orders.json');
    const customerOrders = orders.filter(o => o.customer && o.customer.email && o.customer.email.toLowerCase() === customer.email.toLowerCase());

    res.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        orders: customerOrders,
        wishlist: customer.wishlist || []
      }
    });
  } catch (err) {
    next(err);
  }
};

const recoverPassword = (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please enter a valid registered patron email address.' });
    }

    const customers = readJSON('customers.json');
    const found = customers.find(c => c.email.toLowerCase() === email.toLowerCase());

    res.json({
      success: true,
      message: found
        ? 'Password reset is not configured yet. Please contact the House of Jewelux support team.'
        : 'If an account exists for this email, password reset support is available through our contact channel.'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  recoverPassword
};
 + salt.toString('hex') + '

const register = (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password required' });
    }

    const customers = readJSON('customers.json');
    if (customers.find(c => c.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists' });
    }

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const newCustomer = {
      id: `CUST-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      passwordHash,
      createdAt: new Date().toISOString(),
      orders: [],
      wishlist: []
    };

    customers.push(newCustomer);
    writeJSON('customers.json', customers);

    res.json({
      success: true,
      customer: { id: newCustomer.id, name: newCustomer.name, email: newCustomer.email, phone: newCustomer.phone }
    });
  } catch (err) {
    next(err);
  }
};

const login = (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const customers = readJSON('customers.json');
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const customer = customers.find(c => c.email.toLowerCase() === email.toLowerCase() && c.passwordHash === passwordHash);

    if (!customer) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const orders = readJSON('orders.json');
    const customerOrders = orders.filter(o => o.customer && o.customer.email && o.customer.email.toLowerCase() === customer.email.toLowerCase());

    res.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        orders: customerOrders,
        wishlist: customer.wishlist || []
      }
    });
  } catch (err) {
    next(err);
  }
};

const recoverPassword = (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please enter a valid registered patron email address.' });
    }

    const customers = readJSON('customers.json');
    const found = customers.find(c => c.email.toLowerCase() === email.toLowerCase());

    res.json({
      success: true,
      message: found 
        ? `A secure password reset link has been dispatched to ${email}. Please check your inbox.`
        : `If an account is associated with ${email}, password reset instructions have been dispatched.`
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  recoverPassword
};
 + derived.toString('hex');
}

function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false;
  if (stored.startsWith('scrypt

const register = (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password required' });
    }

    const customers = readJSON('customers.json');
    if (customers.find(c => c.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists' });
    }

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const newCustomer = {
      id: `CUST-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      passwordHash,
      createdAt: new Date().toISOString(),
      orders: [],
      wishlist: []
    };

    customers.push(newCustomer);
    writeJSON('customers.json', customers);

    res.json({
      success: true,
      customer: { id: newCustomer.id, name: newCustomer.name, email: newCustomer.email, phone: newCustomer.phone }
    });
  } catch (err) {
    next(err);
  }
};

const login = (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const customers = readJSON('customers.json');
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const customer = customers.find(c => c.email.toLowerCase() === email.toLowerCase() && c.passwordHash === passwordHash);

    if (!customer) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const orders = readJSON('orders.json');
    const customerOrders = orders.filter(o => o.customer && o.customer.email && o.customer.email.toLowerCase() === customer.email.toLowerCase());

    res.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        orders: customerOrders,
        wishlist: customer.wishlist || []
      }
    });
  } catch (err) {
    next(err);
  }
};

const recoverPassword = (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please enter a valid registered patron email address.' });
    }

    const customers = readJSON('customers.json');
    const found = customers.find(c => c.email.toLowerCase() === email.toLowerCase());

    res.json({
      success: true,
      message: found 
        ? `A secure password reset link has been dispatched to ${email}. Please check your inbox.`
        : `If an account is associated with ${email}, password reset instructions have been dispatched.`
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  recoverPassword
};
)) {
    const parts = stored.split('

const register = (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password required' });
    }

    const customers = readJSON('customers.json');
    if (customers.find(c => c.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists' });
    }

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const newCustomer = {
      id: `CUST-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      passwordHash,
      createdAt: new Date().toISOString(),
      orders: [],
      wishlist: []
    };

    customers.push(newCustomer);
    writeJSON('customers.json', customers);

    res.json({
      success: true,
      customer: { id: newCustomer.id, name: newCustomer.name, email: newCustomer.email, phone: newCustomer.phone }
    });
  } catch (err) {
    next(err);
  }
};

const login = (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const customers = readJSON('customers.json');
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const customer = customers.find(c => c.email.toLowerCase() === email.toLowerCase() && c.passwordHash === passwordHash);

    if (!customer) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const orders = readJSON('orders.json');
    const customerOrders = orders.filter(o => o.customer && o.customer.email && o.customer.email.toLowerCase() === customer.email.toLowerCase());

    res.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        orders: customerOrders,
        wishlist: customer.wishlist || []
      }
    });
  } catch (err) {
    next(err);
  }
};

const recoverPassword = (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please enter a valid registered patron email address.' });
    }

    const customers = readJSON('customers.json');
    const found = customers.find(c => c.email.toLowerCase() === email.toLowerCase());

    res.json({
      success: true,
      message: found 
        ? `A secure password reset link has been dispatched to ${email}. Please check your inbox.`
        : `If an account is associated with ${email}, password reset instructions have been dispatched.`
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  recoverPassword
};
);
    if (parts.length !== 3 || !/^[a-f0-9]{32}$/i.test(parts[1]) || !/^[a-f0-9]{128}$/i.test(parts[2])) return false;
    const actual = crypto.scryptSync(password, Buffer.from(parts[1], 'hex'), 64, { N: 16384, r: 8, p: 1 });
    const expected = Buffer.from(parts[2], 'hex');
    return crypto.timingSafeEqual(actual, expected);
  }
  const legacy = crypto.createHash('sha256').update(password).digest('hex');
  const a = Buffer.from(legacy, 'hex');
  const b = Buffer.from(stored, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const register = (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password required' });
    }

    const customers = readJSON('customers.json');
    if (customers.find(c => c.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists' });
    }

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const newCustomer = {
      id: `CUST-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      passwordHash,
      createdAt: new Date().toISOString(),
      orders: [],
      wishlist: []
    };

    customers.push(newCustomer);
    writeJSON('customers.json', customers);

    res.json({
      success: true,
      customer: { id: newCustomer.id, name: newCustomer.name, email: newCustomer.email, phone: newCustomer.phone }
    });
  } catch (err) {
    next(err);
  }
};

const login = (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const customers = readJSON('customers.json');
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const customer = customers.find(c => c.email.toLowerCase() === email.toLowerCase() && c.passwordHash === passwordHash);

    if (!customer) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const orders = readJSON('orders.json');
    const customerOrders = orders.filter(o => o.customer && o.customer.email && o.customer.email.toLowerCase() === customer.email.toLowerCase());

    res.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        orders: customerOrders,
        wishlist: customer.wishlist || []
      }
    });
  } catch (err) {
    next(err);
  }
};

const recoverPassword = (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please enter a valid registered patron email address.' });
    }

    const customers = readJSON('customers.json');
    const found = customers.find(c => c.email.toLowerCase() === email.toLowerCase());

    res.json({
      success: true,
      message: found 
        ? `A secure password reset link has been dispatched to ${email}. Please check your inbox.`
        : `If an account is associated with ${email}, password reset instructions have been dispatched.`
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  recoverPassword
};
)) {
      customer.passwordHash = hashPassword(password);
      writeJSON('customers.json', customers);
    }

    if (!customer) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const orders = readJSON('orders.json');
    const customerOrders = orders.filter(o => o.customer && o.customer.email && o.customer.email.toLowerCase() === customer.email.toLowerCase());

    res.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        orders: customerOrders,
        wishlist: customer.wishlist || []
      }
    });
  } catch (err) {
    next(err);
  }
};

const recoverPassword = (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please enter a valid registered patron email address.' });
    }

    const customers = readJSON('customers.json');
    const found = customers.find(c => c.email.toLowerCase() === email.toLowerCase());

    res.json({
      success: true,
      message: found 
        ? `A secure password reset link has been dispatched to ${email}. Please check your inbox.`
        : `If an account is associated with ${email}, password reset instructions have been dispatched.`
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  recoverPassword
};
 + salt.toString('hex') + '

const register = (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password required' });
    }

    const customers = readJSON('customers.json');
    if (customers.find(c => c.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists' });
    }

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const newCustomer = {
      id: `CUST-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      passwordHash,
      createdAt: new Date().toISOString(),
      orders: [],
      wishlist: []
    };

    customers.push(newCustomer);
    writeJSON('customers.json', customers);

    res.json({
      success: true,
      customer: { id: newCustomer.id, name: newCustomer.name, email: newCustomer.email, phone: newCustomer.phone }
    });
  } catch (err) {
    next(err);
  }
};

const login = (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const customers = readJSON('customers.json');
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const customer = customers.find(c => c.email.toLowerCase() === email.toLowerCase() && c.passwordHash === passwordHash);

    if (!customer) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const orders = readJSON('orders.json');
    const customerOrders = orders.filter(o => o.customer && o.customer.email && o.customer.email.toLowerCase() === customer.email.toLowerCase());

    res.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        orders: customerOrders,
        wishlist: customer.wishlist || []
      }
    });
  } catch (err) {
    next(err);
  }
};

const recoverPassword = (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please enter a valid registered patron email address.' });
    }

    const customers = readJSON('customers.json');
    const found = customers.find(c => c.email.toLowerCase() === email.toLowerCase());

    res.json({
      success: true,
      message: found 
        ? `A secure password reset link has been dispatched to ${email}. Please check your inbox.`
        : `If an account is associated with ${email}, password reset instructions have been dispatched.`
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  recoverPassword
};
 + derived.toString('hex');
}

function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false;
  if (stored.startsWith('scrypt

const register = (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password required' });
    }

    const customers = readJSON('customers.json');
    if (customers.find(c => c.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists' });
    }

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const newCustomer = {
      id: `CUST-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      passwordHash,
      createdAt: new Date().toISOString(),
      orders: [],
      wishlist: []
    };

    customers.push(newCustomer);
    writeJSON('customers.json', customers);

    res.json({
      success: true,
      customer: { id: newCustomer.id, name: newCustomer.name, email: newCustomer.email, phone: newCustomer.phone }
    });
  } catch (err) {
    next(err);
  }
};

const login = (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const customers = readJSON('customers.json');
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const customer = customers.find(c => c.email.toLowerCase() === email.toLowerCase() && c.passwordHash === passwordHash);

    if (!customer) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const orders = readJSON('orders.json');
    const customerOrders = orders.filter(o => o.customer && o.customer.email && o.customer.email.toLowerCase() === customer.email.toLowerCase());

    res.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        orders: customerOrders,
        wishlist: customer.wishlist || []
      }
    });
  } catch (err) {
    next(err);
  }
};

const recoverPassword = (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please enter a valid registered patron email address.' });
    }

    const customers = readJSON('customers.json');
    const found = customers.find(c => c.email.toLowerCase() === email.toLowerCase());

    res.json({
      success: true,
      message: found 
        ? `A secure password reset link has been dispatched to ${email}. Please check your inbox.`
        : `If an account is associated with ${email}, password reset instructions have been dispatched.`
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  recoverPassword
};
)) {
    const parts = stored.split('

const register = (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password required' });
    }

    const customers = readJSON('customers.json');
    if (customers.find(c => c.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists' });
    }

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const newCustomer = {
      id: `CUST-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      passwordHash,
      createdAt: new Date().toISOString(),
      orders: [],
      wishlist: []
    };

    customers.push(newCustomer);
    writeJSON('customers.json', customers);

    res.json({
      success: true,
      customer: { id: newCustomer.id, name: newCustomer.name, email: newCustomer.email, phone: newCustomer.phone }
    });
  } catch (err) {
    next(err);
  }
};

const login = (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const customers = readJSON('customers.json');
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const customer = customers.find(c => c.email.toLowerCase() === email.toLowerCase() && c.passwordHash === passwordHash);

    if (!customer) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const orders = readJSON('orders.json');
    const customerOrders = orders.filter(o => o.customer && o.customer.email && o.customer.email.toLowerCase() === customer.email.toLowerCase());

    res.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        orders: customerOrders,
        wishlist: customer.wishlist || []
      }
    });
  } catch (err) {
    next(err);
  }
};

const recoverPassword = (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please enter a valid registered patron email address.' });
    }

    const customers = readJSON('customers.json');
    const found = customers.find(c => c.email.toLowerCase() === email.toLowerCase());

    res.json({
      success: true,
      message: found 
        ? `A secure password reset link has been dispatched to ${email}. Please check your inbox.`
        : `If an account is associated with ${email}, password reset instructions have been dispatched.`
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  recoverPassword
};
);
    if (parts.length !== 3 || !/^[a-f0-9]{32}$/i.test(parts[1]) || !/^[a-f0-9]{128}$/i.test(parts[2])) return false;
    const actual = crypto.scryptSync(password, Buffer.from(parts[1], 'hex'), 64, { N: 16384, r: 8, p: 1 });
    const expected = Buffer.from(parts[2], 'hex');
    return crypto.timingSafeEqual(actual, expected);
  }
  const legacy = crypto.createHash('sha256').update(password).digest('hex');
  const a = Buffer.from(legacy, 'hex');
  const b = Buffer.from(stored, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const register = (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password required' });
    }

    const customers = readJSON('customers.json');
    if (customers.find(c => c.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists' });
    }

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const newCustomer = {
      id: `CUST-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      passwordHash,
      createdAt: new Date().toISOString(),
      orders: [],
      wishlist: []
    };

    customers.push(newCustomer);
    writeJSON('customers.json', customers);

    res.json({
      success: true,
      customer: { id: newCustomer.id, name: newCustomer.name, email: newCustomer.email, phone: newCustomer.phone }
    });
  } catch (err) {
    next(err);
  }
};

const login = (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const customers = readJSON('customers.json');
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const customer = customers.find(c => c.email.toLowerCase() === email.toLowerCase() && c.passwordHash === passwordHash);

    if (!customer) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const orders = readJSON('orders.json');
    const customerOrders = orders.filter(o => o.customer && o.customer.email && o.customer.email.toLowerCase() === customer.email.toLowerCase());

    res.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        orders: customerOrders,
        wishlist: customer.wishlist || []
      }
    });
  } catch (err) {
    next(err);
  }
};

const recoverPassword = (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please enter a valid registered patron email address.' });
    }

    const customers = readJSON('customers.json');
    const found = customers.find(c => c.email.toLowerCase() === email.toLowerCase());

    res.json({
      success: true,
      message: found 
        ? `A secure password reset link has been dispatched to ${email}. Please check your inbox.`
        : `If an account is associated with ${email}, password reset instructions have been dispatched.`
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  recoverPassword
};
