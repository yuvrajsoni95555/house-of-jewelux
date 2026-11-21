/**
 * HOUSE OF JEWELUX — Newsletter & Circle Subscription Controller
 */

const db = require('../db');

const subscribe = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid email required' });
    }

    await db.subscribers.add(email, 'website_footer');

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
