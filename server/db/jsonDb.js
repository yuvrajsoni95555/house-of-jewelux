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
      // In serverless / read-only filesystem, gracefully proceed with in-memory default
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
    console.error(`Error writing to ${filename}:`, err.message);
    return false;
  }
}

// Private records (orders, customers, payments, appointments, subscribers) in local development only.
// They live in .localdata/ (git-ignored): the data/ folder is published with the public website.
const PRIVATE_DIR = path.join(config.rootDir, '.localdata');
function readPrivate(filename, defaultVal = []) {
  try { return JSON.parse(fs.readFileSync(path.join(PRIVATE_DIR, filename), 'utf8')); } catch (e) { return defaultVal; }
}
function writePrivate(filename, data) {
  fs.mkdirSync(PRIVATE_DIR, { recursive: true });
  fs.writeFileSync(path.join(PRIVATE_DIR, filename), JSON.stringify(data, null, 2), 'utf8');
  return true;
}

module.exports = {
  readJSON,
  writeJSON,
  readPrivate,
  writePrivate,
  DATA_DIR: config.dataDir
};
