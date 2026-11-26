-- ===================================================================
-- HOUSE OF JEWELUX — PRODUCTION DATABASE SCHEMA (POSTGRESQL / SUPABASE)
-- Version: 001_initial_schema
-- ===================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------
-- 1. CUSTOMERS TABLE (Patrons & Connoisseurs)
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    wishlist JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- -------------------------------------------------------------------
-- 2. PRODUCTS TABLE (High Jewellery Catalog)
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price INTEGER NOT NULL CHECK (price >= 0),
    original_price INTEGER CHECK (original_price >= 0),
    category VARCHAR(100) NOT NULL,
    collection VARCHAR(100),
    material VARCHAR(100),
    metal VARCHAR(100) DEFAULT 'BIS 925 Sterling Silver',
    image TEXT NOT NULL,
    gallery JSONB DEFAULT '[]'::jsonb,
    badge VARCHAR(100),
    description TEXT,
    stock_status VARCHAR(50) DEFAULT 'in_stock',
    rating NUMERIC(3,2) DEFAULT 5.00,
    reviews_count INTEGER DEFAULT 0,
    specifications JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_collection ON products(collection);
CREATE INDEX IF NOT EXISTS idx_products_material ON products(material);
CREATE INDEX IF NOT EXISTS idx_products_stock_status ON products(stock_status);

-- -------------------------------------------------------------------
-- 3. ORDERS TABLE (Atelier Acquisitions)
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(64) UNIQUE NOT NULL,
    customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    shipping_address JSONB NOT NULL,
    items JSONB NOT NULL,
    pricing JSONB NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'razorpay',
    payment_status VARCHAR(100) NOT NULL DEFAULT 'Pending',
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    razorpay_signature VARCHAR(255),
    order_status VARCHAR(100) NOT NULL DEFAULT 'Payment pending',
    tracking_number VARCHAR(100),
    courier_partner VARCHAR(255),
    estimated_delivery VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(LOWER(customer_email));
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- -------------------------------------------------------------------
-- 4. PAYMENTS AUDIT TABLE (Financial Telemetry)
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(64) REFERENCES orders(order_id) ON DELETE CASCADE,
    gateway VARCHAR(50) NOT NULL DEFAULT 'razorpay',
    gateway_order_id VARCHAR(100) NOT NULL,
    gateway_payment_id VARCHAR(100) UNIQUE NOT NULL,
    amount INTEGER NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(50) NOT NULL,
    signature VARCHAR(255),
    payload JSONB DEFAULT '{}'::jsonb,
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_payment_id ON payments(gateway_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_order_id ON payments(gateway_order_id);

-- -------------------------------------------------------------------
-- 5. APPOINTMENTS TABLE (Private Salon & Atelier Consultations)
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    booking_ref VARCHAR(64) UNIQUE NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    appointment_type VARCHAR(100) NOT NULL,
    preferred_date DATE NOT NULL,
    preferred_time VARCHAR(50) NOT NULL,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'Confirmed with Master Jeweller',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_booking_ref ON appointments(booking_ref);
CREATE INDEX IF NOT EXISTS idx_appointments_email ON appointments(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(preferred_date);

-- -------------------------------------------------------------------
-- 6. BESPOKE CUSTOM ORDERS TABLE
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS custom_orders (
    id SERIAL PRIMARY KEY,
    commission_id VARCHAR(64) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    jewellery_type VARCHAR(100),
    metal_preference VARCHAR(100),
    budget_band VARCHAR(100),
    description TEXT,
    status VARCHAR(100) DEFAULT 'In Review with Master Goldsmith Yuvraj Soni',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_orders_commission_id ON custom_orders(commission_id);
CREATE INDEX IF NOT EXISTS idx_custom_orders_email ON custom_orders(LOWER(email));

-- -------------------------------------------------------------------
-- 7. SUBSCRIBERS TABLE (Privilege Circle)
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscribers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    source VARCHAR(100) DEFAULT 'website_footer',
    subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(LOWER(email));

-- -------------------------------------------------------------------
-- 8. CATEGORIES TABLE
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image TEXT,
    display_order INTEGER DEFAULT 0
);

-- -------------------------------------------------------------------
-- 9. COUPONS TABLE
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupons (
    code VARCHAR(50) PRIMARY KEY,
    discount_percent INTEGER CHECK (discount_percent BETWEEN 0 AND 100),
    flat_discount_inr INTEGER CHECK (flat_discount_inr >= 0),
    min_order_inr INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------
-- 10. MIGRATIONS METADATA TABLE
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS _migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------
-- 11. ROW LEVEL SECURITY (RLS) FOR SUPABASE
-- -------------------------------------------------------------------
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Allow public read access to products and categories
CREATE POLICY "Public Read Products" ON products FOR SELECT USING (true);
CREATE POLICY "Public Read Categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public Read Active Coupons" ON coupons FOR SELECT USING (is_active = true);

-- Allow service role (backend API server) full access across all tables
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        -- Standard PostgreSQL fallback: allow public insert where appropriate or bypass in connection
        NULL;
    END IF;
END $$;
