/**
 * HOUSE OF JEWELUX — Express Application Factory
 * Configures security, parsers, static file serving, API router, rate limiting, and SPA fallbacks.
 */

const express = require('express');
const compression = require('compression');
const path = require('path');
const config = require('./config');
const { securityHeaders } = require('./middleware/security');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { globalLimiter, authLimiter, paymentLimiter } = require('./middleware/rateLimiter');
const apiRouter = require('./routes/api');

const app = express();

// High-performance response compression (Gzip / Deflate for all text, JSON, CSS, JS, HTML > 1KB)
app.use(compression({
  threshold: 1024,
  level: 6,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// Body parsers with rawBody retention for webhook signature validation
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global security headers & reverse proxy HTTPS redirection
app.use(securityHeaders);

// Static assets serving with high-efficiency HTTP caching
app.use(express.static(config.rootDir, {
  maxAge: '7d',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    } else if (filePath.match(/\.(css|js|woff2?|otf|ttf|png|jpe?g|webp|svg|ico)$/i)) {
      res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
    }
  }
}));

// Rate limiting
app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/payment', paymentLimiter);

// REST API Router mounted at /api
app.use('/api', apiRouter);

// Unhandled API route fallback (returns JSON 404)
app.use('/api', notFoundHandler);

// Single Page Application (SPA) HTML fallback for client-side routing
app.use((req, res) => {
  res.sendFile(path.join(config.rootDir, 'index.html'));
});

// Centralized error handling
app.use(errorHandler);

module.exports = app;
