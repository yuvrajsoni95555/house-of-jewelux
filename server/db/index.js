/**
 * HOUSE OF JEWELUX — Unified Database & Persistence Adapter
 * Provides high-level repository interfaces with automatic switching
 * between Supabase/PostgreSQL (when DATABASE_URL is set) and local JSON storage (fallback).
 */

const { Pool } = require('pg');
const jsonDb = require('./jsonDb');
const config = require('../config');

let pool = null;
let isPostgresActive = false;
const IS_DEPLOYED = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

// Initialize PostgreSQL pool if DATABASE_URL or SUPABASE_DATABASE_URL is provided
const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

if (dbUrl) {
  try {
    const isSupabase = dbUrl.includes('supabase.co') || dbUrl.includes('pooler.supabase.com');
    pool = new Pool({
      connectionString: dbUrl,
      ssl: isSupabase || /sslmode=require|neon\.tech|prisma\.io/.test(dbUrl) || process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });

    pool.on('error', (err) => {
      console.error('[DB POOL ERROR] Unexpected error on idle client:', err.message);
    });

    isPostgresActive = true;
    console.log(`✦ [DATABASE] PostgreSQL / Supabase adapter active`);
  } catch (err) {
    console.warn(`⚠️ [DATABASE] Failed to initialize PostgreSQL pool: ${err.message}. Falling back to JSON storage.`);
    pool = null;
    isPostgresActive = false;
  }
} else {
  console.log('✦ [DATABASE] Running in resilient JSON storage mode (set DATABASE_URL to enable PostgreSQL / Supabase)');
}

// Where private records live without Postgres: local development only (.localdata/, never committed).
// With Postgres they are not mirrored anywhere; deployed without a database, saving them is refused.
const dbMissing = () => Object.assign(new Error('Database is not configured'), { status: 503, userMessage: 'Our order system is not available right now. Please contact our concierge.' });
const local = isPostgresActive ? { readJSON: (f, d = []) => d, writeJSON: () => true }
  : IS_DEPLOYED ? { readJSON: () => { throw dbMissing(); }, writeJSON: () => { throw dbMissing(); } }
    : { readJSON: jsonDb.readPrivate, writeJSON: jsonDb.writePrivate };

/**
 * Execute raw SQL query with parameters (when PG is active)
 */
async function query(text, params = []) {
  if (!pool) {
    throw new Error('Database pool is not active in JSON mode');
  }
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (config.env === 'development') {
    console.log(`[SQL QUERY] ${duration}ms | rows: ${res.rowCount}`);
  }
  return res;
}

/**
 * Check connection status
 */
async function getHealth() {
  if (!isPostgresActive || !pool) {
    return {
      type: 'json_fallback',
      status: 'healthy',
      details: 'Operating on local validated JSON database'
    };
  }
  try {
    const res = await pool.query('SELECT NOW() as now, current_database() as db');
    return {
      type: 'postgresql',
      status: 'connected',
      database: res.rows[0].db,
      timestamp: res.rows[0].now
    };
  } catch (err) {
    return {
      type: 'postgresql',
      status: 'error',
      error: err.message,
      fallbackActive: true
    };
  }
}

// ===================================================================
// REPOSITORY APIS
// ===================================================================

