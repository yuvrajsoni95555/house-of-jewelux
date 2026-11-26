/**
 * HOUSE OF JEWELUX — Admin API sessions
 * POST /api/admin/login with the ADMIN_SECRET_PIN returns a signed token (12 hours).
 * Every admin route requires "Authorization: Bearer <token>". Without ADMIN_SECRET_PIN and
 * SESSION_SECRET set on the server, admin login is switched off (there are no built-in PINs).
 */

const crypto = require('crypto');
const config = require('../config');

const TTL_MS = 12 * 60 * 60 * 1000;
const sign = (payload) => crypto.createHmac('sha256', config.sessionSecret).update(payload).digest('base64url');
const enabled = () => Boolean(config.adminPin && config.sessionSecret);

function issueToken() {
  const payload = Buffer.from(JSON.stringify({ role: 'admin', exp: Date.now() + TTL_MS })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token) {
  const [payload, sig] = String(token || '').split('.');
  if (!payload || !sig || !enabled()) return false;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return false;
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')).exp > Date.now(); } catch (e) { return false; }
}

function pinMatches(pin) {
  if (!enabled() || typeof pin !== 'string') return false;
  const a = crypto.createHash('sha256').update(pin).digest();
  const b = crypto.createHash('sha256').update(config.adminPin).digest();
  return crypto.timingSafeEqual(a, b);
}

function requireAdmin(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!verifyToken(token)) return res.status(401).json({ success: false, error: 'Admin sign-in required' });
  next();
}

// Self-check (runs once at startup; a failure means the signing code is broken)
if (process.env.NODE_ENV !== 'production' && config.sessionSecret) {
  const t = issueToken();
  if (enabled() && (!verifyToken(t) || verifyToken(t + 'x') || verifyToken('a.b'))) throw new Error('adminAuth self-check failed');
}

module.exports = { enabled, issueToken, verifyToken, pinMatches, requireAdmin };
