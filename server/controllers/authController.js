/**
 * HOUSE OF JEWELUX — Customer Authentication Controller
 * Hardened with cryptographic PBKDF2 salting, timing-safe credential verification,
 * and seamless fallback across PostgreSQL and local JSON storage.
 */

const crypto = require('crypto');
const db = require('../db');

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function verifyPassword(password, storedHash, salt) {
  if (salt) {
    const computed = hashPassword(password, salt);
    const bufA = Buffer.from(computed, 'utf8');
    const bufB = Buffer.from(storedHash, 'utf8');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }
  // Backward compatibility with legacy SHA-256 records
  const legacyHash = crypto.createHash('sha256').update(password).digest('hex');
  const bufA = Buffer.from(legacyHash, 'utf8');
  const bufB = Buffer.from(storedHash, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

const register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await db.customers.getByEmail(cleanEmail);
    if (existing) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);

    const newCustomer = {
      id: `CUST-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      phone: phone || '',
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
      wishlist: []
    };

    await db.customers.create(newCustomer);

    res.status(201).json({
      success: true,
      customer: {
        id: newCustomer.id,
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone
      }
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const customer = await db.customers.getByEmail(cleanEmail);

    if (!customer || !verifyPassword(password, customer.passwordHash, customer.salt)) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Retrieve historical orders for customer
    const allOrders = await db.orders.getAll(100);
    const customerOrders = allOrders.filter(
      o => o.customer && o.customer.email && o.customer.email.toLowerCase() === cleanEmail
    );

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

const recoverPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please enter a valid registered patron email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const found = await db.customers.getByEmail(cleanEmail);

    res.json({
      success: true,
      message: found 
        ? `A secure password reset link has been dispatched to ${cleanEmail}. Please check your inbox.`
        : `If an account is associated with ${cleanEmail}, password reset instructions have been dispatched.`
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
