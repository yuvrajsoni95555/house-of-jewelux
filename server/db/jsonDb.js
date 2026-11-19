/**
 * HOUSE OF JEWELUX — Safe File-Based Database Access Layer
 * Handles resilient read/write operations with JSON validation and auto-initialization.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

// Ensure data directory exists
if (!fs.existsSync(config.dataDir)) {
  fs.mkdirSync(config.dataDir, { recursive: true });
}

function readJSON(filename, defaultVal = []) {
  const filePath = path.join(config.dataDir, filename);
  if (!fs.existsSync(filePath)) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(defaultVal, null, 2), 'utf8');
    } catch (err) {
      console.error(`Error initializing file ${filename}:`, err);
    }
    return defaultVal;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error(`JSON Parse error in ${filename}, returning default fallback:`, e.message);
    return defaultVal;
  }
}

function writeJSON(filename, data) {
  const filePath = path.join(config.dataDir, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing to ${filename}:`, err);
    throw err;
  }
}

// Auto-seed required files if missing
['orders.json', 'customers.json', 'custom_orders.json', 'subscribers.json', 'appointments.json'].forEach(f => {
  if (!fs.existsSync(path.join(config.dataDir, f))) {
    writeJSON(f, []);
  }
});

module.exports = {
  readJSON,
  writeJSON,
  DATA_DIR: config.dataDir
};
