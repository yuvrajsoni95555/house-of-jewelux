/**
 * HOUSE OF JEWELUX — Security Middleware
 */
const crypto = require('crypto');
const config = require('../config');
const tokenSecret = config.sessionSecret || crypto.randomBytes(32).toString('hex');
const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 8;
const SESSION_TTL_SECONDS = 8 * 60 * 60;

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

function adminLoginRateLimit(req, res, next) {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (record && now - record.startedAt < LOGIN_WINDOW_MS && record.count >= LOGIN_MAX_ATTEMPTS) {
    return res.status(429).json({ success: false, error: 'Too many sign-in attempts. Please wait 15 minutes and try again.' });
  }
  if (!record || now - record.startedAt >= LOGIN_WINDOW_MS) loginAttempts.set(key, { startedAt: now, count: 1 });
  else record.count += 1;
  next();
}

function issueAdminSession() {
  const payload = Buffer.from(JSON.stringify({ role: 'admin', exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS })).toString('base64url');
  const signature = crypto.createHmac('sha256', tokenSecret).update(payload).digest('base64url');
  return payload + '.' + signature;
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const parts = token.split('.');
  if (parts.length !== 2) return res.status(401).json({ success: false, error: 'Admin authentication required. Please sign in again.' });
  const expected = crypto.createHmac('sha256', tokenSecret).update(parts[0]).digest();
  let supplied;
  try { supplied = Buffer.from(parts[1], 'base64url'); } catch (_) { supplied = Buffer.alloc(0); }
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
    return res.status(401).json({ success: false, error: 'Invalid admin session.' });
  }
  try {
    const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    if (payload.role !== 'admin' || !Number.isFinite(payload.exp) || payload.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ success: false, error: 'Admin session expired. Please sign in again.' });
    }
  } catch (_) {
    return res.status(401).json({ success: false, error: 'Invalid admin session.' });
  }
  next();
}

module.exports = { securityHeaders, issueAdminSession, requireAdmin, adminLoginRateLimit };
