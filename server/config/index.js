/**
 * HOUSE OF JEWELUX — Server Configuration Module
 * Centralized, validated environment configuration with secure defaults.
 */

const path = require('path');

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  adminPin: process.env.ADMIN_SECRET_PIN || '1926',
  sessionSecret: process.env.SESSION_SECRET || 'house-of-jewelux-jaipur-1926-atelier-token',
  siteUrl: process.env.SITE_URL || 'http://localhost:3000',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,https://houseofjewelux.com,https://www.houseofjewelux.com').split(','),
  dataDir: path.resolve(__dirname, '../../data'),
  rootDir: path.resolve(__dirname, '../..')
};

// Simple startup validation
if (config.env === 'production' && config.adminPin === '1926') {
  console.warn('⚠️ [SECURITY WARNING] Default ADMIN_SECRET_PIN is in use in production. Please set ADMIN_SECRET_PIN in environment variables.');
}

module.exports = config;
