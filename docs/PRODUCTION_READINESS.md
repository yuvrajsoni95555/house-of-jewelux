# Production Readiness — House of Jewelux

This document records items that cannot be safely completed from repository code alone and must be configured or verified before accepting live customer payments.

## Blockers

### 1. Persistent database

The current API stores orders, customers, appointments and newsletter subscriptions in JSON files under `data/`. The repository's Vercel configuration routes API requests to a serverless function. A serverless function's local filesystem is not a durable shared database; writes may fail or disappear between invocations.

Before launch, migrate the JSON data layer to a persistent database (for example, a managed PostgreSQL/Supabase database) and configure its credentials in the hosting environment. Do not rely on local JSON files for live orders or customer accounts.

### 2. Payment gateway

Checkout now accepts only advance payment and records orders as `Payment Pending`. No payment gateway is integrated and no payment is automatically verified. Configure a supported payment provider, implement server-side payment-order creation and signature/webhook verification, and only then transition an order to `Paid`.

Do not mark payment as paid from a browser response or a customer-selected payment method.

### 3. Customer email

Password recovery currently does not send an email because no email provider is configured. Configure a transactional email provider and implement expiring, single-use reset tokens before advertising email password recovery.

### 4. Product photography and specifications

The catalogue contains 50 SKUs but only 22 unique primary image paths. Product-specific photos and exact material/stone specifications must be matched to each SKU. The QA report lists the current image verification gap.

Only publish hallmark, certification, gemstone origin, hypoallergenic, water-resistance, anti-tarnish lifetime or warranty claims when supported by actual documentation.

### 5. Business policies and shipping

Confirm final shipping territories, delivery estimates, charges, return/exchange windows, refund processing, warranty terms and the legal business contact details. The current storefront copy avoids promising unverified service levels.

## Required environment settings

- `NODE_ENV=production`
- `ADMIN_SECRET_PIN`: unique random value of at least 12 characters
- `SESSION_SECRET`: random secret of at least 32 characters, identical across all server instances
- Persistent database connection settings
- Payment provider credentials after gateway integration
- Transactional email credentials after email integration

## Final QA still required

- Test on real mobile devices at common widths (360, 375, 390 and 430 px) and tablet/desktop.
- Complete an end-to-end customer registration, login, cart, payment and order tracking test against the persistent database.
- Verify admin authentication and role protection on the deployed hosting environment.
- Verify each product photo and specification against the actual item.
