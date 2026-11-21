/**
 * HOUSE OF JEWELUX — Automated Production Database Backup Utility
 * Exports all database tables to structured, timestamped JSON archives with SHA-256 integrity checksums.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('../server/db');

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve(__dirname, `../data/backups/backup_${timestamp}`);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log(`✦ Initiating House of Jewelux Database Backup -> ${backupDir}`);

  const manifest = {
    createdAt: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    dbType: db.isPostgresActive() ? 'postgresql' : 'json_store',
    files: {}
  };

  const tables = [
    { name: 'orders', fetch: () => db.orders.getAll(10000) },
    { name: 'customers', fetch: () => db.customers.getAll() },
    { name: 'appointments', fetch: () => db.appointments.getAll() },
    { name: 'custom_orders', fetch: () => db.customOrders.getAll() },
    { name: 'subscribers', fetch: () => db.subscribers.getAll() },
    { name: 'products', fetch: () => db.readJSON('products.json') },
    { name: 'categories', fetch: () => db.readJSON('categories.json') },
    { name: 'coupons', fetch: () => db.readJSON('coupons.json') }
  ];

  for (const t of tables) {
    try {
      const data = await t.fetch();
      const content = JSON.stringify(data, null, 2);
      const filePath = path.join(backupDir, `${t.name}.json`);
      fs.writeFileSync(filePath, content, 'utf8');

      const hash = crypto.createHash('sha256').update(content).digest('hex');
      manifest.files[`${t.name}.json`] = {
        recordCount: Array.isArray(data) ? data.length : Object.keys(data).length,
        sizeBytes: Buffer.byteLength(content),
        sha256: hash
      };
      console.log(`✓ Backed up ${t.name}: ${manifest.files[`${t.name}.json`].recordCount} records`);
    } catch (err) {
      console.error(`❌ Failed to backup table ${t.name}:`, err.message);
    }
  }

  fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`✦ Backup successfully archived at: ${backupDir}`);
  return { success: true, backupDir, manifest };
}

if (require.main === module) {
  createBackup()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = createBackup;