const orders = {
  async getAll(limit = 100) {
    if (isPostgresActive && pool) {
      try {
        const res = await query(
          `SELECT order_id as "orderId", customer_name, customer_email, customer_phone, 
                  shipping_address as "shippingAddress", items, pricing, 
                  payment_method as "paymentMethod", payment_status as "paymentStatus",
                  razorpay_order_id as "razorpayOrderId", razorpay_payment_id as "razorpayPaymentId",
                  order_status as "orderStatus", tracking_number as "trackingNumber",
                  estimated_delivery as "estimatedDelivery", created_at as "orderDate"
           FROM orders ORDER BY created_at DESC LIMIT $1`,
          [limit]
        );
        return res.rows.map(r => ({
          ...r,
          customer: { name: r.customer_name, email: r.customer_email, phone: r.customer_phone }
        }));
      } catch (err) {
        throw err; // no JSON fallback once Postgres is configured
      }
    }
    return local.readJSON('orders.json');
  },

  async getByRazorpayOrderId(razorpayOrderId) {
    if (!razorpayOrderId) return null;
    if (isPostgresActive && pool) {
      const res = await query(`SELECT order_id as "orderId" FROM orders WHERE razorpay_order_id = $1 LIMIT 1`, [razorpayOrderId]);
      return res.rows.length ? orders.getById(res.rows[0].orderId) : null;
    }
    return local.readJSON('orders.json').find((o) => o.razorpayOrderId === razorpayOrderId) || null;
  },

  async getById(orderId) {
    if (isPostgresActive && pool) {
      try {
        const res = await query(
          `SELECT order_id as "orderId", customer_name, customer_email, customer_phone, 
                  shipping_address as "shippingAddress", items, pricing, 
                  payment_method as "paymentMethod", payment_status as "paymentStatus",
                  razorpay_order_id as "razorpayOrderId", razorpay_payment_id as "razorpayPaymentId",
                  order_status as "orderStatus", tracking_number as "trackingNumber",
                  estimated_delivery as "estimatedDelivery", created_at as "orderDate"
           FROM orders WHERE LOWER(order_id) = LOWER($1) LIMIT 1`,
          [orderId]
        );
        if (res.rows.length > 0) {
          const r = res.rows[0];
          return {
            ...r,
            customer: { name: r.customer_name, email: r.customer_email, phone: r.customer_phone }
          };
        }
        return null;
      } catch (err) {
        throw err; // no JSON fallback once Postgres is configured
      }
    }
    const all = local.readJSON('orders.json');
    return all.find(o => o.orderId && o.orderId.toLowerCase() === orderId.toLowerCase()) || null;
  },

  async create(orderData) {
    if (isPostgresActive && pool) {
      try {
        await query(
          `INSERT INTO orders (
            order_id, customer_name, customer_email, customer_phone,
            shipping_address, items, pricing, payment_method, payment_status,
            razorpay_order_id, razorpay_payment_id, razorpay_signature,
            order_status, tracking_number, estimated_delivery, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
          [
            orderData.orderId,
            orderData.customer?.name || orderData.customer?.fullName || 'Valued Connoisseur',
            orderData.customer?.email || '',
            orderData.customer?.phone || '',
            JSON.stringify(orderData.shippingAddress || {}),
            JSON.stringify(orderData.items || []),
            JSON.stringify(orderData.pricing || {}),
            orderData.payment?.method || orderData.paymentMethod || 'razorpay',
            orderData.payment?.status || orderData.paymentStatus || 'Pending',
            orderData.razorpayOrderId || null,
            orderData.razorpayPaymentId || null,
            orderData.razorpaySignature || null,
            orderData.orderStatus || 'Payment pending',
            orderData.trackingNumber || null,
            orderData.estimatedDelivery || null,
            orderData.orderDate || new Date().toISOString()
          ]
        );
      } catch (err) {
        throw err; // no JSON fallback once Postgres is configured
      }
    }
    // Always maintain JSON sync as immediate local audit
    const all = local.readJSON('orders.json');
    all.unshift(orderData);
    local.writeJSON('orders.json', all);
    return orderData;
  },

  async update(orderId, updates) {
    if (isPostgresActive && pool) {
      try {
        const fields = [];
        const values = [orderId];
        let idx = 2;

        if (updates.orderStatus) {
          fields.push(`order_status = $${idx++}`);
          values.push(updates.orderStatus);
        }
        if (updates.paymentStatus) {
          fields.push(`payment_status = $${idx++}`);
          values.push(updates.paymentStatus);
        }
        if (updates.trackingNumber) {
          fields.push(`tracking_number = $${idx++}`);
          values.push(updates.trackingNumber);
        }
        if (updates.razorpayPaymentId) {
          fields.push(`razorpay_payment_id = $${idx++}`);
          values.push(updates.razorpayPaymentId);
        }
        if (updates.razorpaySignature) {
          fields.push(`razorpay_signature = $${idx++}`);
          values.push(updates.razorpaySignature);
        }

        if (fields.length > 0) {
          fields.push('updated_at = NOW()');
          await query(
            `UPDATE orders SET ${fields.join(', ')} WHERE LOWER(order_id) = LOWER($1)`,
            values
          );
        }
        return await orders.getById(orderId);
      } catch (err) {
        throw err; // no JSON fallback once Postgres is configured
      }
    }
    const all = local.readJSON('orders.json');
    const idx = all.findIndex(o => o.orderId && o.orderId.toLowerCase() === orderId.toLowerCase());
    if (idx !== -1) {
      if (updates.orderStatus) all[idx].orderStatus = updates.orderStatus;
      if (updates.paymentStatus) {
        if (!all[idx].payment) all[idx].payment = {};
        all[idx].payment.status = updates.paymentStatus;
        all[idx].paymentStatus = updates.paymentStatus;
      }
      if (updates.trackingNumber) all[idx].trackingNumber = updates.trackingNumber;
      if (updates.razorpayPaymentId) all[idx].razorpayPaymentId = updates.razorpayPaymentId;
      if (updates.razorpaySignature) all[idx].razorpaySignature = updates.razorpaySignature;
      local.writeJSON('orders.json', all);
      return all[idx];
    }
    return null;
  },

  async findByQuery(searchId) {
    if (!searchId) return null;
    const clean = searchId.trim().toUpperCase();
    const phoneClean = clean.replace(/[^0-9]/g, '');

    if (isPostgresActive && pool) {
      try {
        const res = await query(
          `SELECT order_id as "orderId", customer_name, customer_email, customer_phone, 
                  shipping_address as "shippingAddress", items, pricing, 
                  payment_method as "paymentMethod", payment_status as "paymentStatus",
                  order_status as "orderStatus", tracking_number as "trackingNumber",
                  estimated_delivery as "estimatedDelivery", created_at as "orderDate"
           FROM orders 
           WHERE UPPER(order_id) = $1 
              OR UPPER(tracking_number) = $1 
              OR UPPER(customer_email) = $1 
              OR (customer_phone != '' AND REGEXP_REPLACE(customer_phone, '[^0-9]', '', 'g') = $2)
           ORDER BY created_at DESC LIMIT 1`,
          [clean, phoneClean || clean]
        );
        if (res.rows.length > 0) {
          const r = res.rows[0];
          return {
            ...r,
            customer: { name: r.customer_name, email: r.customer_email, phone: r.customer_phone }
          };
        }
      } catch (err) {
        throw err; // no JSON fallback once Postgres is configured
      }
    }

    const all = local.readJSON('orders.json');
    return all.find(o => 
      (o.orderId && o.orderId.toUpperCase() === clean) ||
      (o.trackingNumber && o.trackingNumber.toUpperCase() === clean) ||
      (o.customer && (
        (o.customer.email && o.customer.email.toUpperCase() === clean) ||
        (o.customer.phone && o.customer.phone.replace(/[^0-9]/g, '') === phoneClean)
      ))
    ) || null;
  }
};

const payments = {
  async record(paymentData) {
    if (isPostgresActive && pool) {
      try {
        await query(
          `INSERT INTO payments (
            order_id, gateway, gateway_order_id, gateway_payment_id,
            amount, currency, status, signature, payload, verified_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          ON CONFLICT (gateway_payment_id) DO NOTHING`,
          [
            paymentData.orderId,
            paymentData.gateway || 'razorpay',
            paymentData.gatewayOrderId,
            paymentData.gatewayPaymentId,
            paymentData.amount,
            paymentData.currency || 'INR',
            paymentData.status || 'captured',
            paymentData.signature || null,
            JSON.stringify(paymentData.payload || {})
          ]
        );
      } catch (err) {
        throw err; // no JSON fallback once Postgres is configured
      }
    }
    // Also record in jsonDb
    const list = local.readJSON('payments.json', []);
    if (!list.find(p => p.gatewayPaymentId === paymentData.gatewayPaymentId)) {
      list.unshift({ ...paymentData, recordedAt: new Date().toISOString() });
      local.writeJSON('payments.json', list);
    }
    return paymentData;
  },

  async isDuplicate(gatewayPaymentId) {
    if (!gatewayPaymentId) return false;
    if (isPostgresActive && pool) {
      try {
        const res = await query(
          `SELECT 1 FROM payments WHERE gateway_payment_id = $1 LIMIT 1`,
          [gatewayPaymentId]
        );
        if (res.rows.length > 0) return true;
      } catch (err) {
        throw err; // no JSON fallback once Postgres is configured
      }
    }
    const list = local.readJSON('payments.json', []);
    return list.some(p => p.gatewayPaymentId === gatewayPaymentId);
  }
};

const customers = {
  async getByEmail(email) {
    if (!email) return null;
    const clean = email.trim().toLowerCase();
    if (isPostgresActive && pool) {
      try {
        const res = await query(
          `SELECT id, name, email, phone, password_hash as "passwordHash", salt, wishlist, created_at as "createdAt"
           FROM customers WHERE LOWER(email) = $1 LIMIT 1`,
          [clean]
        );
        if (res.rows.length > 0) return res.rows[0];
      } catch (err) {
        throw err; // no JSON fallback once Postgres is configured
      }
    }
    const all = local.readJSON('customers.json');
    return all.find(c => c.email && c.email.toLowerCase() === clean) || null;
  },

  async create(customerData) {
    if (isPostgresActive && pool) {
      try {
        await query(
          `INSERT INTO customers (id, name, email, phone, password_hash, salt, wishlist, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            customerData.id,
            customerData.name,
            customerData.email.toLowerCase(),
            customerData.phone || '',
            customerData.passwordHash,
            customerData.salt || '',
            JSON.stringify(customerData.wishlist || []),
            customerData.createdAt || new Date().toISOString()
          ]
        );
      } catch (err) {
        throw err; // no JSON fallback once Postgres is configured
      }
    }
    const all = local.readJSON('customers.json');
    all.push(customerData);
    local.writeJSON('customers.json', all);
    return customerData;
  },

  async getAll() {
    if (isPostgresActive && pool) {
      try {
        const res = await query(
          `SELECT id, name, email, phone, created_at as "createdAt" FROM customers ORDER BY created_at DESC`
        );
        return res.rows;
      } catch (err) {
        throw err; // no JSON fallback once Postgres is configured
      }
    }
    return local.readJSON('customers.json');
  }
};

const appointments = {
  async create(data) {
    if (isPostgresActive && pool) {
      try {
        await query(
          `INSERT INTO appointments (
            booking_ref, client_name, email, phone, appointment_type,
            preferred_date, preferred_time, notes, status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            data.id || data.bookingRef,
            data.name || data.clientName,
            data.email,
            data.phone,
            data.appointmentType || data.type || 'Salon Consultation',
            data.date,
            data.time,
            data.notes || '',
            data.status || 'Confirmed with Master Jeweller',
            data.createdAt || new Date().toISOString()
          ]
        );
      } catch (err) {
        throw err; // no JSON fallback once Postgres is configured
      }
    }
    const list = local.readJSON('appointments.json');
    list.unshift(data);
    local.writeJSON('appointments.json', list);
    return data;
  },

  async getAll() {
    if (isPostgresActive && pool) {
      try {
        const res = await query(
          `SELECT booking_ref as id, client_name as name, email, phone, 
                  appointment_type as type, preferred_date as date, preferred_time as time,
                  notes, status, created_at as "createdAt" 
           FROM appointments ORDER BY created_at DESC`
        );
        return res.rows;
      } catch (err) {
        throw err; // no JSON fallback once Postgres is configured
      }
    }
    return local.readJSON('appointments.json');
  }
};

const customOrders = {
  async create(data) {
    if (isPostgresActive && pool) {
      try {
        await query(
          `INSERT INTO custom_orders (
            commission_id, full_name, email, phone, jewellery_type,
            metal_preference, budget_band, description, status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            data.id,
            data.fullName,
            data.email,
            data.phone,
            data.jewelleryType,
            data.metalPreference,
            data.budgetBand,
            data.description,
            data.status || 'In Review with Master Goldsmith Yuvraj Soni',
            data.createdAt || new Date().toISOString()
          ]
        );
      } catch (err) {
        throw err; // no JSON fallback once Postgres is configured
      }
    }
    const list = local.readJSON('custom_orders.json');
    list.unshift(data);
    local.writeJSON('custom_orders.json', list);
    return data;
  },

  async getAll() {
    if (isPostgresActive && pool) {
      try {
        const res = await query(
          `SELECT commission_id as id, full_name as "fullName", email, phone,
                  jewellery_type as "jewelleryType", metal_preference as "metalPreference",
                  budget_band as "budgetBand", description, status, created_at as "createdAt"
           FROM custom_orders ORDER BY created_at DESC`
        );
        return res.rows;
      } catch (err) {
        throw err; // no JSON fallback once Postgres is configured
      }
    }
    return local.readJSON('custom_orders.json');
  }
};

const subscribers = {
  async add(email, source = 'website_footer') {
    const clean = email.trim().toLowerCase();
    if (isPostgresActive && pool) {
      try {
        await query(
          `INSERT INTO subscribers (email, source, status, subscribed_at)
           VALUES ($1, $2, 'active', NOW())
           ON CONFLICT (email) DO NOTHING`,
          [clean, source]
        );
      } catch (err) {
        throw err; // no JSON fallback once Postgres is configured
      }
    }
    const list = local.readJSON('subscribers.json');
    if (!list.find(s => (typeof s === 'string' ? s : s.email) === clean)) {
      list.push({ email: clean, subscribedAt: new Date().toISOString(), source });
      local.writeJSON('subscribers.json', list);
    }
    return { email: clean, status: 'subscribed' };
  },

  async getAll() {
    if (isPostgresActive && pool) {
      try {
        const res = await query(`SELECT email, source, status, subscribed_at as "subscribedAt" FROM subscribers`);
        return res.rows;
      } catch (err) {
        throw err; // no JSON fallback once Postgres is configured
      }
    }
    return local.readJSON('subscribers.json');
  }
};

module.exports = {
  pool,
  query,
  getHealth,
  isPostgresActive: () => isPostgresActive,
  orders,
  payments,
  customers,
  appointments,
  customOrders,
  subscribers,
  // Direct JSON access backward compatibility
  readJSON: jsonDb.readJSON,
  writeJSON: jsonDb.writeJSON,
  DATA_DIR: jsonDb.DATA_DIR
};
