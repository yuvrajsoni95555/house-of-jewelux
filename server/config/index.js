/**
 * HOUSE OF JEWELUX — Server Configuration
 */
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';
const adminPin = process.env.ADMIN_SECRET_PIN || '';
const sessionSecret = process.env.SESSION_SECRET || '';

if (isProduction && (!adminPin || adminPin.length < 12 || !sessionSecret || sessionSecret.length < 32)) {
  throw new Error('Production requires ADMIN_SECRET_PIN (12+ chars) and SESSION_SECRET (32+ chars). Set them in the hosting environment.');
}

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: Number.parseInt(process.env.PORT, 10) || 3000,
  adminPin,
  sessionSecret,
  siteUrl: process.env.SITE_URL || 'http://localhost:3000',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,https://houseofjewelux.com,https://www.houseofjewelux.com').split(',').map(v => v.trim()).filter(Boolean),
  dataDir: path.resolve(__dirname, '../../data'),
  rootDir: path.resolve(__dirname, '../..')
};
