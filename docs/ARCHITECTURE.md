# HOUSE OF JEWELUX — CURRENT ARCHITECTURE

## Overview

House of Jewelux is a jewellery storefront for gold, silver and diamond collections. The brand direction combines Indian heritage influences with contemporary minimalism.

## Application layers

```
Browser
  ├─ index.html
  ├─ app.js (single-page route and storefront UI)
  ├─ style.css
  ├─ hero-cinematic.js / motion-engine.js
  └─ visual-editor.js (admin-session gated)
          |
          | same-origin /api requests
          v
Express application (server/app.js)
  ├─ security middleware
  ├─ API router (server/routes/api.js)
  ├─ controllers
  └─ JSON data access layer (server/db/jsonDb.js)
          |
          v
data/*.json
```

## Security

- Admin login verifies the configured `ADMIN_SECRET_PIN` and issues a signed, expiring bearer token.
- Admin API routes require the bearer token.
- The visual editor requires the same admin session; the old client-side PIN bypass has been removed.
- Customer passwords are stored with salted scrypt hashes. Existing legacy SHA-256 hashes are upgraded after a successful login.
- Security middleware sets common browser security headers and redirects forwarded production HTTP requests to HTTPS.
- Admin login rate limiting is in-process. For a multi-instance production deployment, move rate limiting to a shared service.

## Checkout and customer requests

- Checkout accepts advance payment only; Cash on Delivery is rejected by the server.
- The application does not currently integrate a payment gateway. New orders remain payment-pending until an administrator verifies payment.
- Delivery charges and delivery estimates are not calculated as a fixed promise; the team must confirm them before payment.
- Order tracking looks up an order by its order ID. It does not provide live courier telemetry.
- Consultation forms create pending requests. They do not reserve a calendar slot or send an automated confirmation email.
- Newsletter subscription succeeds only after the API saves the address.

## Data storage and deployment limitations

The current data layer reads and writes JSON files under `data/`. This is useful for local development and repository review, but it is not durable or shared storage on serverless platforms such as Vercel. Concurrent writes and instance changes can cause lost or unavailable order data.

**Do not accept live customer orders on a serverless deployment until orders, customers, appointments and subscribers have been migrated to a persistent database.**

## Quality checks

The repository contains Node tests for admin-session security and a GitHub Actions workflow for JavaScript syntax checks and tests. The workflow must pass on the latest pull-request head before merge. Real-device and deployed end-to-end testing remain separate tasks.
