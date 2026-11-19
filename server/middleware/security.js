/**
 * HOUSE OF JEWELUX — Security & Transport Middleware
 * Implements strict security headers and HTTPS reverse-proxy redirection.
 */

function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Forwarded Proto HTTPS redirection for production reverse proxies (Vercel, Cloudflare, NGINX)
  if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(301, 'https://' + req.headers.host + req.url);
  }
  next();
}

module.exports = {
  securityHeaders
};
