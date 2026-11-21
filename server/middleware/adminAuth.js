/**
 * Signed, short-lived admin bearer-token authentication.
 * Tokens are HMAC-SHA256 signed and expire after 8 hours.
 */
const crypto = require('crypto');
const config = require('../config');

function sign(value) {
  return crypto.createHmac('sha256', config.adminSessionSecret).update(value).digest('base64url');
}

function createAdminToken() {
  if (!config.adminSessionSecret || config.adminSessionSecret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET must be configured with at least 32 random characters.');
  }
  const payload = Buffer.from(JSON.stringify({ role: 'admin', exp: Date.now() + 8 * 60 * 60 * 1000 })).toString('base64url');
  return payload + '.' + sign(payload);
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer ([A-Za-z0-9._-]+)$/);
  if (!match || !config.adminSessionSecret || config.adminSessionSecret.length < 32) {
    return res.status(401).json({ success: false, error: 'Admin authentication required' });
  }
  const parts = match[1].split('.');
  if (parts.length !== 2) return res.status(401).json({ success: false, error: 'Invalid admin session' });
  const expected = sign(parts[0]);
  const a = Buffer.from(parts[1]);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ success: false, error: 'Invalid admin session' });
  }
  try {
    const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    if (payload.role !== 'admin' || !Number.isFinite(payload.exp) || payload.exp <= Date.now()) {
      return res.status(401).json({ success: false, error: 'Admin session expired' });
    }
  } catch (_) {
    return res.status(401).json({ success: false, error: 'Invalid admin session' });
  }
  next();
}

module.exports = { requireAdmin, createAdminToken };
