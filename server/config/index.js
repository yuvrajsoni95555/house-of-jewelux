/**
 * HOUSE OF JEWELUX — Server Configuration Module
 * Centralized, validated environment configuration with secure defaults.
 */

const path = require('path');

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  // No built-in PIN or secret: without them, admin login is off (see middleware/adminAuth.js)
  adminPin: process.env.ADMIN_SECRET_PIN || '',
  sessionSecret: process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' || process.env.VERCEL ? '' : 'local-development-only-secret'),
  siteUrl: process.env.SITE_URL || 'http://localhost:3000',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,https://houseofjewelux.com,https://www.houseofjewelux.com').split(','),
  dataDir: path.resolve(__dirname, '../../data'),
  rootDir: path.resolve(__dirname, '../..')
};

// Simple startup validation
if (!config.adminPin || !config.sessionSecret) {
  console.warn('[SECURITY] ADMIN_SECRET_PIN or SESSION_SECRET is not set: admin API login is switched off.');
}

module.exports = config;
