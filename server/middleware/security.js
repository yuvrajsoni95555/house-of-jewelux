/**
 * HOUSE OF JEWELUX — Security Middleware
 */
const crypto = require('crypto');
const sessions = new Map();
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect(301, 'https://' + req.headers.host + req.url);
  }
  next();
}

function issueAdminSession() {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const expiresAt = sessions.get(token);
  if (!token || !expiresAt || expiresAt < Date.now()) {
    if (token) sessions.delete(token);
    return res.status(401).json({ success: false, error: 'Admin authentication required. Please sign in again.' });
  }
  next();
}

module.exports = { securityHeaders, issueAdminSession, requireAdmin };
