/**
 * HOUSE OF JEWELUX — Express Application Factory
 * Configures security, parsers, static file serving, API router, and SPA fallbacks.
 */

const express = require('express');
const path = require('path');
const config = require('./config');
const { securityHeaders } = require('./middleware/security');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const apiRouter = require('./routes/api');

const app = express();

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global security headers & reverse proxy HTTPS redirection
app.use(securityHeaders);

// Static assets serving
app.use(express.static(config.rootDir));

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
