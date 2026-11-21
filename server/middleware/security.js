/**
 * HOUSE OF JEWELUX — Security & Transport Middleware
 * Implements strict security headers, CORS origin control, HTTPS redirection,
 * and Content Security Policy (configured for Razorpay, Google Fonts, and CDNs).
 */

const config = require('../config');

function securityHeaders(req, res, next) {
  // MIME sniffing protection
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Clickjacking protection (Razorpay modal creates an internal frame)
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Strict Transport Security (HSTS)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(self "https://api.razorpay.com" "https://checkout.razorpay.com")');

  // Content Security Policy (CSP)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://api.razorpay.com https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.cdnfonts.com",
    "font-src 'self' https://fonts.gstatic.com https://fonts.cdnfonts.com data:",
    "img-src 'self' data: blob: https:",
    "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
    "connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://lumberjack.razorpay.com https://*.supabase.co"
  ].join('; ');

  res.setHeader('Content-Security-Policy', csp);

  // CORS Origin Control
  const origin = req.headers.origin;
  if (origin && (config.allowedOrigins.includes(origin) || config.env === 'development')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Razorpay-Signature');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  // Forwarded Proto HTTPS redirection for production reverse proxies (Vercel, Cloudflare, NGINX)
  if (config.env === 'production' && req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(301, 'https://' + req.headers.host + req.url);
  }

  next();
}

module.exports = {
  securityHeaders
};
