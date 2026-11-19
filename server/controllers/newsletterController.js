/**
 * HOUSE OF JEWELUX — Newsletter & Circle Subscription Controller
 */

const { readJSON, writeJSON } = require('../db/jsonDb');

const subscribe = (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid email required' });
    }

    const subs = readJSON('subscribers.json', []);
    if (!subs.includes(email.toLowerCase())) {
      subs.push(email.toLowerCase());
      writeJSON('subscribers.json', subs);
    }

    res.json({
      success: true,
      message: 'Welcome to the House of Jewelux Atelier Circle. Use code FIRSTLUX for 10% privilege on your first acquisition.'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  subscribe
};
