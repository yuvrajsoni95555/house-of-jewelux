/**
 * HOUSE OF JEWELUX — Centralized Error Handling Middleware
 * Prevents leaking stack traces or internal secrets to public clients.
 */

const config = require('../config');

function errorHandler(err, req, res, next) {
  const statusCode = err.status || err.statusCode || 500;
  
  // Structured internal logging
  console.error(`[API ERROR] ${req.method} ${req.url} -> Status ${statusCode}:`, err.message);
  if (config.env === 'development' && err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: err.userMessage || 'An unexpected error occurred. Please contact the Jaipur Concierge.',
    ...(config.env === 'development' ? { debug: err.message } : {})
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `Resource not found at ${req.method} ${req.originalUrl}`
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
