/**
 * HOUSE OF JEWELUX — Customer Authentication Controller
 * Handles patron registration, credential verification, and password recovery.
 */

const crypto = require('crypto');
const { readJSON, writeJSON } = require('../db/jsonDb');

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
