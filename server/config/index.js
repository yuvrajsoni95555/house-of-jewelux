/**
 * HOUSE OF JEWELUX — Server Configuration Module
 * Secrets must be supplied by the deployment environment.
 */
const path = require('path');

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  adminPin: process.env.ADMIN_SECRET_PIN || '',
  adminSessionSecret: process.env.ADMIN_SESSION_SECRET || '',
  sessionSecret: process.env.SESSION_SECRET || '',
  siteUrl: process.env.SITE_URL || 'http://localhost:3000',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,https://houseofjewelux.com,https://www.houseofjewelux.com').split(',').map(v => v.trim()).filter(Boolean),
  dataDir: path.resolve(__dirname, '../../data'),
  rootDir: path.resolve(__dirname, '../..')
};

if (config.env === 'production') {
  if (!config.adminPin || config.adminPin.length < 12) {
    console.error('[SECURITY] ADMIN_SECRET_PIN must be set to a strong secret of at least 12 characters.');
  }
  if (!config.adminSessionSecret || config.adminSessionSecret.length < 32) {
    console.error('[SECURITY] ADMIN_SESSION_SECRET must be set to a random secret of at least 32 characters.');
  }
}

module.exports = config;
