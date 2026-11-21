/**
 * HOUSE OF JEWELUX — Express Application Factory
 * Configures security, parsers, static file serving, API router, rate limiting, and SPA fallbacks.
 */

const express = require('express');
const path = require('path');
const config = require('./config');
const { securityHeaders } = require('./middleware/security');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { globalLimiter, authLimiter, paymentLimiter } = require('./middleware/rateLimiter');
const apiRouter = require('./routes/api');

const app = express();

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

// Static assets serving
app.use(express.static(config.rootDir));

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
