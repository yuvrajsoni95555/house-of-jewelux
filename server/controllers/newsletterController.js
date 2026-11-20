/**
 * HOUSE OF JEWELUX — Newsletter Subscription Controller
 */
const { readJSON, writeJSON } = require('../db/jsonDb');

const subscribe = (req, res, next) => {
  try {
    const email = typeof (req.body || {}).email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    const subs = readJSON('subscribers.json', []);
    if (!subs.includes(email)) {
      subs.push(email);
      if (!writeJSON('subscribers.json', subs)) {
        return res.status(500).json({ success: false, error: 'Unable to save your subscription right now. Please try again.' });
      }
    }

    return res.json({
      success: true,
      message: 'Thank you for subscribing to House of Jewelux updates. Use code FIRSTLUX for 10% off your first order.'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { subscribe };
