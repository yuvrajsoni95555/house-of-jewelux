/**
 * HOUSE OF JEWELUX — JSON to Production Database Migrator
 * Reads existing JSON records from /data and seeds PostgreSQL / Supabase,
 * preserving all existing IDs, customer accounts, orders, appointments, and products.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const DATA_DIR = path.resolve(__dirname, '../data');

function loadJSON(filename, fallback = []) {
  const p = path.join(DATA_DIR, filename);
  if (!fs.existsSync(p)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.error(`Error reading ${filename}:`, e.message);
    return fallback;
  }
}

async function migrateData() {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
  if (!dbUrl) {
    console.log('✦ [DATA MIGRATION INFO] No DATABASE_URL or SUPABASE_DATABASE_URL set in environment.');
    console.log('✦ Data is currently stored and persisted safely in /data JSON repository.');
    return { skipped: true, reason: 'NO_DATABASE_URL' };
  }

  const isSupabase = dbUrl.includes('supabase.co') || dbUrl.includes('pooler.supabase.com');
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: isSupabase || process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false
  });

  const client = await pool.connect();
  console.log('✦ Connected to PostgreSQL / Supabase. Beginning data ingestion...');

  try {
    await client.query('BEGIN');

    // 1. Categories
    const categories = loadJSON('categories.json', []);
    let catCount = 0;
    for (const cat of categories) {
      await client.query(
        `INSERT INTO categories (id, name, slug, description, image, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            slug = EXCLUDED.slug,
            description = EXCLUDED.description,
            image = EXCLUDED.image`,
        [cat.id, cat.name, cat.slug || cat.id, cat.description || '', cat.image || '', cat.order || 0]
      );
      catCount++;
    }
    console.log(`✓ Migrated ${catCount} categories`);

    // 2. Products
    const products = loadJSON('products.json', []);
    let prodCount = 0;
    for (const p of products) {
      await client.query(
        `INSERT INTO products (
            id, name, price, original_price, category, collection, material, metal,
            image, badge, description, stock_status, rating, reviews_count
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO UPDATE SET
            price = EXCLUDED.price,
            original_price = EXCLUDED.original_price,
            stock_status = EXCLUDED.stock_status,
            badge = EXCLUDED.badge,
            updated_at = NOW()`,
        [
          p.id,
          p.name,
          p.price,
          p.originalPrice || p.price,
          p.category || 'high-jewellery',
          p.collection || '',
          p.material || '',
          p.metal || 'BIS 925 Sterling Silver',
          p.image,
          p.badge || null,
          p.description || '',
          p.stockStatus || 'in_stock',
          p.rating || 5.0,
          p.reviewsCount || 0
        ]
      );
      prodCount++;
    }
    console.log(`✓ Migrated ${prodCount} products`);

    // 3. Coupons
    const couponsObj = loadJSON('coupons.json', {});
    let couponCount = 0;
    for (const [code, c] of Object.entries(couponsObj)) {
      await client.query(
        `INSERT INTO coupons (code, discount_percent, flat_discount_inr, min_order_inr, is_active)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (code) DO NOTHING`,
        [code, c.discountPercent || null, c.flatDiscountINR || null, c.minOrderINR || 0, true]
      );
      couponCount++;
    }
    console.log(`✓ Migrated ${couponCount} coupons`);

    // 4. Customers
    const customers = loadJSON('customers.json', []);
    let custCount = 0;
    for (const c of customers) {
      await client.query(
        `INSERT INTO customers (id, name, email, phone, password_hash, salt, wishlist, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [
          c.id,
          c.name,
          c.email.toLowerCase(),
          c.phone || '',
          c.passwordHash,
          c.salt || '',
          JSON.stringify(c.wishlist || []),
          c.createdAt || new Date().toISOString()
        ]
      );
      custCount++;
    }
    console.log(`✓ Migrated ${custCount} customers`);

    // 5. Orders
    const orders = loadJSON('orders.json', []);
    let orderCount = 0;
    for (const o of orders) {
      await client.query(
        `INSERT INTO orders (
            order_id, customer_name, customer_email, customer_phone,
            shipping_address, items, pricing, payment_method, payment_status,
            order_status, tracking_number, estimated_delivery, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (order_id) DO NOTHING`,
        [
          o.orderId,
          o.customer?.name || o.customer?.fullName || 'Valued Connoisseur',
          o.customer?.email || '',
          o.customer?.phone || '',
          JSON.stringify(o.shippingAddress || {}),
          JSON.stringify(o.items || []),
          JSON.stringify(o.pricing || {}),
          o.payment?.method || o.paymentMethod || 'razorpay',
          o.payment?.status || o.paymentStatus || 'Confirmed & Paid',
          o.orderStatus || 'Confirmed by Jaipur Atelier',
          o.trackingNumber || null,
          o.estimatedDelivery || '3 - 5 Business Days via Sequel Secure Logistics',
          o.orderDate || new Date().toISOString()
        ]
      );
      orderCount++;
    }
    console.log(`✓ Migrated ${orderCount} historical orders`);

    // 6. Appointments
    const appointments = loadJSON('appointments.json', []);
    let apptCount = 0;
    for (const a of appointments) {
      await client.query(
        `INSERT INTO appointments (
            booking_ref, client_name, email, phone, appointment_type,
            preferred_date, preferred_time, notes, status, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (booking_ref) DO NOTHING`,
        [
          a.id || `HJ-APT-${Date.now()}-${apptCount}`,
          a.name || a.clientName || 'Salon Client',
          a.email || '',
          a.phone || '',
          a.type || a.appointmentType || 'Salon Consultation',
          a.date || new Date().toISOString().split('T')[0],
          a.time || '14:00',
          a.notes || '',
          a.status || 'Confirmed with Master Jeweller',
          a.createdAt || new Date().toISOString()
        ]
      );
      apptCount++;
    }
    console.log(`✓ Migrated ${apptCount} appointments`);

    // 7. Custom Orders (Bespoke commissions)
    const customOrders = loadJSON('custom_orders.json', []);
    let bespokeCount = 0;
    for (const b of customOrders) {
      await client.query(
        `INSERT INTO custom_orders (
            commission_id, full_name, email, phone, jewellery_type,
            metal_preference, budget_band, description, status, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (commission_id) DO NOTHING`,
        [
          b.id,
          b.fullName,
          b.email,
          b.phone,
          b.jewelleryType || '',
          b.metalPreference || '',
          b.budgetBand || '',
          b.description || '',
          b.status || 'In Review with Master Goldsmith Yuvraj Soni',
          b.createdAt || new Date().toISOString()
        ]
      );
      bespokeCount++;
    }
    console.log(`✓ Migrated ${bespokeCount} bespoke commissions`);

    // 8. Newsletter Subscribers
    const subscribers = loadJSON('subscribers.json', []);
    let subCount = 0;
    for (const s of subscribers) {
      const email = typeof s === 'string' ? s : s.email;
      if (!email) continue;
      await client.query(
        `INSERT INTO subscribers (email, status, subscribed_at)
         VALUES ($1, 'active', NOW())
         ON CONFLICT (email) DO NOTHING`,
        [email.toLowerCase()]
      );
      subCount++;
    }
    console.log(`✓ Migrated ${subCount} newsletter subscribers`);

    await client.query('COMMIT');
    console.log('✦ Data migration successfully committed.');
    return {
      success: true,
      categories: catCount,
      products: prodCount,
      coupons: couponCount,
      customers: custCount,
      orders: orderCount,
      appointments: apptCount,
      customOrders: bespokeCount,
      subscribers: subCount
    };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Data migration failed and was rolled back:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  migrateData()
    .then(res => {
      console.log('Migration Result:', res);
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = migrateData;
