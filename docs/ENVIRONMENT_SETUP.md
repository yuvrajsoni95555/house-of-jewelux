# HOUSE OF JEWELUX — ENVIRONMENT SETUP & CONFIGURATION

## 1. Prerequisites
- **Node.js:** v18.0.0 or later (v20+ Recommended)
- **Git**

---

## 2. Quick Setup

```bash
# 1. Clone or navigate to the repository
cd houseofjewelux

# 2. Copy the environment configuration template
cp .env.example .env

# 3. Install production dependencies
npm install

# 4. Start the development server
npm run dev
# Server will start at http://localhost:3000
```

---

## 3. Environment Variables Reference

| Variable | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `PORT` | Number | `3000` | Port on which the HTTP server listens |
| `NODE_ENV` | String | `development` | Environment mode (`development` or `production`) |
| `ADMIN_SECRET_PIN` | String | — | Required secure admin PIN; use at least 12 random characters |
| `SESSION_SECRET` | String | — | Required in production; use a random secret of at least 32 characters |
| `SITE_URL` | String | `http://localhost:3000` | Public domain of the application |
| `ALLOWED_ORIGINS` | CSV | `localhost:3000,...` | Whitelisted origins for cross-origin requests |


## 4. Production security requirements

Before deploying:
- Set `NODE_ENV=production`.
- Set `ADMIN_SECRET_PIN` to a unique random value of at least 12 characters. Never use the example placeholder.
- Set `SESSION_SECRET` to a cryptographically random value of at least 32 characters. Keep it private and consistent across all server instances.
- Configure secrets in the hosting provider's environment settings. Do not commit a real `.env` file.
- Admin API endpoints require a signed bearer session issued by `POST /api/admin/login`. Sessions expire after 8 hours.
- Customer orders remain payment-pending until an administrator verifies receipt of advance payment. The application does not currently integrate a payment gateway; do not describe an order as paid based on the selected payment method.
