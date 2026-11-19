/**
 * HOUSE OF JEWELUX — Production Server Entrypoint
 * Bootstraps the modular application from server/app.js
 */

const app = require('./server/app');
const config = require('./server/config');

const server = app.listen(config.port, () => {
  console.log(`✦ HOUSE OF JEWELUX Server live at http://localhost:${config.port} (${config.env})`);
  console.log(`✦ Maison: House of Jewelux | Founder: Yuvraj Soni`);
  console.log(`✦ Jaipur Bench Goldsmithing × Contemporary Global Luxury`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  server.close(() => process.exit(0));
});

module.exports = server;
